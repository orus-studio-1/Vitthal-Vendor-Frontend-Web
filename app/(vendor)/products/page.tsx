"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

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
  name?: string | null;
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

const ProductsPage = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [status, setStatus] = useState("");
  const [vendorCategories, setVendorCategories] = useState<{ code: string; label: string }[]>([]);

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
      if (productType) queryParams.append("productType", productType);
      if (status) queryParams.append("status", status);

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
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch vendor products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorProducts();
  }, [debouncedSearch, category, productType, status]);

  const handleDeleteClick = (id: string) => {
    setSelectedProductId(id);
    setSelectedVariantId(null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProductId) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      let url = `${apiUrl}/api/vendors/product/${selectedProductId}`;
      if (selectedVariantId) {
        url += `?productVariantId=${selectedVariantId}`;
      }
      const response = await fetch(
        url,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        if (selectedVariantId) {
          // Remove only that variant from the product's variants list
          setProducts(products.map(p => {
            if (p.product_id === selectedProductId) {
              return {
                ...p,
                variants: p.variants.filter(v => v.product_variant_id !== selectedVariantId)
              };
            }
            return p;
          }).filter(p => p.variants.length > 0)); // If no variants left, remove product row entirely
        } else {
          setProducts(products.filter((p) => p.product_id !== selectedProductId));
        }
        setDeleteModalOpen(false);
        setSelectedProductId(null);
        setSelectedVariantId(null);
      } else {
        alert(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Products
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/products/stocks"
            className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium shadow-sm w-full sm:w-auto"
          >
            Manage Stocks & Prices
          </Link>
          <Link
            href="/products/add"
            className="inline-flex items-center justify-center bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium shadow-sm w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-24 z-40 bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 min-w-[140px] transition-all duration-200"
            >
              <option value="">All Categories</option>
              {vendorCategories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 min-w-[140px] transition-all duration-200"
            >
              <option value="">Product Type</option>
              <option value="hdpe">HDPE</option>
              <option value="pet">PET</option>
              <option value="aluminum">Aluminum</option>
              <option value="steel">Steel</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
                <th className="px-6 py-3 whitespace-nowrap">Product</th>
                <th className="px-6 py-3 whitespace-nowrap">Category</th>
                <th className="px-6 py-3 whitespace-nowrap">Stock & Price</th>
                <th className="px-6 py-3 whitespace-nowrap">Date Added</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-gray-500"
                  >
                    Loading your products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-50 p-4 rounded-full mb-4 border border-gray-100">
                        <Filter className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900 mb-1">
                        No products found
                      </p>
                      <p className="text-gray-500 mb-6">
                        Get started by adding a new product to your catalog or
                        change filters.
                      </p>
                      <Link
                        href="/products/add"
                        className="text-sm bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-md hover:bg-gray-50 transition-colors font-medium shadow-sm inline-flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isExpanded = !!expandedProductIds[product.product_id];
                  const prices = product.variants ? product.variants.map((v) => Number(v.price)) : [];
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                  const priceRange = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
                  const totalStock = product.variants ? product.variants.reduce((sum, v) => sum + Number(v.stock_quantity), 0) : 0;
                  const activeVariantsCount = product.variants ? product.variants.filter(v => v.is_active && v.status === 'active').length : 0;

                  return (
                    <React.Fragment key={product.product_id}>
                      <tr className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleExpand(product.product_id)}
                              className="p-1 rounded hover:bg-gray-150 text-gray-500 transition-colors"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            {product.primary_image ? (
                              <img
                                src={product.primary_image}
                                alt={product.product_name}
                                className="w-10 h-10 rounded-md object-cover border border-gray-200 bg-gray-50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                {product.product_name}
                              </p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                ID: {product.product_id.split("-")[0]}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div>{product.category}</div>
                          <div className="text-xs text-gray-400">
                            {product.product_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="font-medium text-gray-900">
                            {priceRange}
                          </div>
                          <div className="text-xs text-gray-500">
                            {totalStock} in stock ({product.variants?.length || 0} variations)
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(product.created_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                product.approval_status === "approved"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : product.approval_status === "rejected"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              Product: {product.approval_status || "pending"}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {activeVariantsCount} / {product.variants?.length || 0} active listings
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/products/view/${product.product_id}`}
                              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                              title="View Analytics"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/products/edit/${product.product_id}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                              title="Edit product variants"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedProductId(product.product_id);
                                setSelectedVariantId(null);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                              title="Delete catalog product mapping"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && product.variants && product.variants.length > 0 && (
                        <tr className="bg-gray-50/30">
                          <td colSpan={6} className="px-10 py-3.5 bg-zinc-50/40">
                            <div className="overflow-hidden border border-gray-150 rounded-xl bg-white shadow-xs">
                              <table className="min-w-full divide-y divide-gray-150 text-xs">
                                <thead className="bg-gray-50/70 font-semibold text-gray-500 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-6 py-2.5 text-left">Variant Dimensions</th>
                                    <th className="px-6 py-2.5 text-left">SKU</th>
                                    <th className="px-6 py-2.5 text-left">Price (₹)</th>
                                    <th className="px-6 py-2.5 text-left">MOQ</th>
                                    <th className="px-6 py-2.5 text-left">Stock</th>
                                    <th className="px-6 py-2.5 text-left">Listing Status</th>
                                    <th className="px-6 py-2.5 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                  {product.variants.map((v) => {
                                    const variantProperties = v.name || Object.entries(v.properties || {})
                                      .map(([key, val]) => `${key}: ${val}`)
                                      .join(", ") || "Default / Standard";
                                    return (
                                      <tr key={v.product_variant_id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-3 font-semibold text-gray-800">{variantProperties}</td>
                                        <td className="px-6 py-3 font-mono">{v.sku || "-"}</td>
                                        <td className="px-6 py-3 font-semibold text-gray-900">
                                          ₹{v.price}
                                          {v.pending_price !== null && v.pending_price !== undefined && (
                                            <span className="block text-[10px] text-amber-600 font-normal">
                                              (Pending: ₹{v.pending_price})
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-6 py-3">{v.moq}</td>
                                        <td className="px-6 py-3">{v.stock_quantity}</td>
                                        <td className="px-6 py-3">
                                          <div className="flex flex-col items-start gap-1">
                                            <span
                                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                v.is_active && v.status === "active"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  : "bg-gray-50 text-gray-600 border-gray-200"
                                              }`}
                                            >
                                              {v.is_active && v.status === "active" ? "Active" : "Inactive"}
                                            </span>
                                            {v.status !== "active" && (
                                              <span className="text-[10px] text-amber-600 font-medium italic">
                                                ({v.status === "waiting" ? "pending approval" : v.status})
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <Link
                                              href={`/products/edit/${product.product_id}`}
                                              className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                              Edit
                                            </Link>
                                            <button
                                              onClick={() => {
                                                setSelectedProductId(product.product_id);
                                                setSelectedVariantId(v.product_variant_id);
                                                setDeleteModalOpen(true);
                                              }}
                                              className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
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

        {/* Pagination */}
        {products.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <p className="text-gray-500 text-sm">
              Showing <span className="font-medium text-gray-900">1</span> to{" "}
              <span className="font-medium text-gray-900">
                {products.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">
                {products.length}
              </span>{" "}
              results
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                disabled
              >
                Previous
              </button>
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Remove Product
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to stop selling this product? This action
                cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? "Removing..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
