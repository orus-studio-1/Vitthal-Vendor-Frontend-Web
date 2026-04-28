"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Search, Check, Plus, Tag, Package, Banknote } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Define types for data
type ProductResult = {
  product_id: string;
  product_name: string;
  category: string;
  product_type: string;
  primary_image?: string;
};

export default function AddProductPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  
  // Vendor states
  const [price, setPrice] = useState('');
  const [moq, setMoq] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  // Debounced search effect connected to DB
  useEffect(() => {
    if (searchQuery.length > 2 && !selectedProduct && !isCreatingNew) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`http://localhost:9000/api/products/getProductByName?name=${encodeURIComponent(searchQuery)}`, {
            credentials: 'include'
          });
          const data = await res.json();
          if (res.ok && data.data) {
            setSearchResults(data.data);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Failed to search products:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedProduct, isCreatingNew]);

  const handleSelectProduct = (product: ProductResult) => {
    setSelectedProduct(product);
    setSearchQuery(product.product_name);
    setSearchResults([]);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedProduct(null);
    setSearchResults([]);
    setProductName(searchQuery); // Pre-fill name with what they searched
  };

  const resetSelection = () => {
    setIsCreatingNew(false);
    setSelectedProduct(null);
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    if (!price || !moq || !stockQuantity) {
      toast.error("Please fill out all pricing and stock fields!");
      return;
    }

    setIsSaving(true);
    try {
      let finalProductId = selectedProduct?.product_id;

      // 1. Create global product if new
      if (isCreatingNew) {
        if (!productName || !category || !productType) {
          toast.error("Please fill out all required global product details!");
          setIsSaving(false);
          return;
        }

        const prodRes = await fetch("http://localhost:9000/api/products/addProduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: productName,
            description,
            category,
            productType,
            specifications: "{}"
          })
        });

        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(prodData.message || "Failed to create product");
        finalProductId = prodData.result.id;
      }

      // 2. Add vendor product link (pricing & stock)
      const vendorRes = await fetch("http://localhost:9000/api/products/addVendorProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: finalProductId,
          price: Number(price),
          moq: Number(moq),
          stockQuantity: Number(stockQuantity)
        })
      });

      const vendorData = await vendorRes.json();
      if (!vendorRes.ok) throw new Error(vendorData.message || "Failed to save vendor details");

      toast.success("Product published successfully!");
      window.location.href = "/products"; // redirect to products list
      
    } catch (error: any) {
      toast.error("Error: " + error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto text-sm pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/products" 
          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Add Product to Sell</h1>
          <p className="text-gray-500 mt-1">Search for an existing product or create a new one.</p>
        </div>
      </div>

      {/* Step 1: Find or Create */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6 relative z-20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: What are you selling?</h2>
        
        {!selectedProduct && !isCreatingNew ? (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing the product name (e.g. Plastic Pellets)..." 
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-base transition-all"
            />
            
            {/* Search Results Dropdown */}
            {searchQuery.length > 2 && (
              <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
                {isSearching ? (
                  <div className="p-6 text-center text-gray-500 animate-pulse">Searching catalog...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map(result => (
                        <button
                          key={result.product_id}
                          onClick={() => handleSelectProduct(result)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {result.primary_image ? (
                              <img src={result.primary_image} alt={result.product_name} className="w-12 h-12 rounded object-cover border border-gray-200" />
                            ) : (
                              <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 text-base">{result.product_name}</p>
                              <p className="text-sm text-gray-500">{result.category} • {result.product_type}</p>
                            </div>
                          </div>
                          <span className="text-blue-600 text-sm font-medium px-3 py-1 bg-blue-50 rounded-full">Select</span>
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-600">Can't find your specific product?</p>
                      <button onClick={handleCreateNew} className="text-gray-900 font-semibold text-sm hover:underline flex items-center bg-white px-3 py-1.5 border border-gray-300 rounded shadow-sm">
                        <Plus className="w-4 h-4 mr-1" /> Add New
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold text-lg mb-1">No products found</p>
                    <p className="text-gray-500 mb-6 text-sm">We couldn't find a product matching "{searchQuery}" in our catalog.</p>
                    <button onClick={handleCreateNew} className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      Create "{searchQuery}" as New Product
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-emerald-800 font-medium mb-0.5">{isCreatingNew ? "Creating New Product" : "Selected Product"}</p>
                <p className="text-emerald-950 font-bold text-lg">{isCreatingNew ? (productName || "New Custom Product") : selectedProduct?.product_name}</p>
              </div>
            </div>
            <button onClick={resetSelection} className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded shadow-sm hover:bg-emerald-100 text-sm font-medium transition-colors">
              Change Product
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Product & Vendor Details */}
      {(selectedProduct || isCreatingNew) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* If creating new, show global product fields */}
          {isCreatingNew && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Step 2: Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Product Name *</label>
                    <input 
                      type="text" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                    <textarea 
                      rows={3} 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900" 
                      placeholder="Brief description of the product..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Category *</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="plastic">Plastic</option>
                    <option value="metal">Metal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Product Type *</label>
                  <select 
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="hdpe">HDPE</option>
                    <option value="pet">PET</option>
                    <option value="aluminum">Aluminum</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Upload Product Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">Click to upload images</p>
                    <p className="text-sm text-gray-500 mt-1">Supported formats: JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vendor Pricing & Stock */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {isCreatingNew ? "Step 3: Your Selling Price & Stock" : "Step 2: Your Selling Price & Stock"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Selling Price (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Banknote className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Your price per unit</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Minimum Order (MOQ) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    min="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    placeholder="1"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Minimum units a buyer must buy</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Available Stock *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-medium" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Total units available right now</p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-4 mt-8">
            <Link 
              href="/products" 
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium text-base"
            >
              Cancel
            </Link>
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-8 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-500 transition-colors font-medium shadow-md text-base"
            >
              {isSaving ? "Publishing..." : "Save & Publish Listing"}
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}
