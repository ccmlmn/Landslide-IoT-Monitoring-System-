import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add new sensor data from ESP32
export const addSensorData = mutation({
  args: {
    deviceId: v.optional(v.string()),
    location: v.optional(v.string()),
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
  },
  handler: async (ctx, args) => {
    const timestamp = new Date().toISOString();
    
    const id = await ctx.db.insert("sensorData", {
      timestamp,
      deviceId: args.deviceId,
      location: args.location,
      rainValue: args.rainValue,
      soilMoisture: args.soilMoisture,
      tiltValue: args.tiltValue,
      processed: false,
    });

    return id;
  },
});

// Get unprocessed sensor data (for Python backend)
export const getUnprocessedData = query({
  args: {},
  handler: async (ctx) => {
    const data = await ctx.db
      .query("sensorData")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .collect();
    
    return data;
  },
});

// Mark sensor data as processed
export const markAsProcessed = mutation({
  args: {
    id: v.id("sensorData"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true });
  },
});

// Add anomaly detection result
export const addAnomalyResult = mutation({
  args: {
    sensorDataId: v.id("sensorData"),
    timestamp: v.string(),
    deviceId: v.optional(v.string()),
    location: v.optional(v.string()),
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
    riskScore: v.float64(),
    riskState: v.string(),
    zScoreRain: v.float64(),
    zScoreSoil: v.float64(),
    zScoreTilt: v.float64(),
    // New optional fields for hybrid approach
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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("anomalyResults", {
      sensorDataId: args.sensorDataId,
      timestamp: args.timestamp,
      deviceId: args.deviceId,
      location: args.location,
      rainValue: args.rainValue,
      soilMoisture: args.soilMoisture,
      tiltValue: args.tiltValue,
      riskScore: args.riskScore,
      riskState: args.riskState,
      zScoreRain: args.zScoreRain,
      zScoreSoil: args.zScoreSoil,
      zScoreTilt: args.zScoreTilt,
      thresholdStatus: args.thresholdStatus,
      thresholds: args.thresholds,
      rollingMean: args.rollingMean,
    });

    return id;
  },
});

// Get latest anomaly results for dashboard
export const getLatestResults = query({
  args: {
    limit: v.optional(v.number()),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let results;
    if (args.deviceId) {
      results = await ctx.db
        .query("anomalyResults")
        .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("anomalyResults")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }
    
    return results;
  },
});

// Get latest single result
export const getLatestResult = query({
  args: {
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.deviceId) {
      const result = await ctx.db
        .query("anomalyResults")
        .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
        .order("desc")
        .first();
      return result;
    }
    const result = await ctx.db
      .query("anomalyResults")
      .withIndex("by_timestamp")
      .order("desc")
      .first();
    
    return result;
  },
});

// Get the latest result for EACH device (for map overview)
export const getLatestResultPerDevice = query({
  args: {},
  handler: async (ctx) => {
    const deviceIds = ["ESP32-001", "ESP32-002"];
    const results: Record<string, any> = {};
    for (const deviceId of deviceIds) {
      const result = await ctx.db
        .query("anomalyResults")
        .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
        .order("desc")
        .first();
      results[deviceId] = result ?? null;
    }
    return results;
  },
});

// Get all sensor data (for debugging)
export const getAllSensorData = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const data = await ctx.db
      .query("sensorData")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    return data;
  },
});
