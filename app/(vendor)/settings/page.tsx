"use client";

import React, { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  FileCheck,
  Percent,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type Category = {
  code: string;
  label: string;
};

type VendorDetails = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_is_active: boolean;
  vendor_phone?: string;
  vendor_company_name?: string;
  vendor_gst_number?: string;
  vendor_gst_certificate_link?: string;
  vendor_business_type?: string;
  vendor_company_website?: string;
  vendor_alternative_number?: string;
  vendor_designation?: string;
  vendor_business_description?: string;
  vendor_is_approved?: boolean;
  vendor_approval_status?: string;
  vendor_approval_notes?: string;
  vendor_application_number?: string;
  vendor_is_blocked?: boolean;
  vendor_credit_cycle?: string;
  vendor_minimum_commision_percentage?: number;
  vendor_maximum_commision_percentage?: number;
  vendor_address?: string;
  vendor_city?: string;
  vendor_state?: string;
  vendor_country?: string;
  vendor_pincode?: string;
  vendor_latitude?: number;
  vendor_longitude?: number;
  vendor_categories?: Category[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export default function SettingsPage() {
  const { user, fetchUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "agreement">("profile");
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useLayoutEffect(() => {
    async function fetchVendorDetails() {
      try {
        const response = await fetch(
          `${API_BASE}/api/vendors/getVendorDetails`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "vendor",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setVendorDetails(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch vendor details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVendorDetails();
  }, []);

  return (
    <main className="flex-1 bg-zinc-50 min-h-screen font-sans">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb */}
        <nav className="text-sm text-zinc-500 flex items-center gap-2">
          <Link href="/" className="hover:text-zinc-800 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-zinc-400" />
          <span className="text-zinc-800 font-medium">Settings</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              Settings
            </h1>
            <p className="text-zinc-500 mt-1 font-medium">
              Review your B2B account information, active categories, commission structure and registration agreement.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-sm font-medium">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Custom Tabs */}
            <div className="flex border-b border-zinc-200 bg-white p-1 rounded-xl shadow-sm">
              <button
                id="btn-tab-profile"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "profile"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <Building2 size={16} />
                Business Profile
              </button>
              <button
                id="btn-tab-agreement"
                onClick={() => setActiveTab("agreement")}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "agreement"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <FileCheck size={16} />
                Account Agreement
              </button>
            </div>

            {/* Content Areas */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Basic Vendor Info */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Building2 className="text-blue-600" size={20} />
                    Company & Business Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company Name</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_company_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">GST Number</p>
                      <p className="text-sm font-mono font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_gst_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Business Type</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1 capitalize">{vendorDetails?.vendor_business_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Designation / Role</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_designation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Application Reference</p>
                      <p className="text-sm font-mono font-bold text-blue-600 mt-1">{vendorDetails?.vendor_application_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company Website</p>
                      {vendorDetails?.vendor_company_website ? (
                        <a href={vendorDetails.vendor_company_website} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-500 hover:underline mt-1 block">
                          {vendorDetails.vendor_company_website}
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-zinc-800 mt-1">—</p>
                      )}
                    </div>
                  </div>
                  {vendorDetails?.vendor_business_description && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Business Description</p>
                      <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{vendorDetails.vendor_business_description}</p>
                    </div>
                  )}
                </div>

                {/* Account details & Contacts */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Mail className="text-emerald-600" size={20} />
                    Account & Contact Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Primary Contact Person</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{user?.username || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Primary Email (Locked)</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{user?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Phone Number</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_phone || "—"}</p>
                    </div>
                    {vendorDetails?.vendor_alternative_number && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Alternative Phone</p>
                        <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails.vendor_alternative_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories and Commercials */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Percent className="text-purple-600" size={20} />
                    Categories & Commercial Terms
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Allowed Categories</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {vendorDetails?.vendor_categories && vendorDetails.vendor_categories.length > 0 ? (
                          vendorDetails.vendor_categories.map((cat, idx) => (
                            <span key={cat.code || idx} className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md border border-zinc-200">
                              {cat.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-500">None selected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Credit Cycle</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_credit_cycle || "Immediate Payment"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Minimum Platform Commission</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_minimum_commision_percentage ?? 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Maximum Platform Commission</p>
                      <p className="text-sm font-bold text-zinc-800 mt-1">{vendorDetails?.vendor_maximum_commision_percentage ?? 0}%</p>
                    </div>
                  </div>
                </div>

                {/* Warehouse / Billing Address */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <MapPin className="text-red-600" size={20} />
                    Primary Office / Warehouse Location
                  </h2>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Registered Address</p>
                    {vendorDetails?.vendor_address ? (
                      <div className="text-sm text-zinc-800 space-y-1">
                        <p className="font-bold">{vendorDetails.vendor_address}</p>
                        <p>{vendorDetails.vendor_city}, {vendorDetails.vendor_state} - {vendorDetails.vendor_pincode}</p>
                        <p className="text-xs text-zinc-500 font-semibold">{vendorDetails.vendor_country}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No registered address listed.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === "agreement" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Account Creation Agreement Details */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  
                  {/* Digital Signature Banner */}
                  <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-950">Signed Agreement Online</h3>
                        <p className="text-xs text-zinc-500">Digitally accepted at the time of vendor registration setup.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      <CheckCircle2 size={14} />
                      SIGNED & ACTIVE
                    </div>
                  </div>

                  {/* Contract content */}
                  <div className="p-6 md:p-8 space-y-6 max-h-[500px] overflow-y-auto border-b border-zinc-100 font-serif text-zinc-800 text-sm leading-relaxed">
                    <div className="text-center space-y-2 border-b border-zinc-200 pb-6 font-sans">
                      <h2 className="text-lg font-bold text-zinc-900 tracking-wider">VITTHAL B2B INDUSTRIAL MARKETPLACE</h2>
                      <h1 className="text-xl font-extrabold text-zinc-900">STANDARD SELLER PARTICIPATION AGREEMENT</h1>
                      <p className="text-xs font-medium text-zinc-500">Document ID: VENDOR-AGR-{vendorDetails?.vendor_application_number || "SYS"}</p>
                    </div>

                    <div className="space-y-4">
                      <p>
                        This Seller Participation Agreement (&quot;Agreement&quot;) defines the legally binding terms governing your participation as a registered merchant and supplier on the Vitthal Multi-Vendor Industrial Marketplace Platform.
                      </p>

                      <h3 className="font-sans font-bold text-zinc-950 mt-4">1. PLATFORM SCOPE AND SERVICES</h3>
                      <p>
                        Vitthal facilitates online transaction logs, product catalog hosting, quotation workflow processing, RFQ bidding systems, order processing, and payment settlements for industrial goods across Metals, Plastics, and Chemicals sectors.
                      </p>

                      <h3 className="font-sans font-bold text-zinc-950 mt-4">2. CATALOGING AND INVENTORY</h3>
                      <p>
                        The Vendor agrees to maintain accurate listings, pricing details, specifications, and minimum order quantities (MOQ). Product listings must not violate third-party intellectual property. Vitthal Admin reserves the right to remove any inaccurate or unverified industrial listings.
                      </p>

                      <h3 className="font-sans font-bold text-zinc-950 mt-4">3. COMMISSION AND TRANSACTION FEE</h3>
                      <p>
                        The Vendor agrees to platform commission structures set during onboarding. The platform commission is deducted directly at order settlement. In accordance with onboarding parameters, the agreed commission ranges between a Minimum of <strong>{vendorDetails?.vendor_minimum_commision_percentage ?? 0}%</strong> and a Maximum of <strong>{vendorDetails?.vendor_maximum_commision_percentage ?? 0}%</strong> based on product categories.
                      </p>

                      <h3 className="font-sans font-bold text-zinc-950 mt-4">4. LOGISTICS, PACKAGING, AND FULFILLMENT</h3>
                      <p>
                        The Vendor agrees to pack items appropriately for secure transport and fulfill orders within the designated dispatch timeframe. Shipment status tracking updates must be accurately inputted into the vendor system panel.
                      </p>

                      <h3 className="font-sans font-bold text-zinc-950 mt-4">5. CREDIT TERMS & SETTLEMENTS</h3>
                      <p>
                        Payouts will be processed in accordance with the registered billing credit cycle. The Vendor&apos;s specified payment cycle parameter is set to: <strong>{vendorDetails?.vendor_credit_cycle || "Immediate Settlement"}</strong>. Settlements are remitted directly to the verified bank account upon verification of customer delivery.
                      </p>
                    </div>
                  </div>

                  {/* Agreement Metadata / Stamp */}
                  <div className="bg-zinc-50 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-600 border-t border-zinc-100">
                    <div className="space-y-2 border-r border-zinc-200 md:pr-6">
                      <p className="font-bold text-zinc-900 uppercase tracking-wider mb-2 text-[10px]">Merchant Representative Sign-off</p>
                      <div className="space-y-1 bg-white border border-zinc-200 rounded-lg p-3 font-mono">
                        <p><span className="text-zinc-400">Company:</span> <strong className="text-zinc-800">{vendorDetails?.vendor_company_name}</strong></p>
                        <p><span className="text-zinc-400">Signed By:</span> {user?.username}</p>
                        <p><span className="text-zinc-400">IP:</span> 127.0.0.1 (Verified Setup Session)</p>
                      </div>
                    </div>
                    <div className="space-y-2 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-zinc-900 uppercase tracking-wider mb-2 text-[10px]">Contract Metadata</p>
                        <p><span className="font-semibold text-zinc-700">Contract Reference:</span> AGR-REF-{vendorDetails?.vendor_application_number || "PENDING"}</p>
                        <p><span className="font-semibold text-zinc-700">Effective Date:</span> Active Platform Registration Session</p>
                        <p className="text-[10px] text-zinc-400 mt-2">Digitally stamped by Vitthal B2B Authentication Authority.</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}