"use client";

import { AppLayout } from "@/components/AppLayout";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RoleGuard } from "@/components/RoleGuard";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Download,
  Search,
  X,
  Eye,
  ChevronDown,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Alert item type
interface AlertItem {
  _id: string;
  timestamp: string;
  rawTimestamp: string;
  nodeId: string;
  location: string;
  tilt: number;
  moisture: number;
  tiltZ: number;
  moistureZ: number;
  status: "Danger" | "Warning" | "Normal";
}

// Map riskState to display status
function mapStatus(riskState: string): "Danger" | "Warning" | "Normal" {
  switch (riskState) {
    case "High":
      return "Danger";
    case "Moderate":
      return "Warning";
    default:
      return "Normal";
  }
}

// Status badge component
function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const styles = {
    Danger: size === "lg"
      ? "bg-red-100 text-red-700 border border-red-200 px-5 py-1.5 text-base dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
      : "bg-red-100 text-red-700 px-3 py-1 text-xs dark:bg-red-900/30 dark:text-red-400",
    Warning: size === "lg"
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200 px-5 py-1.5 text-base dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
      : "bg-yellow-100 text-yellow-700 px-3 py-1 text-xs dark:bg-yellow-900/30 dark:text-yellow-400",
    Normal: size === "lg"
      ? "bg-green-100 text-green-700 border border-green-200 px-5 py-1.5 text-base dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
      : "bg-green-100 text-green-700 px-3 py-1 text-xs dark:bg-green-900/30 dark:text-green-400",
  };
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.Normal}`}>
      {status}
    </span>
  );
}

// Alert Detail Modal
function AlertDetailModal({
  alert,
  onClose,
}: {
  alert: {
    timestamp: string;
    nodeId: string;
    location: string;
    tilt: number;
    moisture: number;
    tiltZ: number;
    moistureZ: number;
    status: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Alert Details</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Full details for the selected alert event</p>

        {/* Status badge */}
        <div className="flex justify-center mb-5">
          <StatusBadge status={alert.status} size="lg" />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{alert.timestamp}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Node ID</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{alert.nodeId}</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{alert.location}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tilt Angle</p>
            <p className={`text-2xl font-bold ${alert.status === "Danger" ? "text-red-600 dark:text-red-400" : alert.status === "Warning" ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400"}`}>
              {alert.tilt.toFixed(1)}°
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Z-Score: {alert.tiltZ.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Soil Moisture</p>
            <p className={`text-2xl font-bold ${alert.status === "Danger" ? "text-red-600 dark:text-red-400" : alert.status === "Warning" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
              {alert.moisture.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Z-Score: {alert.moistureZ.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sensorFilter, setSensorFilter] = useState("All Sensors");
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const rawResults = useQuery(api.sensorData.getLatestResults, { limit: 100 });

  // Transform data with hardcoded node info (single ESP32 for now)
  const alertData: AlertItem[] = useMemo(() => {
    if (!rawResults) return [];
    return rawResults.map((r) => ({
      _id: r._id,
      timestamp: new Date(r.timestamp).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      rawTimestamp: r.timestamp,
      nodeId: "ESP32-001",
      location: "Sensor A - East Ridge",
      tilt: r.tiltValue,
      moisture: r.soilMoisture,
      tiltZ: r.zScoreTilt,
      moistureZ: r.zScoreSoil,
      status: mapStatus(r.riskState),
    }));
  }, [rawResults]);

  // Counts
  const dangerCount = alertData.filter((a) => a.status === "Danger").length;
  const warningCount = alertData.filter((a) => a.status === "Warning").length;
  const normalCount = alertData.filter((a) => a.status === "Normal").length;

  // Unique node IDs for filters (future-proof for multiple ESP32s)
  const nodeIds = useMemo(() => [...new Set(alertData.map((a: AlertItem) => a.nodeId))], [alertData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return alertData.filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.nodeId.toLowerCase().includes(q) && !a.location.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (statusFilter !== "All Status" && a.status !== statusFilter) return false;
      if (sensorFilter !== "All Sensors" && a.nodeId !== sensorFilter) return false;
      return true;
    });
  }, [alertData, searchQuery, statusFilter, sensorFilter]);

  // Export to CSV
  const handleExport = () => {
    if (filteredData.length === 0) return;
    const headers = ["Timestamp", "Node ID", "Location", "Tilt (°)", "Moisture (%)", "Tilt Z", "Moisture Z", "Status"];
    const rows = filteredData.map((a) => [
      a.timestamp, a.nodeId, a.location,
      a.tilt.toFixed(1), a.moisture.toFixed(1),
      a.tiltZ.toFixed(2), a.moistureZ.toFixed(2), a.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alert-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All Status");
    setSensorFilter("All Sensors");
  };

  const isLoading = rawResults === undefined;

  return (
    <RoleGuard allowedRoles={["admin"]} fallbackUrl="/">
      <AppLayout
        sidebar={<AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        onMenuClick={() => setSidebarOpen(true)}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Anomaly Alerts & Logs</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review and export historical alert data</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Danger Alerts</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{isLoading ? "—" : dangerCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Warning Alerts</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{isLoading ? "—" : warningCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Normal Readings</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{isLoading ? "—" : normalCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Search className="h-4 w-4" />
              Filters:
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by node or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-3">
                {/* Status filter */}
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>Danger</option>
                    <option>Warning</option>
                    <option>Normal</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {/* Sensor filter */}
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={sensorFilter}
                    onChange={(e) => setSensorFilter(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option>All Sensors</option>
                    {nodeIds.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {/* Clear filters */}
                <button
                  onClick={clearFilters}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                  title="Clear filters"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Alert Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Alert Logs</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{filteredData.length} records</span>
            </div>

            {isLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <AlertTriangle className="h-12 w-12 mb-3" />
                <p className="text-lg font-medium">No records found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {/* ===== MOBILE CARD VIEW (< sm) ===== */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredData.map((alert) => (
                    <div key={alert._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">{alert.timestamp}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{alert.nodeId}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{alert.location}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={alert.status} />
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Tilt</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.tilt.toFixed(1)}°</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Moisture</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.moisture.toFixed(1)}%</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Tilt Z</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.tiltZ.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-400">Moist Z</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.moistureZ.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ===== DESKTOP TABLE (>= sm) ===== */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Timestamp</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Node ID</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Location</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tilt (°)</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Moisture (%)</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tilt Z</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Moisture Z</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {filteredData.map((alert) => (
                        <tr key={alert._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{alert.timestamp}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{alert.nodeId}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{alert.location}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{alert.tilt.toFixed(1)}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{alert.moisture.toFixed(1)}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{alert.tiltZ.toFixed(2)}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{alert.moistureZ.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={alert.status} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedAlert(alert)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alert Detail Modal */}
        {selectedAlert && (
          <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
        )}
      </AppLayout>
    </RoleGuard>
  );
}
