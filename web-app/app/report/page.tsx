"use client";

import { AppLayout } from "@/components/AppLayout";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ReportPage() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    reportType: "Ground Crack",
    description: "",
    location: "",
    severity: "Medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitReport = useMutation(api.reports.submitReport);

  const reportTypes = [
    "Ground Crack",
    "Water Seepage",
    "Strange Sound",
    "Unusual Movement",
    "Falling Rocks",
    "Other"
  ];

  const severityLevels = [
    { value: "Low", color: "text-green-600", bg: "bg-green-50" },
    { value: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" },
    { value: "High", color: "text-red-600", bg: "bg-red-50" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await submitReport({
        userName: user.fullName || "Anonymous",
        userEmail: user.emailAddresses[0]?.emailAddress || "",
        reportType: formData.reportType,
        description: formData.description,
        location: formData.location || undefined,
        severity: formData.severity,
      });
      
      setSubmitSuccess(true);
      setFormData({
        reportType: "Ground Crack",
        description: "",
        location: "",
        severity: "Medium",
      });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout 
      sidebar={<CommunitySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      onMenuClick={() => setSidebarOpen(true)}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-green-600" />
            Submit a Report
          </h1>
          <p className="text-gray-600">
            Report any unusual observations or concerns about landslide risks in your area
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Report submitted successfully!</p>
                  <p className="text-sm">Our team will review your report shortly.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-blue-800">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">When to report:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Visible cracks in the ground or walls</li>
                  <li>Unusual water flow or seepage</li>
                  <li>Strange sounds (cracking, rumbling)</li>
                  <li>Tilting trees, poles, or structures</li>
                  <li>Sudden changes in well water levels</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Observation *
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {severityLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level.value })}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.severity === level.value
                          ? `${level.bg} border-current ${level.color} font-semibold shadow-md`
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {level.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Near Main Road, Behind Community Hall"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe what you observed in detail..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include details like when you noticed it, size, location, etc.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.description}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    reportType: "Ground Crack",
                    description: "",
                    location: "",
                    severity: "Medium",
                  })}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Clear
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600 text-center">
              Your report will be reviewed by our monitoring team. Your contact information will be kept confidential.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
