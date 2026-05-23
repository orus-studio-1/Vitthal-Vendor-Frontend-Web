"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Package,
  Search,
  XCircle,
} from "lucide-react";
import { VendorAdminQuotationSummary, vendorQuotationApi } from "@/lib/api";
import { toast } from "sonner";

type FilterTab = "All" | "Action Needed" | "Pending Admin" | "Confirmed" | "Closed";

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function getStatusInfo(status: string) {
  switch (status) {
    case "sent":
    case "vendor_opened":
      return {
        tab: "Action Needed" as FilterTab,
        label: "Action Needed",
        color: "text-rose-700",
        bg: "bg-rose-50 border-rose-200",
        icon: AlertCircle,
      };
    case "vendor_approved":
      return {
        tab: "Pending Admin" as FilterTab,
        label: "Waiting for Admin",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        icon: Clock,
      };
    case "admin_approved":
      return {
        tab: "Confirmed" as FilterTab,
        label: "Approved",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        icon: CheckCircle2,
      };
    case "vendor_rejected":
    case "admin_rejected":
      return {
        tab: "Closed" as FilterTab,
        label: "Closed",
        color: "text-zinc-600",
        bg: "bg-zinc-100 border-zinc-200",
        icon: XCircle,
      };
    default:
      return {
        tab: "All" as FilterTab,
        label: status.replace(/_/g, " "),
        color: "text-zinc-700",
        bg: "bg-zinc-50 border-zinc-200",
        icon: FileText,
      };
  }
}

export default function VendorQuotationsPage() {
  const [quotations, setQuotations] = useState<VendorAdminQuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        const response = await vendorQuotationApi.listDashboardQuotations();
        setQuotations(response.data || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load quotations";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadQuotations();
  }, []);

  const stats = useMemo(() => {
    return quotations.reduce(
      (summary, quotation) => {
        const statusInfo = getStatusInfo(quotation.status);
        summary.total += 1;

        if (statusInfo.tab === "Action Needed") summary.actionNeeded += 1;
        if (statusInfo.tab === "Pending Admin") summary.pendingAdmin += 1;
        if (statusInfo.tab === "Confirmed") summary.confirmed += 1;

        return summary;
      },
      { total: 0, actionNeeded: 0, pendingAdmin: 0, confirmed: 0 }
    );
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const statusInfo = getStatusInfo(quotation.status);
      const matchesTab = activeTab === "All" || statusInfo.tab === activeTab;
      const matchesSearch = !query
        || quotation.title.toLowerCase().includes(query)
        || quotation.company_name.toLowerCase().includes(query)
        || quotation.quotation_number.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, quotations, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-zinc-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="border-b border-zinc-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">Product Quotation Requests</h1>
          <p className="text-zinc-500">Review buy-product quotations sent by admin and respond from the secure email link.</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">Total Requests</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-medium text-rose-700">Action Needed</p>
              <p className="mt-2 text-3xl font-bold text-rose-900">{stats.actionNeeded}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Pending Admin</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">{stats.pendingAdmin}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">Confirmed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 sm:w-auto sm:pb-0">
            {(["All", "Action Needed", "Pending Admin", "Confirmed", "Closed"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search quotation..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50">
              <FileText className="h-10 w-10 text-zinc-300" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">No requests found</h2>
            <p className="mt-2 text-zinc-500">You do not have any product quotation requests matching these filters.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredQuotations.map((quotation) => {
              const status = getStatusInfo(quotation.status);
              const StatusIcon = status.icon;

              return (
                <article
                  key={quotation.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                      <Package size={28} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <h3 className="truncate text-lg font-bold text-zinc-900">{quotation.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-500">{quotation.company_name} • {quotation.quotation_number}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex flex-col rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5">
                          <span className="text-xs font-medium text-zinc-400">Requested Qty</span>
                          <span className="font-semibold text-zinc-800">{quotation.quantity} {quotation.unit}</span>
                        </div>

                        <div className="flex flex-col rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5">
                          <span className="text-xs font-medium text-zinc-400">Target Price</span>
                          <span className="font-semibold text-zinc-800">{formatCurrency(quotation.target_price)}</span>
                        </div>

                        <div className="flex flex-col rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5">
                          <span className="text-xs font-medium text-zinc-400">Vendor Price</span>
                          <span className="font-semibold text-zinc-800">{formatCurrency(quotation.vendor_price)}</span>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-zinc-500">
                        {quotation.status === "sent" || quotation.status === "vendor_opened"
                          ? "Respond from the secure quotation link sent to your email."
                          : quotation.vendor_notes || quotation.admin_review_notes || "No extra notes captured yet."}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
