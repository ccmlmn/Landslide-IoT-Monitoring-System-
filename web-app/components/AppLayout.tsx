"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wifi, Moon, Settings as SettingsIcon } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const latestResult = useQuery(api.sensorData.getLatestResult);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">Slope Sentry</h1>
              <p className="text-sm text-gray-500">Landslide Early Warning</p>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex items-center gap-4">
              {/* Online Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Online</span>
                </div>
              </div>

              {/* Last Updated */}
              {latestResult && (
                <div className="text-sm text-gray-600">
                  Updated: {new Date(latestResult.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Moon className="h-5 w-5 text-gray-600" />
              </button>

              {/* Settings */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <SettingsIcon className="h-5 w-5 text-gray-600" />
              </button>

              {/* User Button */}
              <UserButton />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
