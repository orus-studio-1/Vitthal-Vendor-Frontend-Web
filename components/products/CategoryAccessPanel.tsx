"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FolderPlus,
  History,
  Info,
  Loader2,
  Search,
  Tags,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Category = { id: string; code: string; label: string; description?: string | null; pending?: boolean };
type RequestStatus = "pending" | "approved" | "partially_approved" | "rejected";
type CategoryRequest = {
  id: string;
  reason: string;
  status: RequestStatus;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  items: Array<{ category_id: string; code: string; label: string; status: "pending" | "approved" | "rejected" }>;
};

const MIN_REASON = 15;
const MAX_REASON = 1000;
const MAX_CATEGORIES = 10;

const STATUS_STYLES: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Under review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  partially_approved: { label: "Partly approved", className: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected: { label: "Not approved", className: "bg-red-50 text-red-700 border-red-200" },
};

const ITEM_STYLES = {
  pending: "bg-gray-50 text-gray-700 border-gray-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200 line-through decoration-red-300",
} as const;

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Shows the vendor's product categories and lets it request more. Catalogue search only shows
 * products from the vendor's own categories, so new categories unlock new catalogue products.
 */
export default function CategoryAccessPanel({
  openRequest = null,
}: {
  /** Opens the dialog on a tab (from a link or a notification). `at` makes repeat opens fire again. */
  openRequest?: { tab: "new" | "history"; at: number } | null;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

  const [assigned, setAssigned] = useState<Category[]>([]);
  const [available, setAvailable] = useState<Category[]>([]);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAllAssigned, setShowAllAssigned] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await fetch(`${apiUrl}/api/vendors/category-requests`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not load your categories.");
      setAssigned(data.data.assigned || []);
      setAvailable(data.data.available || []);
      setRequests(data.data.requests || []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your categories.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (openRequest) {
      setTab(openRequest.tab);
      setModalOpen(true);
    }
  }, [openRequest]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const requestable = available.filter((c) => !c.pending);

  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? available.filter((c) => c.label.toLowerCase().includes(q)) : available;
  }, [available, search]);

  const openModal = (initialTab: "new" | "history" = "new") => {
    setTab(initialTab);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setSearch("");
  };

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_CATEGORIES) {
        toast.error(`You can request up to ${MAX_CATEGORIES} categories at a time.`);
        return current;
      }
      return [...current, id];
    });
  };

  const submit = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one category.");
      return;
    }
    if (reason.trim().length < MIN_REASON) {
      toast.error(`Please describe why you need these categories (at least ${MIN_REASON} characters).`);
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}/api/vendors/category-requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "vendor" },
        body: JSON.stringify({ categoryIds: selected, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not submit your request.");
      toast.success(data.message || "Request submitted for review.");
      setSelected([]);
      setReason("");
      await load();
      setTab("history");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleAssigned = showAllAssigned ? assigned : assigned.slice(0, 8);
  const selectedLabels = available.filter((c) => selected.includes(c.id)).map((c) => c.label);

  return (
    <>
      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Your product categories</h2>
              {!loading && (
                <span className="text-xs text-gray-500">({assigned.length})</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can find and list catalogue products only from these categories. Need another one? Request access and our team will review it.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {loading ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading categories...
                </span>
              ) : loadError ? (
                <span className="text-xs text-red-600">{loadError}</span>
              ) : assigned.length === 0 ? (
                <span className="text-xs text-gray-500 italic">No categories assigned yet.</span>
              ) : (
                <>
                  {visibleAssigned.map((c) => (
                    <span key={c.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                      {c.label}
                    </span>
                  ))}
                  {assigned.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllAssigned((v) => !v)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 px-1"
                    >
                      {showAllAssigned ? "Show less" : `+${assigned.length - 8} more`}
                    </button>
                  )}
                </>
              )}
            </div>

            {pendingRequests.length > 0 && (
              <button
                type="button"
                onClick={() => openModal("history")}
                className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                {pendingRequests.length} request{pendingRequests.length > 1 ? "s" : ""} under review
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {requests.length > 0 && (
              <button
                type="button"
                onClick={() => openModal("history")}
                className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <History className="w-4 h-4 mr-2" />
                Request history
              </button>
            )}
            <button
              type="button"
              onClick={() => openModal("new")}
              disabled={loading || !!loadError}
              className="inline-flex items-center justify-center bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Request categories
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-request-title"
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-200">
              <div>
                <h3 id="category-request-title" className="text-lg font-semibold text-gray-900">
                  Product category access
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Request new categories to unlock their catalogue products for listing.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 border-b border-gray-200">
              {([
                { id: "new", label: "New request" },
                { id: "history", label: `History${requests.length ? ` (${requests.length})` : ""}` },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {tab === "new" ? (
                requestable.length === 0 && available.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-10">
                    <div className="bg-gray-50 p-4 rounded-full mb-4 border border-gray-100">
                      <CheckCircle2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900 mb-1">You have access to every category</p>
                    <p className="text-gray-500 text-sm">There are no more product categories to request right now.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">
                          Select categories <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-gray-500">
                          {selected.length} selected · up to {MAX_CATEGORIES}
                        </span>
                      </div>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search categories..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-gray-50 hover:bg-white text-sm"
                        />
                      </div>
                      <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
                        {filteredAvailable.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-gray-500">No categories match &ldquo;{search}&rdquo;.</p>
                        ) : (
                          filteredAvailable.map((c) => {
                            const isSelected = selected.includes(c.id);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                                  c.pending ? "bg-gray-50/60 cursor-not-allowed" : isSelected ? "bg-gray-50 cursor-pointer" : "hover:bg-gray-50/60 cursor-pointer"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={c.pending}
                                  onChange={() => toggle(c.id)}
                                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 disabled:opacity-40"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className={`block text-sm font-medium ${c.pending ? "text-gray-400" : "text-gray-900"}`}>
                                    {c.label}
                                  </span>
                                  {c.description && (
                                    <span className="block text-xs text-gray-500 truncate">{c.description}</span>
                                  )}
                                </span>
                                {c.pending && (
                                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                    <Clock className="w-3 h-3" /> Under review
                                  </span>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                      {selectedLabels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {available.filter((c) => selected.includes(c.id)).map((c) => (
                            <span key={c.id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-xs font-medium border bg-gray-900 text-white border-gray-900">
                              {c.label}
                              <button
                                type="button"
                                onClick={() => toggle(c.id)}
                                aria-label={`Remove ${c.label}`}
                                className="rounded-full p-0.5 hover:bg-white/20"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="category-request-reason" className="text-sm font-medium text-gray-900">
                        Why do you need these categories? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="category-request-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
                        rows={4}
                        placeholder="e.g. We manufacture and supply office stationery to 40+ corporate clients and hold stock of A4 paper, files and printer consumables."
                        className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <div className="mt-1 flex justify-between text-xs">
                        <span className={reason.trim().length > 0 && reason.trim().length < MIN_REASON ? "text-amber-600" : "text-gray-500"}>
                          Describe the products you supply and your experience. Minimum {MIN_REASON} characters.
                        </span>
                        <span className="text-gray-400">{reason.length}/{MAX_REASON}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs text-blue-800">
                      <Info className="w-4 h-4 shrink-0 mt-px" />
                      <span>
                        Each category is reviewed separately. You&apos;ll get a notification with the decision, and approved categories show up in Add Product right away.
                      </span>
                    </div>
                  </div>
                )
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="bg-gray-50 p-4 rounded-full mb-4 border border-gray-100">
                    <History className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">No requests yet</p>
                  <p className="text-gray-500 text-sm">Your category requests and their decisions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => {
                    const style = STATUS_STYLES[r.status];
                    return (
                      <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-500">Requested on {formatDate(r.created_at)}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style.className}`}>
                            {r.status === "pending" ? <Clock className="w-3 h-3" /> : r.status === "rejected" ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {style.label}
                          </span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {r.items.map((item) => (
                            <span key={item.category_id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ITEM_STYLES[item.status]}`}>
                              {item.label}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-gray-500">Your reason</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.reason}</p>
                        {r.admin_note && (
                          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                            <p className="text-xs font-medium text-gray-500">Note from the admin team</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.admin_note}</p>
                          </div>
                        )}
                        {r.reviewed_at && (
                          <p className="mt-2 text-[11px] text-gray-400">Reviewed on {formatDate(r.reviewed_at)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-lg">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                {tab === "new" ? "Cancel" : "Close"}
              </button>
              {tab === "new" && available.length > 0 && (
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || selected.length === 0 || reason.trim().length < MIN_REASON}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting
                    ? "Submitting..."
                    : selected.length > 1
                      ? `Submit request for ${selected.length} categories`
                      : "Submit request"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
