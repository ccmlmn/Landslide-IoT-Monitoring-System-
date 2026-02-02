"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Droplets, Mountain, Activity, MapPin, Wifi, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Risk Status Card Skeleton */}
      <Card className="border-2">
        <CardHeader>
          <div className="h-7 bg-gray-200 rounded w-64"></div>
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </CardContent>
      </Card>

      {/* Sensor Values Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent History Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-64"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const latestResult = useQuery(api.sensorData.getLatestResult);
  const history = useQuery(api.sensorData.getLatestResults, { limit: 10 });
  const [chartFilter, setChartFilter] = useState<'all' | 'rain' | 'soil' | 'tilt'>('all');

  if (!latestResult) {
    return <DashboardSkeleton />;
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

  // Prepare chart data
  const chartData = history?.map((record) => ({
    time: new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    rain: record.rainValue,
    soil: record.soilMoisture,
    tilt: record.tiltValue,
    risk: record.riskScore,
    status: record.riskState
  })).reverse() || [];

  return (
    <div className="space-y-6">
      {/* Sensor Status Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sensor Status</p>
                <p className="text-lg font-semibold text-gray-900">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-lg font-semibold text-gray-900">Site A - Zone 1 - UTP</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(latestResult.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Sensor Data Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Sensor Data Trends</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setChartFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'all'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Sensors
              </button>
              <button
                onClick={() => setChartFilter('rain')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'rain'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rain
              </button>
              <button
                onClick={() => setChartFilter('soil')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'soil'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Soil
              </button>
              <button
                onClick={() => setChartFilter('tilt')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'tilt'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tilt
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              
              {(chartFilter === 'all' || chartFilter === 'rain') && (
                <Line 
                  type="monotone" 
                  dataKey="rain" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Rain Value"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {(chartFilter === 'all' || chartFilter === 'soil') && (
                <Line 
                  type="monotone" 
                  dataKey="soil" 
                  stroke="#d97706" 
                  strokeWidth={2}
                  name="Soil Moisture"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {(chartFilter === 'all' || chartFilter === 'tilt') && (
                <Line 
                  type="monotone" 
                  dataKey="tilt" 
                  stroke="#9333ea" 
                  strokeWidth={2}
                  name="Tilt Value"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="risk" 
                stroke="#dc2626" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Risk %"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Risk Status Legend */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {chartData.slice(-5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  item.status === 'High' ? 'bg-red-600' :
                  item.status === 'Moderate' ? 'bg-yellow-600' : 'bg-green-600'
                }`}></div>
                <span className="text-xs text-gray-600">{item.time}</span>
                <span className={`text-xs font-semibold ${
                  item.status === 'High' ? 'text-red-600' :
                  item.status === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
