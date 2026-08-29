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
import Link from "next/link";
import {
  VendorAdminQuotationSummary,
  VendorQuotationSummary,
  vendorQuotationApi,
  vendorNegotiationApi,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

type FilterTab = "All" | "Action Needed" | "Pending Admin" | "Confirmed" | "Closed";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function getStatusInfo(status: string) {
  switch (status) {
    // Admin-vendor quotation statuses
    case "sent":
    case "vendor_opened":
    // Client-vendor negotiation statuses
    case "pending_vendor":
    case "client_countered":
      return {
        tab: "Action Needed" as FilterTab,
        label: "Action Needed",
        color: "text-rose-700",
        bg: "bg-rose-50 border-rose-200",
        icon: AlertCircle,
      };

    case "vendor_approved":
    case "client_accepted":
    case "admin_confirmation_pending":
      return {
        tab: "Pending Admin" as FilterTab,
        label: "Waiting for Admin",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        icon: Clock,
      };

    case "admin_approved":
    case "admin_confirmed":
      return {
        tab: "Confirmed" as FilterTab,
        label: "Approved",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        icon: CheckCircle2,
      };

    case "vendor_rejected":
    case "admin_rejected":
    case "client_rejected":
    case "admin_confirmation_rejected":
      return {
        tab: "Closed" as FilterTab,
        label: "Closed",
        color: "text-zinc-600",
        bg: "bg-zinc-100 border-zinc-200",
        icon: XCircle,
      };

    case "vendor_offered":
    case "vendor_countered":
      return {
        tab: "All" as FilterTab,
        label: "Waiting on Client",
        color: "text-zinc-500",
        bg: "bg-zinc-100 border-zinc-200",
        icon: Clock,
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
  const router = useRouter();
  const { user } = useAuthStore();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && user.vendorType === "service") {
      router.replace("/service-quotations");
    }
  }, [user, router]);

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        setLoading(true);
        const [negotiationsRes, adminQuotesRes] = await Promise.allSettled([
          vendorNegotiationApi.listQuotations(),
          vendorQuotationApi.listDashboardQuotations(),
        ]);

        const negotiations = negotiationsRes.status === "fulfilled" ? (negotiationsRes.value.data || []) : [];
        const adminQuotes = adminQuotesRes.status === "fulfilled" ? (adminQuotesRes.value.data || []) : [];

        // Normalize adminQuotes
        const normalizedAdminQuotes = adminQuotes.map((q) => ({
          id: q.id,
          status: q.status,
          requested_quantity: q.quantity,
          requested_price: q.target_price,
          current_offer_price: q.vendor_price,
          current_offer_quantity: q.quantity,
          current_offer_by: "admin",
          accepted_price: q.status === "admin_approved" ? q.vendor_price : null,
          accepted_quantity: q.status === "admin_approved" ? q.quantity : null,
          rejection_reason: q.vendor_rejection_reason,
          buyer_city: null,
          buyer_state: null,
          buyer_country: null,
          buyer_pincode: null,
          buyer_id: "admin",
          created_at: q.created_at,
          updated_at: q.updated_at,
          title: q.title,
          is_admin_quote: true,
          company_name: q.company_name,
          quotation_number: q.quotation_number,
          unit: q.unit,
        }));

        // Normalize client negotiations
        const normalizedNegotiations = negotiations.map((n) => ({
          ...n,
          is_admin_quote: false,
          title: n.product_name,
          company_name: "Client Request",
          quotation_number: `REQ-${n.id.slice(0, 8).toUpperCase()}`,
          unit: "Units",
        }));

        const combined = [...normalizedAdminQuotes, ...normalizedNegotiations].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setQuotations(combined);
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
          <p className="text-zinc-500">Review and negotiate buy-product quotations requested by clients or sent by admin.</p>

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
              const isLink = !quotation.is_admin_quote;

              const CardContent = (
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
                        <span className="font-semibold text-zinc-800">{quotation.requested_quantity} {quotation.unit}</span>
                      </div>

                      {quotation.is_admin_quote && (
                        <div className="flex flex-col rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5">
                          <span className="text-xs font-medium text-zinc-400">Target Price</span>
                          <span className="font-semibold text-zinc-800">{formatCurrency(quotation.requested_price)}</span>
                        </div>
                      )}

                      <div className="flex flex-col rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5">
                        <span className="text-xs font-medium text-zinc-400">
                          {quotation.is_admin_quote ? "Vendor Price" : "Current Offer"}
                        </span>
                        <span className="font-semibold text-zinc-800">
                          {formatCurrency(quotation.current_offer_price || quotation.accepted_price)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-zinc-500 line-clamp-2 overflow-hidden text-ellipsis leading-relaxed">
                      {quotation.is_admin_quote
                        ? (quotation.status === "sent" || quotation.status === "vendor_opened"
                          ? "Respond from the secure quotation link sent to your email."
                          : quotation.vendor_notes || quotation.admin_review_notes || "No extra notes captured yet.")
                        : (quotation.status === "pending_vendor"
                          ? "New client request. Click to view details and send your first offer."
                          : quotation.status === "client_countered"
                          ? "Client countered your offer. Click to respond."
                          : "Click to view negotiation history and details.")
                      }
                    </p>
                  </div>
                </div>
              );

              if (isLink) {
                return (
                  <Link
                    key={quotation.id}
                    href={`/quotations/${quotation.id}`}
                    className="block rounded-3xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg"
                  >
                    {CardContent}
                  </Link>
                );
              }

              return (
                <article
                  key={quotation.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg"
                >
                  {CardContent}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
