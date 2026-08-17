"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, Send, CheckCircle2, XCircle, FileText, ArrowLeft,
  Package, User, ShieldCheck, Clock, Truck, IndianRupee,
  Receipt, Calendar, Percent, ExternalLink, AlertTriangle, Info
} from "lucide-react";
import Link from "next/link";
import { vendorNegotiationApi, VendorQuotationDetail } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

// ─── Helpers ─────────────────────────────────────────────────────────
function formatINR(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function getStatusInfo(status: string) {
  switch (status) {
    case "pending_vendor":
    case "client_countered":
      return { label: "Action Needed", bg: "bg-rose-100", text: "text-rose-800", icon: AlertTriangle };
    case "vendor_offered":
    case "vendor_countered":
      return { label: "Waiting on Client", bg: "bg-amber-100", text: "text-amber-800", icon: Clock };
    case "client_accepted":
      return { label: "Accepted — Awaiting Admin", bg: "bg-indigo-100", text: "text-indigo-800", icon: ShieldCheck };
    case "admin_confirmation_pending":
      return { label: "Admin Reviewing", bg: "bg-orange-100", text: "text-orange-800", icon: ShieldCheck };
    case "admin_confirmed":
      return { label: "Fully Confirmed ✓", bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle2 };
    case "client_rejected":
    case "vendor_rejected":
    case "admin_confirmation_rejected":
      return { label: "Rejected / Closed", bg: "bg-zinc-100", text: "text-zinc-800", icon: XCircle };
    default:
      return { label: status.replace(/_/g, " "), bg: "bg-zinc-100", text: "text-zinc-800", icon: Info };
  }
}

export default function VendorQuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.vendorType === "service") {
      router.replace(`/service-quotations/${quotationId}`);
    }
  }, [user, quotationId, router]);

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<VendorQuotationDetail | null>(null);
  const [document, setDocument] = useState<{ quotation_number: string; document_url: string; valid_until: string; created_at: string } | null>(null);

  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [tokenPercentage, setTokenPercentage] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vendorActionTab, setVendorActionTab] = useState<"accept" | "counter" | "reject">("counter");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isClosed = useMemo(
    () => Boolean(quotation && ["client_accepted", "client_rejected", "vendor_rejected", "cancelled", "expired", "admin_confirmation_pending", "admin_confirmed", "admin_confirmation_rejected"].includes(quotation.quotation.status)),
    [quotation]
  );

  const canVendorRespond = useMemo(
    () => Boolean(quotation && quotation.quotation.current_offer_by !== "vendor" && !isClosed),
    [quotation, isClosed]
  );

  const isFirstOffer = useMemo(
    () => Boolean(quotation && quotation.quotation.status === "pending_vendor"),
    [quotation]
  );

  const loadQuotation = async () => {
    try {
      const response = await vendorNegotiationApi.getQuotation(quotationId);
      const data = response.data as any;
      setQuotation({ quotation: data.quotation, messages: data.messages });
      setDocument(data.document || null);
      if (data.quotation?.current_offer_price != null) {
        setOfferPrice(String(data.quotation.current_offer_price));
      }

      if (data.quotation?.current_offer_quantity != null) {
        setOfferQuantity(String(data.quotation.current_offer_quantity));
      } else if (data.quotation?.requested_quantity != null) {
        setOfferQuantity(String(data.quotation.requested_quantity));
      }

      if (data.quotation?.delivery_days != null) setDeliveryDays(String(data.quotation.delivery_days));
      if (data.quotation?.token_percentage != null) setTokenPercentage(String(data.quotation.token_percentage));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load quotation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId) void loadQuotation();
  }, [quotationId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [quotation?.messages]);
  const submitResponse = async (action: "offer" | "counter" | "reject" | "accept") => {
    if (!canVendorRespond) {
      toast.error("Wait for the client to respond before sending another offer.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "offer" || action === "counter") {
        if (!offerPrice || !offerQuantity) throw new Error("Price and quantity required");
        payload.offerPrice = Number(offerPrice);
        payload.offerQuantity = Number(offerQuantity);
        payload.note = note.trim();
        if (action === "offer") {
          if (!deliveryDays || !tokenPercentage) throw new Error("Delivery days and token money percentage are required for the first offer");
          payload.deliveryDays = Number(deliveryDays);
          payload.tokenPercentage = Number(tokenPercentage);
        }
        if (action === "counter") {
          if (!reason.trim()) throw new Error("Reason required for counter offer");
          payload.reason = reason.trim();
          if (deliveryDays) payload.deliveryDays = Number(deliveryDays);
          if (tokenPercentage) payload.tokenPercentage = Number(tokenPercentage);
        }
      }
      if (action === "reject") {
        if (!reason.trim()) throw new Error("Reason required for rejection");
        payload.reason = reason.trim();
        payload.note = note.trim();
      }
      if (action === "accept") {
        payload.note = note.trim();
      }

      await vendorNegotiationApi.respondToQuotation(quotationId, payload as any);
      toast.success(action === "accept" ? "Offer accepted successfully!" : "Response submitted successfully");
      setNote("");
      setReason("");
      await loadQuotation();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit response";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };
  // ─── Computed Values ───────────────────────────────────────────────
  const computedSubtotal = offerPrice && offerQuantity ? Number(offerPrice) * Number(offerQuantity) : 0;
  const computedGST = computedSubtotal * 0.18;
  const computedTotal = computedSubtotal + computedGST;
  const computedTokenAmount = tokenPercentage ? (Number(tokenPercentage) / 100) * computedTotal : 0;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-zinc-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center text-center px-4">
        <FileText className="h-16 w-16 text-zinc-300 mb-4" />
        <h2 className="text-2xl font-semibold text-zinc-900">Quotation Not Found</h2>
        <p className="mt-2 text-zinc-500">The quotation you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/quotations" className="mt-6 text-blue-600 hover:underline">Return to requests</Link>
      </div>
    );
  }

  const { quotation: info, messages } = quotation;
  const statusInfo = getStatusInfo(info.status);
  const displayMessages = messages.filter(m => m.sender_role !== "admin" && m.action !== "admin_confirmed" && m.action !== "admin_rejected");

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* ─── Header ─── */}
      <div className="bg-white border-b border-zinc-200 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/quotations" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
            <ArrowLeft size={16} /> Back to requests
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{info.product_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mt-1">
                <span>Client requested <strong className="text-zinc-800">{info.requested_quantity} {info.unit || "units"}</strong></span>
                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                  Competing quotation — multiple vendors bidding
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(info as any).vendor_document_url && (
                <a href={((info as any).vendor_document_url as string).includes('?') ? (info as any).vendor_document_url : `${(info as any).vendor_document_url}?t=${new Date((info as any).updated_at || info.created_at).getTime()}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors">
                  <FileText size={16} /> Your Latest Quotation <ExternalLink size={14} />
                </a>
              )}
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold border ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
              </div>
            </div>
          </div>

          {/* Document Info Banner */}
          {document && (
            <div className="mt-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs text-emerald-800">
              <Calendar size={14} />
              <span>Quotation <strong>{document.quotation_number}</strong> • Valid until <strong>{formatDate(document.valid_until)}</strong></span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* ─── Left Panel ─── */}
          <div className="flex flex-col gap-6 h-[800px] lg:h-[850px] shrink-0">

            {/* Premium S3 Documents Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm bg-gradient-to-br from-zinc-50 to-white shrink-0">
              <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2 mb-4">
                <FileText size={18} className="text-emerald-600" />
                Official Agreements
              </h2>
              <div className="space-y-3">
                {/* 1. Base Request Agreement */}
                {document ? (
                  <a
                    href={document.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors text-xs font-semibold text-emerald-800"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText size={16} className="text-emerald-600 shrink-0" />
                      View Base Agreement
                    </span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-400 text-center italic">
                    Base Agreement not generated
                  </div>
                )}

                {/* 2. Vendor Specific Filled Agreement */}
                {(info as any).vendor_document_url ? (
                  <a
                    href={(info as any).vendor_document_url.includes('?') ? (info as any).vendor_document_url : `${(info as any).vendor_document_url}?t=${new Date((info as any).updated_at || info.created_at).getTime()}`}
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex-1 overflow-y-auto">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-blue-600" /> Quotation Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm">Requested Qty</span>
                  <span className="font-semibold text-zinc-900">{info.requested_quantity} {info.unit || "units"}</span>
                </div>
                {info.current_offer_price && (
                  <div className="flex justify-between pb-3 border-b border-zinc-100">
                    <span className="text-blue-600 text-sm font-medium">Your Latest Offer</span>
                    <span className="font-bold text-blue-700">{formatINR(info.current_offer_price)} × {info.current_offer_quantity}</span>
                  </div>
                )}
                {info.accepted_price && (
                  <div className="flex justify-between pb-3 border-b border-zinc-100">
                    <span className="text-emerald-600 text-sm font-medium">Agreed Price</span>
                    <span className="font-bold text-emerald-700">{formatINR(info.accepted_price)} × {info.accepted_quantity}</span>
                  </div>
                )}
                {(info as any).delivery_days != null && (
                  <div className="flex justify-between pb-3 border-b border-zinc-100">
                    <span className="text-zinc-500 text-sm flex items-center gap-1"><Truck size={14} /> Delivery</span>
                    <span className="font-semibold text-zinc-900">{(info as any).delivery_days} Days</span>
                  </div>
                )}
                {(info as any).token_percentage != null && (
                  <div className="flex justify-between pb-3 border-b border-zinc-100">
                    <span className="text-zinc-500 text-sm flex items-center gap-1"><Percent size={14} /> Token Money</span>
                    <span className="font-semibold text-orange-700">{(info as any).token_percentage}% ({formatINR((info as any).token_amount)})</span>
                  </div>
                )}
                {(info as any).vendor_document_url && (
                  <a href={(info as any).vendor_document_url.includes('?') ? (info as any).vendor_document_url : `${(info as any).vendor_document_url}?t=${new Date((info as any).updated_at || info.created_at).getTime()}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors pt-2">
                    <FileText size={14} /> Your Filled Quotation Document <ExternalLink size={12} />
                  </a>
                )}
                <div className="pt-2">
                  <p className="text-xs text-zinc-400">Created: {new Date(info.created_at).toLocaleString()}</p>
                  <p className="text-xs text-zinc-400 mt-1">Last Update: {new Date((info as any).updated_at || info.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex-1 overflow-y-auto">
              <h2 className="text-lg font-bold text-zinc-900 mb-6">Progress</h2>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:-translate-x-1/2 before:bg-zinc-100">
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                  <p className="text-sm font-semibold text-zinc-900">Request Received</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${info.status !== "pending_vendor" ? "bg-blue-600 ring-4 ring-blue-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${info.status !== "pending_vendor" ? "text-zinc-900" : "text-zinc-400"}`}>Negotiation</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${info.status.includes("accepted") || (info as any).admin_confirmation_status ? "bg-blue-600 ring-4 ring-blue-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${info.status.includes("accepted") || (info as any).admin_confirmation_status ? "text-zinc-900" : "text-zinc-400"}`}>Client Accepted</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${(info as any).admin_confirmation_status === "confirmed" ? "bg-emerald-500 ring-4 ring-emerald-50" : (info as any).admin_confirmation_status === "rejected" ? "bg-rose-500 ring-4 ring-rose-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${(info as any).admin_confirmation_status === "confirmed" ? "text-emerald-600" : (info as any).admin_confirmation_status === "rejected" ? "text-rose-600" : "text-zinc-400"}`}>Admin Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Panel: Chat ─── */}
          <div className="flex flex-col h-[800px] lg:h-[850px] rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

            {/* Chat Header */}
            <div className="flex border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
              <div className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-white text-blue-600 border-b-2 border-blue-600">
                <User size={18} /> Chat with Client
              </div>
            </div>

            {/* ─── Messages Area ─── */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-zinc-50/50 to-white">
              <div className="max-w-4xl mx-auto w-full space-y-5">
                {displayMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                    <Clock size={32} className="mb-3 text-zinc-300" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Send your first offer with pricing, delivery timeline, and terms below.</p>
                  </div>
                ) : (
                  displayMessages.map((msg) => {
                    const isVendor = msg.sender_role === "vendor";
                    const subtotal = msg.offer_price && msg.offer_quantity ? msg.offer_price * msg.offer_quantity : null;
                    const gst = subtotal ? subtotal * 0.18 : null;
                    const total = subtotal && gst ? subtotal + gst : null;

                    return (
                      <div key={msg.id} className={`flex ${isVendor ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] w-full ${isVendor ? "ml-8" : "mr-8"}`}>
                          {/* Sender + Time */}
                          <div className={`flex items-center gap-2 mb-1.5 ${isVendor ? "justify-end" : "justify-start"}`}>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isVendor ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"}`}>
                              {isVendor ? "You" : "Client"}
                            </div>
                            <span className="text-[10px] text-zinc-400">{formatTime(msg.created_at)} • {formatDate(msg.created_at)}</span>
                          </div>

                          {/* Message Card */}
                          <div className={`rounded-2xl overflow-hidden border ${isVendor
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white"
                            : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
                            }`}>
                            {/* Action badge */}
                            <div className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b ${isVendor ? "border-blue-500/30 text-blue-100 bg-blue-700/50" : "border-zinc-100 text-zinc-500 bg-zinc-50"
                              }`}>
                              {msg.action === "request" && "📋 Quotation Request"}
                              {msg.action === "offer" && "💰 Offer Sent"}
                              {msg.action === "counter" && (isVendor ? "↩️ Your Counter" : "↩️ Client Counter")}
                              {msg.action === "accept" && "✅ Accepted"}
                              {msg.action === "reject" && "❌ Rejected"}
                              {msg.action === "note" && "📝 Note"}
                            </div>

                            <div className="p-4 space-y-3">
                              {/* Pricing breakdown */}
                              {msg.offer_price != null && msg.offer_quantity != null && msg.action !== "request" && (
                                <div className={`rounded-xl p-3 space-y-2 ${isVendor ? "bg-blue-700/40" : "bg-zinc-50 border border-zinc-100"}`}>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                      <p className={`text-[10px] uppercase tracking-wider ${isVendor ? "text-blue-200" : "text-zinc-400"}`}>Unit Price</p>
                                      <p className="text-sm font-bold">{formatINR(msg.offer_price)}</p>
                                    </div>
                                    <div>
                                      <p className={`text-[10px] uppercase tracking-wider ${isVendor ? "text-blue-200" : "text-zinc-400"}`}>Quantity</p>
                                      <p className="text-sm font-bold">{msg.offer_quantity?.toLocaleString("en-IN")} {info.unit || "units"}</p>
                                    </div>
                                    <div>
                                      <p className={`text-[10px] uppercase tracking-wider ${isVendor ? "text-blue-200" : "text-zinc-400"}`}>Subtotal</p>
                                      <p className="text-sm font-bold">{formatINR(subtotal)}</p>
                                    </div>
                                  </div>
                                  {total != null && (
                                    <div className={`flex items-center justify-between pt-2 mt-2 border-t ${isVendor ? "border-blue-500/30" : "border-zinc-200"}`}>
                                      <span className={`text-xs ${isVendor ? "text-blue-200" : "text-zinc-500"}`}>GST (18%): {formatINR(gst)}</span>
                                      <span className="text-sm font-extrabold">{formatINR(total)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {msg.action === "request" && msg.offer_quantity != null && (
                                <div className="rounded-xl p-3 bg-zinc-50 border border-zinc-100">
                                  <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">Requested Quantity</p>
                                    <p className="text-base font-bold text-zinc-950 mt-1">{msg.offer_quantity?.toLocaleString("en-IN")} {info.unit || "units"}</p>
                                  </div>
                                </div>
                              )}

                              {msg.reason && (
                                <div className={`flex items-start gap-2 text-sm ${isVendor ? "text-blue-100" : "text-zinc-600"}`}>
                                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                  <span><strong>Reason:</strong> {msg.reason}</span>
                                </div>
                              )}
                              {msg.note && (
                                <div className={`text-sm whitespace-pre-wrap ${isVendor ? "text-blue-100" : "text-zinc-600"}`}>{msg.note}</div>
                              )}
                              {msg.action === "accept" && (
                                <div className={`flex items-center gap-2 text-sm font-semibold ${isVendor ? "text-emerald-200" : "text-emerald-700"}`}>
                                  <CheckCircle2 size={16} /> Offer accepted!
                                </div>
                              )}
                              {msg.action === "reject" && (
                                <div className={`flex items-center gap-2 text-sm font-semibold ${isVendor ? "text-rose-200" : "text-rose-700"}`}>
                                  <XCircle size={16} /> Rejected
                                </div>
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

            {/* ─── Action Area ─── */}
            <div className="bg-white border-t border-zinc-200 p-6">
              {isClosed ? (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-zinc-600">
                  <CheckCircle2 className="text-zinc-400 shrink-0" />
                  <p className="text-sm font-medium">This negotiation is closed. Terms have been agreed upon or rejected.</p>
                </div>
              ) : !canVendorRespond ? (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <Clock className="text-amber-500 animate-pulse shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Waiting for client to review and respond to your offer...</p>
                    <p className="text-xs text-amber-600 mt-0.5">The client will accept, counter, or reject your offer.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* If client countered, show action tabs */}
                  {info.status === "client_countered" && (
                    <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setVendorActionTab("accept"); setReason(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "accept" ? "bg-white shadow text-emerald-700" : "text-zinc-600 hover:text-zinc-900"}`}
                      >
                        <CheckCircle2 size={14} /> Accept Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVendorActionTab("counter"); setReason(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "counter" ? "bg-white shadow text-blue-700" : "text-zinc-600 hover:text-zinc-900"}`}
                      >
                        <Send size={14} /> Make Counter Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVendorActionTab("reject"); setReason("Cannot fulfill terms"); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "reject" ? "bg-white shadow text-rose-700" : "text-zinc-600 hover:text-zinc-900"}`}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Accept Offer Pathway */}
                  {info.status === "client_countered" && vendorActionTab === "accept" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-800 flex items-start gap-2.5">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">You are accepting the client's counter offer</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            This will accept the client's bid of <strong className="text-emerald-800">{formatINR(info.current_offer_price)}</strong> for <strong className="text-emerald-800">{info.current_offer_quantity} {info.unit || "units"}</strong>, and close bidding with other vendors.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Acceptance Note (optional)</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="e.g. We are pleased to accept your counter offer terms..."
                          className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>

                      <button
                        onClick={() => void submitResponse("accept")}
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        Accept and Create Order
                      </button>
                    </div>
                  )}

                  {/* Reject Pathway */}
                  {((info.status === "client_countered" && vendorActionTab === "reject") || reason) && (
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
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Why are you rejecting this request? (Required)"
                          className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 placeholder-rose-300 focus:border-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Rejection Note (optional)</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Additional details about rejection..."
                          className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>

                      <div className="flex gap-3">
                        {info.status === "client_countered" && (
                          <button
                            type="button"
                            onClick={() => { setVendorActionTab("counter"); setReason(""); }}
                            className="px-5 py-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-200"
                          >
                            Back
                          </button>
                        )}
                        <button
                          onClick={() => void submitResponse("reject")}
                          disabled={submitting || !reason.trim()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Counter Offer/First Offer Pathway */}
                  {(isFirstOffer || (info.status === "client_countered" && vendorActionTab === "counter" && !reason)) && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Live Calculation Preview */}
                      {offerPrice && offerQuantity && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                          <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <IndianRupee size={12} /> Live Quote Preview
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
                              <p className="text-zinc-400">Grand Total</p>
                              <p className="font-bold text-emerald-700">{formatINR(computedTotal)}</p>
                            </div>
                            {tokenPercentage && (
                              <div className="bg-white rounded-lg border border-orange-100 p-2">
                                <p className="text-zinc-400">Token ({tokenPercentage}%)</p>
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
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Price per unit"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Quantity ({info.unit || "Units"}) *</label>
                          <input
                            type="number"
                            value={offerQuantity}
                            onChange={(e) => setOfferQuantity(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder={info.unit || "Units"}
                          />
                        </div>
                      </div>

                      {/* Delivery & Token */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block flex items-center gap-1">
                            <Truck size={12} /> Delivery Days {isFirstOffer && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={deliveryDays}
                            onChange={(e) => setDeliveryDays(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="e.g. 7"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block flex items-center gap-1">
                            <Percent size={12} /> Token Money % {isFirstOffer && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={tokenPercentage}
                            onChange={(e) => setTokenPercentage(e.target.value)}
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="e.g. 10"
                          />
                        </div>
                      </div>

                      {/* Reason input for counter offer (mandatory!) */}
                      {!isFirstOffer && (
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Reason for Counter Offer *</label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why are you countering the client's price/quantity? (Required)"
                            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Message / Note (optional)</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add a message to the client..."
                          className="w-full min-h-[70px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-zinc-100">
                        {isFirstOffer && (
                          <button
                            type="button"
                            onClick={() => setReason("Cannot fulfill terms")}
                            className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-auto"
                          >
                            Reject Request
                          </button>
                        )}
                        <button
                          onClick={() => void submitResponse(isFirstOffer ? "offer" : "counter")}
                          disabled={submitting || !offerPrice || !offerQuantity || (!isFirstOffer && !reason.trim())}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                          {isFirstOffer ? "Send First Offer" : "Send Counter Offer"}
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
