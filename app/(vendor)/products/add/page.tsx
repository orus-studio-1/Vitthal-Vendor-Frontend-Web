"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  X,
  Search,
  Check,
  Plus,
  Tag,
  Package,
  Banknote,
  Bold,
  Italic,
  List,
  ListOrdered,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/markdown-renderer";

// Define types for data
type ProductResult = {
  product_id: string;
  product_name: string;
  category: string;
  product_type: string;
  primary_image?: string;
};

type ProductDetail = ProductResult & {
  description?: string;
  specifications?: Record<string, unknown>;
  images?: Array<{
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  vendors?: Array<{
    vendor_id: string;
    company_name: string;
    price: number;
    moq: number;
    stock_quantity: number;
  }>;
};

type VendorCategory = {
  code: string;
  label: string;
};

type SpecificationDraft = {
  id: string;
  key: string;
  value: string;
};

type MarkdownAction =
  | "bold"
  | "italic"
  | "bullet"
  | "ordered"
  | "heading1"
  | "heading2"
  | "heading3"
  | "quote";

type MarkdownEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    message:
      text && !text.trim().startsWith("<!DOCTYPE")
        ? text
        : `Unexpected non-JSON response from ${response.url || "server"}`,
  };
}

function replaceRange(
  value: string,
  start: number,
  end: number,
  replacement: string,
) {
  return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}

