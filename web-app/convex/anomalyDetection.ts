import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

/**
 * TypeScript implementation of hybrid anomaly detection (Z-score + Fixed Thresholds)
 * This is a fallback in case Python serverless function is unavailable
 */

// Define threshold values (same as Python version)
const THRESHOLDS = {
  tilt: { warning: 15.0, danger: 25.0, unit: '°' },
  soil: { warning: 70.0, danger: 85.0, unit: '%' },
  rain: { warning: 50.0, danger: 75.0, unit: '' }
};

// Helper function to check threshold status
const checkThresholdStatus = (
  sensorType: 'tilt' | 'soil' | 'rain',
  value: number
): { status: string; level: string; message: string } => {
  const threshold = THRESHOLDS[sensorType];
  
  if (value >= threshold.danger) {
    return {
      status: 'danger',
      level: 'High',
      message: `Exceeds danger threshold (${threshold.danger}${threshold.unit})`
    };
  } else if (value >= threshold.warning) {
    return {
      status: 'warning',
      level: 'Moderate',
      message: `Exceeds warning threshold (${threshold.warning}${threshold.unit})`
    };
  } else {
    return {
      status: 'normal',
      level: 'Low',
      message: 'Within normal range'
    };
  }
};

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
        zScores: { rain: 0, soil: 0, tilt: 0 },
        thresholdStatus: {
          rain: checkThresholdStatus('rain', args.rainValue),
          soil: checkThresholdStatus('soil', args.soilMoisture),
          tilt: checkThresholdStatus('tilt', args.tiltValue)
        },
        thresholds: THRESHOLDS,
        rollingMean: { rain: 0, soil: 0, tilt: 0 }
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

    // Calculate rolling means
    const rollingMean = {
      rain: rainHistory.reduce((sum, val) => sum + val, 0) / rainHistory.length,
      soil: soilHistory.reduce((sum, val) => sum + val, 0) / soilHistory.length,
      tilt: tiltHistory.reduce((sum, val) => sum + val, 0) / tiltHistory.length
    };

    // === METHOD 1: Statistical Z-Scores ===
    const zRain = calculateZScore(args.rainValue, rainHistory);
    const zSoil = calculateZScore(args.soilMoisture, soilHistory);
    const zTilt = calculateZScore(args.tiltValue, tiltHistory);

    // Calculate statistical risk using Z-scores
    const avgZ = (Math.abs(zRain) + Math.abs(zSoil) + Math.abs(zTilt)) / 3;
    let statisticalRisk = (avgZ / 3) * 100;

    // Critical thresholds: if tilt or soil moisture is extremely abnormal, set max risk
    if (Math.abs(zTilt) > 3 || Math.abs(zSoil) > 3) {
      statisticalRisk = 100;
    }

    statisticalRisk = Math.max(0, Math.min(100, statisticalRisk));

    // Determine statistical risk state
    let statisticalState = "Low";
    if (statisticalRisk > 60) {
      statisticalState = "High";
    } else if (statisticalRisk > 30) {
      statisticalState = "Moderate";
    }

    // === METHOD 2: Fixed Threshold Checking ===
    const thresholdStatus = {
      rain: checkThresholdStatus('rain', args.rainValue),
      soil: checkThresholdStatus('soil', args.soilMoisture),
      tilt: checkThresholdStatus('tilt', args.tiltValue)
    };

    // Count danger and warning flags
    const dangerCount = Object.values(thresholdStatus).filter(s => s.status === 'danger').length;
    const warningCount = Object.values(thresholdStatus).filter(s => s.status === 'warning').length;

    // Determine threshold-based risk
    let thresholdRisk = 0;
    let thresholdState = "Low";
    
    if (dangerCount >= 1) {
      thresholdState = "High";
      thresholdRisk = 100;
    } else if (warningCount >= 2) {
      thresholdState = "High";
      thresholdRisk = 80;
    } else if (warningCount >= 1) {
      thresholdState = "Moderate";
      thresholdRisk = 50;
    }

    // === HYBRID COMBINATION: Take the WORSE of both methods ===
    const finalRisk = Math.max(statisticalRisk, thresholdRisk);

    // Final state is the worse of the two
    const riskStates = { Low: 0, Moderate: 1, High: 2 };
    const finalStatePriority = Math.max(
      riskStates[statisticalState as keyof typeof riskStates],
      riskStates[thresholdState as keyof typeof riskStates]
    );
    const finalState = Object.keys(riskStates).find(
      key => riskStates[key as keyof typeof riskStates] === finalStatePriority
    ) as string;

    return {
      riskScore: Math.round(finalRisk * 100) / 100,
      riskState: finalState,
      zScores: {
        rain: Math.round(zRain * 10000) / 10000,
        soil: Math.round(zSoil * 10000) / 10000,
        tilt: Math.round(zTilt * 10000) / 10000,
      },
      thresholdStatus,
      thresholds: THRESHOLDS,
      rollingMean: {
        rain: Math.round(rollingMean.rain * 100) / 100,
        soil: Math.round(rollingMean.soil * 100) / 100,
        tilt: Math.round(rollingMean.tilt * 100) / 100
      }
    };
  },
});
