'use client';

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { Dashboard } from "@/components/Dashboard";
import { AlertTriangle, Radio, Bell, Zap } from "lucide-react";

export default function Home() {
    return (
        <>
            <SignedIn>
                {/* Authenticated View - Dashboard */}
                <main className="min-h-screen bg-gray-50">
                    <header className="bg-white shadow-sm border-b">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Landslide Monitoring System
                                </h1>
                            </div>
                            <UserButton />
                        </div>
                    </header>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Dashboard />
                    </div>
                </main>
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
                                        <h3 className="text-lg font-semibold mb-2">AI Anomaly Detection</h3>
                                        <p className="text-green-100">Machine learning algorithms predict landslide risks before they occur</p>
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
                    <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
                        <div className="w-full max-w-md">
                            <SignIn 
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "shadow-lg border-0",
                                        logoImage: "h-20 w-20",
                                        headerTitle: "text-2xl font-bold text-gray-900",
                                        headerSubtitle: "text-gray-600",
                                        formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold py-2.5",
                                        formFieldInput: "border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent",
                                        footerActionLink: "text-green-600 hover:text-green-700 font-medium",
                                        socialButtonsBlockButton: "border border-gray-300 rounded-lg hover:bg-gray-50 font-medium",
                                        dividerLine: "bg-gray-200",
                                        dividerText: "text-gray-600"
                                    },
                                    variables: {
                                        colorPrimary: "#16a34a",
                                        colorBackground: "#ffffff",
                                        colorInputBackground: "#f9fafb",
                                        colorInputText: "#111827",
                                        fontFamily: "system-ui, -apple-system, sans-serif"
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
