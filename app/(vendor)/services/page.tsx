"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Check,
  Edit,
  Trash2,
  Wrench,
  ChevronDown,
  ChevronRight,
  Filter,
  DollarSign,
  Calendar,
  Eye,
} from "lucide-react";
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
  modification_status?: string | null;
  service_status: string;
  service_image: string;
  category_name: string;
  booking_count: number;
};

type GlobalService = {
  id: string;
  name: string;
  category_code: string;
  description: string;
  status: string;
};

type ServiceNode = { id: string; name: string; children?: ServiceNode[] };
type ServiceCategoryTree = { id: string; label: string; subcategories?: ServiceNode[] };

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [globalServices, setGlobalServices] = useState<GlobalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded row state
  const [expandedServiceIds, setExpandedServiceIds] = useState<Record<string, boolean>>({});

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pricingTypeFilter, setPricingTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [serviceCategories, setServiceCategories] = useState<{ id: string; code: string; label: string }[]>([]);
  const [coverageCategories, setCoverageCategories] = useState<ServiceCategoryTree[]>([]);
  const [coveredCategoryIds, setCoveredCategoryIds] = useState<string[]>([]);
  const [coveredSubcategoryIds, setCoveredSubcategoryIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services/vendor/offerings`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });

      if (res.ok) {
        const json = await res.json();
        setOfferings(json.data || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else {
        setError("Failed to fetch service offerings");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load service offerings. Make sure admin backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalServices = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });
      if (res.ok) {
        const json = await res.json();
        setGlobalServices(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch global services list:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/vendors/getVendorCategories`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });
      if (res.ok) {
        const json = await res.json();
        setServiceCategories(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch vendor service categories:", err);
    }
  };

  const fetchServiceCoverage = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const headers = {
        "x-request-from": "vendor",
      };
      const [categoriesResponse, coverageResponse] = await Promise.all([
        fetch(`${apiUrl}/api/service-hub/categories`),
        fetch(`${apiUrl}/api/service-hub/vendor/coverage`, { credentials: "include", headers }),
      ]);
      if (!categoriesResponse.ok || !coverageResponse.ok) return;
      const [categoriesJson, coverageJson] = await Promise.all([
        categoriesResponse.json(),
        coverageResponse.json(),
      ]);
      setCoverageCategories(categoriesJson.data || []);
      setCoveredCategoryIds(coverageJson.data?.category_ids || []);
      setCoveredSubcategoryIds(coverageJson.data?.subcategory_ids || []);
    } catch (err) {
      console.error("Failed to fetch selected service request coverage:", err);
    }
  };

  useEffect(() => {
    fetchOfferings();
    fetchGlobalServices();
    fetchCategories();
    fetchServiceCoverage();
  }, []);

  const coveredNodes = new Set(coveredSubcategoryIds);
  const selectedCoverage = coverageCategories
    .filter((category) => coveredCategoryIds.includes(category.id))
    .map((category) => ({
      ...category,
      selectedSubcategories: (category.subcategories || [])
        .filter((subcategory) => coveredNodes.has(subcategory.id))
        .map((subcategory) => ({
          ...subcategory,
          selectedChildren: (subcategory.children || []).filter((child) => coveredNodes.has(child.id)),
        })),
    }));

  const toggleExpand = (id: string) => {
    setExpandedServiceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteOffering = async (offeringId: string) => {
    if (!window.confirm("Are you sure you want to delete this service offering? This action cannot be undone.")) {
      return;
    }

    try {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:9001";
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const res = await fetch(`${adminUrl}/api/services/vendor/offerings/${offeringId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        toast.success("Service offering deleted successfully");
        setOfferings(offerings.filter((o) => o.id !== offeringId));
      } else {
        const errorJson = await res.json().catch(() => ({}));
        toast.error(errorJson.message || "Failed to delete service offering");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error deleting service offering");
    }
  };





  // Filter logic
  const filteredOfferings = offerings.filter((o) => {
    const matchesSearch = o.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? o.category_name === categoryFilter : true;
    const matchesPricingType = pricingTypeFilter ? o.pricing_type === pricingTypeFilter : true;
    const matchesStatus =
      statusFilter === ""
        ? true
        : statusFilter === "active"
        ? o.is_active
        : !o.is_active;

    return matchesSearch && matchesCategory && matchesPricingType && matchesStatus;
  });

  // Services available to add (not already offered)
  const offeredServiceIds = new Set(offerings.map((o) => o.service_id));
  const availableServicesToAdd = globalServices.filter(
    (s) => !offeredServiceIds.has(s.id) && s.status === "approved"
  );

  // Pagination Logic
  const totalResults = filteredOfferings.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOfferings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Services
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium shadow-sm w-full sm:w-auto"
          >
            Manage Bookings
          </Link>
          <Link
            href="/service-coverage"
            className="inline-flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-md hover:bg-emerald-100 transition-colors font-medium shadow-sm w-full sm:w-auto whitespace-nowrap text-xs font-semibold"
          >
            Request Coverage
          </Link>
          <Link
            href="/services/add"
            className="inline-flex items-center justify-center bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium shadow-sm w-full sm:w-auto whitespace-nowrap text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Link>
        </div>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-emerald-100"><Wrench className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold tracking-tight">Request coverage</h2>
                {selectedCoverage.length > 0 ? <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-emerald-50">{selectedCoverage.length} categor{selectedCoverage.length === 1 ? "y" : "ies"} active</span> : null}
              </div>
              <p className="mt-1 text-xs text-emerald-50/75">Clients can send you requests for the categories and work types listed here.</p>
            </div>
          </div>
          <Link href="/service-coverage" className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20">
            Manage coverage <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
        {selectedCoverage.length === 0 ? (
          <div className="m-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 sm:m-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">No request coverage selected</p>
              <p className="mt-1 text-xs text-gray-500">Choose the work you accept to receive matching client requests.</p>
            </div>
            <Link href="/service-coverage" className="rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-900">Choose work types</Link>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {selectedCoverage.map((category) => (
              <div key={category.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-emerald-200 hover:shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><Wrench className="h-4 w-4" /></span>
                    <p className="truncate text-sm font-semibold text-gray-900">{category.label}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800"><Check className="h-3 w-3" /> Active</span>
                </div>
                <div className="p-4">
                {category.selectedSubcategories.length ? (
                  <ul className="space-y-3">
                    {category.selectedSubcategories.map((subcategory) => (
                      <li key={subcategory.id} className="relative pl-4">
                        <span className="absolute bottom-0 left-0 top-0 w-px bg-emerald-200" />
                        <p className="relative inline-flex max-w-full items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-950">
                          <span className="absolute -left-[17px] h-2 w-2 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-200" />
                          {subcategory.name}
                        </p>
                        {subcategory.selectedChildren.length ? (
                          <ul className="mt-2 flex flex-wrap gap-1.5 pl-1">
                            {subcategory.selectedChildren.map((child) => <li key={child.id} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-600"><ChevronRight className="h-3 w-3 text-emerald-600" />{child.name}</li>)}
                          </ul>
                        ) : <span className="ml-2 text-[10px] text-gray-400">No sub-subcategories selected</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-gray-500"><Check className="h-3.5 w-3.5 text-emerald-600" />Main category selected; no specific work type chosen.</p>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Search and Filter Bar */}
      <div className="sticky top-24 z-40 bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search services by name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 min-w-[140px] transition-all duration-200"
            >
              <option value="">All Categories</option>
              {serviceCategories.map((cat) => (
                <option key={cat.code || cat.id} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={pricingTypeFilter}
              onChange={(e) => {
                setPricingTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 min-w-[140px] transition-all duration-200"
            >
              <option value="">Pricing Type</option>
              <option value="flat">Flat Rate</option>
              <option value="hourly">Hourly Billing</option>
              <option value="project">Project Scope</option>
              <option value="milestone">Milestones</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 min-w-[120px] transition-all duration-200"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-medium">
                <th className="px-6 py-3 whitespace-nowrap">Service</th>
                <th className="px-6 py-3 whitespace-nowrap">Category</th>
                <th className="px-6 py-3 whitespace-nowrap">Price & MOQ</th>
                <th className="px-6 py-3 whitespace-nowrap">Date Added</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    Loading your service offerings...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-50 p-4 rounded-full mb-4 border border-gray-100">
                        <Filter className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900 mb-1">No service listings found</p>
                      <p className="text-gray-500 mb-6">
                        Your accepted service request categories are shown above. Add a service listing if you also want to publish an individual offering in your portfolio.
                      </p>
                      <Link
                        href="/services/add"
                        className="text-xs bg-white border border-gray-300 text-gray-700 px-4.5 py-2.5 rounded-md hover:bg-gray-50 transition-colors font-semibold shadow-sm inline-flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((offering) => {
                  const isExpanded = !!expandedServiceIds[offering.id];
                  return (
                    <React.Fragment key={offering.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleExpand(offering.id)}
                              className="p-1 rounded hover:bg-gray-150 text-gray-500 transition-colors"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {offering.service_image ? (
                              <img
                                src={offering.service_image}
                                alt={offering.service_name}
                                className="w-10 h-10 rounded-md object-cover border border-gray-200 bg-gray-50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                {offering.service_name}
                              </p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                ID: {offering.id.split("-")[0]}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div>{offering.category_name}</div>
                          <div className="text-xs text-gray-400 capitalize">
                            {offering.pricing_type} rate
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="font-medium text-gray-900">
                            ₹{parseFloat(offering.price).toLocaleString("en-IN")}
                          </div>
                          <div className="text-xs text-gray-500">
                            MOQ: {offering.moq} unit(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(offering.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const statusLower = (offering.service_status || "").toLowerCase();
                            const isApproved = statusLower === "approved" || statusLower === "active" || (offering.is_active && statusLower !== "rejected");
                            const isRejected = statusLower === "rejected";

                            let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                            let badgeLabel = "Service: pending";

                            if (isApproved) {
                              badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                              badgeLabel = "Service: active";
                            } else if (isRejected) {
                              badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                              badgeLabel = "Service: rejected";
                            }

                            return (
                              <div className="flex flex-col items-start gap-1">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>{badgeLabel}</span>
                                {offering.modification_status === "pending" && <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Edit: under approval</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDeleteOffering(offering.id)}
                              title="Delete Offering"
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/services/view/${offering.id}`}
                              title="View Details"
                              className="p-1.5 rounded-lg border border-gray-250 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => router.push(`/services/edit/${offering.id}`)}
                              title="Edit Service"
                              disabled={offering.modification_status === "pending"}
                              className="p-1.5 rounded-lg border border-gray-250 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable offering details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600 p-2">
                              <div>
                                <p className="font-semibold text-gray-700 uppercase tracking-wider mb-1">Offering Info</p>
                                <p><strong>Service ID:</strong> {offering.service_id}</p>
                                <p><strong>Pricing Type:</strong> <span className="capitalize">{offering.pricing_type} rate</span></p>
                                <p><strong>Min Order Qty (MOQ):</strong> {offering.moq} unit(s)</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 uppercase tracking-wider mb-1">Metrics</p>
                                <p><strong>Total Bookings:</strong> {offering.booking_count} bookings</p>
                                <p><strong>Created on:</strong> {new Date(offering.created_at).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 uppercase tracking-wider mb-1">Market Status</p>
                                <p>
                                  <strong>Global Status:</strong>{" "}
                                  <span className="capitalize text-emerald-700 font-medium">{offering.service_status}</span>
                                </p>
                                <p><strong>Your Offering is:</strong> {offering.is_active ? "Active" : "Inactive"}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && totalResults > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
            <div className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-semibold text-gray-700">{Math.min(indexOfLastItem, totalResults)}</span> of{" "}
              <span className="font-semibold text-gray-700">{totalResults}</span> results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
