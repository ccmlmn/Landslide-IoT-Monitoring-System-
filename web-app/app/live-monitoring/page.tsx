"use client";

import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Droplets, Gauge, Zap, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Area,
  ComposedChart
} from "recharts";

export default function LiveMonitoring() {
  const latestData = useQuery(api.sensorData.getLatestResult);
  const recentData = useQuery(api.sensorData.getLatestResults, { limit: 30 });

  // Loading state
  if (!latestData) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Sensor Monitoring</h1>
              <p className="text-gray-600">Real-time sensor data with detailed analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Auto-refresh: 2s</span>
              </div>
            </div>
          </div>
          
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="h-40 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Default thresholds if not in data yet
  const thresholds = latestData.thresholds || {
    tilt: { warning: 15, danger: 25, unit: '°' },
    soil: { warning: 70, danger: 85, unit: '%' },
    rain: { warning: 50, danger: 75, unit: '' }
  };

  // Default threshold status if not in data yet
  const defaultThresholdStatus = {
    status: 'normal',
    level: 'Low',
    message: 'Within normal range'
  };

  const thresholdStatus = {
    rain: latestData.thresholdStatus?.rain || defaultThresholdStatus,
    soil: latestData.thresholdStatus?.soil || defaultThresholdStatus,
    tilt: latestData.thresholdStatus?.tilt || defaultThresholdStatus
  };

  // Prepare chart data
  const chartData = recentData?.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    tilt: item.tiltValue,
    soilMoisture: item.soilMoisture,
    rain: item.rainValue,
    tiltMean: item.rollingMean?.tilt || 0,
    soilMean: item.rollingMean?.soil || 0,
    rainMean: item.rollingMean?.rain || 0
  })).reverse() || [];

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getSensorIcon = (sensor: string) => {
    switch(sensor) {
      case 'tilt': return <TrendingUp className="h-5 w-5" />;
      case 'soil': return <Droplets className="h-5 w-5" />;
      case 'rain': return <Gauge className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Sensor Monitoring</h1>
            <p className="text-gray-600">Real-time sensor data with detailed analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Auto-refresh: 2s</span>
            </div>
          </div>
        </div>

        {/* Current Sensor Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tilt Sensor */}
          <Card className={`border-2 ${getSensorStatusColor(thresholdStatus.tilt.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getSensorIcon('tilt')}
                  Tilt Angle
                </CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSensorStatusColor(thresholdStatus.tilt.status)}`}>
                  {thresholdStatus.tilt.level}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{latestData.tiltValue.toFixed(1)}</span>
                  <span className="text-lg text-gray-500">{thresholds.tilt.unit}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {thresholdStatus.tilt.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Soil Moisture Sensor */}
          <Card className={`border-2 ${getSensorStatusColor(thresholdStatus.soil.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getSensorIcon('soil')}
                  Soil Moisture
                </CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSensorStatusColor(thresholdStatus.soil.status)}`}>
                  {thresholdStatus.soil.level}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{latestData.soilMoisture.toFixed(1)}</span>
                  <span className="text-lg text-gray-500">{thresholds.soil.unit}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {thresholdStatus.soil.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rain Sensor */}
          <Card className={`border-2 ${getSensorStatusColor(thresholdStatus.rain.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getSensorIcon('rain')}
                  Rain Intensity
                </CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSensorStatusColor(thresholdStatus.rain.status)}`}>
                  {thresholdStatus.rain.level}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{latestData.rainValue.toFixed(1)}</span>
                  <span className="text-lg text-gray-500">{thresholds.rain.unit || 'units'}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {thresholdStatus.rain.message}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tilt Angle Chart with Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle>Tilt Angle Over Time</CardTitle>
              </div>
              <span className="text-sm text-gray-500">{chartData.length} readings</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, thresholds.tilt.danger * 1.2]} />
                <Tooltip />
                <Legend />
                
                {/* Danger threshold */}
                <ReferenceLine 
                  y={thresholds.tilt.danger} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Danger (${thresholds.tilt.danger}°)`, position: 'right', fill: '#ef4444', fontSize: 12 }}
                />
                
                {/* Warning threshold */}
                <ReferenceLine 
                  y={thresholds.tilt.warning} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Warning (${thresholds.tilt.warning}°)`, position: 'right', fill: '#f59e0b', fontSize: 12 }}
                />
                
                {/* Rolling mean as area */}
                <Area 
                  type="monotone" 
                  dataKey="tiltMean" 
                  fill="#93c5fd" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={0.2}
                  name="Rolling Mean"
                />
                
                {/* Current tilt */}
                <Line 
                  type="monotone" 
                  dataKey="tilt" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Current Tilt"
                />
                
                {/* Dummy lines for legend - Warning */}
                <Line 
                  type="monotone" 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name={`Warning (${thresholds.tilt.warning}°)`}
                  legendType="line"
                />
                
                {/* Dummy lines for legend - Danger */}
                <Line 
                  type="monotone" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name={`Danger (${thresholds.tilt.danger}°)`}
                  legendType="line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Soil Moisture Chart with Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-green-600" />
                <CardTitle>Soil Moisture Over Time</CardTitle>
              </div>
              <span className="text-sm text-gray-500">{chartData.length} readings</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, thresholds.soil.danger * 1.2]} />
                <Tooltip />
                <Legend />
                
                <ReferenceLine 
                  y={thresholds.soil.danger} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Danger (${thresholds.soil.danger}%)`, position: 'right', fill: '#ef4444', fontSize: 12 }}
                />
                
                <ReferenceLine 
                  y={thresholds.soil.warning} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Warning (${thresholds.soil.warning}%)`, position: 'right', fill: '#f59e0b', fontSize: 12 }}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="soilMean" 
                  fill="#86efac" 
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={0.2}
                  name="Rolling Mean"
                />
                
                <Line 
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Soil Moisture"
                />
                
                {/* Dummy lines for legend - Warning */}
                <Line 
                  type="monotone" 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name={`Warning (${thresholds.soil.warning}%)`}
                  legendType="line"
                />
                
                {/* Dummy lines for legend - Danger */}
                <Line 
                  type="monotone" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name={`Danger (${thresholds.soil.danger}%)`}
                  legendType="line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rain Sensor Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-purple-600" />
                <CardTitle>Rain Intensity Over Time</CardTitle>
              </div>
              <span className="text-sm text-gray-500">{chartData.length} readings</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, thresholds.rain.danger * 1.2]} />
                <Tooltip />
                <Legend />
                
                <ReferenceLine 
                  y={thresholds.rain.danger} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Danger (${thresholds.rain.danger})`, position: 'right', fill: '#ef4444', fontSize: 12 }}
                />
                
                <ReferenceLine 
                  y={thresholds.rain.warning} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Warning (${thresholds.rain.warning})`, position: 'right', fill: '#f59e0b', fontSize: 12 }}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="rainMean" 
                  fill="#c084fc" 
                  stroke="#9333ea"
                  strokeWidth={2}
                  fillOpacity={0.2}
                  name="Rolling Mean"
                />
                
                <Line 
                  type="monotone" 
                  dataKey="rain" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Rain Intensity"
                />
                
                {/* Dummy lines for legend - Warning */}
                <Line 
                  type="monotone" 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name={`Warning (${thresholds.rain.warning})`}
                  legendType="line"
                />
                
                {/* Dummy lines for legend - Danger */}
                <Line 
                  type="monotone" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name={`Danger (${thresholds.rain.danger})`}
                  legendType="line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Combined Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{latestData.riskScore.toFixed(1)}</span>
                  <span className="text-lg text-gray-500">%</span>
                </div>
                <div className={`text-sm font-medium ${
                  latestData.riskState === 'High' ? 'text-red-600' :
                  latestData.riskState === 'Moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {latestData.riskState} Risk
                </div>
                <div className="text-xs text-gray-600">
                  Hybrid approach: Z-Score + Thresholds
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Max Z-Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {Math.max(
                    Math.abs(latestData.zScoreRain),
                    Math.abs(latestData.zScoreSoil),
                    Math.abs(latestData.zScoreTilt)
                  ).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  {Math.max(Math.abs(latestData.zScoreRain), Math.abs(latestData.zScoreSoil), Math.abs(latestData.zScoreTilt)) >= 3 
                    ? '🚨 Critical anomaly detected' 
                    : Math.max(Math.abs(latestData.zScoreRain), Math.abs(latestData.zScoreSoil), Math.abs(latestData.zScoreTilt)) >= 2 
                    ? '⚠️ Moderate anomaly' 
                    : '✅ Normal'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xl font-bold">
                  {new Date(latestData.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(latestData.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
