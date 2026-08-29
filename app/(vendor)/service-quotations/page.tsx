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
  ChevronRight,
  MessageSquare,
  FileText,
  LayoutGrid,
  List,
  Wrench,
  Truck,
  Cog,
  IndianRupee,
  Calendar,
  User,
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const stats = React.useMemo(() => {
    return quotations.reduce(
      (summary, q) => {
        summary.total += 1;
        if (["pending_vendor", "client_countered", "broadcasted"].includes(q.status)) {
          summary.actionNeeded += 1;
        } else if (["vendor_offered", "vendor_countered", "quoted"].includes(q.status)) {
          summary.waitingClient += 1;
        } else if (["client_accepted", "accepted", "in_progress", "completed"].includes(q.status)) {
          summary.confirmed += 1;
        }
        return summary;
      },
      { total: 0, actionNeeded: 0, waitingClient: 0, confirmed: 0 }
    );
  }, [quotations]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
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
      } else if (res.status === 401) {
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
    if (value === null || value === undefined || value === "") return "Open for Bids";
    const num = Number(value);
    if (isNaN(num)) return "Open for Bids";
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(2)}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
      pending_vendor: {
        label: "New Request",
        style: "bg-blue-50 text-blue-700 border-blue-100",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      },
      broadcasted: {
        label: "Open RFQ",
        style: "bg-blue-50 text-blue-700 border-blue-100",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      },
      vendor_offered: {
        label: "Offer Sent",
        style: "bg-amber-50 text-amber-700 border-amber-100",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      },
      quoted: {
        label: "Quoted",
        style: "bg-amber-50 text-amber-700 border-amber-100",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      },
      client_countered: {
        label: "Client Counter",
        style: "bg-amber-50 text-amber-800 border-amber-200 animate-pulse",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      },
      client_accepted: {
        label: "Accepted",
        style: "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold",
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      },
      accepted: {
        label: "Accepted",
        style: "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold",
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      },
      in_progress: {
        label: "In Progress",
        style: "bg-blue-50 text-blue-700 border-blue-100 font-semibold",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      },
      completed: {
        label: "Completed",
        style: "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold",
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      },
      client_rejected: {
        label: "Client Rejected",
        style: "bg-rose-50 text-rose-700 border-rose-100",
        icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
      },
      vendor_rejected: {
        label: "Declined",
        style: "bg-rose-50 text-rose-700 border-rose-100",
        icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
      },
      cancelled: {
        label: "Cancelled",
        style: "bg-zinc-50 text-zinc-500 border-zinc-100",
        icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
      },
    };
    return (
      configs[status] || {
        label: status.toUpperCase(),
        style: "bg-zinc-50 text-zinc-600 border-zinc-200",
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      }
    );
  };

  const getServiceIcon = (name: string) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("logistics") || lower.includes("freight") || lower.includes("transport")) {
      return <Truck className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes("job") || lower.includes("machin") || lower.includes("cnc") || lower.includes("vmc")) {
      return <Cog className="w-4 h-4 text-emerald-600" />;
    }
    return <Wrench className="w-4 h-4 text-emerald-600" />;
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
    downloadPdfReport(
      "Service Quotations Report",
      [
        {
          heading: "Summary",
          rows: [
            ["Total Requests", stats.total],
            ["Action Needed", stats.actionNeeded],
            ["Waiting on Client", stats.waitingClient],
            ["Confirmed", stats.confirmed],
          ],
        },
        {
          heading: "Quotations List",
          headers: ["ID", "Customer", "Date", "Service", "Target", "Agreed", "Status"],
          rows: filteredQuotations.map((q) => [
            `#${q.id.slice(0, 8).toUpperCase()}`,
            q.client_name,
            new Date(q.created_at).toLocaleDateString("en-IN"),
            q.service_name,
            q.requested_price ? `INR ${parseFloat(q.requested_price).toFixed(2)}` : "N/A",
            q.agreed_price ? `INR ${parseFloat(q.agreed_price).toFixed(2)}` : "N/A",
            q.status.toUpperCase(),
          ]),
        },
      ],
      `service_quotations_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.scope_of_work && q.scope_of_work.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "Pending") {
      return (
        matchesSearch &&
        ["pending_vendor", "client_countered", "broadcasted"].includes(q.status)
      );
    }
    if (statusFilter === "Negotiating") {
      return (
        matchesSearch &&
        ["vendor_offered", "vendor_countered", "quoted"].includes(q.status)
      );
    }
    if (statusFilter === "Accepted") {
      return (
        matchesSearch &&
        ["client_accepted", "accepted", "in_progress", "completed"].includes(q.status)
      );
    }
    if (statusFilter === "Closed") {
      return (
        matchesSearch &&
        ["client_rejected", "vendor_rejected", "cancelled"].includes(q.status)
      );
    }
    return matchesSearch;
  });

  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
              Service Quotations & RFQ Bids
            </h1>
            <p className="text-zinc-500 mt-1 text-xs md:text-sm">
              Review factory breakdown tickets, precision machining RFQs, and commercial freight transport requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredQuotations.length === 0}
              className="px-3.5 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-50 transition-all text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={filteredQuotations.length === 0}
              className="px-3.5 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-50 transition-all text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
            <p className="text-xs font-medium text-zinc-500">Total Service Requests</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-2xs">
            <p className="text-xs font-medium text-rose-700">Action Required (New RFQs)</p>
            <p className="mt-2 text-2xl font-bold text-rose-900">{stats.actionNeeded}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-2xs">
            <p className="text-xs font-medium text-amber-700">Quotes Submitted</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{stats.waitingClient}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-2xs">
            <p className="text-xs font-medium text-emerald-700">Jobs Accepted / Active</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.confirmed}</p>
          </div>
        </div>

        {/* Controls: Search, Filters, View Switcher */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, client, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-medium rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {["All Requests", "Pending", "Negotiating", "Accepted", "Closed"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {status}
              </button>
            ))}

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center gap-1 border border-zinc-200 rounded-lg p-0.5 bg-zinc-50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === "grid" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === "table" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-medium">Loading service requests...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-200 bg-white shadow-2xs">
            <p className="text-rose-600 text-xs font-medium mb-3">{error}</p>
            <button
              onClick={fetchQuotations}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : paginatedQuotations.length === 0 ? (
          <div className="p-16 text-center rounded-2xl border border-zinc-200 bg-white shadow-2xs">
            <Wrench className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-800">No service requests found</h3>
            <p className="text-xs text-zinc-500 mt-1">There are no service requests matching your active filter.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* FIXED-SIZE CARDS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedQuotations.map((q) => {
              const statusConfig = getStatusConfig(q.status);
              return (
                <Link
                  key={q.id}
                  href={`/service-quotations/${q.id}`}
                  className="group flex h-[255px] min-h-[255px] max-h-[255px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs transition hover:border-emerald-600 hover:shadow-xs"
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {getServiceIcon(q.service_name)}
                        <span className="font-mono text-xs font-bold text-zinc-900 truncate">
                          {formatOrderId(q.id)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusConfig.style}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Service Name (Fixed 1-line truncate with '...') */}
                    <h3 className="mt-3 font-heading text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition truncate">
                      {q.service_name}
                    </h3>

                    {/* Client Name (Fixed 1-line truncate with '...') */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                      <User className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{q.client_name || "Factory Client"}</span>
                    </div>

                    {/* Scope of Work / Symptoms (Fixed 2-line clamp with '...') */}
                    <p className="mt-2.5 line-clamp-2 text-xs text-zinc-500 leading-relaxed overflow-hidden text-ellipsis">
                      {q.scope_of_work || "Direct service quotation and dispatch request."}
                    </p>
                  </div>

                  {/* Bottom Footer Bar */}
                  <div className="border-t border-zinc-100 pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400">
                        {q.agreed_price ? "Agreed Quote" : "Target / Est. Fare"}
                      </span>
                      <span className="font-heading font-bold text-zinc-900 truncate">
                        {q.agreed_price
                          ? formatCurrency(q.agreed_price)
                          : formatCurrency(q.requested_price)}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                      Review & Bid <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-zinc-500 text-[11px] uppercase font-bold tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-4">Request ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Target / Agreed</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedQuotations.map((q) => {
                    const statusConfig = getStatusConfig(q.status);
                    return (
                      <tr key={q.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-zinc-900">{formatOrderId(q.id)}</td>
                        <td className="px-5 py-4 font-medium text-zinc-900">{q.client_name}</td>
                        <td className="px-5 py-4 text-zinc-500">{formatDate(q.created_at)}</td>
                        <td className="px-5 py-4 font-medium text-zinc-900">{q.service_name}</td>
                        <td className="px-5 py-4 font-semibold text-zinc-900">
                          {q.agreed_price ? formatCurrency(q.agreed_price) : formatCurrency(q.requested_price)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusConfig.style}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/service-quotations/${q.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Open Room <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
            <p className="text-xs text-zinc-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} requests
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-zinc-50"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-zinc-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-zinc-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
