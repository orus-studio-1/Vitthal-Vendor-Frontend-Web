"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  Banknote,
  Tag,
  Save,
  X,
  ImageOff,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface ProductImage {
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface VendorProduct {
  product_id: string;
  product_name: string;
  description: string;
  category: string;
  product_type: string;
  material?: string;
  grade?: string;
  application?: string;
  standard?: string;
  specifications: Record<string, unknown>;
  price: number;
  moq: number;
  stock_quantity: number;
  quotation_enabled?: boolean;
  quotation_min_qty?: number | null;
  quotation_limit?: number | null;
  vendor_can_set_quotation_limit?: boolean;
  is_active: boolean;
  status: string;
  vendor_product_created_at: string;
  vendor_product_updated_at: string;
  images: ProductImage[];
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [quotationEnabled, setQuotationEnabled] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const response = await fetch(
        `${apiUrl}/api/products/vendor/product/${productId}`,
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
        const prod = data.data;
        setProduct(prod);
        setPrice(prod.price.toString());
        setMoq(prod.moq.toString());
        setStockQuantity(prod.stock_quantity.toString());
        setIsActive(prod.is_active);
        setQuotationEnabled(Boolean(prod.quotation_enabled));
      } else {
        toast.error(data.message || "Failed to fetch product");
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const response = await fetch(
        `${apiUrl}/api/products/vendor/product/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          credentials: "include",
          body: JSON.stringify({
            price: Number(price),
            moq: Number(moq),
            stockQuantity: Number(stockQuantity),
            isActive,
            quotationEnabled,
            quotationMinQty: null,
          }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Product updated successfully!");
        router.push(`/products/view/${productId}`);
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  const primaryImage =
    product?.images?.find((img) => img.is_primary)?.image_url ||
    product?.images?.[0]?.image_url;

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

  if (!product) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The product you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-2.5 rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
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
            href={`/products/view/${productId}`}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Edit Product
            </h1>
            <p className="text-gray-500 mt-1">
              Update pricing, stock, and availability
            </p>
          </div>
        </div>
        <Link
          href={`/products/view/${productId}`}
          className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Product
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Preview Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Product Details
          </h2>
          <div className="flex items-start gap-4">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.product_name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-gray-50"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {product.product_name}
              </h3>
              <p className="text-gray-500 text-sm mt-0.5">
                {product.category} • {product.product_type}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                ID: {product.product_id.split("-")[0]}
              </p>
            </div>
          </div>

          {product.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <MarkdownRenderer
                content={product.description}
                className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Status Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Product Status
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-emerald-100" : "bg-gray-200"}`}
              >
                {isActive ? (
                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {isActive ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-gray-500">
                  {isActive
                    ? "Product is visible to buyers"
                    : "Product is hidden from buyers"}
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

        {/* Pricing & Stock */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Pricing & Stock
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Banknote className="h-5 w-5 text-gray-400" />
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
              <p className="text-xs text-gray-500 mt-1.5">
                Your price per unit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Minimum Order (MOQ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium"
                  placeholder="1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Minimum units a buyer must buy
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Available Stock <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Total units available right now
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Participate in quotation deals</p>
                <p className="text-xs text-gray-500">
                  {product.quotation_limit
                    ? `This product requires quotation for orders of ${product.quotation_limit}+ units. Enable to receive quotation requests.`
                    : "No quotation limit set for this product. Contact admin to enable quotation flow."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuotationEnabled((prev) => !prev)}
                disabled={!product.quotation_limit}
                className="text-gray-700 disabled:opacity-40"
                aria-pressed={quotationEnabled}
              >
                {quotationEnabled ? (
                  <ToggleRight className="h-7 w-7 text-emerald-600" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-gray-400" />
                )}
              </button>
            </div>

            {product.quotation_limit && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                <p className="text-sm font-medium text-blue-900">Product Quotation Limit</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Orders of <strong>{product.quotation_limit}+</strong> units require quotation negotiation.
                  {quotationEnabled && Number(stockQuantity) < product.quotation_limit && (
                    <span className="block mt-1 text-amber-700 font-medium">
                      ⚠️ Your stock ({stockQuantity}) is below the quotation limit. Increase stock to receive quotation requests.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Specifications (Read-only) */}
        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-500 capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-gray-900">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Contact admin to modify product specifications
              </p>
            </div>
          )}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Link
            href={`/products/view/${productId}`}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium text-base"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-500 transition-colors font-medium shadow-md text-base inline-flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
