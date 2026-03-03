"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Droplets, Mountain, Activity, ChevronsUpDown, MapPin, ShieldCheck, ShieldAlert, ShieldOff, CloudRain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SensorMap = dynamic(() => import("@/components/SensorMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl">
      <div className="text-sm text-gray-400 animate-pulse">Loading map...</div>
    </div>
  ),
});

// Known sensor nodes
const SENSOR_NODES = [
  { id: "All", label: "All Nodes", location: "Combined view" },
  { id: "ESP32-001", label: "ESP32-001", location: "Site A — Armani Cameron Residence" },
  { id: "ESP32-002", label: "ESP32-002", location: "Site B — Armani Cameron Residence" },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Risk Status Card Skeleton */}
      <Card className="border-2">
        <CardHeader>
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </CardContent>
      </Card>

      {/* Sensor Values Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent History Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardProps {
  showZScore?: boolean;
  isAdmin?: boolean;
}

// ─── Community-focused simplified dashboard ───────────────────────────────────
function CommunityDashboard() {
  const latestResult = useQuery(api.sensorData.getLatestResult, {});
  const perDevice = useQuery(api.sensorData.getLatestResultPerDevice);

  if (!latestResult) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  const { riskState, riskScore, timestamp, thresholdStatus } = latestResult;

  const riskConfig: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; heading: string; sub: string }> = {
    High: {
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-300 dark:border-red-700",
      text: "text-red-700 dark:text-red-300",
      icon: <ShieldOff className="h-12 w-12 text-red-600 dark:text-red-400" />,
      heading: "⚠️ HIGH RISK — Take Action Now",
      sub: "A high landslide risk has been detected. Please follow evacuation instructions immediately.",
    },
    Moderate: {
      bg: "bg-yellow-50 dark:bg-yellow-900/30",
      border: "border-yellow-300 dark:border-yellow-700",
      text: "text-yellow-700 dark:text-yellow-300",
      icon: <ShieldAlert className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />,
      heading: "⚡ MODERATE RISK — Stay Alert",
      sub: "Conditions are elevated. Monitor updates closely and be ready to evacuate if needed.",
    },
    Low: {
      bg: "bg-green-50 dark:bg-green-900/30",
      border: "border-green-300 dark:border-green-700",
      text: "text-green-700 dark:text-green-300",
      icon: <ShieldCheck className="h-12 w-12 text-green-600 dark:text-green-400" />,
      heading: "✅ LOW RISK — All Clear",
      sub: "Conditions are currently normal. No immediate action is required.",
    },
  };

  const cfg = riskConfig[riskState] ?? {
    bg: "bg-gray-50 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-700 dark:text-gray-300",
    icon: <Activity className="h-12 w-12 text-gray-400" />,
    heading: "Initializing…",
    sub: "Waiting for first sensor reading.",
  };

  // Sensor status helpers
  type SensorKey = "rain" | "soil" | "tilt";
  const sensorConfig: { key: SensorKey; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "rain", label: "Rainfall", icon: <CloudRain className="h-6 w-6 text-blue-500" />, desc: "Amount of rainfall detected by the sensor" },
    { key: "soil", label: "Soil Moisture", icon: <Droplets className="h-6 w-6 text-amber-500" />, desc: "Water content in the surrounding soil" },
    { key: "tilt", label: "Ground Movement", icon: <Mountain className="h-6 w-6 text-purple-500" />, desc: "Tilt / slope displacement of the ground" },
  ];

  const statusStyle: Record<string, { badge: string; card: string; label: string }> = {
    normal:  {
      badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      card: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10",
      label: "Safe",
    },
    warning: {
      badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      card: "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10",
      label: "Caution",
    },
    danger:  {
      badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      card: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
      label: "Danger",
    },
  };

  const time = new Date(timestamp).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-4">
      {/* ── Risk Banner ── */}
      <div className={`rounded-2xl border-2 ${cfg.bg} ${cfg.border} p-5 flex items-center gap-4`}>
        <div className="shrink-0">{cfg.icon}</div>
        <div>
          <p className={`text-2xl font-extrabold leading-tight ${cfg.text}`}>{cfg.heading}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{cfg.sub}</p>
          <p className="mt-2 text-xs text-gray-400">Last updated: {time}</p>
        </div>
      </div>

      {/* ── Sensor Condition Cards ── */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
        Sensor Conditions
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {sensorConfig.map(({ key, label, icon, desc }) => {
          const raw = thresholdStatus?.[key];
          const statusKey: string = raw?.status?.toLowerCase() ?? "normal";
          const style = statusStyle[statusKey] ?? statusStyle["normal"];
          return (
            <div key={key} className={`rounded-2xl border-2 ${style.card} px-5 py-4 flex flex-col gap-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{label}</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
                  {style.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {raw?.message ?? desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Site Map ── */}
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1 pt-2">
        Monitoring Sites
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* site legend */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          {SENSOR_NODES.filter((n) => n.id !== "All").map((node) => {
            const data = perDevice?.[node.id];
            const risk: string = data?.riskState ?? "Unknown";
            const color = risk === "High" ? "#ef4444" : risk === "Moderate" ? "#f59e0b" : risk === "Low" ? "#22c55e" : "#9ca3af";
            const siteLabel = node.id === "ESP32-001" ? "Site A" : "Site B";
            return (
              <div key={node.id} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{siteLabel}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "22", color }}>
                  {risk}
                </span>
              </div>
            );
          })}
          <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-block" />
            Live
          </div>
        </div>
        <div style={{ height: 360 }}>
          <SensorMap
            nodes={SENSOR_NODES.filter((n) => n.id !== "All").map((node) => {
              const data = perDevice?.[node.id];
              return {
                id: node.id,
                label: node.label,
                location: node.location,
                lat: node.id === "ESP32-001" ? 4.4715 : 4.4698,
                lng: node.id === "ESP32-001" ? 101.3762 : 101.3779,
                risk: data?.riskState ?? "Unknown",
                riskScore: data?.riskScore,
                tilt: data?.tiltValue,
                soil: data?.soilMoisture,
                rain: data?.rainValue,
                updatedAt: data
                  ? new Date(data.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })
                  : undefined,
              };
            })}
          />
        </div>
      </div>
    </div>
  );
}


export function Dashboard({ showZScore = true, isAdmin = true }: DashboardProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>("All");
  const [chartFilter, setChartFilter] = useState<'all' | 'rain' | 'soil' | 'tilt'>('all');

  // Community users get the simplified resident-focused view
  if (!isAdmin) {
    return <CommunityDashboard />;
  }

  const deviceFilter = selectedDevice !== "All" ? { deviceId: selectedDevice } : {};
  const latestResult = useQuery(api.sensorData.getLatestResult, deviceFilter);
  const history = useQuery(api.sensorData.getLatestResults, { limit: 10, ...deviceFilter });
  const perDevice = useQuery(api.sensorData.getLatestResultPerDevice);

  const activeNode = SENSOR_NODES.find((n) => n.id === selectedDevice) ?? SENSOR_NODES[0];

  if (!latestResult) {
    return <DashboardSkeleton />;
  }

  const getRiskColor = (riskState: string) => {
    switch (riskState) {
      case "High":
        return "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      case "Moderate":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
      case "Low":
        return "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600";
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
      {/* Node / Device Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
          <Activity className="h-4 w-4" />
          <span>Viewing:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {activeNode.id === "All" ? "All Nodes" : `${activeNode.label} · ${activeNode.location}`}
          </span>
        </div>
        <div className="relative">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="appearance-none pl-3 pr-9 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            {SENSOR_NODES.map((node) => (
              <option key={node.id} value={node.id}>
                {node.id === "All" ? "All Nodes" : `${node.label} — ${node.location}`}
              </option>
            ))}
          </select>
          <ChevronsUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Risk Status Card */}
      <Card className={`border-2 ${getRiskColor(latestResult.riskState)}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${
            latestResult.riskState === "High" ? "text-red-600 dark:text-red-400" :
            latestResult.riskState === "Moderate" ? "text-yellow-600 dark:text-yellow-400" :
            "text-green-600 dark:text-green-400"
          }`}>
            <AlertTriangle className="h-6 w-6" />
            Current Risk Level: {latestResult.riskState}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold mb-2 ${
            latestResult.riskState === "High" ? "text-red-600 dark:text-red-400" :
            latestResult.riskState === "Moderate" ? "text-yellow-600 dark:text-yellow-400" :
            "text-green-600 dark:text-green-400"
          }`}>
            {latestResult.riskScore}%
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
            {showZScore && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Z-Score: {latestResult.zScoreRain.toFixed(2)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soil Moisture</CardTitle>
            <Mountain className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestResult.soilMoisture.toFixed(2)}</div>
            {showZScore && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Z-Score: {latestResult.zScoreSoil.toFixed(2)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tilt Value</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestResult.tiltValue.toFixed(2)}</div>
            {showZScore && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Z-Score: {latestResult.zScoreTilt.toFixed(2)}</p>
            )}
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
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Sensors
              </button>
              <button
                onClick={() => setChartFilter('rain')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'rain'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Rain
              </button>
              <button
                onClick={() => setChartFilter('soil')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'soil'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Soil
              </button>
              <button
                onClick={() => setChartFilter('tilt')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartFilter === 'tilt'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, white)', 
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: 'var(--tooltip-text, #111827)'
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
              
              {/* Risk % moved to the end */}
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
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.time}</span>
                <span className={`text-xs font-semibold ${
                  item.status === 'High' ? 'text-red-600' :
                  item.status === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Location Map */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Sensor Locations
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Legend bar */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            {SENSOR_NODES.filter((n) => n.id !== "All").map((node) => {
              const data = perDevice?.[node.id];
              const risk: string = data?.riskState ?? "Unknown";
              const color =
                risk === "High" ? "#ef4444" :
                risk === "Moderate" ? "#f59e0b" :
                risk === "Low" ? "#22c55e" : "#9ca3af";
              return (
                <div key={node.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{node.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{node.location}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "22", color }}>
                    {risk}
                  </span>
                </div>
              );
            })}
            <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-block" />
              Live
            </div>
          </div>

          {/* Map */}
          <div style={{ height: 420 }}>
            <SensorMap
              nodes={SENSOR_NODES.filter((n) => n.id !== "All").map((node) => {
                const data = perDevice?.[node.id];
                return {
                  id: node.id,
                  label: node.label,
                  location: node.location,
                  lat: node.id === "ESP32-001" ? 4.4715 : 4.4698,
                  lng: node.id === "ESP32-001" ? 101.3762 : 101.3779,
                  risk: data?.riskState ?? "Unknown",
                  riskScore: data?.riskScore,
                  tilt: data?.tiltValue,
                  soil: data?.soilMoisture,
                  rain: data?.rainValue,
                  updatedAt: data
                    ? new Date(data.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })
                    : undefined,
                };
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

