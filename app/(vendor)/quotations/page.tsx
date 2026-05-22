"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import { vendorNegotiationApi, VendorQuotationSummary } from "@/lib/api";
import { toast } from "sonner";

function statusStyles(status: string) {
  switch (status) {
    case "pending_vendor":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "vendor_offered":
    case "vendor_countered":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "client_countered":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "client_accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "client_rejected":
    case "vendor_rejected":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-gray-200 bg-gray-100 text-gray-700";
  }
}

export default function VendorQuotationsPage() {
  const [quotations, setQuotations] = useState<VendorQuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Quotation requests</h1>
      {quotations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No quotation requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotations.map((quote) => (
            <Link
              key={quote.id}
              href={`/quotations/${quote.id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{quote.product_name}</p>
                  <p className="text-xs text-gray-500">Requested: {quote.requested_quantity} units</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyles(quote.status)}`}>
                  {quote.status.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
