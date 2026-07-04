"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Wrench,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Eye,
  Percent,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

type ServiceOffering = {
  id: string;
  price: string;
  pricing_type: "flat" | "hourly" | "project" | "milestone";
  moq: number;
  is_active: boolean;
  created_at: string;
  service_id: string;
  service_name: string;
  service_status: string;
  service_image: string;
  category_name: string;
  booking_count: number;
  delivery_days?: number;
  token_percentage?: string;
};

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const offeringId = params.id as string;

  const [offering, setOffering] = useState<ServiceOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState<"flat" | "hourly" | "project" | "milestone">("flat");
  const [moq, setMoq] = useState("1");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [tokenPercentage, setTokenPercentage] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  useEffect(() => {
    fetchOffering();
  }, [offeringId]);

  const fetchOffering = async () => {
    try {
      setLoading(true);
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:9001";
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const response = await fetch(`${adminUrl}/api/services/vendor/offerings`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch service offerings");
      }

      const data = await response.json();
      const allOfferings: ServiceOffering[] = data.data || [];
      const current = allOfferings.find((o) => o.id === offeringId);

      if (!current) {
        toast.error("Service offering not found or access denied.");
        return;
      }

      setOffering(current);
      setPrice(current.price);
      setPricingType(current.pricing_type);
      setMoq(String(current.moq));
      setDeliveryDays(current.delivery_days ? String(current.delivery_days) : "");
      setTokenPercentage(current.token_percentage ? String(current.token_percentage) : "");
      setIsActive(current.is_active);
    } catch (error) {
      console.error("Failed to fetch offering:", error);
      toast.error("Failed to fetch offering details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:9001";
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const response = await fetch(`${adminUrl}/api/services/vendor/offerings/${offeringId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          price: parseFloat(price),
          pricingType,
          moq: parseInt(moq),
          deliveryDays: deliveryDays ? parseInt(deliveryDays) : null,
          tokenPercentage: tokenPercentage ? parseFloat(tokenPercentage) : null,
          isActive,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Service updated successfully!");
        router.push(`/services/view/${offeringId}`);
      } else {
        toast.error(data.message || "Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Offering Not Found</h2>
          <p className="text-gray-500 mb-6">
            The service offering you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-2.5 rounded-md hover:bg-gray-800 transition-colors font-medium text-xs shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto text-sm pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/services/view/${offeringId}`}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Edit Service</h1>
            <p className="text-gray-500 mt-1">Update pricing, timeline, and terms</p>
          </div>
        </div>
        <Link
          href={`/services/view/${offeringId}`}
          className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium"
        >
          <Eye className="w-4 h-4 mr-2 animate-pulse" /> View Service
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Details Preview Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
          <div className="flex items-start gap-4">
            {offering.service_image ? (
              <img
                src={offering.service_image}
                alt={offering.service_name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-gray-50"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Wrench className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{offering.service_name}</h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {offering.category_name} • <span className="capitalize">{offering.pricing_type} Model</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">ID: {offering.id.split("-")[0].toUpperCase()}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-650 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg border border-gray-150 italic">
              We offer high-quality professional {offering.service_name} services, fully compliant with B2B industry standards. Standard scheduling, negotiation channels, and completion verification procedures apply.
            </p>
          </div>
        </div>

        {/* Status Toggle Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-emerald-100" : "bg-gray-200"}`}>
                {isActive ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{isActive ? "Active" : "Inactive"}</p>
                <p className="text-xs text-gray-500">
                  {isActive ? "Service offering is visible to buyers" : "Service offering is hidden from buyers"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                isActive ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pricing & Terms Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Pricing Model <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md font-normal">
                    How you bill the service (e.g. flat rate, hourly, per project).
                  </div>
                </div>
              </div>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white"
              >
                <option value="flat">Flat Price</option>
                <option value="hourly">Hourly Billing</option>
                <option value="project">Project Scope</option>
                <option value="milestone">Milestone Billing</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md font-normal">
                    The rate/base price charged for the selected pricing model.
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Minimum Order (MOQ) <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md font-normal">
                    Minimum units/hours/projects a buyer must order to book this service.
                  </div>
                </div>
              </div>
              <input
                type="number"
                min="1"
                required
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium"
                placeholder="1"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Default Execution Timeline (Days) <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md font-normal">
                    Default days required to deliver the scope of service after booking.
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium"
                  placeholder="e.g. 7"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Default Token Money (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md font-normal">
                    The percentage of advance token payment required to start booking execution.
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={tokenPercentage}
                  onChange={(e) => setTokenPercentage(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium"
                  placeholder="e.g. 10.0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Link
            href={`/services/view/${offeringId}`}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium text-base"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-500 transition-colors font-medium shadow-md text-base inline-flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
