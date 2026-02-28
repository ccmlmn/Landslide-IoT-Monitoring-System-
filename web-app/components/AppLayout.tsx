"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wifi, Moon, Sun, Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  onMenuClick?: () => void;
}

export function AppLayout({ children, sidebar, onMenuClick }: AppLayoutProps) {
  const latestResult = useQuery(api.sensorData.getLatestResult);
  const [darkMode, setDarkMode] = useState(false);

  // Sync dark mode state from localStorage + listen for changes from other components
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const isDark = stored === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }

    const handleDarkModeChange = () => {
      const current = localStorage.getItem("darkMode") === "true";
      setDarkMode(current);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange);
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (newValue) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
    // Dispatch custom event so other components sync
    window.dispatchEvent(new Event("darkModeChanged"));
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - fixed overlay on mobile, part of layout on desktop */}
      {sidebar}

      {/* Main Content - full width on mobile, flex-1 on desktop */}
      <div className="w-full lg:flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger + Title */}
            <div className="flex items-center gap-3">
              {/* Hamburger menu for mobile */}
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
                <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Slope Sentry</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Landslide Early Warning</p>
              </div>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Online Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs lg:text-sm font-medium text-green-700 dark:text-green-400 hidden sm:inline">Online</span>
                </div>
              </div>

              {/* Last Updated */}
              {latestResult && (
                <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                  Updated: {new Date(latestResult.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {/* User Button */}
              <UserButton />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
