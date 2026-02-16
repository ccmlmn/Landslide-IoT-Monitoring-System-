import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ESP32 sends sensor data here
http.route({
  path: "/sensor-data",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const data = await request.json();
      
      const { rain_value, soil_moisture, tilt_value } = data;

      // Validate data
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

      // Store in Convex
      const id = await ctx.runMutation(api.sensorData.addSensorData, {
        rainValue: rain_value,
        soilMoisture: soil_moisture,
        tiltValue: tilt_value,
      });

      // Get recent history for anomaly detection
      const recentData = await ctx.runQuery(api.sensorData.getLatestResults, { limit: 20 });
      
      // Build history object from recent data
      const history: { rain: number[], soil: number[], tilt: number[] } = {
        rain: recentData.map(d => d.rainValue),
        soil: recentData.map(d => d.soilMoisture),
        tilt: recentData.map(d => d.tiltValue)
      };

      // Calculate risk using Python serverless function (preferred) or TypeScript fallback
      let riskResult = null;
      
      try {
        // Try Python serverless function first (for production)
        const deploymentUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
        const apiUrl = deploymentUrl 
          ? `https://${deploymentUrl}/api/calculate-risk`
          : 'http://localhost:3000/api/calculate-risk';
        
        const riskResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rainValue: rain_value,
            soilMoisture: soil_moisture,
            tiltValue: tilt_value,
            history: history
          }),
        });

        if (riskResponse.ok) {
          const riskData = await riskResponse.json();
          
          if (riskData.success) {
            riskResult = {
              riskScore: riskData.data.riskScore,
              riskState: riskData.data.riskState,
              zScores: riskData.data.zScores,
              // New fields for hybrid approach
              thresholdStatus: riskData.data.thresholdStatus,
              thresholds: riskData.data.thresholds,
              rollingMean: riskData.data.rollingMean
            };
          }
        }
      } catch (error) {
        console.error("Python API unavailable, using TypeScript fallback:", error);
      }

      // Fallback to TypeScript implementation if Python failed
      if (!riskResult) {
        try {
          riskResult = await ctx.runAction(api.anomalyDetection.calculateRisk, {
            rainValue: rain_value,
            soilMoisture: soil_moisture,
            tiltValue: tilt_value,
          });
        } catch (error) {
          console.error("TypeScript fallback failed:", error);
        }
      }

      // If we have a risk result, save it
      if (riskResult) {
        const timestamp = new Date().toISOString();
        
        await ctx.runMutation(api.sensorData.addAnomalyResult, {
          sensorDataId: id,
          timestamp: timestamp,
          rainValue: rain_value,
          soilMoisture: soil_moisture,
          tiltValue: tilt_value,
          riskScore: riskResult.riskScore,
          riskState: riskResult.riskState,
          zScoreRain: riskResult.zScores.rain,
          zScoreSoil: riskResult.zScores.soil,
          zScoreTilt: riskResult.zScores.tilt,
          // New fields for hybrid approach
          thresholdStatus: riskResult.thresholdStatus,
          thresholds: riskResult.thresholds,
          rollingMean: riskResult.rollingMean
        });

        // Mark as processed
        await ctx.runMutation(api.sensorData.markAsProcessed, { id });

        return new Response(
          JSON.stringify({ 
            status: "success", 
            id,
            message: "Data received and processed",
            riskState: riskResult.riskState,
            riskScore: riskResult.riskScore
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      // Final fallback: Return last known risk state
      const latestAnomaly = await ctx.runQuery(api.anomalyResults.getLatest);

      return new Response(
        JSON.stringify({ 
          status: "success", 
          id,
          message: "Data received (risk calculation pending)",
          riskState: latestAnomaly?.riskState || "Low"
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error receiving sensor data:", error);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: String(error),
          riskState: "Low"
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
