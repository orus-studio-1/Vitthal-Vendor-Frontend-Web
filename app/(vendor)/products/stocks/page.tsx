"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowLeft,
  Save,
  Check,
  Loader2,
  Package,
  Info,
  Lock,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type VendorProductVariant = {
  vendor_product_id: string;
  product_variant_id: string;
  price: number;
  pending_price?: number | null;
  moq: number;
  stock_quantity: number;
  is_active: boolean; // status
  status: string; // vendor_product_status
  gst_percentage?: number;
  properties: Record<string, string>;
  sku?: string | null;
};

type VendorProduct = {
  product_id: string;
  product_name: string;
  primary_image?: string;
  category: string;
  product_type: string;
  created_date: string;
  approval_status?: string;
  approval_notes?: string | null;
  variants: VendorProductVariant[];
};

type DraftValues = {
  price: string;
  moq: string;
  stock_quantity: string;
  is_active: boolean;
};

const StocksPage = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [vendorCategories, setVendorCategories] = useState<{ code: string; label: string }[]>([]);

  // Drafts state for inline inputs
  const [drafts, setDrafts] = useState<Record<string, DraftValues>>({});

  useEffect(() => {
    const fetchVendorCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
        const response = await fetch(
          `${apiUrl}/api/vendors/getVendorCategories`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "vendor",
            },
          }
        );
        const data = await response.json();
        if (response.ok && data.data) {
          setVendorCategories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch vendor categories:", error);
      }
    };
    fetchVendorCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append("search", debouncedSearch);
      if (category) queryParams.append("category", category);

      const response = await fetch(
        `${apiUrl}/api/products/getVendorProducts?${queryParams.toString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        },
      );
      const data = await response.json();
      if (response.ok && data.data) {
        const items = data.data as VendorProduct[];
        setProducts(items);

        // Initialize drafts
        const newDrafts: Record<string, DraftValues> = {};
        items.forEach((p) => {
          if (p.variants) {
            p.variants.forEach((v) => {
              newDrafts[v.product_variant_id] = {
                price: v.price.toString(),
                moq: (v.moq || 1).toString(),
                stock_quantity: (v.stock_quantity || 0).toString(),
                is_active: v.is_active,
              };
            });
          }
        });
        setDrafts(newDrafts);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorProducts();
  }, [debouncedSearch, category]);

  const handleInputChange = (
    variantId: string,
    field: keyof DraftValues,
    value: string | boolean
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }));
  };

  const isRowDirty = (variant: VendorProductVariant) => {
    const draft = drafts[variant.product_variant_id];
    if (!draft) return false;

    return (
      draft.price !== variant.price.toString() ||
      draft.moq !== variant.moq.toString() ||
      draft.stock_quantity !== variant.stock_quantity.toString() ||
      draft.is_active !== variant.is_active
    );
  };

  const handleSaveRow = async (productId: string, variant: VendorProductVariant) => {
    const draft = drafts[variant.product_variant_id];
    if (!draft) return;

    // Validation
    const parsedPrice = parseFloat(draft.price);
    const parsedMoq = parseInt(draft.moq);
    const parsedStock = parseInt(draft.stock_quantity);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Price must be a positive number");
      return;
    }
    if (isNaN(parsedMoq) || parsedMoq <= 0) {
      toast.error("MOQ must be greater than 0");
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Stock quantity must be 0 or more");
      return;
    }

    setSavingId(variant.product_variant_id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      
      const payload = {
        price: parsedPrice,
        moq: parsedMoq,
        stockQuantity: parsedStock,
        isActive: draft.is_active,
        quotationEnabled: false, // Maintain existing default
        gstPercentage: variant.gst_percentage,
        productVariantId: variant.product_variant_id
      };

      const response = await fetch(
        `${apiUrl}/api/products/vendor/product/${productId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Updated successfully");
        // Reload products to fetch latest DB values (e.g. pending_price)
        await fetchVendorProducts();
      } else {
        toast.error(data.message || "Failed to update listing details");
      }
    } catch (error) {
      console.error("Failed to save vendor product details:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto text-sm bg-gray-50/50 min-h-screen">
      {/* Navigation & Title */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Manage Stocks & Prices
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Instantly adjust stock levels, MOQ, and toggle active states. Price edits require admin review.
            </p>
          </div>
        </div>
        <button
          onClick={fetchVendorProducts}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Info Warning Alert */}
      <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <p className="font-semibold text-blue-900">Immediate Storefront Updates</p>
          <p className="text-xs text-blue-700 mt-1">
            Modifications to Stock Levels, MOQ, and Active Toggles reflect immediately to buyers. 
            However, editing the price of an already active listing will create a pending request. The existing price remains visible on the store until approved.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 min-w-[160px] transition-all duration-200"
          >
            <option value="">All Categories</option>
            {vendorCategories.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4 w-44">Price (₹)</th>
                <th className="px-6 py-4 w-32">MOQ</th>
                <th className="px-6 py-4 w-36">Stock Level</th>
                <th className="px-6 py-4 w-32">Listing State</th>
                <th className="px-6 py-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading products stock sheet...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <React.Fragment key={product.product_id}>
                    {/* Parent Product Header Row */}
                    <tr className="bg-gray-100/50 border-b border-gray-200">
                      <td colSpan={6} className="px-6 py-3 font-semibold text-gray-800 text-sm">
                        <div className="flex items-center gap-3">
                          {product.primary_image ? (
                            <img
                              src={product.primary_image}
                              alt={product.product_name}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 bg-gray-50"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-gray-950">{product.product_name}</span>
                            <span className="text-xs text-gray-400 ml-2">({product.category} • {product.product_type})</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Variants Sub-Rows */}
                    {product.variants && product.variants.map((variant) => {
                      const draft = drafts[variant.product_variant_id];
                      const dirty = isRowDirty(variant);
                      const isSaving = savingId === variant.product_variant_id;
                      const isApprovedListing = variant.status === "active";
                      const variantProperties = Object.entries(variant.properties || {})
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(", ") || "Default / Standard";

                      return (
                        <tr
                          key={variant.product_variant_id}
                          className={`hover:bg-gray-50/40 transition-colors border-b border-gray-150 ${
                            !isApprovedListing ? "bg-zinc-50/10" : ""
                          }`}
                        >
                          <td className="px-6 py-4 pl-12">
                            <div>
                              <p className="font-semibold text-gray-850">{variantProperties}</p>
                              {variant.sku && <p className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {variant.sku}</p>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="relative rounded-md shadow-xs">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none select-none">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  value={draft?.price ?? ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      variant.product_variant_id,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                              {variant.pending_price !== null &&
                                variant.pending_price !== undefined && (
                                  <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 self-start">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                    <span>Pending: ₹{variant.pending_price}</span>
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={draft?.moq ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  variant.product_variant_id,
                                  "moq",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                              min="1"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={draft?.stock_quantity ?? ""}
                              onChange={(e) =>
                                handleInputChange(
                                  variant.product_variant_id,
                                  "stock_quantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                              min="0"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              {isApprovedListing ? (
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={draft?.is_active ?? false}
                                    onChange={(e) =>
                                      handleInputChange(
                                        variant.product_variant_id,
                                        "is_active",
                                        e.target.checked
                                      )
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                              ) : (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[11px] font-medium">
                                  <Lock className="w-3 h-3" />
                                  <span>Needs Approval</span>
                                </div>
                              )}
                              {isApprovedListing && (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    variant.is_active
                                      ? "text-emerald-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {variant.is_active ? "Visible" : "Hidden"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isSaving ? (
                              <div className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                              </div>
                            ) : dirty ? (
                              <button
                                onClick={() => handleSaveRow(product.product_id, variant)}
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs hover:shadow-sm"
                                title="Save changes"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-300 select-none">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StocksPage;
