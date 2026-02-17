"use client";

import { AppLayout } from "@/components/AppLayout";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RoleGuard } from "@/components/RoleGuard";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={["admin"]} fallbackUrl="/">
      <AppLayout 
        sidebar={<AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        onMenuClick={() => setSidebarOpen(true)}
      >
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">System configuration and preferences - Admin Only</p>
        </div>

        <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-500">Content coming soon...</p>
          </div>
        </div>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
