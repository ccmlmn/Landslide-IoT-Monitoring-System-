"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Droplets, Mountain, Activity } from "lucide-react";

export function Dashboard() {
  const latestResult = useQuery(api.sensorData.getLatestResult);
  const history = useQuery(api.sensorData.getLatestResults, { limit: 10 });

  if (!latestResult) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">Waiting for sensor data...</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (riskState: string) => {
    switch (riskState) {
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      case "Moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Status Card */}
      <Card className={`border-2 ${getRiskColor(latestResult.riskState)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Current Risk Level: {latestResult.riskState}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">
            {latestResult.riskScore}%
          </div>
          <p className="text-sm text-gray-600">
            Last updated: {new Date(latestResult.timestamp).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Sensor Values Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rain Value</CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestResult.rainValue.toFixed(2)}</div>
            <p className="text-xs text-gray-600">Z-Score: {latestResult.zScoreRain.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soil Moisture</CardTitle>
            <Mountain className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestResult.soilMoisture.toFixed(2)}</div>
            <p className="text-xs text-gray-600">Z-Score: {latestResult.zScoreSoil.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tilt Value</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestResult.tiltValue.toFixed(2)}</div>
            <p className="text-xs text-gray-600">Z-Score: {latestResult.zScoreTilt.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history?.map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {new Date(record.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Rain: {record.rainValue.toFixed(1)} | Soil:{" "}
                    {record.soilMoisture.toFixed(1)} | Tilt:{" "}
                    {record.tiltValue.toFixed(1)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(
                      record.riskState
                    )}`}
                  >
                    {record.riskState}
                  </span>
                  <span className="text-lg font-bold text-gray-700">
                    {record.riskScore.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
