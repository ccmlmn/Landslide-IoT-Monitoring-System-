"use client";

import { AppLayout } from "@/components/AppLayout";
import { TrendingUp } from "lucide-react";

export default function HistoricalTrends() {
  return (
    <AppLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historical Trends</h1>
        <p className="text-gray-600">Analyze sensor data over time</p>
      </div>

      <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Historical Trends</h3>
          <p className="text-gray-500">Content coming soon...</p>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
