"use client";

import { AppLayout } from "@/components/AppLayout";
import { Activity } from "lucide-react";

export default function LiveMonitoring() {
  return (
    <AppLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Monitoring</h1>
        <p className="text-gray-600">Real-time sensor data visualization</p>
      </div>

      <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Monitoring</h3>
          <p className="text-gray-500">Content coming soon...</p>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