function createSpecificationDraft(): SpecificationDraft {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `spec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    key: "",
    value: "",
  };
}

function getSelectedLineRange(value: string, start: number, end: number) {
  const selectionStart = Math.min(start, end);
  const selectionEnd = Math.max(start, end);
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const endAnchor = selectionEnd > selectionStart ? selectionEnd - 1 : selectionStart;
  const lineBreakIndex = value.indexOf("\n", endAnchor);
  const lineEnd = lineBreakIndex === -1 ? value.length : lineBreakIndex;

  return {
    lineStart,
    lineEnd,
    selectionStart,
    selectionEnd,
  };
}

function applyInlineWrapper(
  value: string,
  start: number,
  end: number,
  wrapper: string,
  placeholder: string,
) {
  const selectedText = value.slice(start, end);
  const hasSelection = selectedText.length > 0;
  const isWrapped =
    hasSelection &&
    selectedText.startsWith(wrapper) &&
    selectedText.endsWith(wrapper) &&
    selectedText.length >= wrapper.length * 2;

  if (isWrapped) {
    const unwrappedText = selectedText.slice(wrapper.length, -wrapper.length);
    return {
      value: replaceRange(value, start, end, unwrappedText),
      selectionStart: start,
      selectionEnd: start + unwrappedText.length,
    } satisfies MarkdownEditResult;
  }

  const content = hasSelection ? selectedText : placeholder;
  const replacement = `${wrapper}${content}${wrapper}`;

  return {
    value: replaceRange(value, start, end, replacement),
    selectionStart: start + wrapper.length,
    selectionEnd: start + wrapper.length + content.length,
  } satisfies MarkdownEditResult;
}

function applyLinePrefix(
  value: string,
  start: number,
  end: number,
  options: {
    prefix: string;
    prefixPattern: RegExp;
    removalPattern: RegExp;
    placeholderLabel?: string;
  },
) {
  const { lineStart, lineEnd, selectionStart, selectionEnd } = getSelectedLineRange(
    value,
    start,
    end,
  );
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const meaningfulLines = lines.filter((line) => line.trim().length > 0);
  const shouldRemovePrefix =
    meaningfulLines.length > 0 &&
    meaningfulLines.every((line) => options.prefixPattern.test(line.trimStart()));

  const nextLines = lines.map((line, index) => {
    if (!line.trim()) {
      return line;
    }

    const trimmedStart = line.trimStart();
    const indent = line.slice(0, line.length - trimmedStart.length);
    const stripped = trimmedStart.replace(options.removalPattern, "");

    if (shouldRemovePrefix) {
      return `${indent}${stripped}`;
    }

    const prefix = options.prefix === "1. " ? `${index + 1}. ` : options.prefix;
    return `${indent}${prefix}${stripped}`;
  });

  const replacement = nextLines.join("\n");
  const hasCollapsedSelection = selectionStart === selectionEnd;

  return {
    value: replaceRange(value, lineStart, lineEnd, replacement),
    selectionStart: hasCollapsedSelection
      ? lineStart + (shouldRemovePrefix ? 0 : options.prefix.length)
      : lineStart,
    selectionEnd: hasCollapsedSelection ? lineStart + replacement.length : lineStart + replacement.length,
  } satisfies MarkdownEditResult;
}

function applyHeadingLevel(
  value: string,
  start: number,
  end: number,
  level: 1 | 2 | 3,
) {
  const headingPrefix = `${"#".repeat(level)} `;
  const { lineStart, lineEnd, selectionStart, selectionEnd } = getSelectedLineRange(
    value,
    start,
    end,
  );
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const meaningfulLines = lines.filter((line) => line.trim().length > 0);
  const sameHeading =
    meaningfulLines.length > 0 &&
    meaningfulLines.every((line) => line.trimStart().startsWith(headingPrefix));

  const nextLines = lines.map((line) => {
    if (!line.trim()) {
      return line;
    }

    const trimmedStart = line.trimStart();
    const indent = line.slice(0, line.length - trimmedStart.length);
    const stripped = trimmedStart.replace(/^#{1,3}\s+/, "");

    if (sameHeading) {
      return `${indent}${stripped}`;
    }

    return `${indent}${headingPrefix}${stripped}`;
  });

  const replacement = nextLines.join("\n");

  return {
    value: replaceRange(value, lineStart, lineEnd, replacement),
    selectionStart: selectionStart === selectionEnd ? lineStart + headingPrefix.length : lineStart,
    selectionEnd: selectionStart === selectionEnd ? lineStart + replacement.length : lineStart + replacement.length,
  } satisfies MarkdownEditResult;
}

function transformMarkdown(
  value: string,
  start: number,
  end: number,
  action: MarkdownAction,
) {
  if (action === "bold") {
    return applyInlineWrapper(value, start, end, "**", "bold text");
  }

  if (action === "italic") {
    return applyInlineWrapper(value, start, end, "*", "italic text");
  }

  if (action === "bullet") {
    return applyLinePrefix(value, start, end, {
      prefix: "- ",
      prefixPattern: /^[-*]\s+/, 
      removalPattern: /^[-*]\s+/, 
    });
  }

  if (action === "ordered") {
    return applyLinePrefix(value, start, end, {
      prefix: "1. ",
      prefixPattern: /^\d+\.\s+/, 
      removalPattern: /^\d+\.\s+/, 
    });
  }

  if (action === "heading1") {
    return applyHeadingLevel(value, start, end, 1);
  }

  if (action === "heading2") {
    return applyHeadingLevel(value, start, end, 2);
  }

  if (action === "heading3") {
    return applyHeadingLevel(value, start, end, 3);
  }

  return applyLinePrefix(value, start, end, {
    prefix: "> ",
    prefixPattern: /^>\s?/, 
    removalPattern: /^>\s?/, 
  });
}

export default function AddProductPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(
    null,
  );
  const [productPreview, setProductPreview] = useState<ProductDetail | null>(
    null,
  );
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allowedCategories, setAllowedCategories] = useState<VendorCategory[]>(
    [],
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [specifications, setSpecifications] = useState<SpecificationDraft[]>([
    createSpecificationDraft(),
  ]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [grade, setGrade] = useState("");
  const [material, setMaterial] = useState("");
  const [application, setApplication] = useState("");
  const [standard, setStandard] = useState("");
  const descriptionRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Vendor states
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [quotationEnabled, setQuotationEnabled] = useState(false);
  const toolbarButtonClass =
    "inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100";

  useEffect(() => {
    const fetchVendorCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(`${apiBase}/api/vendors/getVendorCategories`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        });

        const data = await parseApiResponse(res);
        if (res.ok && Array.isArray(data.data)) {
          setAllowedCategories(data.data);
        } else {
          setAllowedCategories([]);
        }
      } catch (error) {
        console.error("Failed to load vendor categories:", error);
        setAllowedCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchVendorCategories();
  }, [apiBase]);

  // Debounced search effect connected to DB
  useEffect(() => {
    if (searchQuery.length > 2 && !selectedProduct && !isCreatingNew) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `${apiBase}/api/products/getProductByName?name=${encodeURIComponent(searchQuery)}`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "x-request-from": "vendor",
              },
            },
          );
          const data = await parseApiResponse(res);
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

  const fetchProductPreview = async (productId: string) => {
    setIsPreviewLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/products/getProductById/${productId}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        },
      );

      const data = await parseApiResponse(res);
      if (res.ok && data.data) {
        setProductPreview(data.data);
      } else {
        setProductPreview(null);
      }
    } catch (error) {
      console.error("Failed to fetch product preview:", error);
      setProductPreview(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectProduct = async (product: ProductResult) => {
    // Check if the product category is allowed for this vendor
    const categoryIsAllowed = allowedCategories.some(
      (allowedCategory) =>
        allowedCategory.code.toLowerCase() === product.category.toLowerCase() ||
        allowedCategory.label.toLowerCase() === product.category.toLowerCase(),
    );

    if (allowedCategories.length > 0 && !categoryIsAllowed) {
      toast.error("You can only add products from your assigned categories. Please select a product from your allowed categories.");
      return;
    }

    setSelectedProduct(product);
    setSearchQuery(product.product_name);
    setSearchResults([]);
    setIsCreatingNew(false);
    await fetchProductPreview(product.product_id);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedProduct(null);
    setSearchResults([]);
    setProductName(searchQuery); // Pre-fill name with what they searched
    setProductPreview(null);
    setSpecifications([createSpecificationDraft()]);
  };

  const resetSelection = () => {
    setIsCreatingNew(false);
    setSelectedProduct(null);
    setSearchQuery("");
    setProductPreview(null);
    setSpecifications([createSpecificationDraft()]);
    setUploadedImages([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/jpg"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValidType) {
        toast.error(`${file.name} - Invalid format. Use JPG or PNG.`);
      }
      if (!isValidSize) {
        toast.error(`${file.name} - File too large. Max 5MB.`);
      }
      return isValidType && isValidSize;
    });
    setUploadedImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSpecification = (
    index: number,
    field: keyof SpecificationDraft,
    value: string,
  ) => {
    setSpecifications((current) =>
      current.map((specification, currentIndex) =>
        currentIndex === index
          ? { ...specification, [field]: value }
          : specification,
      ),
    );
  };

  const addSpecificationRow = () => {
    setSpecifications((current) => [...current, createSpecificationDraft()]);
  };

  const removeSpecificationRow = (index: number) => {
    setSpecifications((current) =>
      current.length === 1
        ? [createSpecificationDraft()]
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const applyMarkdown = (action: MarkdownAction) => {
    const textarea = descriptionRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const nextState = transformMarkdown(description, start, end, action);
    setDescription(nextState.value);

    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextState.selectionStart, nextState.selectionEnd);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!price || !moq || !stockQuantity) {
      toast.error("Please fill out all pricing and stock fields!");
      return;
    }

    // No local quotation limit validation needed as it's product-global

    // Category validation for existing products
    if (!isCreatingNew && selectedProduct) {
      const categoryIsAllowed = allowedCategories.some(
        (allowedCategory) =>
          allowedCategory.code.toLowerCase() === selectedProduct.category.toLowerCase() ||
          allowedCategory.label.toLowerCase() === selectedProduct.category.toLowerCase(),
      );

      if (allowedCategories.length > 0 && !categoryIsAllowed) {
        toast.error("You can only add products from your assigned categories.");
        return;
      }
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

        const categoryIsAllowed = allowedCategories.some(
          (allowedCategory) =>
            allowedCategory.code.toLowerCase() === category.toLowerCase() ||
            allowedCategory.label.toLowerCase() === category.toLowerCase(),
        );

        if (allowedCategories.length > 0 && !categoryIsAllowed) {
          toast.error("You can only add products from your assigned categories.");
          setIsSaving(false);
          return;
        }

        const specificationPayload = specifications
          .map((specification) => ({
            key: specification.key.trim(),
            value: specification.value.trim(),
          }))
          .filter(
            (specification) => specification.key.length > 0 || specification.value.length > 0,
          );

        const prodRes = await fetch(`${apiBase}/api/products/addProduct`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          credentials: "include",
          body: JSON.stringify({
            name: productName,
            description,
            category,
            productType,
            grade,
            material,
            application,
            standard,
            specifications: specificationPayload,
          }),
        });

        const prodData = await parseApiResponse(prodRes);
        if (!prodRes.ok)
          throw new Error(prodData.message || "Failed to create product");
        finalProductId = prodData.result.id;
      }

      // 2. Add vendor product link (pricing & stock)
      // If vendor added additional specifications for an existing product, submit them first
      if (!isCreatingNew && finalProductId) {
        const specificationPayload = specifications
          .map((specification) => ({ key: specification.key.trim(), value: specification.value.trim() }))
          .filter((s) => s.key.length > 0 || s.value.length > 0);

        if (specificationPayload.length > 0) {
          const specRes = await fetch(`${apiBase}/api/products/addProductSpecifications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "vendor",
            },
            credentials: "include",
            body: JSON.stringify({ productId: finalProductId, specifications: specificationPayload }),
          });
          const specData = await parseApiResponse(specRes);
          if (!specRes.ok) throw new Error(specData.message || "Failed to submit specifications");
        }
      }

      const vendorRes = await fetch(`${apiBase}/api/products/addVendorProduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: finalProductId,
          price: Number(price),
          moq: Number(moq),
          stockQuantity: Number(stockQuantity),
          quotationEnabled,
          quotationMinQty: null,
        }),
      });

      const vendorData = await parseApiResponse(vendorRes);
      if (!vendorRes.ok)
        throw new Error(vendorData.message || "Failed to save vendor details");

      // 3. Upload images if any
      if (uploadedImages.length > 0 && finalProductId) {
        const formData = new FormData();
        formData.append("productId", finalProductId);
        uploadedImages.forEach((image) => {
          formData.append("images", image);
        });

        const imageRes = await fetch(`${apiBase}/api/products/uploadProductImages`, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          },
          body: formData,
        });

        const imageData = await parseApiResponse(imageRes);
        if (!imageRes.ok) {
          console.warn("Failed to upload some images:", imageData.message);
          toast.warning("Product saved but some images failed to upload.");
        }
      }

      toast.success(
        isCreatingNew
          ? "Product submitted successfully. It will appear after admin approval."
          : "Vendor listing saved successfully!",
      );
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
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Add Product to Sell
          </h1>
          <p className="text-gray-500 mt-1">
            Search for an existing product or create a new one.
          </p>
        </div>
      </div>

      {/* Step 1: Find or Create */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6 relative z-20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Step 1: What are you selling?
        </h2>

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
                  <div className="p-6 text-center text-gray-500 animate-pulse">
                    Searching catalog...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.product_id}
                          onClick={() => handleSelectProduct(result)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {result.primary_image ? (
                              <img
                                src={result.primary_image}
                                alt={result.product_name}
                                className="w-12 h-12 rounded object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 text-base">
                                {result.product_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {result.category} • {result.product_type}
                              </p>
                            </div>
                          </div>
                          <span className="text-blue-600 text-sm font-medium px-3 py-1 bg-blue-50 rounded-full">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Can't find your specific product?
                      </p>
                      <button
                        onClick={handleCreateNew}
                        className="text-gray-900 font-semibold text-sm hover:underline flex items-center bg-white px-3 py-1.5 border border-gray-300 rounded shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add New
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold text-lg mb-1">
                      No products found
                    </p>
                    <p className="text-gray-500 mb-6 text-sm">
                      We couldn't find a product matching "{searchQuery}" in our
                      catalog.
                    </p>
                    <button
                      onClick={handleCreateNew}
                      className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
                    >
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
                <p className="text-emerald-800 font-medium mb-0.5">
                  {isCreatingNew ? "Creating New Product" : "Selected Product"}
                </p>
                <p className="text-emerald-950 font-bold text-lg">
                  {isCreatingNew
                    ? productName || "New Custom Product"
                    : selectedProduct?.product_name}
                </p>
              </div>
            </div>
            <button
              onClick={resetSelection}
              className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded shadow-sm hover:bg-emerald-100 text-sm font-medium transition-colors"
            >
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
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Step 2: Product Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Description
                    </label>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Select text for bold or italic. Use the block buttons on whole lines to toggle headings, bullets, numbers, and quotes on or off.
                    </p>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("bold")}
                            className={toolbarButtonClass}
                            title="Toggle bold"
                          >
                            <Bold className="h-4 w-4" />
                            Bold
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("italic")}
                            className={toolbarButtonClass}
                            title="Toggle italic"
                          >
                            <Italic className="h-4 w-4" />
                            Italic
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("heading1")}
                            className={toolbarButtonClass}
                            title="Toggle heading 1"
                          >
                            H1
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("heading2")}
                            className={toolbarButtonClass}
                            title="Toggle heading 2"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("heading3")}
                            className={toolbarButtonClass}
                            title="Toggle heading 3"
                          >
                            H3
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("bullet")}
                            className={toolbarButtonClass}
                            title="Toggle bullet list"
                          >
                            <List className="h-4 w-4" />
                            Bullet
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("ordered")}
                            className={toolbarButtonClass}
                            title="Toggle numbered list"
                          >
                            <ListOrdered className="h-4 w-4" />
                            Numbered
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyMarkdown("quote")}
                            className={toolbarButtonClass}
                            title="Toggle quote block"
                          >
                            Quote
                          </button>
                        </div>
                        <textarea
                          ref={descriptionRef}
                          rows={10}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-65 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm leading-6 focus:border-gray-900 focus:ring-2 focus:ring-gray-900"
                          placeholder={`Write a markdown-style description...\n\nUse the toolbar or type markdown directly.`}
                        />
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Live Preview
                          </p>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm">
                            Synced from markdown
                          </span>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-white p-4">
                          {description ? (
                            <MarkdownRenderer
                              content={description}
                              className="prose prose-sm max-w-none text-sm text-gray-700"
                            />
                          ) : (
                            <p className="text-sm leading-6 text-gray-500">
                              Your formatted description will render here as you type.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 bg-white"
                    disabled={isLoadingCategories}
                  >
                    <option value="">
                      {isLoadingCategories
                        ? "Loading categories..."
                        : allowedCategories.length > 0
                          ? "Select Category"
                          : "No categories assigned"}
                    </option>
                    {allowedCategories.length > 0 && (
                      allowedCategories.map((allowedCategory) => (
                        <option key={allowedCategory.code} value={allowedCategory.code}>
                          {allowedCategory.label}
                        </option>
                      ))
                    )}
                  </select>
                  {!isLoadingCategories && allowedCategories.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Your vendor profile does not currently have any active categories assigned.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Product Type *
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. A, B, Premium"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Recycled Plastic, Pure Steel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Application
                  </label>
                  <input
                    type="text"
                    value={application}
                    onChange={(e) => setApplication(e.target.value)}
                    placeholder="e.g. Industrial, Packaging"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Standard
                  </label>
                  <input
                    type="text"
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    placeholder="e.g. ISO 9001, ASTM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Specifications
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Add product specifications as key/value rows. Vendor-added specs will stay pending until admin approval.
                  </p>
                  <div className="space-y-3">
                    {specifications.map((specification, index) => (
                      <div
                        key={specification.id}
                        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3"
                      >
                        <input
                          type="text"
                          value={specification.key}
                          onChange={(e) => updateSpecification(index, "key", e.target.value)}
                          placeholder="Key, e.g. material"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        <input
                          type="text"
                          value={specification.value}
                          onChange={(e) => updateSpecification(index, "value", e.target.value)}
                          placeholder="Value, e.g. recycled plastic"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecificationRow(index)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addSpecificationRow}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Specification
                  </button>
                  <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                      Product Preview
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {productName || "Product name preview"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category || "Category"} • {productType || "Type"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {grade && (
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Grade:</span>
                            <span className="font-medium text-gray-900 ml-1">{grade}</span>
                          </div>
                        )}
                        {material && (
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Material:</span>
                            <span className="font-medium text-gray-900 ml-1">{material}</span>
                          </div>
                        )}
                        {application && (
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Application:</span>
                            <span className="font-medium text-gray-900 ml-1">{application}</span>
                          </div>
                        )}
                        {standard && (
                          <div className="bg-white rounded px-2 py-1">
                            <span className="text-gray-500">Standard:</span>
                            <span className="font-medium text-gray-900 ml-1">{standard}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Description Preview
                        </p>
                        {description ? (
                          <MarkdownRenderer
                            content={description}
                            className="prose prose-sm max-w-none text-sm text-gray-700"
                          />
                        ) : (
                          <p className="text-sm text-gray-500">
                            Add a description to see it here.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Specifications Preview
                        </p>
                        <div className="space-y-2">
                          {specifications
                            .filter((specification) => specification.key || specification.value)
                            .map((specification, index) => (
                              <div
                                key={specification.id}
                                className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                              >
                                <span className="text-gray-500">{specification.key || "Key"}</span>
                                <span className="font-medium text-gray-900">{specification.value || "Value"}</span>
                              </div>
                            ))}
                          {specifications.every(
                            (specification) => !specification.key && !specification.value,
                          ) && (
                            <p className="text-sm text-gray-500">
                              Add key/value specifications to preview them here.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Product Images
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">
                      Click to upload images
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: JPG, PNG (Max 5MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                        Uploaded Images ({uploadedImages.length})
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {uploadedImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Upload preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isCreatingNew && productPreview && (
            <div className="space-y-6">
              {/* Product Overview Card */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Left: Primary Image */}
                  <div className="relative h-64 sm:h-80 lg:h-full bg-gray-50">
                    {productPreview.images && productPreview.images.length > 0 ? (
                      <img
                        src={productPreview.images.find((i) => i.is_primary)?.image_url || productPreview.images[0].image_url}
                        alt={productPreview.product_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Right: Product Info */}
                  <div className="p-6 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {productPreview.product_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 capitalize">
                        {productPreview.category?.replace(/_/g, " ") || "Uncategorized"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 capitalize">
                        {productPreview.product_type?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-0.5">Sellers</p>
                        <p className="text-lg font-bold text-gray-900">
                          {productPreview.vendors?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-0.5">Images</p>
                        <p className="text-lg font-bold text-gray-900">
                          {productPreview.images?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-0.5">Specifications</p>
                        <p className="text-lg font-bold text-gray-900">
                          {productPreview.specifications ? Object.keys(productPreview.specifications).length : 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-0.5">Price Range</p>
                        <p className="text-lg font-bold text-gray-900">
                          {productPreview.vendors && productPreview.vendors.length > 0
                            ? `₹${Math.min(...productPreview.vendors.map((v) => v.price))} - ₹${Math.max(...productPreview.vendors.map((v) => v.price))}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Description preview */}
                    {productPreview.description && (
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Description</p>
                        <div className="text-sm text-gray-700 line-clamp-4">
                          <MarkdownRenderer content={productPreview.description} className="prose prose-sm max-w-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              {productPreview.images && productPreview.images.length > 1 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">All Images</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {productPreview.images
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((image, index) => (
                        <div
                          key={index}
                          className={`relative aspect-square rounded-lg overflow-hidden border ${
                            image.is_primary ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
                          }`}
                        >
                          <img
                            src={image.image_url}
                            alt={`${productPreview.product_name} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {image.is_primary && (
                            <span className="absolute top-1 left-1 inline-flex items-center rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Full Description */}
              {productPreview.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Full Description</h3>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
                    <MarkdownRenderer content={productPreview.description} className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed" />
                  </div>
                </div>
              )}

              {/* Specifications */}
              {productPreview.specifications && Object.keys(productPreview.specifications).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Specifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(productPreview.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center bg-gray-50 rounded-lg border border-gray-100 px-4 py-3"
                      >
                        <span className="text-sm text-gray-500 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Vendors */}
              {productPreview.vendors && productPreview.vendors.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                    Other Vendors Selling This Product
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {productPreview.vendors.map((vendor) => (
                      <div
                        key={vendor.vendor_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{vendor.company_name}</p>
                          <p className="text-xs text-gray-500">MOQ: {vendor.moq} units</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">₹{vendor.price}</p>
                            <p className="text-xs text-gray-500">{vendor.stock_quantity} in stock</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Allow vendors to add additional technical specs for existing products */}
          {!isCreatingNew && selectedProduct && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Technical Specifications (optional)</h2>
              <p className="text-xs text-gray-500 mb-4">Add key/value technical specs. These will be submitted as pending and require admin approval.</p>
              <div className="space-y-3">
                {specifications.map((specification, index) => (
                  <div key={specification.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                    <input
                      type="text"
                      value={specification.key}
                      onChange={(e) => updateSpecification(index, "key", e.target.value)}
                      placeholder="Key, e.g. tensile_strength"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    <input
                      type="text"
                      value={specification.value}
                      onChange={(e) => updateSpecification(index, "value", e.target.value)}
                      placeholder="Value, e.g. 250 MPa"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                    <button type="button" onClick={() => removeSpecificationRow(index)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addSpecificationRow} className="mt-4 inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Add Specification
              </button>
            </div>
          )}

          {/* Image Upload for Existing Products */}
          {!isCreatingNew && selectedProduct && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Product Images (optional)</h2>
              <p className="text-xs text-gray-500 mb-4">Upload images to help buyers visualize the product better.</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-900">
                  Click to upload images
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG (Max 5MB each)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageSelect}
                className="hidden"
              />
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Images to Upload ({uploadedImages.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {uploadedImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vendor Pricing & Stock */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {isCreatingNew
                ? "Step 3: Your Selling Price & Stock"
                : "Step 2: Your Selling Price & Stock"}
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
                <p className="text-xs text-gray-500 mt-1.5">
                  Your price per unit
                </p>
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
                <p className="text-xs text-gray-500 mt-1.5">
                  Minimum units a buyer must buy
                </p>
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
                <p className="text-xs text-gray-500 mt-1.5">
                  Total units available right now
                </p>
              </div>
                      <div className="mt-6">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 max-w-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Enable quotation ordering</p>
                  <p className="text-xs text-gray-500">Require negotiation for large quantities</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotationEnabled((prev) => !prev)}
                  className="text-gray-700"
                  aria-pressed={quotationEnabled}
                >
                  {quotationEnabled ? (
                    <ToggleRight className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-gray-400" />
                  )}
                </button>
              </div>
            </div>      </div>
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
