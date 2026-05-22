"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, CheckCircle2, XCircle, FileText, ArrowLeft, Package, User, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { vendorNegotiationApi, VendorQuotationDetail } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

function getStatusInfo(status: string) {
  switch (status) {
    case "pending_vendor":
    case "client_countered":
      return { label: "Action Needed", bg: "bg-rose-100", text: "text-rose-800" };
    case "vendor_offered":
    case "vendor_countered":
      return { label: "Waiting on Client", bg: "bg-amber-100", text: "text-amber-800" };
    case "client_accepted":
      return { label: "Accepted - Awaiting Admin", bg: "bg-indigo-100", text: "text-indigo-800" };
    case "admin_confirmation_pending":
      return { label: "Admin Reviewing", bg: "bg-orange-100", text: "text-orange-800" };
    case "admin_confirmed":
      return { label: "Fully Confirmed", bg: "bg-emerald-100", text: "text-emerald-800" };
    case "client_rejected":
    case "vendor_rejected":
    case "admin_confirmation_rejected":
      return { label: "Rejected / Closed", bg: "bg-zinc-100", text: "text-zinc-800" };
    default:
      return { label: status.replace(/_/g, " "), bg: "bg-zinc-100", text: "text-zinc-800" };
  }
}

export default function VendorQuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<VendorQuotationDetail | null>(null);
  
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isClosed = useMemo(
    () => Boolean(quotation && ["client_accepted", "client_rejected", "vendor_rejected", "cancelled", "expired", "admin_confirmation_pending", "admin_confirmed", "admin_confirmation_rejected"].includes(quotation.quotation.status)),
    [quotation]
  );
  
  const canVendorRespond = useMemo(
    () => Boolean(quotation && quotation.quotation.current_offer_by !== "vendor" && !isClosed),
    [quotation, isClosed]
  );

  const loadQuotation = async () => {
    try {
      const response = await vendorNegotiationApi.getQuotation(quotationId);
      setQuotation(response.data || null);
      setOfferPrice(response.data?.quotation?.current_offer_price != null ? String(response.data.quotation.current_offer_price) : "");
      setOfferQuantity(response.data?.quotation?.current_offer_quantity != null ? String(response.data.quotation.current_offer_quantity) : "");
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [quotation?.messages]);

  const submitResponse = async (action: "offer" | "counter" | "reject") => {
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
        if (action === "counter") {
          payload.reason = reason.trim();
        }
      }
      if (action === "reject") {
        if (!reason.trim()) throw new Error("Reason required for rejection");
        payload.reason = reason.trim();
        payload.note = note.trim();
      }

      await vendorNegotiationApi.respondToQuotation(quotationId, payload as any);
      toast.success("Response submitted successfully");
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
        <p className="mt-2 text-zinc-500">The quotation you're looking for doesn't exist.</p>
        <Link href="/quotations" className="mt-6 text-blue-600 hover:underline">Return to requests</Link>
      </div>
    );
  }

  const { quotation: info, messages } = quotation;
  const statusInfo = getStatusInfo(info.status);
  
  // Filter out admin confirmation messages from vendor chat view to keep it client-vendor focused
  const displayMessages = messages.filter(m => m.sender_role !== "admin" && m.action !== "admin_confirmed" && m.action !== "admin_rejected");

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/quotations" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
            <ArrowLeft size={16} /> Back to requests
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{info.product_name}</h1>
              <p className="text-sm text-zinc-500 mt-1">Client requested <span className="font-semibold text-zinc-800">{info.requested_quantity} units</span></p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold border ${statusInfo.bg} ${statusInfo.text} border-current/20`}>
              {statusInfo.label}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Quotation Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm">Requested</span>
                  <span className="font-semibold text-zinc-900">{info.requested_quantity} units</span>
                </div>
                {info.current_offer_price && (
                  <div className="flex justify-between pb-4 border-b border-zinc-100">
                    <span className="text-blue-600 text-sm font-medium">Your Latest Offer</span>
                    <span className="font-bold text-blue-700">₹{info.current_offer_price} × {info.current_offer_quantity}</span>
                  </div>
                )}
                {info.accepted_price && (
                  <div className="flex justify-between pb-4 border-b border-zinc-100">
                    <span className="text-emerald-600 text-sm font-medium">Agreed Price</span>
                    <span className="font-bold text-emerald-700">₹{info.accepted_price} × {info.accepted_quantity}</span>
                  </div>
                )}
                
                <div className="pt-2">
                  <p className="text-xs text-zinc-400">Created: {new Date(info.created_at).toLocaleString()}</p>
                  <p className="text-xs text-zinc-400 mt-1">Last Update: {new Date((info as any).updated_at || info.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Negotiation Timeline / Steps */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
                  <p className={`text-sm font-semibold ${info.status.includes("accepted") || (info as any).admin_confirmation_status ? "text-zinc-900" : "text-zinc-400"}`}>Client Accepted Terms</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ${(info as any).admin_confirmation_status === "confirmed" ? "bg-emerald-500 ring-4 ring-emerald-50" : (info as any).admin_confirmation_status === "rejected" ? "bg-rose-500 ring-4 ring-rose-50" : "bg-zinc-200"}`} />
                  <p className={`text-sm font-semibold ${(info as any).admin_confirmation_status === "confirmed" ? "text-emerald-600" : (info as any).admin_confirmation_status === "rejected" ? "text-rose-600" : "text-zinc-400"}`}>Admin Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Chat and Actions */}
          <div className="lg:col-span-2 flex flex-col h-[800px] rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            
            {/* Header */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/80">
              <div className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-white text-blue-600 border-b-2 border-blue-600">
                <User size={18} /> Chat with Client
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30">
              {displayMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <p>No messages yet in this channel.</p>
                </div>
              ) : (
                displayMessages.map((msg) => {
                  const isVendor = msg.sender_role === "vendor";
                  
                  return (
                    <div key={msg.id} className={`flex ${isVendor ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[80%] gap-3 ${isVendor ? "flex-row-reverse" : "flex-row"}`}>
                        
                        {/* Avatar */}
                        <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm
                          ${isVendor ? "bg-blue-600" : "bg-zinc-500"}
                        `}>
                          {isVendor ? "V" : "C"}
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl p-4 shadow-sm ${
                          isVendor 
                            ? "bg-blue-600 text-white rounded-tr-sm" 
                            : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm"
                        }`}>
                          
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className={`text-xs font-bold ${isVendor ? "text-blue-100" : "text-zinc-500"}`}>
                              {isVendor ? "You" : "Client"}
                            </span>
                            <span className={`text-[10px] ${isVendor ? "text-blue-200" : "text-zinc-400"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Content */}
                          <div className={`text-sm ${isVendor ? "text-blue-50" : "text-zinc-600"} space-y-2`}>
                            {msg.action && msg.action !== "note" && msg.action !== "request" && (
                              <div className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider ${
                                isVendor ? "bg-blue-700/50" : "bg-zinc-100 text-zinc-600"
                              }`}>
                                {msg.action.replace(/_/g, " ")}
                              </div>
                            )}

                            {msg.offer_price && msg.offer_quantity && (
                              <div className={`mt-2 rounded-lg p-3 ${isVendor ? "bg-blue-700/50" : "bg-zinc-50 border border-zinc-100"}`}>
                                <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Offer Details</p>
                                <p className="text-lg font-bold">₹{msg.offer_price} × {msg.offer_quantity}</p>
                              </div>
                            )}

                            {msg.reason && (
                              <div>
                                <p className="text-xs uppercase opacity-80 font-semibold mt-2">Reason</p>
                                <p className="mt-0.5">{msg.reason}</p>
                              </div>
                            )}

                            {msg.note && (
                              <div className="whitespace-pre-wrap">{msg.note}</div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Action Area */}
            <div className="bg-white border-t border-zinc-200 p-6">
              
              {isClosed ? (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-zinc-600">
                  <CheckCircle2 className="text-zinc-400" />
                  <p className="text-sm font-medium">This negotiation is closed. Terms have been agreed upon or rejected.</p>
                </div>
              ) : !canVendorRespond ? (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <Clock className="text-amber-500 animate-pulse" />
                  <p className="text-sm font-medium">Waiting for client to review and respond to your offer...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Your Price (₹)</label>
                      <input
                        type="number"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Price per unit"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Quantity</label>
                      <input
                        type="number"
                        value={offerQuantity}
                        onChange={(e) => setOfferQuantity(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder="Units"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">Message / Note</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a message to the client..."
                      className="w-full min-h-[80px] resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  
                  {reason && (
                    <div>
                      <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider ml-1 mb-1 block">Rejection Reason</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Required if rejecting"
                        className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800 placeholder-rose-300 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => setReason(reason ? "" : "Cannot fulfill request")}
                      className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-auto"
                    >
                      {reason ? "Cancel Rejection" : "Reject Request"}
                    </button>
                    
                    {reason ? (
                      <button
                        onClick={() => void submitResponse("reject")}
                        disabled={submitting || !reason.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
                      >
                        <XCircle size={18} /> Confirm Rejection
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => void submitResponse("offer")}
                          disabled={submitting || !offerPrice || !offerQuantity}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-2 text-sm font-bold text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-50 transition-colors"
                        >
                          <Send size={18} /> {info.status === "pending_vendor" ? "Send First Offer" : "Send Counter Offer"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
