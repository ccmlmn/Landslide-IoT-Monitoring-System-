"use client";

import { AppLayout } from "@/components/AppLayout";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RoleGuard } from "@/components/RoleGuard";
import {
  Settings as SettingsIcon,
  SlidersHorizontal,
  Gauge,
  Sun,
  Wifi,
  Battery,
  MapPin,
  RotateCcw,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Algorithm Settings (demo - values don't persist)
  const [zScoreThreshold, setZScoreThreshold] = useState(3.0);
  const [slidingWindowSize, setSlidingWindowSize] = useState(10);
  const [chartRefreshRate, setChartRefreshRate] = useState(3);

  // Threshold Value Settings (demo - values don't persist)
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState(75);
  const [vibrationThreshold, setVibrationThreshold] = useState(4.5);
  const [rainfallThreshold, setRainfallThreshold] = useState(50);
  const [inclinationThreshold, setInclinationThreshold] = useState(15);

  // Dark Mode (functional)
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage on mount + listen for changes from header toggle
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const handleDarkModeChange = () => {
      const current = localStorage.getItem("darkMode") === "true";
      setDarkMode(current);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (newValue) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
    // Dispatch custom event so the header toggle syncs
    window.dispatchEvent(new Event("darkModeChanged"));
  };

  const handleReset = () => {
    setZScoreThreshold(3.0);
    setSlidingWindowSize(10);
    setChartRefreshRate(3);
    setSoilMoistureThreshold(75);
    setVibrationThreshold(4.5);
    setRainfallThreshold(50);
    setInclinationThreshold(15);
  };

  return (
    <RoleGuard allowedRoles={["admin"]} fallbackUrl="/">
      <AppLayout
        sidebar={
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        }
        onMenuClick={() => setSidebarOpen(true)}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Settings
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Configure system parameters and notifications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Algorithm Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <SlidersHorizontal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Algorithm Settings
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure anomaly detection parameters
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Z-Score Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Z-Score Threshold
                    </label>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {zScoreThreshold.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={zScoreThreshold}
                    onChange={(e) =>
                      setZScoreThreshold(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Higher values reduce false positives but may miss some
                    anomalies. Recommended: 3.0 - 3.5
                  </p>
                </div>

                {/* Sliding Window Size */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Sliding Window Size
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={slidingWindowSize}
                      onChange={(e) =>
                        setSlidingWindowSize(parseInt(e.target.value) || 0)
                      }
                      min="5"
                      max="50"
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      readings
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Number of recent readings used to calculate mean and standard
                    deviation.
                  </p>
                </div>

                {/* Chart Refresh Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Chart Refresh Rate
                    </label>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {chartRefreshRate}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={chartRefreshRate}
                    onChange={(e) =>
                      setChartRefreshRate(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Threshold Value Settings (replacing Notification Settings) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <Gauge className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Threshold Value Settings
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure sensor alert thresholds
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Soil Moisture */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Soil Moisture Threshold
                    </label>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {soilMoistureThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={soilMoistureThreshold}
                    onChange={(e) =>
                      setSoilMoistureThreshold(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Alert when soil moisture exceeds this value
                  </p>
                </div>

                {/* Vibration */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vibration Threshold
                    </label>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {vibrationThreshold.toFixed(1)} g
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={vibrationThreshold}
                    onChange={(e) =>
                      setVibrationThreshold(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Alert when ground vibration exceeds this level
                  </p>
                </div>

                {/* Rainfall */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rainfall Threshold
                    </label>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {rainfallThreshold} mm/hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={rainfallThreshold}
                    onChange={(e) =>
                      setRainfallThreshold(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Alert when rainfall rate exceeds this value
                  </p>
                </div>

                {/* Inclination */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Inclination Threshold
                    </label>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {inclinationThreshold}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={inclinationThreshold}
                    onChange={(e) =>
                      setInclinationThreshold(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Alert when slope inclination change exceeds this angle
                  </p>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <Sun className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Display Settings
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Customize the dashboard appearance
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dark Mode
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Toggle between light and dark theme
                    </p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      darkMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        darkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Device Management */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <SettingsIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Device Management
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Monitor connected ESP32 sensor nodes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Device 1 */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Primary Sensor
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ESP32-001
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        Cameron Highlands - North
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Battery className="h-3 w-3" />
                        87%
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                      Online
                    </span>
                  </div>
                </div>

                {/* Device 2 */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Secondary Sensor
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ESP32-002
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        Cameron Highlands - East
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Battery className="h-3 w-3" />
                        92%
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                      Online
                    </span>
                  </div>
                </div>

                {/* Device 3 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Backup Sensor
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ESP32-003
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        Cameron Highlands - South
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Battery className="h-3 w-3" />
                        --
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-gray-400 text-white rounded-full">
                      Offline
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
