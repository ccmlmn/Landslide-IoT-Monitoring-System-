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
    // New fields for hybrid approach (threshold-based monitoring)
    thresholdStatus: v.optional(v.object({
      rain: v.object({
        status: v.string(),
        level: v.string(),
        message: v.string()
      }),
      soil: v.object({
        status: v.string(),
        level: v.string(),
        message: v.string()
      }),
      tilt: v.object({
        status: v.string(),
        level: v.string(),
        message: v.string()
      })
    })),
    thresholds: v.optional(v.object({
      tilt: v.object({
        warning: v.float64(),
        danger: v.float64(),
        unit: v.string()
      }),
      soil: v.object({
        warning: v.float64(),
        danger: v.float64(),
        unit: v.string()
      }),
      rain: v.object({
        warning: v.float64(),
        danger: v.float64(),
        unit: v.string()
      })
    })),
    rollingMean: v.optional(v.object({
      rain: v.float64(),
      soil: v.float64(),
      tilt: v.float64()
    }))
  }).index("by_timestamp", ["timestamp"])
    .index("by_risk_state", ["riskState"]),

  // Community reports
  reports: defineTable({
    timestamp: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    reportType: v.string(), // "Ground Crack", "Water Seepage", "Strange Sound", "Other"
    description: v.string(),
    location: v.optional(v.string()),
    severity: v.string(), // "Low", "Medium", "High"
    status: v.string(), // "Pending", "Reviewed", "Resolved"
    adminNotes: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"]),
});
