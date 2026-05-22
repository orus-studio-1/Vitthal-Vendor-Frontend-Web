"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Loader2, ArrowRight, FileText, Search, Clock, CheckCircle2, XCircle, AlertCircle, Package } from "lucide-react";
import { vendorNegotiationApi, VendorQuotationSummary } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";

type FilterTab = "All" | "Action Needed" | "Pending Client" | "Confirmed" | "Closed";

function getStatusInfo(status: string) {
  switch (status) {
    case "pending_vendor":
    case "client_countered":
      return { label: "Action Needed", color: "text-rose-700", bg: "bg-rose-50 border-rose-200 animate-pulse", icon: AlertCircle };
    case "vendor_offered":
    case "vendor_countered":
      return { label: "Waiting on Client", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock };
    case "client_accepted":
    case "admin_confirmation_pending":
      return { label: "Accepted - Awaiting Admin", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Clock };
    case "admin_confirmed":
      return { label: "Fully Confirmed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 };
    case "client_rejected":
    case "vendor_rejected":
    case "admin_confirmation_rejected":
      return { label: "Rejected / Closed", color: "text-zinc-600", bg: "bg-zinc-100 border-zinc-200", icon: XCircle };
    default:
      return { label: status.replace(/_/g, " "), color: "text-zinc-700", bg: "bg-zinc-50 border-zinc-200", icon: FileText };
  }
}

export default function VendorQuotationsPage() {
  const [quotations, setQuotations] = useState<VendorQuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        const response = await vendorNegotiationApi.listQuotations();
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
    return {
      total: quotations.length,
      actionNeeded: quotations.filter(q => q.status === "pending_vendor" || q.status === "client_countered").length,
      pendingClient: quotations.filter(q => q.status === "vendor_offered" || q.status === "vendor_countered").length,
      confirmed: quotations.filter(q => q.status === "admin_confirmed").length,
    };
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    let filtered = quotations;

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => item.product_name.toLowerCase().includes(q));
    }

    // Apply tab filter
    switch (activeTab) {
      case "Action Needed":
        filtered = filtered.filter(item => item.status === "pending_vendor" || item.status === "client_countered");
        break;
      case "Pending Client":
        filtered = filtered.filter(item => item.status === "vendor_offered" || item.status === "vendor_countered");
        break;
      case "Confirmed":
        filtered = filtered.filter(item => item.status === "admin_confirmed" || item.status === "client_accepted" || item.status === "admin_confirmation_pending");
        break;
      case "Closed":
        filtered = filtered.filter(item => item.status.includes("rejected"));
        break;
    }

    return filtered;
  }, [quotations, activeTab, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-zinc-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-zinc-200 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Quotation Requests</h1>
          <p className="text-zinc-500">Manage client requests and negotiate custom pricing.</p>

          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">Total Requests</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-rose-50 p-5">
              <p className="text-sm font-medium text-rose-700">Action Needed</p>
              <p className="mt-2 text-3xl font-bold text-rose-900">{stats.actionNeeded}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Pending Client</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">{stats.pendingClient}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">Confirmed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex w-full sm:w-auto items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {(["All", "Action Needed", "Pending Client", "Confirmed", "Closed"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
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
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List */}
        {filteredQuotations.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 mb-4">
              <FileText className="h-10 w-10 text-zinc-300" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">No requests found</h2>
            <p className="mt-2 text-zinc-500">You don't have any quotation requests matching these filters.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredQuotations.map((quote) => {
              const status = getStatusInfo(quote.status);
              const StatusIcon = status.icon;
              
              return (
                <Link
                  key={quote.id}
                  href={`/quotations/${quote.id}`}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-3xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {/* Assuming we might have image later, fallback to package */}
                    <Package size={28} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                      <h3 className="text-lg font-bold text-zinc-900 truncate">{quote.product_name}</h3>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex flex-col bg-zinc-50 rounded-lg px-3 py-1.5 border border-zinc-100">
                        <span className="text-xs text-zinc-400 font-medium">Requested Qty</span>
                        <span className="font-semibold text-zinc-800">{quote.requested_quantity} units</span>
                      </div>
                      
                      {/* Usually vendors don't see client's target price until they offer, but it depends on logic. Let's just show current offer */}
                      {(quote as any).current_offer_price && (
                        <div className="flex flex-col bg-blue-50/50 rounded-lg px-3 py-1.5 border border-blue-100">
                          <span className="text-xs text-blue-400 font-medium">Current Offer</span>
                          <span className="font-semibold text-blue-800">₹{(quote as any).current_offer_price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center justify-between w-full sm:w-auto">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
