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
  Paperclip,
  IndianRupee,
  Loader2,
  AlertTriangle,
  Info,
  X,
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
  ticket_number?: string;
  subcategory_name?: string | null;
  sub_subcategory_name?: string | null;
  ticket_payload?: Record<string, unknown>;
  documents?: Array<{
    id: string;
    doc_name?: string | null;
    doc_type: string;
    doc_url: string;
  }>;
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

type QuoteLineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  source: "catalog" | "manual";
  productId?: string;
  productVariantId?: string;
  vendorProductId?: string;
  requestItemId?: string;
  unit?: string;
  confirmedDeliveryDate?: string;
  supplierAcceptedDate?: string;
  remark?: string;
};
type CatalogChoice = {
  id: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
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
  const [vendorActionTab, setVendorActionTab] = useState<
    "accept" | "counter" | "reject"
  >("counter");
  const [priceInput, setPriceInput] = useState("");
  const [deliveryDaysInput, setDeliveryDaysInput] = useState("");
  const [tokenPercentageInput, setTokenPercentageInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [catalogChoices, setCatalogChoices] = useState<CatalogChoice[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [manualItemName, setManualItemName] = useState("");
  const [manualItemPrice, setManualItemPrice] = useState("");
  const [manualItemQuantity, setManualItemQuantity] = useState("1");
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
  const [serviceCharge, setServiceCharge] = useState("");
  const [travelCharge, setTravelCharge] = useState("");
  const [otherCharge, setOtherCharge] = useState("");

  const isFirstOffer = React.useMemo(
    () =>
      Boolean(
        quotation &&
        (quotation.status === "pending_vendor" ||
          quotation.status === "broadcasted"),
      ),
    [quotation],
  );

  const formatINR = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === "") return "₹0.00";
    const num = Number(val);
    if (isNaN(num)) return "₹0.00";
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isJobInquiry = Boolean(
    quotation &&
    /job\s*inquiry|job\s*work/i.test(
      `${quotation.service_name} ${String(quotation.ticket_payload?.service_name || "")} ${String(quotation.ticket_payload?.service_code || "")}`,
    ),
  );

  const computedSubtotal = React.useMemo(() => {
    if (
      quotation &&
      (/machine\s*maintenance/i.test(
        `${quotation.service_name} ${String(quotation.ticket_payload?.service_name || "")}`,
      ) ||
        isJobInquiry)
    ) {
      return (
        quoteItems.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ) +
        (Number(serviceCharge) || 0) +
        (Number(travelCharge) || 0) +
        (Number(otherCharge) || 0)
      );
    }
    const p = parseFloat(priceInput);
    return isNaN(p) ? 0 : p;
  }, [
    priceInput,
    quotation,
    quoteItems,
    serviceCharge,
    travelCharge,
    otherCharge,
    isJobInquiry,
  ]);

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

  const isMachineMaintenance = Boolean(
    quotation &&
    /machine\s*maintenance/i.test(
      `${quotation.service_name} ${String(quotation.ticket_payload?.service_name || "")}`,
    ),
  );

  useEffect(() => {
    if (!isJobInquiry || !quotation) return;
    const requestedItems = Array.isArray(
      quotation.ticket_payload?.job_work_items,
    )
      ? (quotation.ticket_payload.job_work_items as Array<
          Record<string, unknown>
        >)
      : [];
    setQuoteItems(
      requestedItems.map((item, index) => ({
        id: String(item.id || `requested-${index}`),
        requestItemId: String(item.id || `requested-${index}`),
        name: String(item.item_name || item.name || `Item ${index + 1}`),
        quantity: Number(item.quantity || 0),
        unitPrice: 0,
        unit: String(item.unit || "unit"),
        source: "manual" as const,
        confirmedDeliveryDate: "",
        supplierAcceptedDate: "",
        remark: "",
      })),
    );
  }, [isJobInquiry, quotation?.id]);

  useEffect(() => {
    if (!isMachineMaintenance) {
      setCatalogChoices([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(
      async () => {
        try {
          setCatalogLoading(true);
          setCatalogError("");
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
          const query = new URLSearchParams({
            offset: String(catalogPage),
            limit: "20",
          });
          if (catalogSearch.trim()) query.set("search", catalogSearch.trim());
          const res = await fetch(
            `${apiUrl}/api/products/getAllProducts?${query.toString()}`,
            {
              credentials: "include",
              headers: { "x-request-from": "vendor" },
            },
          );
          if (!res.ok)
            throw new Error("Could not load products from the web catalog.");
          const json = await res.json();
          const choices: CatalogChoice[] = (
            Array.isArray(json.data) ? json.data : []
          ).map((product: any) => ({
            id: String(product.product_id),
            productId: String(product.product_id),
            name: String(product.product_name || "Product"),
            price: Number(product.min_price || 0),
            unit: String(product.unit || "Unit"),
          }));
          if (cancelled) return;
          setCatalogChoices((previous) =>
            catalogPage === 0 ? choices : [...previous, ...choices],
          );
          setCatalogHasMore(
            (catalogPage + 1) * 20 < Number(json.totalCount || 0),
          );
        } catch (error) {
          console.error(
            "Could not load vendor product catalog for quote builder",
            error,
          );
          if (!cancelled)
            setCatalogError(
              error instanceof Error
                ? error.message
                : "Could not load products from the web catalog.",
            );
        } finally {
          if (!cancelled) setCatalogLoading(false);
        }
      },
      catalogPage === 0 ? 250 : 0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isMachineMaintenance, catalogPage, catalogSearch]);

  const addCatalogItem = (choice: CatalogChoice) => {
    setQuoteItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        name: choice.name,
        quantity: 1,
        unitPrice: choice.price,
        source: "catalog",
        productId: choice.productId,
      },
    ]);
  };

  const addManualItem = () => {
    const quantity = Number(manualItemQuantity);
    const unitPrice = Number(manualItemPrice);
    if (
      !manualItemName.trim() ||
      quantity <= 0 ||
      unitPrice < 0 ||
      !Number.isFinite(unitPrice)
    ) {
      toast.error("Enter an item name, a valid quantity, and a unit price.");
      return;
    }
    setQuoteItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        name: manualItemName.trim(),
        quantity,
        unitPrice,
        source: "manual",
      },
    ]);
    setManualItemName("");
    setManualItemPrice("");
    setManualItemQuantity("1");
  };

  const isTerminal = React.useMemo(() => {
    if (!quotation) return false;
    return [
      "client_rejected",
      "vendor_rejected",
      "cancelled",
      "closed_accepted_by_other",
    ].includes(quotation.status);
  }, [quotation]);

  const isWaitingForClient = React.useMemo(() => {
    if (!quotation) return false;
    return ["vendor_offered", "vendor_countered", "quoted"].includes(
      quotation.status,
    );
  }, [quotation]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("vendor_token")
          : null;
      const res = await fetch(`${apiUrl}/api/services/quotations/${id}`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
          ...(token &&
            token !== "null" &&
            token !== "undefined" && { Authorization: `Bearer ${token}` }),
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
    if (user && user.role !== "vendor") {
      router.replace("/login");
    } else if (user && user.vendorType === "product") {
      setError(
        "This request is a service quotation. Your vendor profile is currently set to Product Vendor.",
      );
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const submitResponse = async (
    action: "offer" | "counter" | "reject" | "accept",
  ) => {
    setSubmittingAction(true);

    try {
      const payload: Record<string, unknown> = { action };
      if (action === "offer" || action === "counter") {
        if (
          (isMachineMaintenance && quoteItems.length === 0) ||
          (isJobInquiry && quoteItems.length === 0)
        )
          throw new Error("Add or price at least one quotation item.");
        if (
          isMachineMaintenance &&
          quoteItems.some((item) => item.quantity <= 0 || item.unitPrice < 0)
        )
          throw new Error(
            "Quote quantities must be positive and item prices cannot be negative.",
          );
        if (
          isJobInquiry &&
          quoteItems.some(
            (item) =>
              item.quantity <= 0 ||
              item.unitPrice <= 0 ||
              !item.confirmedDeliveryDate ||
              !item.supplierAcceptedDate,
          )
        )
          throw new Error(
            "Enter a rate and both supplier accepted and confirmed delivery dates for every requested item.",
          );
        if (!isMachineMaintenance && !isJobInquiry && !priceInput)
          throw new Error("Price is required");
        if (!deliveryDaysInput && !isJobInquiry)
          throw new Error("Execution timeline is required");
        if (!isMachineMaintenance && !isJobInquiry && !tokenPercentageInput)
          throw new Error("Token money percentage is required");

        payload.offerPrice = computedTotal;
        payload.deliveryDays = deliveryDaysInput
          ? Number(deliveryDaysInput)
          : 7;
        if (!isMachineMaintenance && !isJobInquiry)
          payload.tokenPercentage = Number(tokenPercentageInput);
        payload.note = noteInput.trim();
        if (isMachineMaintenance || isJobInquiry) {
          payload.quoteBreakdown = {
            items: quoteItems.map(
              ({
                name,
                quantity,
                unitPrice,
                source,
                productId,
                productVariantId,
                vendorProductId,
                requestItemId,
                unit,
                confirmedDeliveryDate,
                supplierAcceptedDate,
                remark,
              }) => ({
                name,
                item_name: name,
                quantity,
                unit,
                unit_price: unitPrice,
                rate: unitPrice,
                amount: quantity * unitPrice,
                source,
                ...(productId
                  ? {
                      product_id: productId,
                      product_variant_id: productVariantId,
                      vendor_product_id: vendorProductId,
                    }
                  : {}),
                ...(isJobInquiry
                  ? {
                      request_item_id: requestItemId,
                      confirmed_delivery_date: confirmedDeliveryDate,
                      supplier_accepted_date: supplierAcceptedDate,
                      notes: remark,
                      remark,
                    }
                  : {}),
              }),
            ),
            service_charge: Number(serviceCharge) || 0,
            travel_charge: Number(travelCharge) || 0,
            other_charge: Number(otherCharge) || 0,
            subtotal: computedSubtotal,
            gst_rate: 18,
            gst_amount: computedGST,
            total: computedTotal,
          };
        }

        if (action === "counter") {
          if (!reasonInput.trim())
            throw new Error("Reason required for counter proposal");
          payload.reason = reasonInput.trim();
        }
      }
      if (action === "reject") {
        if (!reasonInput.trim())
          throw new Error("Reason required for rejection");
        payload.reason = reasonInput.trim();
        payload.note = noteInput.trim();
      }
      if (action === "accept") {
        payload.note = noteInput.trim();
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("vendor_token")
          : null;
      const res = await fetch(
        `${apiUrl}/api/services/quotations/${id}/respond`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
            ...(token &&
              token !== "null" &&
              token !== "undefined" && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        toast.success(
          action === "accept"
            ? "Proposal accepted successfully!"
            : "Response submitted successfully",
        );
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
      const message =
        error instanceof Error ? error.message : "Failed to submit response";
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
        <h1 className="text-2xl font-bold text-gray-900">
          Quotation Not Found
        </h1>
        <p className="text-gray-500 mt-2">
          {error || "Could not find details for this request."}
        </p>
        <Link
          href="/service-quotations"
          className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          <ArrowLeft size={16} /> Back to Service Quotations
        </Link>
      </div>
    );
  }

  const canRespond = !isTerminal && !isWaitingForClient;
  const requestPayload = quotation.ticket_payload || {};
  const requestedJobItems = Array.isArray(requestPayload.job_work_items)
    ? (requestPayload.job_work_items as Array<Record<string, unknown>>)
    : [];
  const requestDetailEntries = Object.entries(requestPayload).filter(
    ([key, value]) =>
      ![
        "service_subcategory_id",
        "service_sub_subcategory_id",
        "service_code",
        "service_name",
        "job_title",
        "job_work_items",
        "machine_photos",
        "machine_video",
        "declaration_accepted",
      ].includes(key) &&
      value !== null &&
      value !== undefined &&
      value !== "" &&
      typeof value !== "object",
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-screen-2xl space-y-6">
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
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                {quotation.service_name}
              </h1>
              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Service
              </span>
            </div>

            {(quotation.subcategory_name || quotation.sub_subcategory_name) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-700">
                {[quotation.subcategory_name, quotation.sub_subcategory_name]
                  .filter(Boolean)
                  .map((name, index) => (
                    <React.Fragment key={`${name}-${index}`}>
                      {index > 0 && <span className="text-zinc-300">/</span>}
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                        {name}
                      </span>
                    </React.Fragment>
                  ))}
              </div>
            )}
            <p className="text-sm text-zinc-500">
              Quotation{" "}
              <span className="font-mono text-zinc-700 font-bold">
                {quotation.id.slice(0, 8).toUpperCase()}
              </span>{" "}
              • Valid until 30 days from creation
            </p>
          </div>
          <span
            className={`self-start sm:self-center inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase border shadow-sm ${
              [
                "completed",
                "client_accepted",
                "accepted",
                "confirmed",
              ].includes(quotation.status)
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : quotation.status === "in_progress"
                  ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                  : isTerminal
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            }`}
          >
            {["completed", "client_accepted", "accepted", "confirmed"].includes(
              quotation.status,
            ) && (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            )}
            {quotation.status === "pending_vendor"
              ? "Action Needed"
              : quotation.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-12">
          {/* Left Columns - Info Cards */}
          <div className="order-2 space-y-6 lg:col-span-4 lg:col-start-9 lg:row-start-1">
            {/* Official Agreements Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Official Agreements
              </h3>
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
                    href={
                      quotation.vendor_document_url.includes("?")
                        ? quotation.vendor_document_url
                        : `${quotation.vendor_document_url}?t=${new Date(quotation.updated_at || quotation.created_at).getTime()}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors text-xs font-semibold text-blue-800 animate-pulse"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ShieldCheck
                        size={16}
                        className="text-blue-600 shrink-0"
                      />
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Quotation Details
              </h3>
              <div className="space-y-3.5 border-t border-zinc-100 pt-4">
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm font-medium">
                    Target Price
                  </span>
                  <span className="font-extrabold text-zinc-900">
                    {formatINR(quotation.requested_price)}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm font-medium">
                    Agreed Final Quote
                  </span>
                  <span className="font-extrabold text-emerald-600 font-mono text-base">
                    {formatINR(
                      quotation.agreed_price || quotation.current_offer_price,
                    )}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-zinc-100">
                  <span className="text-zinc-500 text-sm flex items-center gap-1">
                    <Truck size={14} /> Execution Timeline
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {quotation.delivery_days
                      ? `${quotation.delivery_days} Business Days`
                      : "Pending first offer"}
                  </span>
                </div>
                {!isMachineMaintenance && !isJobInquiry && (
                  <div className="flex justify-between pb-3 border-b border-zinc-100">
                    <span className="text-zinc-500 text-sm flex items-center gap-1">
                      <Percent size={14} /> Token Money
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {quotation.token_percentage != null
                        ? `${quotation.token_percentage}% (${formatINR(quotation.token_amount)})`
                        : "Pending first offer"}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-[10px] text-zinc-400">
                    Created: {new Date(quotation.created_at).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Last Update:{" "}
                    {new Date(
                      quotation.updated_at || quotation.created_at,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Scope of Work */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Scope of Work
              </h3>
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 text-xs text-zinc-600 italic leading-relaxed whitespace-pre-wrap">
                &quot;{quotation.scope_of_work}&quot;
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Progress
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:-translate-x-1/2 before:bg-zinc-100">
                {/* 1. Request Received */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Request Received
                  </p>
                </div>

                {/* 2. Negotiation */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                      quotation.status !== "pending_vendor" &&
                      quotation.status !== "broadcasted"
                        ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                        : "bg-blue-600 ring-4 ring-blue-50 text-white"
                    }`}
                  >
                    {quotation.status !== "pending_vendor" &&
                    quotation.status !== "broadcasted" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      quotation.status !== "pending_vendor" &&
                      quotation.status !== "broadcasted"
                        ? "text-zinc-900"
                        : "text-blue-600"
                    }`}
                  >
                    Negotiation
                  </p>
                </div>

                {/* 3. Client Accepted */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                      [
                        "client_accepted",
                        "accepted",
                        "confirmed",
                        "in_progress",
                        "completed",
                      ].includes(quotation.status)
                        ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                        : "bg-zinc-200"
                    }`}
                  >
                    {[
                      "client_accepted",
                      "accepted",
                      "confirmed",
                      "in_progress",
                      "completed",
                    ].includes(quotation.status) && <CheckCircle2 size={12} />}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      [
                        "client_accepted",
                        "accepted",
                        "confirmed",
                        "in_progress",
                        "completed",
                      ].includes(quotation.status)
                        ? "text-emerald-700"
                        : "text-zinc-400"
                    }`}
                  >
                    Client Accepted
                  </p>
                </div>

                {/* 4. In Progress */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                      ["in_progress", "completed"].includes(quotation.status)
                        ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                        : quotation.status === "client_accepted"
                          ? "bg-blue-600 ring-4 ring-blue-50 text-white animate-pulse"
                          : "bg-zinc-200"
                    }`}
                  >
                    {["in_progress", "completed"].includes(
                      quotation.status,
                    ) && <CheckCircle2 size={12} />}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      ["in_progress", "completed"].includes(quotation.status)
                        ? "text-emerald-700"
                        : quotation.status === "client_accepted"
                          ? "text-blue-600"
                          : "text-zinc-400"
                    }`}
                  >
                    In Progress
                  </p>
                </div>

                {/* 5. Completed */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                      quotation.status === "completed"
                        ? "bg-emerald-500 ring-4 ring-emerald-50 text-white"
                        : "bg-zinc-200"
                    }`}
                  >
                    {quotation.status === "completed" && (
                      <CheckCircle2 size={12} />
                    )}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      quotation.status === "completed"
                        ? "text-emerald-700"
                        : "text-zinc-400"
                    }`}
                  >
                    Completed
                  </p>
                </div>

                {/* Terminal Rejection or Cancellation */}
                {["client_rejected", "vendor_rejected", "cancelled"].includes(
                  quotation.status,
                ) && (
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

          {/* Main quotation workspace */}
          <div className="order-1 min-w-0 space-y-5 lg:col-span-8 lg:col-start-1 lg:row-start-1">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
              >
                <MessageSquare size={16} /> Chat with client{" "}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px]">
                  {messages.length}
                </span>
              </button>
            </div>

            {quotation.ticket_payload && (
              <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      Client requirements
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-zinc-900">
                      {String(
                        requestPayload.job_title ||
                          requestPayload.machine_name ||
                          quotation.service_name,
                      )}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Submitted by {quotation.client_name}
                      {quotation.client_email
                        ? ` · ${quotation.client_email}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800">
                    {quotation.ticket_number ||
                      quotation.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {requestedJobItems.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Requested items
                    </h3>
                    {requestedJobItems.map((item, index) => (
                      <article
                        key={String(item.id || index)}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h4 className="text-sm font-semibold text-zinc-900">
                            {index + 1}.{" "}
                            {String(
                              item.item_name ||
                                item.name ||
                                `Item ${index + 1}`,
                            )}
                          </h4>
                          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            Qty {String(item.quantity ?? "—")}{" "}
                            {String(item.unit || "")}
                          </span>
                        </div>
                        {item.notes ? (
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                            {String(item.notes)}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}

                {requestDetailEntries.length > 0 && (
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                    {requestDetailEntries.map(([key, value]) => {
                      const label = key.replace(/_/g, " ");
                      const emphasized = /problem|issue|notes|work type/i.test(
                        key,
                      );
                      return (
                        <div
                          key={key}
                          className={`rounded-xl border border-zinc-100 p-3.5 ${emphasized ? "sm:col-span-2 bg-amber-50/60" : "bg-zinc-50/70"}`}
                        >
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            {label}
                          </dt>
                          <dd className="mt-1.5 break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                            {String(value)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                )}

                {Boolean(quotation.documents?.length) && (
                  <div className="mt-5 border-t border-zinc-100 pt-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Photos and attachments
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {quotation.documents?.map((document) => (
                        <a
                          key={document.id}
                          href={document.doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Paperclip className="h-3.5 w-3.5" />{" "}
                          {document.doc_name || document.doc_type}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Action Area */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
              {quotation.status === "closed_accepted_by_other" ? (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-100 border border-zinc-200 p-4 text-zinc-600">
                  <XCircle className="text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">
                      Request Claimed by Another Vendor
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Another nearby vendor has accepted this service request.
                      This request is now closed.
                    </p>
                  </div>
                </div>
              ) : quotation.status === "completed" ? (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-950 shadow-xs">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-base font-bold text-emerald-900">
                      Service Order Completed 🎉
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Customer completion OTP has been verified successfully.
                      Service execution is complete!
                    </p>
                  </div>
                </div>
              ) : isTerminal ? (
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-zinc-600">
                  <CheckCircle2 className="text-zinc-400 shrink-0" />
                  <p className="text-sm font-medium">
                    This negotiation is closed. Terms have been agreed upon or
                    rejected.
                  </p>
                </div>
              ) : isWaitingForClient ? (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                  <Clock className="text-amber-500 animate-pulse shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Waiting for client to review and respond to your offer...
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      The client will accept, counter, or reject your offer.
                    </p>
                  </div>
                </div>
              ) : quotation.status === "client_accepted" ||
                quotation.status === "accepted" ||
                quotation.status === "confirmed" ||
                quotation.status === "in_progress" ? (
                /* When Status is Accepted / Confirmed / In Progress: Verify Customer Completion OTP */
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="font-heading text-sm font-bold">
                        Verify Customer OTP & Complete Job
                      </h3>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Ask the customer for their 6-digit Completion PIN once
                        the service/delivery is completed on site.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!noteInput.trim()) return;
                      try {
                        setSubmittingAction(true);
                        const apiUrl =
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:9000";
                        const res = await fetch(
                          `${apiUrl}/api/service-hub/tickets/${id}/complete-otp`,
                          {
                            method: "POST",
                            credentials: "include",
                            headers: {
                              "Content-Type": "application/json",
                              "x-request-from": "vendor",
                            },
                            body: JSON.stringify({ otp: noteInput.trim() }),
                          },
                        );
                        const json = await res.json();
                        if (!res.ok)
                          throw new Error(
                            json.message || "Failed to verify OTP.",
                          );
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
                      {submittingAction ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
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
                        onClick={() => {
                          setVendorActionTab("accept");
                          setReasonInput("");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "accept" ? "bg-white shadow text-emerald-700" : "text-zinc-600 hover:text-zinc-700"}`}
                      >
                        <CheckCircle2 size={14} /> Accept Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVendorActionTab("counter");
                          setReasonInput("");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "counter" ? "bg-white shadow text-blue-700" : "text-zinc-600 hover:text-zinc-700"}`}
                      >
                        <Send size={14} /> Make Counter Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVendorActionTab("reject");
                          setReasonInput("Cannot fulfill terms");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${vendorActionTab === "reject" ? "bg-white shadow text-rose-700" : "text-zinc-600 hover:text-zinc-700"}`}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Accept Offer Pathway */}
                  {quotation.status === "client_countered" &&
                    vendorActionTab === "accept" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-800 flex items-start gap-2.5">
                          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold">
                              You are accepting the client's counter offer
                            </p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                              This will accept the client's bid of{" "}
                              <strong className="text-emerald-800">
                                {formatINR(quotation.current_offer_price)}
                              </strong>{" "}
                              and close the negotiation.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">
                            Acceptance Note (optional)
                          </label>
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
                          {submittingAction ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <CheckCircle2 size={18} />
                          )}
                          Accept and Create Order
                        </button>
                      </div>
                    )}

                  {/* Reject Pathway */}
                  {((quotation.status === "client_countered" &&
                    vendorActionTab === "reject") ||
                    (quotation.status !== "client_countered" &&
                      reasonInput)) && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-rose-800 flex items-start gap-2.5">
                        <XCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">
                            Reject this quotation request
                          </p>
                          <p className="text-xs text-rose-600 mt-0.5">
                            Rejection is permanent and will close this quotation
                            request.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-rose-500 uppercase tracking-wider ml-1 mb-1 block">
                          Reason for Rejection *
                        </label>
                        <input
                          type="text"
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          placeholder="Why are you rejecting this request? (Required)"
                          className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 placeholder-rose-300 focus:border-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">
                          Rejection Note (optional)
                        </label>
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
                            onClick={() => {
                              setVendorActionTab("counter");
                              setReasonInput("");
                            }}
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
                          {submittingAction ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <XCircle size={18} />
                          )}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Counter Offer/First Offer Pathway */}
                  {(isFirstOffer ||
                    (quotation.status === "client_countered" &&
                      vendorActionTab === "counter" &&
                      !reasonInput)) && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Live Calculation Preview */}
                      {(isMachineMaintenance
                        ? computedSubtotal > 0
                        : Boolean(priceInput)) && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                          <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <IndianRupee size={12} /> Live Service Proposal
                            Preview
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-white rounded-lg border border-blue-100 p-2">
                              <p className="text-zinc-400">Subtotal</p>
                              <p className="font-bold text-zinc-900">
                                {formatINR(computedSubtotal)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg border border-blue-100 p-2">
                              <p className="text-zinc-400">GST (18%)</p>
                              <p className="font-bold text-zinc-900">
                                {formatINR(computedGST)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg border border-blue-100 p-2">
                              <p className="text-zinc-400">Total Price</p>
                              <p className="font-bold text-emerald-700">
                                {formatINR(computedTotal)}
                              </p>
                            </div>
                            {!isMachineMaintenance &&
                              !isJobInquiry &&
                              tokenPercentageInput && (
                                <div className="bg-white rounded-lg border border-orange-100 p-2">
                                  <p className="text-zinc-400">
                                    Token Advance ({tokenPercentageInput}%)
                                  </p>
                                  <p className="font-bold text-orange-700">
                                    {formatINR(computedTokenAmount)}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {isJobInquiry && (
                        <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900">
                              Job Inquiry Item Quotation
                            </h4>
                            <p className="mt-1 text-xs text-zinc-500">
                              Enter your rate and delivery commitment for each
                              client item. The requested quantities and units
                              are prefilled.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {quoteItems.map((item, index) => (
                              <div
                                key={item.id}
                                className="rounded-lg border border-zinc-200 bg-white p-3"
                              >
                                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {index + 1}. {item.name}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    Requested: {item.quantity} {item.unit}
                                  </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                  <label className="text-[11px] font-medium text-zinc-600">
                                    Rate per {item.unit || "unit"} (₹) *
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={item.unitPrice || ""}
                                      onChange={(event) =>
                                        setQuoteItems((items) =>
                                          items.map((row) =>
                                            row.id === item.id
                                              ? {
                                                  ...row,
                                                  unitPrice:
                                                    Number(
                                                      event.target.value,
                                                    ) || 0,
                                                }
                                              : row,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                    />
                                  </label>
                                  <label className="text-[11px] font-medium text-zinc-600">
                                    Confirmed delivery date *
                                    <input
                                      type="date"
                                      value={item.confirmedDeliveryDate || ""}
                                      onChange={(event) =>
                                        setQuoteItems((items) =>
                                          items.map((row) =>
                                            row.id === item.id
                                              ? {
                                                  ...row,
                                                  confirmedDeliveryDate:
                                                    event.target.value,
                                                }
                                              : row,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                    />
                                  </label>
                                  <label className="text-[11px] font-medium text-zinc-600">
                                    Supplier accepted date *
                                    <input
                                      type="date"
                                      value={item.supplierAcceptedDate || ""}
                                      onChange={(event) =>
                                        setQuoteItems((items) =>
                                          items.map((row) =>
                                            row.id === item.id
                                              ? {
                                                  ...row,
                                                  supplierAcceptedDate:
                                                    event.target.value,
                                                }
                                              : row,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                    />
                                  </label>
                                  <label className="text-[11px] font-medium text-zinc-600">
                                    Notes
                                    <input
                                      value={item.remark || ""}
                                      onChange={(event) =>
                                        setQuoteItems((items) =>
                                          items.map((row) =>
                                            row.id === item.id
                                              ? {
                                                  ...row,
                                                  remark: event.target.value,
                                                }
                                              : row,
                                          ),
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                      placeholder="Notes for this item"
                                    />
                                  </label>
                                </div>
                                <p className="mt-2 text-right text-xs font-semibold text-zinc-600">
                                  Line total:{" "}
                                  {formatINR(item.quantity * item.unitPrice)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              {
                                label: "Service / processing charge",
                                value: serviceCharge,
                                set: setServiceCharge,
                              },
                              {
                                label: "Delivery charge",
                                value: travelCharge,
                                set: setTravelCharge,
                              },
                              {
                                label: "Other charges",
                                value: otherCharge,
                                set: setOtherCharge,
                              },
                            ].map((charge) => (
                              <label
                                key={charge.label}
                                className="text-xs font-medium text-zinc-600"
                              >
                                {charge.label} (₹)
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={charge.value}
                                  onChange={(event) =>
                                    charge.set(event.target.value)
                                  }
                                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                            ))}
                          </div>
                          <p className="text-right text-xs font-semibold text-zinc-700">
                            Subtotal {formatINR(computedSubtotal)} · GST (18%){" "}
                            {formatINR(computedGST)} · Total{" "}
                            {formatINR(computedTotal)}
                          </p>
                        </div>
                      )}

                      {isMachineMaintenance && (
                        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900">
                              Machine Maintenance Quote Items
                            </h4>
                            <p className="mt-1 text-xs text-zinc-500">
                              Add items from your web catalog or enter materials
                              manually. Add service and other charges below.
                            </p>
                          </div>
                          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-semibold text-zinc-800">
                                  Web product catalog
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                  Add a product, then set your quoted unit price
                                  below.
                                </p>
                              </div>
                              <input
                                value={catalogSearch}
                                onChange={(event) => {
                                  setCatalogSearch(event.target.value);
                                  setCatalogPage(0);
                                }}
                                placeholder="Search products"
                                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs sm:max-w-xs"
                              />
                            </div>
                            {catalogError && (
                              <p className="text-xs text-rose-600">
                                {catalogError}
                              </p>
                            )}
                            {catalogChoices.length > 0 ? (
                              <div className="max-h-48 divide-y divide-zinc-100 overflow-y-auto rounded-md border border-zinc-100">
                                {catalogChoices.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-medium text-zinc-800">
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] text-zinc-500">
                                        {item.price > 0
                                          ? `Reference from ${formatINR(item.price)} / ${item.unit}`
                                          : item.unit}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCatalogItem(item)}
                                      className="shrink-0 rounded-md bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
                                    >
                                      Add
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : !catalogLoading && !catalogError ? (
                              <p className="rounded-md bg-zinc-50 px-3 py-4 text-center text-xs text-zinc-500">
                                No matching products found in the web catalog.
                              </p>
                            ) : null}
                            {catalogLoading && (
                              <p className="text-[10px] text-zinc-500">
                                Loading products…
                              </p>
                            )}
                            {!catalogLoading && catalogHasMore && (
                              <button
                                type="button"
                                onClick={() =>
                                  setCatalogPage((page) => page + 1)
                                }
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                              >
                                Load more products
                              </button>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[1fr_100px_140px_auto]">
                            <input
                              value={manualItemName}
                              onChange={(event) =>
                                setManualItemName(event.target.value)
                              }
                              placeholder="Manual item / material / work"
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                            />
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={manualItemQuantity}
                              onChange={(event) =>
                                setManualItemQuantity(event.target.value)
                              }
                              aria-label="Manual item quantity"
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={manualItemPrice}
                              onChange={(event) =>
                                setManualItemPrice(event.target.value)
                              }
                              placeholder="Unit price ₹"
                              aria-label="Manual item unit price"
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={addManualItem}
                              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                            >
                              Add manual
                            </button>
                          </div>
                          {quoteItems.length > 0 && (
                            <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-2">
                              <div className="hidden grid-cols-[minmax(0,1fr)_60px_88px_92px_48px] gap-2 px-2 text-[10px] font-semibold uppercase text-zinc-500 sm:grid">
                                <span>Item</span>
                                <span>Qty</span>
                                <span>Unit price</span>
                                <span>Amount</span>
                                <span />
                              </div>
                              {quoteItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="grid grid-cols-2 items-center gap-2 rounded-md border border-zinc-100 p-2 sm:grid-cols-[minmax(0,1fr)_60px_88px_92px_48px]"
                                >
                                  <p
                                    className="col-span-2 truncate text-xs font-medium text-zinc-800 sm:col-span-1"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </p>
                                  <label className="text-[10px] text-zinc-500 sm:text-transparent">
                                    Qty
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="any"
                                      value={item.quantity}
                                      onChange={(event) =>
                                        setQuoteItems((items) =>
                                          items.map((row) =>
                                            row.id === item.id
                                              ? {
                                                  ...row,
                                                  quantity:
                                                    Number(
                                                      event.target.value,
                                                    ) || 0,
                                                }
                                              : row,
                                          ),
                                        )
                                      }
                                      aria-label={`Quantity for ${item.name}`}
                                      className="mt-0.5 w-full rounded border border-zinc-200 px-1.5 py-1 text-xs text-zinc-800"
                                    />
                                  </label>
                                  <label className="text-[10px] text-zinc-500 sm:text-transparent">
                                    Unit price
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unitPrice}
                                      onChange={(event) =>
                                        setQuoteItems((items) =>
                                          items.map((row) =>
                                            row.id === item.id
                                              ? {
                                                  ...row,
                                                  unitPrice:
                                                    Number(
                                                      event.target.value,
                                                    ) || 0,
                                                }
                                              : row,
                                          ),
                                        )
                                      }
                                      aria-label={`Unit price for ${item.name}`}
                                      className="mt-0.5 w-full rounded border border-zinc-200 px-1.5 py-1 text-xs text-zinc-800"
                                    />
                                  </label>
                                  <span className="text-xs font-semibold text-zinc-700 pt-3">
                                    {formatINR(item.quantity * item.unitPrice)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuoteItems((items) =>
                                        items.filter(
                                          (row) => row.id !== item.id,
                                        ),
                                      )
                                    }
                                    className="justify-self-end text-[10px] font-semibold text-rose-600 hover:text-rose-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              {
                                label: "Service charge",
                                value: serviceCharge,
                                set: setServiceCharge,
                              },
                              {
                                label: "Transport charge",
                                value: travelCharge,
                                set: setTravelCharge,
                              },
                              {
                                label: "Miscellaneous charges",
                                value: otherCharge,
                                set: setOtherCharge,
                              },
                            ].map((charge) => (
                              <label
                                key={charge.label}
                                className="text-xs font-medium text-zinc-600"
                              >
                                {charge.label} (₹)
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={charge.value}
                                  onChange={(event) =>
                                    charge.set(event.target.value)
                                  }
                                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                            ))}
                          </div>
                          <p className="text-right text-xs font-semibold text-zinc-700">
                            Subtotal {formatINR(computedSubtotal)} · GST (18%){" "}
                            {formatINR(computedGST)} · Total{" "}
                            {formatINR(computedTotal)}
                          </p>
                        </div>
                      )}

                      {/* Offer Form Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        {!isMachineMaintenance && !isJobInquiry && (
                          <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">
                              Your Price (₹) *
                            </label>
                            <input
                              type="number"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                              placeholder="Total price"
                            />
                          </div>
                        )}
                        {!isJobInquiry && (
                          <div className="min-w-0">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 flex items-center gap-1">
                              <Truck size={12} />
                              Execution Timeline (Days) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={deliveryDaysInput}
                              onChange={(e) => setDeliveryDaysInput(e.target.value)}
                              className="w-full min-w-0 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                              placeholder="Timeline in days"
                            />
                          </div>
                        )}
                      </div>

                      {/* Token money is only part of legacy service quotation payments. */}
                      {!isMachineMaintenance && !isJobInquiry && (
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
                              onChange={(e) =>
                                setTokenPercentageInput(e.target.value)
                              }
                              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                              placeholder="Token Money %"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">
                              Message / Note (optional)
                            </label>
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                              placeholder="Note to client (optional)"
                            />
                          </div>
                        </div>
                      )}

                      {/* Reason input for counter offer (mandatory!) */}
                      {!isFirstOffer && (
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">
                            Reason for Counter Offer *
                          </label>
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
                            onClick={() =>
                              setReasonInput("Cannot fulfill terms")
                            }
                            className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-auto"
                          >
                            Reject Request
                          </button>
                        )}
                        <button
                          onClick={() =>
                            void submitResponse(
                              isFirstOffer ? "offer" : "counter",
                            )
                          }
                          disabled={
                            submittingAction ||
                            (isMachineMaintenance || isJobInquiry
                              ? quoteItems.length === 0 || computedSubtotal <= 0
                              : !priceInput) ||
                            (!isJobInquiry && !deliveryDaysInput) ||
                            (!isMachineMaintenance &&
                              !isJobInquiry &&
                              !tokenPercentageInput) ||
                            (!isFirstOffer && !reasonInput.trim())
                          }
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {submittingAction ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Send size={18} />
                          )}
                          {isFirstOffer
                            ? "Send First Proposal"
                            : "Send Counter Proposal"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {isChatOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-3 backdrop-blur-[2px] sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsChatOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-chat-title"
              className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
                <div>
                  <h2
                    id="client-chat-title"
                    className="flex items-center gap-2 text-sm font-bold text-zinc-900"
                  >
                    <MessageSquare size={16} className="text-emerald-600" />{" "}
                    Conversation with {quotation.client_name}
                  </h2>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Quotation updates and client responses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close conversation"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={18} />
                </button>
              </header>
              <div
                ref={chatContainerRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-6"
              >
                {messages.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center text-center text-zinc-400">
                    <MessageSquare size={30} className="mb-3 text-zinc-300" />
                    <p className="text-sm font-semibold text-zinc-600">
                      No conversation yet
                    </p>
                    <p className="mt-1 text-xs">
                      Your first quotation will appear here for the client.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isVendorMessage = msg.sender_role === "vendor";
                    return (
                      <article
                        key={msg.id}
                        className={`flex ${isVendorMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`w-full max-w-[88%] rounded-2xl border p-4 shadow-xs ${isVendorMessage ? "border-emerald-500 bg-emerald-600 text-white" : "border-zinc-200 bg-white text-zinc-900"}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isVendorMessage ? "bg-white/15 text-emerald-50" : "bg-zinc-100 text-zinc-600"}`}
                            >
                              {isVendorMessage ? "You" : "Client"} ·{" "}
                              {msg.action}
                            </span>
                            <time
                              className={`text-[10px] ${isVendorMessage ? "text-emerald-100" : "text-zinc-400"}`}
                            >
                              {new Date(msg.created_at).toLocaleString()}
                            </time>
                          </div>
                          {msg.offer_price != null && (
                            <p
                              className={`mb-2 text-base font-bold ${isVendorMessage ? "text-white" : "text-zinc-900"}`}
                            >
                              {formatINR(msg.offer_price)}
                            </p>
                          )}
                          {msg.note && (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {msg.note}
                            </p>
                          )}
                          {msg.reason && (
                            <p
                              className={`mt-2 rounded-lg p-2 text-xs ${isVendorMessage ? "bg-emerald-700/50" : "bg-rose-50 text-rose-700"}`}
                            >
                              Reason: {msg.reason}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
              <footer className="border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-500">
                To send an offer or counter proposal, use the quotation form on
                this page.
              </footer>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
