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
      case "High": return "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      case "Medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
      case "Low": return "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-orange-600 bg-orange-50 dark:bg-orange-900/30";
      case "Reviewed": return "text-blue-600 bg-blue-50 dark:bg-blue-900/30";
      case "Resolved": return "text-green-600 bg-green-50 dark:bg-green-900/30";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-700";
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Community Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and review reports submitted by community members</p>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-200">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Reviewed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.reviewed}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reports ({filteredReports.length})</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg font-medium text-sm bg-white dark:bg-gray-700 dark:text-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report._id}
                      className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                    >
                      {/* Mobile and Desktop Layout */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          {/* Report Title */}
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {report.reportType}
                          </h3>
                          
                          {/* Severity and Status - Below title on mobile, inline on desktop */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(report.severity)}`}>
                              {report.severity} Severity
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>

                          {/* Report Details */}
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pt-1">
                            <p><strong>From:</strong> {report.userName} ({report.userEmail})</p>
                            {report.location && <p><strong>Location:</strong> {report.location}</p>}
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {new Date(report.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* View Button - Inside card on mobile, separate on desktop */}
                        <button
                          onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                          className="w-full md:w-auto px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-medium flex items-center justify-center gap-2 md:self-start"
                        >
                          <Eye className="h-4 w-4" />
                          {selectedReport?._id === report._id ? "Hide" : "View"}
                        </button>
                      </div>

                      {/* Expanded View */}
                      {selectedReport?._id === report._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Description:</h4>
                            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {report.description}
                            </p>
                          </div>

                          {report.adminNotes && (
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Admin Notes:</h4>
                              <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                {report.adminNotes}
                              </p>
                            </div>
                          )}

                          {/* Status Update Actions */}
                          <div className="flex gap-2 pt-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 self-center">Update Status:</h4>
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
