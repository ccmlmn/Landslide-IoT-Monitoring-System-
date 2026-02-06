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


      // Fetch latest riskState from anomalyResults
      const latestAnomaly = await ctx.runQuery(api.anomalyResults.getLatest);

      return new Response(
        JSON.stringify({ 
          status: "success", 
          id,
          message: "Data received",
          riskState: latestAnomaly?.riskState || "low"
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error receiving sensor data:", error);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: String(error),
          riskState: "low"
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
