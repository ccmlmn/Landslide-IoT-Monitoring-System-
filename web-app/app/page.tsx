import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Dashboard } from "@/components/Dashboard";
import { AlertTriangle } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Landslide Monitoring System
                        </h1>
                    </div>
                    <div>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Sign In
                                </button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SignedIn>
                    <Dashboard />
                </SignedIn>
                <SignedOut>
                    <div className="flex flex-col items-center justify-center h-96">
                        <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome to Landslide Monitoring System
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Please sign in to view the real-time dashboard
                        </p>
                        <SignInButton mode="modal">
                            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                Sign In to Continue
                            </button>
                        </SignInButton>
                    </div>
                </SignedOut>
            </div>
        </main>
    );
}
