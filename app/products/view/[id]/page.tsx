"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Banknote, Tag, Calendar, Check, X, ImageOff, Edit, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  specifications: Record<string, unknown>;
  vendor_product_id: string;
  price: number;
  moq: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
}

export default function ViewProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const response = await fetch(`${apiUrl}/api/vendors/product/${productId}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.data) {
        setProduct(data.data);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const response = await fetch(`${apiUrl}/api/vendors/product/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Product removed from your catalog");
        router.push('/products');
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const primaryImage = product?.images?.find(img => img.is_primary)?.image_url || product?.images?.[0]?.image_url;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or you don't have access to it.</p>
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{product.product_name}</h1>
            <p className="text-gray-500 mt-1">View product details and performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/products/edit/${productId}`}
            className="inline-flex items-center justify-center bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Remove from catalog"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
        {primaryImage ? (
          <div className="relative h-64 sm:h-80 w-full bg-gray-50">
            <img
              src={primaryImage}
              alt={product.product_name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="h-64 sm:h-80 w-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <ImageOff className="w-16 h-16 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">No product image available</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Info Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Category</p>
            <p className="font-medium text-gray-900 capitalize">{product.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Product Type</p>
            <p className="font-medium text-gray-900 capitalize">{product.product_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              product.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}>
              {product.is_active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Added On</p>
            <p className="font-medium text-gray-900">{new Date(product.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {product.description && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Description</p>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Banknote className="w-4 h-4" />
              <span className="text-sm">Selling Price</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{product.price}</p>
            <p className="text-xs text-gray-500 mt-1">per unit</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">Minimum Order</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{product.moq}</p>
            <p className="text-xs text-gray-500 mt-1">units minimum</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Tag className="w-4 h-4" />
              <span className="text-sm">Available Stock</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{product.stock_quantity}</p>
            <p className="text-xs text-gray-500 mt-1">units in stock</p>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-gray-900">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Images */}
      {product.images && product.images.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={img.image_url}
                  alt={`${product.product_name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.is_primary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-xs rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Product</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove &quot;{product.product_name}&quot; from your catalog? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}