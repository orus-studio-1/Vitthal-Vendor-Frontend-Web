"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, XCircle } from "lucide-react";
import { vendorNegotiationApi, VendorQuotationDetail } from "@/lib/api";
import { toast } from "sonner";

export default function VendorQuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<VendorQuotationDetail | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isClosed = useMemo(
    () => Boolean(quotation && ["client_accepted", "client_rejected", "vendor_rejected", "cancelled", "expired"].includes(quotation.quotation.status)),
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

  const submitResponse = async (action: "offer" | "counter" | "reject") => {
    if (!canVendorRespond) {
      toast.error("Wait for the client to respond before sending another offer.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "offer" || action === "counter") {
        payload.offerPrice = Number(offerPrice);
        payload.offerQuantity = Number(offerQuantity);
        payload.note = note.trim();
        if (action === "counter") {
          payload.reason = reason.trim();
        }
      }
      if (action === "reject") {
        payload.reason = reason.trim();
        payload.note = note.trim();
      }

      await vendorNegotiationApi.respondToQuotation(quotationId, payload as any);
      toast.success("Response submitted");
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quotation) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">Quotation not found.</div>;
  }

  const { quotation: info, messages } = quotation;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{info.product_name}</h1>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize">{info.status.replace(/_/g, " ")}</span>
          <span>Requested: {info.requested_quantity}</span>
          {info.current_offer_price ? <span>Latest offer: ₹{info.current_offer_price} × {info.current_offer_quantity}</span> : null}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h2>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex">
              <div className="mr-3 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{msg.sender_role === "vendor" ? "V" : "B"}</div>
              </div>
              <div className="flex-1">
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-gray-500">{msg.sender_role === "vendor" ? "Vendor" : "Buyer"}</p>
                    <p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                  <div className="mt-2">
                    {msg.offer_price && msg.offer_quantity ? <p className="font-semibold text-gray-800">Offer: ₹{msg.offer_price} × {msg.offer_quantity}</p> : null}
                    {msg.action ? <p className="mt-1 text-sm text-gray-700">Action: {msg.action}</p> : null}
                    {msg.reason ? <p className="mt-1 text-gray-700">Reason: {msg.reason}</p> : null}
                    {msg.note ? <p className="mt-1 text-gray-700">Note: {msg.note}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Respond to buyer</h2>
        <p className="mb-4 text-sm text-gray-500">This is a turn-based quotation thread. Once you send an offer, you must wait for the buyer to counter before sending again.</p>

        {isClosed ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">This quotation is closed. No further response is allowed.</div>
        ) : !canVendorRespond ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">You already sent the latest offer. Wait for the buyer to respond before editing again.</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Offer price (₹)</label>
                <input type="number" min="0" value={offerPrice} onChange={(event) => setOfferPrice(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Offer quantity</label>
                <input type="number" min="1" value={offerQuantity} onChange={(event) => setOfferQuantity(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Reason</label>
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="w-full min-h-20 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Note</label>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="w-full min-h-20 rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => void submitResponse("offer")} disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                <Send className="h-4 w-4" />
                Send offer
              </button>
              <button onClick={() => void submitResponse("counter")} disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                <Send className="h-4 w-4" />
                Counter offer
              </button>
              <button onClick={() => void submitResponse("reject")} disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
