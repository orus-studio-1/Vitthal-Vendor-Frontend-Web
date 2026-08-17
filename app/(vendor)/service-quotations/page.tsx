"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { downloadCsv, downloadPdfReport } from "@/lib/export-utils";

type ServiceQuotation = {
  id: string;
  status: string;
  scope_of_work: string;
  requested_price: string | null;
  agreed_price: string | null;
  created_at: string;
  updated_at: string;
  service_name: string;
  client_name: string;
};

export default function ServiceQuotationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [quotations, setQuotations] = useState<ServiceQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Requests");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const stats = React.useMemo(() => {
    return quotations.reduce(
      (summary, q) => {
        summary.total += 1;
        if (["pending_vendor", "client_countered"].includes(q.status)) {
          summary.actionNeeded += 1;
        } else if (["vendor_offered", "vendor_countered"].includes(q.status)) {
          summary.waitingClient += 1;
        } else if (q.status === "client_accepted") {
          summary.confirmed += 1;
        }
        return summary;
      },
      { total: 0, actionNeeded: 0, waitingClient: 0, confirmed: 0 }
    );
  }, [quotations]);

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  const fetchQuotations = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services/vendor/quotations`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });

      if (res.ok) {
        const json = await res.json();
        setQuotations(json.data || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else {
        setError("Failed to fetch service quotations");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching quotations. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    const interval = setInterval(fetchQuotations, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatOrderId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number | string | null): string => {
    if (value === null) return "N/A";
    const num = Number(value);
    if (isNaN(num)) return "₹0.00";
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(2)}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
      pending_vendor: {
        label: "New Request",
        style: "bg-blue-50 text-blue-700 border-blue-100/50",
        icon: <Clock className="w-3.5 h-3.5 mr-1.5" />,
      },
      vendor_offered: {
        label: "Offer Sent",
        style: "bg-blue-50 text-blue-750 border-blue-100/50",
        icon: <Clock className="w-3.5 h-3.5 mr-1.5" />,
      },
      client_countered: {
        label: "Client Counter",
        style: "bg-amber-50 text-amber-700 border-amber-100/50 animate-pulse",
        icon: <Clock className="w-3.5 h-3.5 mr-1.5" />,
      },
      vendor_countered: {
        label: "Counter Offered",
        style: "bg-blue-55 text-blue-800 border-blue-150",
        icon: <Clock className="w-3.5 h-3.5 mr-1.5" />,
      },
      client_accepted: {
        label: "Accepted",
        style: "bg-emerald-50 text-emerald-700 border-emerald-100/50 font-bold",
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />,
      },
      client_rejected: {
        label: "Client Rejected",
        style: "bg-rose-50 text-rose-700 border-rose-100/50",
        icon: <XCircle className="w-3.5 h-3.5 mr-1.5" />,
      },
      vendor_rejected: {
        label: "Rejected by You",
        style: "bg-rose-50 text-rose-700 border-rose-100/50",
        icon: <XCircle className="w-3.5 h-3.5 mr-1.5" />,
      },
      cancelled: {
        label: "Cancelled",
        style: "bg-zinc-50 text-zinc-500 border-zinc-100",
        icon: <XCircle className="w-3.5 h-3.5 mr-1.5" />,
      },
    };
    return (
      configs[status] || {
        label: status.toUpperCase(),
        style: "bg-zinc-50 text-zinc-600 border-zinc-150",
        icon: <Clock className="w-3.5 h-3.5 mr-1.5" />,
      }
    );
  };

  const handleExportCSV = () => {
    if (filteredQuotations.length === 0) return;
    const headers = [
      "Quotation ID",
      "Customer",
      "Requested Date",
      "Service Name",
      "Target Price",
      "Agreed Price",
      "Status",
    ];
    const rows = filteredQuotations.map((q) => [
      `#${q.id.slice(0, 8).toUpperCase()}`,
      q.client_name,
      new Date(q.created_at).toLocaleDateString("en-IN"),
      q.service_name,
      q.requested_price ? `INR ${parseFloat(q.requested_price).toFixed(2)}` : "N/A",
      q.agreed_price ? `INR ${parseFloat(q.agreed_price).toFixed(2)}` : "N/A",
      q.status.toUpperCase(),
    ]);

    downloadCsv(
      `service_quotations_${new Date().toISOString().split("T")[0]}.csv`,
      headers,
      rows
    );
  };

  const handleExportPDF = () => {
    if (filteredQuotations.length === 0) return;
    const rows = filteredQuotations.map((q) => [
      `#${q.id.slice(0, 8).toUpperCase()}`,
      q.client_name,
      new Date(q.created_at).toLocaleDateString("en-IN"),
      q.service_name,
      q.requested_price ? `INR ${parseFloat(q.requested_price).toFixed(2)}` : "N/A",
      q.agreed_price ? `INR ${parseFloat(q.agreed_price).toFixed(2)}` : "N/A",
      q.status.toUpperCase(),
    ]);

    const sections = [
      {
        heading: `Vendor Service Quotations (${filteredQuotations.length} Requests)`,
        headers: ["ID", "Customer", "Date", "Service", "Target Price", "Agreed Price", "Status"],
        rows,
      },
    ];

    downloadPdfReport(
      "Vendor Service Quotations Report",
      sections,
      `Service_Quotations_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  // Filter Quotations
  const filteredQuotations = quotations.filter((q) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      q.service_name.toLowerCase().includes(query) ||
      q.client_name.toLowerCase().includes(query) ||
      formatOrderId(q.id).toLowerCase().includes(query);

    if (statusFilter === "All Requests") return matchesSearch;
    if (statusFilter === "Pending") return matchesSearch && q.status === "pending_vendor";
    if (statusFilter === "Negotiating") {
      return (
        matchesSearch &&
        ["vendor_offered", "client_countered", "vendor_countered"].includes(q.status)
      );
    }
    if (statusFilter === "Accepted") return matchesSearch && q.status === "client_accepted";
    if (statusFilter === "Closed") {
      return (
        matchesSearch &&
        ["client_rejected", "vendor_rejected", "cancelled"].includes(q.status)
      );
    }
    return matchesSearch;
  });

  // Pagination logic
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Service Quotations Management
            </h1>
            <p className="text-gray-500 mt-1.5 font-medium">
              View and negotiate custom customer order quotes for your services.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredQuotations.length === 0}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={filteredQuotations.length === 0}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Requests</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-rose-700">Action Needed</p>
            <p className="mt-2 text-3xl font-bold text-rose-900">{stats.actionNeeded}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Waiting on Client</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">{stats.waitingClient}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Confirmed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.confirmed}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Quotation ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {["All Requests", "Pending", "Negotiating", "Accepted", "Closed"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-205"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
            <button className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors ml-auto md:ml-0">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <button
                onClick={fetchQuotations}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-7 py-5">Quotation ID</th>
                    <th className="px-7 py-5">Customer</th>
                    <th className="px-7 py-5">Date</th>
                    <th className="px-7 py-5">Service</th>
                    <th className="px-7 py-5">Target Price</th>
                    <th className="px-7 py-5">Current Offer</th>
                    <th className="px-7 py-5">Status</th>
                    <th className="px-7 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedQuotations.length > 0 ? (
                    paginatedQuotations.map((q, idx) => {
                      const statusConfig = getStatusConfig(q.status);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className="px-7 py-5 font-bold text-gray-900">
                            {formatOrderId(q.id)}
                          </td>
                          <td className="px-7 py-5 font-semibold text-gray-700">
                            {q.client_name}
                          </td>
                          <td className="px-7 py-5 text-gray-500 font-medium">
                            {formatDate(q.created_at)}
                          </td>
                          <td className="px-7 py-5 font-medium text-gray-700">
                            {q.service_name}
                          </td>
                          <td className="px-7 py-5 font-bold text-gray-900">
                            {formatCurrency(q.requested_price)}
                          </td>
                          <td className="px-7 py-5 font-bold text-gray-900">
                            {formatCurrency(q.agreed_price)}
                          </td>
                          <td className="px-7 py-5">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center border ${statusConfig.style}`}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-7 py-5 text-right">
                            <Link
                              href={`/service-quotations/${q.id}`}
                              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Negotiate
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-7 py-16 text-center text-gray-500 font-medium"
                      >
                        {quotations.length === 0
                          ? "No service quotations yet. Quotations will appear here once customers request custom service quotes."
                          : "No quotations found matching your search or filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} quotations
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
