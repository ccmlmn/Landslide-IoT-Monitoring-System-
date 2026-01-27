import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add new sensor data from ESP32
export const addSensorData = mutation({
  args: {
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
  },
  handler: async (ctx, args) => {
    const timestamp = new Date().toISOString();
    
    const id = await ctx.db.insert("sensorData", {
      timestamp,
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
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
    riskScore: v.float64(),
    riskState: v.string(),
    zScoreRain: v.float64(),
    zScoreSoil: v.float64(),
    zScoreTilt: v.float64(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("anomalyResults", {
      sensorDataId: args.sensorDataId,
      timestamp: args.timestamp,
      rainValue: args.rainValue,
      soilMoisture: args.soilMoisture,
      tiltValue: args.tiltValue,
      riskScore: args.riskScore,
      riskState: args.riskState,
      zScoreRain: args.zScoreRain,
      zScoreSoil: args.zScoreSoil,
      zScoreTilt: args.zScoreTilt,
    });

    return id;
  },
});

// Get latest anomaly results for dashboard
export const getLatestResults = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const results = await ctx.db
      .query("anomalyResults")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    
    return results;
  },
});

// Get latest single result
export const getLatestResult = query({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.db
      .query("anomalyResults")
      .withIndex("by_timestamp")
      .order("desc")
      .first();
    
    return result;
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
