import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Raw sensor data from ESP32
  sensorData: defineTable({
    timestamp: v.string(),
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
    processed: v.boolean(), // Track if Python has processed this
  }).index("by_timestamp", ["timestamp"])
    .index("by_processed", ["processed"]),

  // Processed anomaly detection results
  anomalyResults: defineTable({
    sensorDataId: v.id("sensorData"),
    timestamp: v.string(),
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
    riskScore: v.float64(),
    riskState: v.string(), // "Low", "Moderate", "High", "Initializing"
    zScoreRain: v.float64(),
    zScoreSoil: v.float64(),
    zScoreTilt: v.float64(),
  }).index("by_timestamp", ["timestamp"])
    .index("by_risk_state", ["riskState"]),
});
