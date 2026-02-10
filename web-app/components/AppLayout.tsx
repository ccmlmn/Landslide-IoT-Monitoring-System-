"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wifi, Moon, Settings as SettingsIcon, Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const latestResult = useQuery(api.sensorData.getLatestResult);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - fixed overlay on mobile, part of layout on desktop */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content - full width on mobile, flex-1 on desktop */}
      <div className="w-full lg:flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger + Title */}
            <div className="flex items-center gap-3">
              {/* Hamburger menu for mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
                <div>
                <h1 className="text-xl font-bold text-gray-900">Slope Sentry</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Landslide Early Warning</p>
              </div>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Online Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 bg-green-50 rounded-lg">
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-xs lg:text-sm font-medium text-green-700 hidden sm:inline">Online</span>
                </div>
              </div>

              {/* Last Updated */}
              {latestResult && (
                <div className="text-xs lg:text-sm text-gray-600 hidden md:block">
                  Updated: {new Date(latestResult.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
                <Moon className="h-5 w-5 text-gray-600" />
              </button>

              {/* Settings */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
                <SettingsIcon className="h-5 w-5 text-gray-600" />
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
