import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

/**
 * TypeScript implementation of Z-score based anomaly detection
 * This is a fallback in case Python serverless function is unavailable
 */
export const calculateRisk = action({
  args: {
    rainValue: v.float64(),
    soilMoisture: v.float64(),
    tiltValue: v.float64(),
  },
  handler: async (ctx, args) => {
    // Fetch last 20 readings for historical context
    const recentData = await ctx.runQuery(api.sensorData.getLatestResults, { limit: 20 });
    
    // Need at least 5 data points to calculate meaningful statistics
    if (recentData.length < 5) {
      return {
        riskScore: 0,
        riskState: "Initializing",
        zScores: { rain: 0, soil: 0, tilt: 0 }
      };
    }

    // Helper function to calculate Z-score
    const calculateZScore = (current: number, values: number[]): number => {
      const n = values.length;
      const mean = values.reduce((sum, val) => sum + val, 0) / n;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      
      // Avoid division by zero
      if (stdDev === 0) return 0;
      
      return (current - mean) / stdDev;
    };

    // Extract historical values
    const rainHistory = recentData.map(d => d.rainValue);
    const soilHistory = recentData.map(d => d.soilMoisture);
    const tiltHistory = recentData.map(d => d.tiltValue);

    // Calculate Z-scores for each sensor
    const zRain = calculateZScore(args.rainValue, rainHistory);
    const zSoil = calculateZScore(args.soilMoisture, soilHistory);
    const zTilt = calculateZScore(args.tiltValue, tiltHistory);

    // Calculate risk score using Z-scores
    // Take absolute values since we care about deviation in either direction
    const avgZ = (Math.abs(zRain) + Math.abs(zSoil) + Math.abs(zTilt)) / 3;
    
    // Map Z-score to percentage (Z=3 means 3 standard deviations = high risk)
    // Assumption: Z=3 (3 sigma) is 100% risk
    let riskScore = (avgZ / 3) * 100;

    // Critical thresholds: if tilt or soil moisture is extremely abnormal, set max risk
    if (Math.abs(zTilt) > 3 || Math.abs(zSoil) > 3) {
      riskScore = 100;
    }

    // Clamp between 0 and 100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine risk state based on score
    let riskState = "Low";
    if (riskScore > 60) {
      riskState = "High";
    } else if (riskScore > 30) {
      riskState = "Moderate";
    }

    return {
      riskScore: Math.round(riskScore * 100) / 100,
      riskState,
      zScores: {
        rain: Math.round(zRain * 10000) / 10000,
        soil: Math.round(zSoil * 10000) / 10000,
        tilt: Math.round(zTilt * 10000) / 10000,
      }
    };
  },
});
