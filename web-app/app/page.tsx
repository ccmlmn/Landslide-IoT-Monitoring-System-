'use client';

import { SignedIn, SignedOut, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { Dashboard } from "@/components/Dashboard";
import { AppLayout } from "@/components/AppLayout";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { AlertTriangle, Radio, Bell, Zap, Mountain } from "lucide-react";
import { useState } from "react";

function DashboardLayout() {
    const { user } = useUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Get user role from Clerk metadata, default to "community"
    const userRole = (user?.publicMetadata?.role as string) || "community";
    const isAdmin = userRole === "admin";

    // Choose the appropriate sidebar based on role
    const sidebar = isAdmin ? (
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    ) : (
        <CommunitySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    );

    return (
        <AppLayout sidebar={sidebar} onMenuClick={() => setSidebarOpen(true)}>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Overview</h2>
                <p className="text-gray-600">
                    {isAdmin ? "Real-time landslide risk monitoring - Admin Dashboard" : "Real-time landslide risk monitoring - Community View"}
                </p>
            </div>
            <Dashboard />
        </AppLayout>
    );
}

export default function Home() {
    const { isLoaded } = useAuth();

    // Show loading screen while Clerk initializes
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-green-200 animate-ping opacity-20"></div>
                        </div>
                        <div className="relative p-6 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg">
                            <Mountain className="h-12 w-12 text-white animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Slope Sentry</h2>
                    <p className="text-gray-600">Initializing system...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <SignedIn>
                {/* Authenticated View - Dashboard with Sidebar */}
                <DashboardLayout />
            </SignedIn>

            <SignedOut>
                {/* Unauthenticated View - Split Layout */}
                <main className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-950 flex">
                    {/* Left Section - Branding & Features */}
                    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 text-white">
                        <div className="max-w-lg">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-green-600 rounded-lg">
                                    <AlertTriangle className="h-8 w-8" />
                                </div>
                                <h1 className="text-4xl font-bold">Slope Sentry</h1>
                            </div>
                            
                            <p className="text-xl text-green-100 mb-12 leading-relaxed">
                                Advanced IoT-based landslide monitoring and early warning system
                            </p>

                            {/* Features */}
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 bg-opacity-30">
                                            <Radio className="h-6 w-6 text-green-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Live Sensor Data</h3>
                                        <p className="text-green-100">Real-time monitoring from distributed IoT sensors across vulnerable areas</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 bg-opacity-30">
                                            <Zap className="h-6 w-6 text-green-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Hybrid Anomaly Detection</h3>
                                        <p className="text-green-100">Z-score Anomaly Detection combined with threshold-based detection</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 bg-opacity-30">
                                            <Bell className="h-6 w-6 text-green-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Instant Alerts</h3>
                                        <p className="text-green-100">Immediate notifications to authorities and communities for rapid response</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-green-500 border-opacity-30">
                                <p className="text-sm text-green-300">Protecting lives through intelligent disaster prediction</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Sign In */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-white relative overflow-hidden">
                        {/* Subtle Background Pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="topographic" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                        <path d="M20 20c0-10 10-20 20-20s20 10 20 20-10 20-20 20-20-10-20-20z" 
                                              fill="none" stroke="currentColor" strokeWidth="1" className="text-green-600"/>
                                        <path d="M30 30c0-15 15-30 30-30s30 15 30 30-15 30-30 30-30-15-30-30z" 
                                              fill="none" stroke="currentColor" strokeWidth="1" className="text-green-600"/>
                                        <path d="M40 40c0-20 20-40 40-40s40 20 40 40-20 40-40 40-40-20-40-40z" 
                                              fill="none" stroke="currentColor" strokeWidth="1" className="text-green-600"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#topographic)"/>
                            </svg>
                        </div>

                        <div className="w-full max-w-md relative z-10">
                            <SignIn 
                                routing="hash"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "shadow-xl border border-green-100 bg-white/95 backdrop-blur-sm",
                                        logoBox: "hidden",
                                        logoImage: "hidden",
                                        headerTitle: "text-2xl font-bold text-gray-900",
                                        headerSubtitle: "text-gray-600",
                                        formButtonPrimary: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold py-2.5 shadow-md hover:shadow-lg transition-all",
                                        formFieldInput: "border-2 border-gray-200 hover:border-green-300 focus:border-green-500 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 transition-all",
                                        footerActionLink: "text-green-600 hover:text-green-700 font-semibold underline-offset-4",
                                        socialButtonsBlockButton: "border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-lg font-medium transition-all",
                                        dividerLine: "bg-gradient-to-r from-transparent via-gray-300 to-transparent",
                                        dividerText: "text-gray-600 bg-white px-2",
                                        formFieldLabel: "text-gray-700 font-medium",
                                        identityPreviewText: "font-medium",
                                        formFieldInputShowPasswordButton: "text-green-600 hover:text-green-700"
                                    },
                                    variables: {
                                        colorPrimary: "#16a34a",
                                        colorBackground: "#ffffff",
                                        colorInputBackground: "#ffffff",
                                        colorInputText: "#111827",
                                        fontFamily: "system-ui, -apple-system, sans-serif",
                                        borderRadius: "0.5rem"
                                    }
                                }}
                            />
                        </div>
                    </div>
                </main>
            </SignedOut>
        </>
    );
}
