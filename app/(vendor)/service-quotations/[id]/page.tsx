"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Wrench,
  TrendingUp,
  Clock,
  User,
  CheckCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  Percent,
  ExternalLink,
  ShieldCheck,
  IndianRupee,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

type Message = {
  id: string;
  sender_role: "client" | "vendor";
  action: "offer" | "counter" | "accept" | "reject" | "request";
  offer_price: string | null;
  note: string | null;
  reason: string | null;
  created_at: string;
  sender_name: string;
};

type Quotation = {
  id: string;
  status: string;
  scope_of_work: string;
  requested_price: string | null;
  agreed_price: string | null;
  created_at: string;
  updated_at: string;
  service_id: string;
  user_id: string;
  vendor_id: string;
  service_name: string;
  client_name: string;
  client_email: string;
  base_document_url?: string;
  vendor_document_url?: string;
  delivery_days?: number;
  token_percentage?: string;
  token_amount?: string;
  current_offer_price?: string;
  current_offer_by?: string;
  pricing_type?: string;
  moq?: number;
};

export default function ServiceQuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [vendorActionTab, setVendorActionTab] = useState<"accept" | "counter" | "reject">("counter");
  const [priceInput, setPriceInput] = useState("");
  const [deliveryDaysInput, setDeliveryDaysInput] = useState("");
  const [tokenPercentageInput, setTokenPercentageInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const isFirstOffer = React.useMemo(
    () => Boolean(quotation && (quotation.status === "pending_vendor" || quotation.status === "broadcasted")),
    [quotation]
  );

  const formatINR = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === "") return "₹0.00";
    const num = Number(val);
    if (isNaN(num)) return "₹0.00";
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const computedSubtotal = React.useMemo(() => {
    const p = parseFloat(priceInput);
    return isNaN(p) ? 0 : p;
  }, [priceInput]);

  const computedGST = React.useMemo(() => {
    return computedSubtotal * 0.18;
  }, [computedSubtotal]);

  const computedTotal = React.useMemo(() => {
    return computedSubtotal + computedGST;
  }, [computedSubtotal, computedGST]);

  const computedTokenAmount = React.useMemo(() => {
    const pct = parseFloat(tokenPercentageInput);
    if (isNaN(pct) || pct <= 0) return 0;
    return (computedTotal * pct) / 100;
  }, [computedTotal, tokenPercentageInput]);

  const isTerminal = React.useMemo(() => {
    if (!quotation) return false;
    return ["client_rejected", "vendor_rejected", "cancelled"].includes(quotation.status);
  }, [quotation]);

  const isWaitingForClient = React.useMemo(() => {
    if (!quotation) return false;
    return ["vendor_offered", "vendor_countered", "quoted"].includes(quotation.status);
  }, [quotation]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const res = await fetch(`${apiUrl}/api/services/quotations/${id}`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        const json = await res.json();
        setQuotation(json.data?.quotation || null);
        setMessages(json.data?.messages || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else {
        setError("Failed to load quotation details");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching quotation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role !== "vendor" || (user.vendorType !== "service" && user.vendorType !== "both"))) {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const submitResponse = async (action: "offer" | "counter" | "reject" | "accept") => {
    setSubmittingAction(true);

    try {
      const payload: Record<string, unknown> = { action };
      if (action === "offer" || action === "counter") {
        if (!priceInput) throw new Error("Price is required");
        if (!deliveryDaysInput) throw new Error("Execution timeline is required");
        if (!tokenPercentageInput) throw new Error("Token money percentage is required");

        payload.offerPrice = Number(priceInput);
        payload.deliveryDays = Number(deliveryDaysInput);
        payload.tokenPercentage = Number(tokenPercentageInput);
        payload.note = noteInput.trim();

        if (action === "counter") {
          if (!reasonInput.trim()) throw new Error("Reason required for counter proposal");
          payload.reason = reasonInput.trim();
        }
      }
      if (action === "reject") {
        if (!reasonInput.trim()) throw new Error("Reason required for rejection");
        payload.reason = reasonInput.trim();
        payload.note = noteInput.trim();
      }
      if (action === "accept") {
        payload.note = noteInput.trim();
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const res = await fetch(`${apiUrl}/api/services/quotations/${id}/respond`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(action === "accept" ? "Proposal accepted successfully!" : "Response submitted successfully");
        setPriceInput("");
        setDeliveryDaysInput("");
        setTokenPercentageInput("");
        setNoteInput("");
        setReasonInput("");
        fetchDetails();
      } else {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Failed to submit response");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit response";
      toast.error(message);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading && !quotation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50/50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Quotation Not Found</h1>
        <p className="text-gray-500 mt-2">{error || "Could not find details for this request."}</p>
        <Link href="/service-quotations" className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold">
          <ArrowLeft size={16} /> Back to Service Quotations
        </Link>
      </div>
    );
  }

  const canRespond = !isTerminal && !isWaitingForClient;

  return (
    <div className="min-h-screen bg-zinc-50/50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/service-quotations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Requests
            </Link>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">{quotation.service_name}</h1>
              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Service
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Quotation <span className="font-mono text-zinc-700 font-bold">{quotation.id.slice(0, 8).toUpperCase()}</span> • Valid until 30 days from creation
            </p>
          </div>
          <span
            className={`self-start sm:self-center inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase border shadow-sm ${
              ["completed", "client_accepted", "accepted", "confirmed"].includes(quotation.status)
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : quotation.status === "in_progress"
                ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                : isTerminal
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            }`}
          >
            {["completed", "client_accepted", "accepted", "confirmed"].includes(quotation.status) && (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            )}
            {quotation.status === "pending_vendor" ? "Action Needed" : quotation.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Columns - Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Official Agreements Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Official Agreements</h3>
              <div className="space-y-3">
                {/* 1. Base Client Agreement */}
                {quotation.base_document_url ? (
                  <a
                    href={quotation.base_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-semibold text-zinc-700"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText size={16} className="text-zinc-500 shrink-0" />
                      View Base Agreement
                    </span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 text-xs text-zinc-400 text-center">
                    Generating Base Agreement...
                  </div>
                )}

                {/* 2. Vendor Specific Proposal Agreement */}
                {quotation.vendor_document_url ? (
                  <a
                    href={quotation.vendor_document_url.includes('?') ? quotation.vendor_document_url : `${quotation.vendor_document_url}?t=${new Date(quotation.updated_at || quotation.created_at).getTime()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors text-xs font-semibold text-blue-800 animate-pulse"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                      Your Latest Quotation
                    </span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 text-xs text-zinc-400 text-center">
                    Awaiting Your First Offer Signature
                  </div>
                )}
              </div>
            </div>

            {/* Quotation Details Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Quotation Details</h3>
              <div className="space-y-3.5 border-t border-zinc-100 pt-4">
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm font-medium">Target Price</span>
                  <span className="font-extrabold text-zinc-900">{formatINR(quotation.requested_price)}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm font-medium">Agreed Final Quote</span>
                  <span className="font-extrabold text-emerald-600 font-mono text-base">
                    {formatINR(quotation.agreed_price || quotation.current_offer_price)}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm flex items-center gap-1"><Truck size={14} /> Execution Timeline</span>
                  <span className="font-semibold text-zinc-900">
                    {quotation.delivery_days ? `${quotation.delivery_days} Business Days` : "Pending first offer"}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm flex items-center gap-1"><Percent size={14} /> Token Money</span>
                  <span className="font-semibold text-zinc-900">
                    {quotation.token_percentage != null ? `${quotation.token_percentage}% (${formatINR(quotation.token_amount)})` : "Pending first offer"}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] text-zinc-400">Created: {new Date(quotation.created_at).toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Last Update: {new Date(quotation.updated_at || quotation.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Scope of Work */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Scope of Work</h3>
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 text-xs text-zinc-600 italic leading-relaxed whitespace-pre-wrap">
                &quot;{quotation.scope_of_work}&quot;
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Progress</h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:-translate-x-1/2 before:bg-zinc-100">
                {/* 1. Request Received */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">Request Received</p>
                </div>

                {/* 2. Negotiation */}
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                    quotation.status !== "pending_vendor" && quotation.status !== "broadcasted"
                      ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                      : "bg-blue-600 ring-4 ring-blue-50 text-white"
                  }`}>
                    {quotation.status !== "pending_vendor" && quotation.status !== "broadcasted" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${
                    quotation.status !== "pending_vendor" && quotation.status !== "broadcasted"
                      ? "text-zinc-900"
                      : "text-blue-600"
                  }`}>Negotiation</p>
                </div>

                {/* 3. Client Accepted */}
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                    ["client_accepted", "accepted", "confirmed", "in_progress", "completed"].includes(quotation.status)
                      ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                      : "bg-zinc-200"
                  }`}>
                    {["client_accepted", "accepted", "confirmed", "in_progress", "completed"].includes(quotation.status) && (
                      <CheckCircle2 size={12} />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${
                    ["client_accepted", "accepted", "confirmed", "in_progress", "completed"].includes(quotation.status)
                      ? "text-emerald-700"
                      : "text-zinc-400"
                  }`}>Client Accepted</p>
                </div>

                {/* 4. In Progress */}
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                    ["in_progress", "completed"].includes(quotation.status)
                      ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                      : quotation.status === "client_accepted"
                      ? "bg-blue-600 ring-4 ring-blue-50 text-white animate-pulse"
                      : "bg-zinc-200"
                  }`}>
                    {["in_progress", "completed"].includes(quotation.status) && (
                      <CheckCircle2 size={12} />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${
                    ["in_progress", "completed"].includes(quotation.status)
                      ? "text-emerald-700"
                      : quotation.status === "client_accepted"
                      ? "text-blue-600"
                      : "text-zinc-400"
                  }`}>In Progress</p>
                </div>

                {/* 5. Completed */}
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                    quotation.status === "completed"
                      ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                      : "bg-zinc-200"
                  }`}>
                    {quotation.status === "completed" && (
                      <CheckCircle2 size={12} />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${
                    quotation.status === "completed"
                      ? "text-emerald-700"
                      : "text-zinc-400"
                  }`}>Completed</p>
                </div>

                {/* Terminal Rejection or Cancellation */}
                {["client_rejected", "vendor_rejected", "cancelled"].includes(quotation.status) && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-rose-500 ring-4 ring-rose-50 flex items-center justify-center text-white">
                      <XCircle size={12} />
                    </div>
                    <p className="text-sm font-semibold text-rose-600">
                      {quotation.status === "client_rejected"
                        ? "Client Rejected"
                        : quotation.status === "vendor_rejected"
                        ? "Vendor Declined"
                        : "Cancelled"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chat thread & Inputs */}
          <div className="lg:col-span-2 flex flex-col h-[750px] rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
              <div className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-white text-emerald-600 border-b-2 border-emerald-600">
                <MessageSquare size={18} /> Chat with Client
              </div>
            </div>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-50/50 to-white">
              <div className="max-w-4xl mx-auto w-full space-y-5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-20">
                    <MessageSquare size={32} className="mb-3 text-zinc-300 animate-bounce" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Submit your first offer to begin negotiation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isVendor = msg.sender_role === "vendor";
                    const offerVal = parseFloat(msg.offer_price || "0");

                    return (
                      <div key={msg.id} className={`flex ${isVendor ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] w-full ${isVendor ? "ml-8" : "mr-8"}`}>
                          {/* Name + Timestamp */}
                          <div className={`flex items-center gap-2 mb-1.5 ${isVendor ? "justify-end" : "justify-start"}`}>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${isVendor ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                              {isVendor ? "You" : "Client"}
                            </div>
                            <span className="text-[10px] text-zinc-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>

                          {/* Message Content Bubble */}
                          <div className={`rounded-2xl border overflow-hidden ${isVendor
                            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500 text-white shadow-sm"
                            : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
                            }`}>
                            <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b ${isVendor ? "border-emerald-500/30 text-emerald-100 bg-emerald-700/50" : "border-zinc-100 text-zinc-500 bg-zinc-50"}`}>
                              {msg.action === "request" && "📋 Service Booking Request"}
                              {msg.action === "offer" && "💰 Offer Sent"}
                              {msg.action === "counter" && (isVendor ? "↩️ Your Counter" : "↩️ Client Counter")}
                              {msg.action === "accept" && "✅ Accepted"}
                              {msg.action === "reject" && "❌ Rejected"}
                            </div>

                            <div className="p-4 space-y-3">
                              {msg.offer_price != null && (
                                <div className={`rounded-xl p-3 ${isVendor ? "bg-emerald-700/40" : "bg-zinc-50 border border-zinc-100"}`}>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold">Offered Price</span>
                                    <span className="text-sm font-extrabold">{formatINR(msg.offer_price)}</span>
                                  </div>
                                </div>
                              )}
                              {msg.note && <p className="text-xs leading-relaxed whitespace-pre-line">{msg.note}</p>}
                              {msg.reason && (
                                <p className={`text-xs italic mt-1.5 p-2 rounded ${isVendor ? "bg-emerald-700/50" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                  Reason: {msg.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Area */}
            <div className="bg-white border-t border-zinc-200 p-6">
              {isTerminal ? (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-zinc-600">
                  <CheckCircle2 className="text-zinc-400 shrink-0" />
                  <p className="text-sm font-medium">This negotiation is closed. Terms have been agreed upon or rejected.</p>
                </div>
              ) : isWaitingForClient ? (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <Clock className="text-amber-500 animate-pulse shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Waiting for client to review and respond to your offer...</p>
                    <p className="text-xs text-amber-600 mt-0.5">The client will accept, counter, or reject your offer.</p>
                  </div>
                </div>
              ) : (quotation.status === "client_accepted" || quotation.status === "accepted" || quotation.status === "confirmed" || quotation.status === "in_progress") ? (
                /* When Status is Accepted / Confirmed / In Progress: Verify Customer Completion OTP */
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="font-heading text-sm font-bold">Verify Customer OTP & Complete Job</h3>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Ask the customer for their 6-digit Completion PIN once the service/delivery is completed on site.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!noteInput.trim()) return;
                      try {
                        setSubmittingAction(true);
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
                        const res = await fetch(`${apiUrl}/api/service-hub/tickets/${id}/complete-otp`, {
                          method: "POST",
                          credentials: "include",
                          headers: {
                            "Content-Type": "application/json",
                            "x-request-from": "vendor",
                          },
                          body: JSON.stringify({ otp: noteInput.trim() }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.message || "Failed to verify OTP.");
                        toast.success("Job marked as completed successfully!");
                        fetchDetails();
                      } catch (err: any) {
                        toast.error(err.message || "Invalid OTP code.");
                      } finally {
                        setSubmittingAction(false);
                      }
                    }}
                    className="space-y-3 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                        6-Digit Customer Completion OTP *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Enter 6-digit PIN from customer"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        className="w-full rounded-xl border border-emerald-300 bg-white py-2.5 px-4 font-mono text-center text-lg tracking-widest text-zinc-900 focus:border-emerald-600 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAction || !noteInput.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      {submittingAction ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      Verify OTP & Complete Service Order
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* If client countered, show action tabs */}
                  {quotation.status === "client_countered" && (
                    <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setVendorActionTab("accept"); setReasonInput(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "accept" ? "bg-white shadow text-emerald-700" : "text-zinc-600 hover:text-zinc-700"}`}
                      >
                        <CheckCircle2 size={14} /> Accept Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVendorActionTab("counter"); setReasonInput(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "counter" ? "bg-white shadow text-blue-700" : "text-zinc-600 hover:text-zinc-700"}`}
                      >
                        <Send size={14} /> Make Counter Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVendorActionTab("reject"); setReasonInput("Cannot fulfill terms"); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "reject" ? "bg-white shadow text-rose-700" : "text-zinc-600 hover:text-zinc-700"}`}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Accept Offer Pathway */}
                  {quotation.status === "client_countered" && vendorActionTab === "accept" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-800 flex items-start gap-2.5">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">You are accepting the client's counter offer</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            This will accept the client's bid of <strong className="text-emerald-800">{formatINR(quotation.current_offer_price)}</strong> and close the negotiation.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Acceptance Note (optional)</label>
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="e.g. We are pleased to accept your counter offer terms..."
                          className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>

                      <button
                        onClick={() => void submitResponse("accept")}
                        disabled={submittingAction}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {submittingAction ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        Accept and Create Order
                      </button>
                    </div>
                  )}

                  {/* Reject Pathway */}
                  {((quotation.status === "client_countered" && vendorActionTab === "reject") || (quotation.status !== "client_countered" && reasonInput)) && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-rose-800 flex items-start gap-2.5">
                        <XCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Reject this quotation request</p>
                          <p className="text-xs text-rose-600 mt-0.5">
                            Rejection is permanent and will close this quotation request.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider ml-1 mb-1 block">Reason for Rejection *</label>
                        <input
                          type="text"
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          placeholder="Why are you rejecting this request? (Required)"
                          className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 placeholder-rose-300 focus:border-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Rejection Note (optional)</label>
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Additional details about rejection..."
                          className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>

                      <div className="flex gap-3">
                        {quotation.status === "client_countered" && (
                          <button
                            type="button"
                            onClick={() => { setVendorActionTab("counter"); setReasonInput(""); }}
                            className="px-5 py-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-200"
                          >
                            Back
                          </button>
                        )}
                        {quotation.status !== "client_countered" && (
                          <button
                            type="button"
                            onClick={() => setReasonInput("")}
                            className="px-5 py-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-200"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => void submitResponse("reject")}
                          disabled={submittingAction || !reasonInput.trim()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
                        >
                          {submittingAction ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Counter Offer/First Offer Pathway */}
                  {(isFirstOffer || (quotation.status === "client_countered" && vendorActionTab === "counter" && !reasonInput)) && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Live Calculation Preview */}
                      {priceInput && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                          <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <IndianRupee size={12} /> Live Service Proposal Preview
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-white rounded-lg border border-blue-100 p-2">
                              <p className="text-zinc-400">Subtotal</p>
                              <p className="font-bold text-zinc-900">{formatINR(computedSubtotal)}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-blue-100 p-2">
                              <p className="text-zinc-400">GST (18%)</p>
                              <p className="font-bold text-zinc-900">{formatINR(computedGST)}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-blue-100 p-2">
                              <p className="text-zinc-400">Total Price</p>
                              <p className="font-bold text-emerald-700">{formatINR(computedTotal)}</p>
                            </div>
                            {tokenPercentageInput && (
                              <div className="bg-white rounded-lg border border-orange-100 p-2">
                                <p className="text-zinc-400">Token Advance ({tokenPercentageInput}%)</p>
                                <p className="font-bold text-orange-700">{formatINR(computedTokenAmount)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Offer Form Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Your Price (₹) *</label>
                          <input
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Total price"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block flex items-center gap-1">
                            <Truck size={12} /> Execution Timeline (Days) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={deliveryDaysInput}
                            onChange={(e) => setDeliveryDaysInput(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Timeline in days"
                          />
                        </div>
                      </div>

                      {/* Token Money */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block flex items-center gap-1">
                            <Percent size={12} /> Token Money % *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={tokenPercentageInput}
                            onChange={(e) => setTokenPercentageInput(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Token Money %"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Message / Note (optional)</label>
                          <input
                            type="text"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Note to client (optional)"
                          />
                        </div>
                      </div>

                      {/* Reason input for counter offer (mandatory!) */}
                      {!isFirstOffer && (
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Reason for Counter Offer *</label>
                          <input
                            type="text"
                            value={reasonInput}
                            onChange={(e) => setReasonInput(e.target.value)}
                            placeholder="Why are you countering? (Required)"
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                        </div>
                      )}

                      <div className="flex gap-3 pt-2 border-t border-zinc-100">
                        {isFirstOffer && (
                          <button
                            type="button"
                            onClick={() => setReasonInput("Cannot fulfill terms")}
                            className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-auto"
                          >
                            Reject Request
                          </button>
                        )}
                        <button
                          onClick={() => void submitResponse(isFirstOffer ? "offer" : "counter")}
                          disabled={submittingAction || !priceInput || !deliveryDaysInput || !tokenPercentageInput || (!isFirstOffer && !reasonInput.trim())}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {submittingAction ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                          {isFirstOffer ? "Send First Proposal" : "Send Counter Proposal"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
