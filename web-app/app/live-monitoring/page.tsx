"use client";

import { AppLayout } from "@/components/AppLayout";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Droplets, Gauge, Zap, Activity, ChevronsUpDown } from "lucide-react";
import {
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
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

// Known sensor nodes
const SENSOR_NODES = [
  { id: "All", label: "All Nodes", location: "Combined view" },
  { id: "ESP32-001", label: "ESP32-001", location: "Site A — Armani Cameron Residence" },
  { id: "ESP32-002", label: "ESP32-002", location: "Site B — Armani Cameron Residence" },
];

const SITE_NODES = [
  { id: "ESP32-001", siteLabel: "Site A", location: "Armani Cameron Residence" },
  { id: "ESP32-002", siteLabel: "Site B", location: "Armani Cameron Residence" },
];

export default function LiveMonitoring() {
  const [selectedDevice, setSelectedDevice] = useState<string>("All");
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = (user?.publicMetadata?.role as string) || "community";
  const isAdmin = userRole === "admin";

  // Admin: single filtered query
  const deviceFilter = selectedDevice !== "All" ? { deviceId: selectedDevice } : {};
  const latestDataAdmin = useQuery(api.sensorData.getLatestResult, isAdmin ? deviceFilter : { deviceId: "ESP32-001" });
  const recentDataAdmin = useQuery(api.sensorData.getLatestResults, isAdmin ? { limit: 30, ...deviceFilter } : { limit: 1, deviceId: "ESP32-001" });

  // Community: always query both sites independently
  const latestSiteA = useQuery(api.sensorData.getLatestResult, { deviceId: "ESP32-001" });
  const latestSiteB = useQuery(api.sensorData.getLatestResult, { deviceId: "ESP32-002" });
  const recentSiteA = useQuery(api.sensorData.getLatestResults, { limit: 30, deviceId: "ESP32-001" });
  const recentSiteB = useQuery(api.sensorData.getLatestResults, { limit: 30, deviceId: "ESP32-002" });

  const activeNode = SENSOR_NODES.find((n) => n.id === selectedDevice) ?? SENSOR_NODES[0];

  const sidebar = isAdmin ? (
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  ) : (
    <CommunitySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  );

  // ── Community loading state ──────────────────────────────────────────────
  if (!isAdmin && (!latestSiteA || !latestSiteB)) {
    return (
      <AppLayout sidebar={sidebar} onMenuClick={() => setSidebarOpen(true)}>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  // ── Admin loading state ──────────────────────────────────────────────────
  if (isAdmin && !latestDataAdmin) {
    return (
      <AppLayout sidebar={sidebar} onMenuClick={() => setSidebarOpen(true)}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Live Sensor Monitoring</h1>
              <p className="text-gray-600 dark:text-gray-400">Real-time sensor data with detailed analytics</p>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      default: return 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
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

  const defaultThresholdStatus = { status: 'normal', level: 'Low', message: 'Within normal range' };

  // ════════════════════════════════════════════════════════════════════════
  // COMMUNITY VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (!isAdmin) {
    const siteData = [
      { site: latestSiteA!, recent: recentSiteA ?? [], siteLabel: "Site A", location: "Armani Cameron Residence", color: "#2563eb", altColor: "#7c3aed" },
      { site: latestSiteB!, recent: recentSiteB ?? [], siteLabel: "Site B", location: "Armani Cameron Residence", color: "#059669", altColor: "#d97706" },
    ];

    const thresholds = latestSiteA!.thresholds || {
      tilt: { warning: 15, danger: 25, unit: '°' },
      soil: { warning: 70, danger: 85, unit: '%' },
      rain: { warning: 50, danger: 75, unit: '' },
    };

    // Build combined chart data aligned by index
    const maxLen = Math.max(recentSiteA?.length ?? 0, recentSiteB?.length ?? 0);
    const reversedA = [...(recentSiteA ?? [])].reverse();
    const reversedB = [...(recentSiteB ?? [])].reverse();
    const combinedChart = Array.from({ length: maxLen }, (_, i) => ({
      time: new Date((reversedA[i] ?? reversedB[i]).timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      siteA_tilt: reversedA[i]?.tiltValue ?? null,
      siteB_tilt: reversedB[i]?.tiltValue ?? null,
      siteA_soil: reversedA[i]?.soilMoisture ?? null,
      siteB_soil: reversedB[i]?.soilMoisture ?? null,
      siteA_rain: reversedA[i]?.rainValue ?? null,
      siteB_rain: reversedB[i]?.rainValue ?? null,
    }));

    return (
      <AppLayout sidebar={sidebar} onMenuClick={() => setSidebarOpen(true)}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Live Sensor Monitoring</h1>
              <p className="text-gray-600 dark:text-gray-400">Real-time readings from all monitoring sites</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>

          {/* Site A & Site B cards — side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {siteData.map(({ site, siteLabel, location }) => {
              const ts = site.thresholdStatus ?? {};
              const tiltS  = ts.tilt  ?? defaultThresholdStatus;
              const soilS  = ts.soil  ?? defaultThresholdStatus;
              const rainS  = ts.rain  ?? defaultThresholdStatus;
              const thr    = site.thresholds || thresholds;

              const riskColor =
                site.riskState === "High"     ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700" :
                site.riskState === "Moderate" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700" :
                                                "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700";
              const riskTextColor =
                site.riskState === "High" ? "text-red-600 dark:text-red-400" :
                site.riskState === "Moderate" ? "text-yellow-600 dark:text-yellow-400" :
                "text-green-600 dark:text-green-400";

              return (
                <div key={siteLabel} className={`rounded-xl border-2 ${riskColor} overflow-hidden`}>
                  {/* Site header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-base">{siteLabel}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{location}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      site.riskState === "High"     ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                      site.riskState === "Moderate" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" :
                                                      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    }`}>
                      {site.riskState} Risk
                    </span>
                  </div>

                  {/* 3 sensor rows */}
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {[
                      { key: 'tilt', label: 'Tilt Angle',     s: tiltS, value: site.tiltValue,     unit: thr.tilt?.unit ?? '°'  },
                      { key: 'soil', label: 'Soil Moisture',  s: soilS, value: site.soilMoisture,  unit: thr.soil?.unit ?? '%'  },
                      { key: 'rain', label: 'Rain Intensity', s: rainS, value: site.rainValue,     unit: thr.rain?.unit || 'units' },
                    ].map(({ key, label, s, value, unit }) => (
                      <div key={key} className={`flex items-center justify-between px-5 py-3 ${getSensorStatusColor(s.status)} bg-opacity-30`}>
                        <div className="flex items-center gap-2">
                          {getSensorIcon(key)}
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold">
                            {value.toFixed(1)}<span className="text-sm font-normal ml-1 text-gray-500">{unit}</span>
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getSensorStatusColor(s.status)}`}>
                            {s.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tilt Chart — both sites */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle>Tilt Angle Over Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={combinedChart}>
                  <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={[0, (dataMax: number) => Math.max(dataMax, thresholds.tilt.danger * 1.2)]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={thresholds.tilt.danger}  stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} label={{ value: `Danger (${thresholds.tilt.danger}°)`,  position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={thresholds.tilt.warning} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} label={{ value: `Warning (${thresholds.tilt.warning}°)`, position: 'right', fill: '#f59e0b', fontSize: 11 }} />
                  <Line type="monotone" dataKey="siteA_tilt" stroke="#2563eb" strokeWidth={2} dot={false} name="Site A" connectNulls />
                  <Line type="monotone" dataKey="siteB_tilt" stroke="#059669" strokeWidth={2} dot={false} name="Site B" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Soil Chart — both sites */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-green-600" />
                <CardTitle>Soil Moisture Over Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={combinedChart}>
                  <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={[0, (dataMax: number) => Math.max(dataMax, thresholds.soil.danger * 1.2)]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={thresholds.soil.danger}  stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} label={{ value: `Danger (${thresholds.soil.danger}%)`,  position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={thresholds.soil.warning} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} label={{ value: `Warning (${thresholds.soil.warning}%)`, position: 'right', fill: '#f59e0b', fontSize: 11 }} />
                  <Line type="monotone" dataKey="siteA_soil" stroke="#2563eb" strokeWidth={2} dot={false} name="Site A" connectNulls />
                  <Line type="monotone" dataKey="siteB_soil" stroke="#059669" strokeWidth={2} dot={false} name="Site B" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rain Chart — both sites */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-purple-600" />
                <CardTitle>Rain Intensity Over Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={combinedChart}>
                  <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={[0, (dataMax: number) => Math.max(dataMax, thresholds.rain.danger * 1.2)]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={thresholds.rain.danger}  stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} label={{ value: `Danger (${thresholds.rain.danger})`,  position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={thresholds.rain.warning} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} label={{ value: `Warning (${thresholds.rain.warning})`, position: 'right', fill: '#f59e0b', fontSize: 11 }} />
                  <Line type="monotone" dataKey="siteA_rain" stroke="#2563eb" strokeWidth={2} dot={false} name="Site A" connectNulls />
                  <Line type="monotone" dataKey="siteB_rain" stroke="#059669" strokeWidth={2} dot={false} name="Site B" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN VIEW (unchanged)
  // ════════════════════════════════════════════════════════════════════════
  const latestData = latestDataAdmin!;
  const recentData = recentDataAdmin;

  const thresholds = latestData.thresholds || {
    tilt: { warning: 15, danger: 25, unit: '°' },
    soil: { warning: 70, danger: 85, unit: '%' },
    rain: { warning: 50, danger: 75, unit: '' }
  };

  const thresholdStatus = {
    rain: latestData.thresholdStatus?.rain || defaultThresholdStatus,
    soil: latestData.thresholdStatus?.soil || defaultThresholdStatus,
    tilt: latestData.thresholdStatus?.tilt || defaultThresholdStatus
  };

  const chartData = recentData?.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    tilt: item.tiltValue,
    soilMoisture: item.soilMoisture,
    rain: item.rainValue,
    tiltMean: item.rollingMean?.tilt || 0,
    soilMean: item.rollingMean?.soil || 0,
    rainMean: item.rollingMean?.rain || 0
  })).reverse() || [];

  return (
    <AppLayout sidebar={sidebar} onMenuClick={() => setSidebarOpen(true)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Live Sensor Monitoring</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {activeNode.id === "All" ? "Real-time sensor data — all nodes" : `${activeNode.label} · ${activeNode.location}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="appearance-none pl-3 pr-9 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                {SENSOR_NODES.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.id === "All" ? "All Nodes" : `${node.label} — ${node.location}`}
                  </option>
                ))}
              </select>
              <ChevronsUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
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
                  <span className="text-lg text-gray-500 dark:text-gray-400">{thresholds.tilt.unit}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
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
                  <span className="text-lg text-gray-500 dark:text-gray-400">{thresholds.soil.unit}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
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
                  <span className="text-lg text-gray-500 dark:text-gray-400">{thresholds.rain.unit || 'units'}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
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
              <span className="text-sm text-gray-500 dark:text-gray-400">{chartData.length} readings</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} domain={[0, thresholds.tilt.danger * 1.2]} stroke="#9ca3af" />
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
                
                {/* Current tilt */}
                <Line 
                  type="monotone" 
                  dataKey="tilt" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Current Tilt"
                />
                
                {/* Rolling mean as area - Admin only */}
                {isAdmin && (
                  <Area 
                    type="monotone" 
                    dataKey="tiltMean" 
                    fill="#93c5fd" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    name="Rolling Mean"
                  />
                )}
                
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
              <span className="text-sm text-gray-500 dark:text-gray-400">{chartData.length} readings</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} domain={[0, thresholds.soil.danger * 1.2]} stroke="#9ca3af" />
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
                
                <Line 
                  type="monotone" 
                  dataKey="soilMoisture" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Soil Moisture"
                />
                
                {/* Rolling mean as area - Admin only */}
                {isAdmin && (
                  <Area 
                    type="monotone" 
                    dataKey="soilMean" 
                    fill="#86efac" 
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    name="Rolling Mean"
                  />
                )}
                
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
              <span className="text-sm text-gray-500 dark:text-gray-400">{chartData.length} readings</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-gray-200 dark:[&>line]:stroke-gray-600" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} domain={[0, thresholds.rain.danger * 1.2]} stroke="#9ca3af" />
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
                
                <Line 
                  type="monotone" 
                  dataKey="rain" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Rain Intensity"
                />
                
                {/* Rolling mean as area - Admin only */}
                {isAdmin && (
                  <Area 
                    type="monotone" 
                    dataKey="rainMean" 
                    fill="#c084fc" 
                    stroke="#9333ea"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    name="Rolling Mean"
                  />
                )}
                
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

        {/* Summary Cards - Admin only */}
        {isAdmin && (
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
                    <span className="text-lg text-gray-500 dark:text-gray-400">%</span>
                  </div>
                  <div className={`text-sm font-medium ${
                    latestData.riskState === 'High' ? 'text-red-600' :
                    latestData.riskState === 'Moderate' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {latestData.riskState} Risk
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
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
                  <div className="text-xs text-gray-600 dark:text-gray-400">
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
                  <div className="text-xs text-gray-600 dark:text-gray-400">
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
        )}
      </div>
    </AppLayout>
  );
}
