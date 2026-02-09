import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ESP32 sends sensor data here
// SYNCHRONOUS PROCESSING: This endpoint processes data BEFORE responding
//
// HOW IT WORKS:
// 1. ESP32 sends sensor data (rain, soil, tilt)
// 2. Convex stores the raw data
// 3. Convex gets historical data (last 20 readings)
// 4. Convex calls Python serverless function (/api/calculate-risk)
// 5. Python calculates risk using Z-scores (takes ~0.5 seconds)
// 6. Convex stores the result in anomalyResults table
// 7. Convex responds to ESP32 with the risk for THIS reading
//
// RESULT: ESP32 gets immediate feedback for the data it JUST sent!
// No more getting old/previous readings' risk states.
http.route({
  path: "/sensor-data",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const data = await request.json();
      
      const { rain_value, soil_moisture, tilt_value } = data;

      // === STEP 1: VALIDATE DATA ===
      // Make sure ESP32 sent numbers, not garbage
      if (
        typeof rain_value !== "number" ||
        typeof soil_moisture !== "number" ||
        typeof tilt_value !== "number"
      ) {
        return new Response(
          JSON.stringify({ 
            status: "error", 
            message: "Invalid data format" 
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // === STEP 2: STORE RAW DATA IN DATABASE ===
      // This gives us an ID to track this specific reading
      const sensorDataId = await ctx.runMutation(api.sensorData.addSensorData, {
        rainValue: rain_value,
        soilMoisture: soil_moisture,
        tiltValue: tilt_value,
      });

      console.log(`📥 Received sensor data: ${sensorDataId}`);

      // === STEP 3: GET HISTORICAL DATA FOR Z-SCORE CALCULATION ===
      // We need past readings to calculate if current reading is "normal" or "anomaly"
      // Get last 20 anomaly results (or fewer if database is new)
      const historyResults = await ctx.runQuery(api.sensorData.getLatestResults, {
        limit: 20,
      });
      
      // Format history for Python - convert from database format to what Python expects
      const history = {
        rain: historyResults.map(h => h.rainValue),
        soil: historyResults.map(h => h.soilMoisture),
        tilt: historyResults.map(h => h.tiltValue),
      };
      
      console.log(`📊 Retrieved ${historyResults.length} historical records for context`);

      // === STEP 4: CALL PYTHON SERVERLESS FUNCTION TO PROCESS IMMEDIATELY ===
      // This is the KEY CHANGE! We don't respond yet.
      // Instead, we call Python to calculate risk NOW (synchronously).
      
      // Build the URL for the Python serverless function
      // In production on Vercel: Uses relative path /api/calculate-risk
      // This works because both Convex and the serverless function are on same deployment
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.PYTHON_SERVER_URL || "http://localhost:3000";
      
      const pythonUrl = `${baseUrl}/api/calculate-risk`;
      
      try {
        console.log(`🔄 Calling Python serverless function at ${pythonUrl}...`);
        
        // Make HTTP POST request to Python serverless function
        // fetch() = JavaScript's way to make HTTP requests (like requests.post in Python)
        // The ESP32 is WAITING during this entire process (synchronous!)
        const pythonResponse = await fetch(pythonUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rainValue: rain_value,
            soilMoisture: soil_moisture,
            tiltValue: tilt_value,
            history: history,  // Pass historical data for Z-score calculation
          }),
        });

        // Check if Python responded successfully
        if (!pythonResponse.ok) {
          throw new Error(`Python serverless function returned ${pythonResponse.status}`);
        }

        // Parse Python's JSON response
        // Format: { success: true, data: { riskScore, riskState, zScores, history } }
        const pythonResult = await pythonResponse.json();
        
        if (!pythonResult.success) {
          throw new Error(pythonResult.error || "Python processing failed");
        }
        
        const processedResult = pythonResult.data;
        
        console.log(`✅ Python processed: ${processedResult.riskState} (${processedResult.riskScore}%)`);

        // === STEP 5: SAVE PROCESSED RESULT TO DATABASE ===
        // Now we store the risk calculation in anomalyResults table
        // This is the NEW result for the data ESP32 JUST sent!
        await ctx.runMutation(api.sensorData.addAnomalyResult, {
          sensorDataId: sensorDataId,
          timestamp: new Date().toISOString(),
          rainValue: rain_value,
          soilMoisture: soil_moisture,
          tiltValue: tilt_value,
          riskScore: processedResult.riskScore,
          riskState: processedResult.riskState,
          zScoreRain: processedResult.zScores.rain,
          zScoreSoil: processedResult.zScores.soil,
          zScoreTilt: processedResult.zScores.tilt,
        });

        // === STEP 6: MARK AS PROCESSED ===
        await ctx.runMutation(api.sensorData.markAsProcessed, {
          id: sensorDataId,
        });

        // === STEP 7: FINALLY RESPOND TO ESP32 ===
        // NOW we respond - ESP32 has waited ~0.5-1 second
        // But it gets the result for THIS reading! ✅
        // 
        // IMPORTANT: This is NOT the old/previous risk state!
        // This is the risk calculated from the data ESP32 JUST sent!
        return new Response(
          JSON.stringify({ 
            status: "success", 
            id: sensorDataId,
            message: "Data processed successfully",
            // ⭐ THIS is the risk state for the data ESP32 just sent!
            riskState: processedResult.riskState,
            riskScore: processedResult.riskScore,
            zScores: processedResult.zScores,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );

      } catch (pythonError) {
        // Python serverless function is down or errored
        console.error("❌ Python processing failed:", pythonError);
        
        // Fallback: Return low risk state so ESP32 doesn't panic
        // We still stored the data, so it can be processed later if needed
        // (Your backend/app.py can pick it up if it's running)
        return new Response(
          JSON.stringify({ 
            status: "warning", 
            id: sensorDataId,
            message: "Data stored but processing failed. Using safe default.",
            riskState: "Low",  // Safe default - don't trigger false alarms
            riskScore: 0,
            error: String(pythonError)
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

    } catch (error) {
      // Unexpected error in this endpoint
      console.error("❌ Error in sensor-data endpoint:", error);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: String(error),
          riskState: "Low"  // Safe default
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", service: "Landslide IoT System" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
