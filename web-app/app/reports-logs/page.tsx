"use client";

import { AppLayout } from "@/components/AppLayout";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ReportsLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  const allReports = useQuery(api.reports.getAllReports);
  const stats = useQuery(api.reports.getReportStats);
  const updateStatus = useMutation(api.reports.updateReportStatus);

  const filteredReports = allReports?.filter(report => 
    filterStatus === "All" ? true : report.status === filterStatus
  ) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High": return "text-red-600 bg-red-50 border-red-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-orange-600 bg-orange-50";
      case "Reviewed": return "text-blue-600 bg-blue-50";
      case "Resolved": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const handleStatusUpdate = async (reportId: any, newStatus: string) => {
    await updateStatus({
      reportId,
      status: newStatus,
    });
    setSelectedReport(null);
  };

  return (
    <RoleGuard allowedRoles={["admin"]} fallbackUrl="/">
      <AppLayout 
        sidebar={<AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        onMenuClick={() => setSidebarOpen(true)}
      >
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Community Reports
            </h1>
            <p className="text-gray-600">Manage and review reports submitted by community members</p>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-700">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700">Reviewed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.reviewed}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-700">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {["All", "Pending", "Reviewed", "Resolved"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === status
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reports ({filteredReports.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report._id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {report.reportType}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(report.severity)}`}>
                              {report.severity} Severity
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>From:</strong> {report.userName} ({report.userEmail})</p>
                            {report.location && <p><strong>Location:</strong> {report.location}</p>}
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {new Date(report.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium"
                        >
                          <Eye className="h-4 w-4 inline mr-2" />
                          {selectedReport?._id === report._id ? "Hide" : "View"}
                        </button>
                      </div>

                      {/* Expanded View */}
                      {selectedReport?._id === report._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description:</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {report.description}
                            </p>
                          </div>

                          {report.adminNotes && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Admin Notes:</h4>
                              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                                {report.adminNotes}
                              </p>
                            </div>
                          )}

                          {/* Status Update Actions */}
                          <div className="flex gap-2 pt-2">
                            <h4 className="font-semibold text-gray-900 self-center">Update Status:</h4>
                            {report.status !== "Reviewed" && (
                              <button
                                onClick={() => handleStatusUpdate(report._id, "Reviewed")}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                              >
                                Mark as Reviewed
                              </button>
                            )}
                            {report.status !== "Resolved" && (
                              <button
                                onClick={() => handleStatusUpdate(report._id, "Resolved")}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                              >
                                Mark as Resolved
                              </button>
                            )}
                            {report.status !== "Pending" && (
                              <button
                                onClick={() => handleStatusUpdate(report._id, "Pending")}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
                              >
                                Mark as Pending
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
