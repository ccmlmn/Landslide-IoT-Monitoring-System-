"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Activity, Mountain, X, Shield, FileText } from "lucide-react";

const communityNavigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Live Monitoring", href: "/live-monitoring", icon: Activity },
  { name: "Report Issue", href: "/report", icon: FileText },
];

interface CommunitySidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CommunitySidebar({ isOpen = true, onClose }: CommunitySidebarProps) {
  const pathname = usePathname();

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden touch-none"
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <div
        className={`flex flex-col w-64 bg-gradient-to-b from-green-50 to-white transition-transform duration-300 ease-in-out
          fixed inset-y-0 left-0 z-50
          lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-green-200 lg:shadow-none
          h-screen shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-md">
              <Mountain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Slope Sentry</h1>
              <p className="text-xs text-green-700 font-medium">Community Monitor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-green-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <p className="px-3 mb-2 text-xs font-semibold text-green-700 uppercase tracking-wider">
            Dashboard
          </p>
          <div className="space-y-2">
            {communityNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-green-600 text-white font-semibold shadow-md"
                      : "text-gray-700 hover:bg-green-100"
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Community Info Box */}
          <div className="mt-8 mx-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Community Access
                </h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  You have access to live monitoring data and current status information.
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-green-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Community Member</span>
          </div>
        </div>
      </div>
    </>
  );
}
