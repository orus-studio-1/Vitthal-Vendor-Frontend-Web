"use client";

import React, { useState, useEffect, useRef } from "react";
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
  HelpCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Trash2,
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
  item_code?: string | null;
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
  quotation_limit?: number | null;
  vendor_can_set_quotation_limit?: boolean;
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

type AttributeDraft = {
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

function createAttributeDraft(key = "", value = ""): AttributeDraft {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ??
      `attr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    key,
    value,
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
  const [activeStep, setActiveStep] = useState(1);
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
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [attributes, setAttributes] = useState<AttributeDraft[]>([
    createAttributeDraft("Material", ""),
    createAttributeDraft("Grade", ""),
    createAttributeDraft("Application", ""),
    createAttributeDraft("Standard", ""),
  ]);
  const [quotationLimit, setQuotationLimit] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  // Vendor states
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [quotationEnabled, setQuotationEnabled] = useState(false);

  const toolbarButtonClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

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
          if (res.ok && data.data && Array.isArray(data.data)) {
            // Filter products that belong to the vendor's opted categories
            const filteredResults = data.data.filter((product: ProductResult) =>
              allowedCategories.some(
                (cat) =>
                  cat.code.toLowerCase() === product.category.toLowerCase() ||
                  cat.label.toLowerCase() === product.category.toLowerCase()
              )
            );
            setSearchResults(filteredResults);
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
  }, [searchQuery, selectedProduct, isCreatingNew, apiBase, allowedCategories]);

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

    if (!categoryIsAllowed) {
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
    setPrimaryImageIndex(0);
    setItemCode("");
    setQuotationLimit("");
    setActiveStep(1);
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
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex((prev) => prev - 1);
    }
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

  const updateAttribute = (
    index: number,
    field: keyof AttributeDraft,
    value: string,
  ) => {
    setAttributes((current) =>
      current.map((attribute, currentIndex) =>
        currentIndex === index
          ? { ...attribute, [field]: value }
          : attribute,
      ),
    );
  };

  const addAttributeRow = () => {
    setAttributes((current) => [...current, createAttributeDraft()]);
  };

  const removeAttributeRow = (index: number) => {
    setAttributes((current) =>
      current.length === 1
        ? [createAttributeDraft()]
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

  const handleNextStep = () => {
    if (activeStep === 1) {
      if (!selectedProduct && !isCreatingNew) {
        toast.error("Please search and select a product or click Create New to continue.");
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (isCreatingNew) {
        if (!productName || !category || !productType) {
          toast.error("Please fill out all required details (Product Name, Category, Product Type).");
          return;
        }
        const categoryIsAllowed = allowedCategories.some(
          (allowedCategory) =>
            allowedCategory.code.toLowerCase() === category.toLowerCase() ||
            allowedCategory.label.toLowerCase() === category.toLowerCase(),
        );

        if (!categoryIsAllowed) {
          toast.error("You can only add products from your assigned categories.");
          return;
        }
      }
      setActiveStep(3);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!price || !moq || !stockQuantity) {
      toast.error("Please fill out all pricing and stock fields!");
      return;
    }

    // Category validation for existing products
    if (!isCreatingNew && selectedProduct) {
      const categoryIsAllowed = allowedCategories.some(
        (allowedCategory) =>
          allowedCategory.code.toLowerCase() === selectedProduct.category.toLowerCase() ||
          allowedCategory.label.toLowerCase() === selectedProduct.category.toLowerCase(),
      );

      if (!categoryIsAllowed) {
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

        if (!categoryIsAllowed) {
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

        const attributesPayload: Record<string, string> = {};
        attributes.forEach((attr) => {
          const k = attr.key.trim();
          if (k) {
            attributesPayload[k] = attr.value.trim();
          }
        });

        const materialVal = attributesPayload["Material"] || attributesPayload["material"] || "";
        const gradeVal = attributesPayload["Grade"] || attributesPayload["grade"] || "";
        const applicationVal = attributesPayload["Application"] || attributesPayload["application"] || "";
        const standardVal = attributesPayload["Standard"] || attributesPayload["standard"] || "";

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
            grade: gradeVal,
            material: materialVal,
            application: applicationVal,
            standard: standardVal,
            attributes: attributesPayload,
            specifications: specificationPayload,
            itemCode: itemCode.trim() || null,
            quotationLimit: quotationLimit ? Number(quotationLimit) : null,
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
        formData.append("primaryImageIndex", primaryImageIndex.toString());
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/products"
          className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Add Product to Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Identify the item, write details/specifications, and publish your selling offers.
          </p>
        </div>
      </div>

      {/* Stepped Progress Bar */}
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative">

          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${activeStep === 1
              ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50"
              : activeStep > 1
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-50"
                : "bg-gray-100 text-gray-400"
              }`}>
              {activeStep > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase ${activeStep === 1 ? "text-blue-600" : activeStep > 1 ? "text-emerald-600" : "text-gray-400"}`}>
              Match Catalog
            </span>
          </div>

          <div className="absolute top-5 left-[calc(16.67%+20px)] w-[calc(33.33%-40px)] h-[3px] bg-gray-100 -z-0">
            <div className={`h-full bg-blue-600 transition-all duration-300 ${activeStep > 1 ? "w-full bg-emerald-500" : "w-0"}`} />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${activeStep === 2
              ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50"
              : activeStep > 2
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-50"
                : "bg-gray-100 text-gray-400"
              }`}>
              {activeStep > 2 ? <Check className="w-5 h-5" /> : "2"}
            </div>
            <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase ${activeStep === 2 ? "text-blue-600" : activeStep > 2 ? "text-emerald-600" : "text-gray-400"}`}>
              Specifications
            </span>
          </div>

          <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(33.33%-40px)] h-[3px] bg-gray-100 -z-0">
            <div className={`h-full bg-blue-600 transition-all duration-300 ${activeStep > 2 ? "w-full bg-emerald-500" : "w-0"}`} />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center flex-1 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${activeStep === 3
              ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50"
              : "bg-gray-100 text-gray-400"
              }`}>
              3
            </div>
            <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase ${activeStep === 3 ? "text-blue-600" : "text-gray-400"}`}>
              Price & Media
            </span>
          </div>

        </div>
      </div>

      {/* Step 1 Container: Find or Create */}
      {activeStep === 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Step 1: Match Catalog Product
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Check if the item is already sold on Vitthal to sync descriptions and prevent duplicates.
              </p>
            </div>
          </div>

          {!selectedProduct && !isCreatingNew ? (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Start typing your product name (e.g. PP Copolymer Granules)..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-base shadow-inner transition-all placeholder:text-gray-400"
                />

                {/* Search Results Dropdown */}
                {searchQuery.length > 2 && (
                  <div className="absolute z-30 w-full mt-2.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-250">
                    {isSearching ? (
                      <div className="p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2.5">
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
                        Searching product registry...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                          {searchResults.map((result) => (
                            <button
                              key={result.product_id}
                              onClick={() => handleSelectProduct(result)}
                              className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                {result.primary_image ? (
                                  <img
                                    src={result.primary_image}
                                    alt={result.product_name}
                                    className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">
                                    {result.product_name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 uppercase font-semibold text-[10px]">
                                      {result.category}
                                    </span>
                                    <span>•</span>
                                    <span>Type: {result.product_type}</span>
                                    {result.item_code && (
                                      <>
                                        <span>•</span>
                                        <span className="text-blue-600 font-mono text-[10px]">Code: {result.item_code}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                Select & Link
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <p className="text-xs text-gray-600 font-medium">
                            Product model not found in catalog?
                          </p>
                          <button
                            onClick={handleCreateNew}
                            className="text-xs font-bold text-gray-900 hover:text-blue-600 flex items-center bg-white px-3.5 py-2 border border-gray-300 rounded-lg shadow-xs hover:border-blue-500 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add custom product
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-zinc-50/50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                          <Search className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-bold text-base mb-1">
                          No matching catalog items
                        </p>
                        <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
                          We couldn't find a product matching "{searchQuery}" in our system registry. Feel free to create it from scratch.
                        </p>
                        <button
                          onClick={handleCreateNew}
                          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-md shadow-blue-100"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create "{searchQuery}" as new product
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Informative tips layout */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Why search first?</h4>
                    <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                      Linking your listing to an existing product helps buyers compare prices instantly and ensures your specifications are synced with global search filters. Only create a new custom product if the item is truly unique or has different physical parameters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200 shrink-0">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                    {isCreatingNew ? "Creating Custom Product" : "Linked Product Model"}
                  </p>
                  <p className="text-emerald-950 font-bold text-lg mt-0.5 leading-snug">
                    {isCreatingNew
                      ? productName || "New Custom Product Setup"
                      : selectedProduct?.product_name}
                  </p>
                  {isCreatingNew && (
                    <p className="text-emerald-800 text-xs mt-1">
                      This will be submitted to the admin catalog queue for approval.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={resetSelection}
                className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-lg shadow-xs hover:bg-emerald-100 text-xs font-bold transition-all shrink-0"
              >
                Change Item
              </button>
            </div>
          )}

          {/* Stepped buttons */}
          <div className="flex items-center justify-end mt-8 border-t border-gray-100 pt-5">
            <button
              onClick={handleNextStep}
              disabled={!selectedProduct && !isCreatingNew}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-bold text-sm shadow-md shadow-blue-100 flex items-center gap-1.5"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 Container: Custom Product Info or Selected Product Verification */}
      {activeStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Creating custom product fields */}
          {isCreatingNew ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Step 2: Enter Product Specifications & Descriptions
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Provide precise properties and details to publish a professional catalog listing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. PP Copolymer Granules - Grade A"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">Specify material type, brand, and key properties in the name.</p>
                </div>

                {/* Item Code (Optional SKU ID) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Product Item Code / SKU
                    </label>
                    <div className="relative group">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md">
                        An optional unique identifier used for internal stock matching and tracking. Keep it blank if not applicable.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="e.g. PP-COP-102"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm transition-all font-mono"
                  />
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white text-sm outline-none transition-all"
                    disabled={isLoadingCategories}
                  >
                    <option value="">
                      {isLoadingCategories
                        ? "Loading categories..."
                        : allowedCategories.length > 0
                          ? "Select Category"
                          : "No categories assigned"}
                    </option>
                    {allowedCategories.length > 0 &&
                      allowedCategories.map((allowedCategory) => (
                        <option key={allowedCategory.code} value={allowedCategory.code}>
                          {allowedCategory.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Product Type Select */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Product Type *
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white text-sm outline-none transition-all"
                  >
                    <option value="">Select Type</option>
                    <option value="hdpe">HDPE</option>
                    <option value="pet">PET</option>
                    <option value="aluminum">Aluminum</option>
                    <option value="pp">PP (Polypropylene)</option>
                    <option value="ldpe">LDPE</option>
                    <option value="pvc">PVC</option>
                    <option value="steel">Steel</option>
                    <option value="copper">Copper</option>
                  </select>
                </div>

                {/* Key Properties (Attributes) Builder */}
                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Product Key Properties (Attributes)
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-4">
                    Define primary product properties (e.g. Material, Grade, Application, Standard) as key-value pairs. Customize keys to fit your product category.
                  </p>

                  <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {attributes.map((attr, index) => (
                      <div key={attr.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                        <input
                          type="text"
                          value={attr.key}
                          onChange={(e) => updateAttribute(index, "key", e.target.value)}
                          placeholder="Property name (e.g. Material)"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) => updateAttribute(index, "value", e.target.value)}
                          placeholder="Value (e.g. Recycled PE)"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttributeRow(index)}
                          className="p-2 border border-gray-300 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addAttributeRow}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-dashed border-gray-300 bg-white text-gray-700 text-xs font-bold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Property Row
                    </button>
                  </div>
                </div>

                {/* Quotation Limit */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Quotation Limit (Units)
                    </label>
                    <div className="relative group">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-md">
                        Threshold quantity above which orders require a quotation request instead of direct buying. Subject to Admin review and editing.
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={quotationLimit}
                    onChange={(e) => setQuotationLimit(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm transition-all"
                  />
                </div>

                {/* Rich Description Editor */}
                <div className="md:col-span-2 space-y-2 mt-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Product Description
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Write detailed characteristics. Highlight text and use formatting tools to style sections.
                  </p>

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 p-3.5">
                    {/* Left: Input Textarea with toolbar */}
                    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
                      <div className="mb-2.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-1.5">
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("bold")}
                          className={toolbarButtonClass}
                          title="Bold"
                        >
                          <Bold className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("italic")}
                          className={toolbarButtonClass}
                          title="Italic"
                        >
                          <Italic className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        <span className="w-[1px] h-4 bg-gray-200 mx-1" />
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("heading1")}
                          className={toolbarButtonClass}
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("heading2")}
                          className={toolbarButtonClass}
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("heading3")}
                          className={toolbarButtonClass}
                        >
                          H3
                        </button>
                        <span className="w-[1px] h-4 bg-gray-200 mx-1" />
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("bullet")}
                          className={toolbarButtonClass}
                          title="Bullet List"
                        >
                          <List className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyMarkdown("ordered")}
                          className={toolbarButtonClass}
                          title="Numbered List"
                        >
                          <ListOrdered className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                      </div>
                      <textarea
                        ref={descriptionRef}
                        rows={8}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 font-mono text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none resize-y min-h-48"
                        placeholder={`Start writing technical product specifications using markdown...\n\nUse headings to divide details.`}
                      />
                    </div>

                    {/* Right: Live Preview */}
                    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-xs max-h-72 overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Live Render Preview
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
                          Markdown Active
                        </span>
                      </div>
                      <div className="flex-1">
                        {description ? (
                          <MarkdownRenderer
                            content={description}
                            className="prose prose-sm max-w-none text-xs text-gray-700"
                          />
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            Your product description preview will render here in real-time.
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Technical Specifications Matrix Builder */}
                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Product Parameters Matrix
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-4">
                    Add standard key-value attributes (e.g. density, tensile_strength) to help search matching.
                  </p>

                  <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {specifications.map((specification, index) => (
                      <div key={specification.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                        <input
                          type="text"
                          value={specification.key}
                          onChange={(e) => updateSpecification(index, "key", e.target.value)}
                          placeholder="Property (e.g., MFI)"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <input
                          type="text"
                          value={specification.value}
                          onChange={(e) => updateSpecification(index, "value", e.target.value)}
                          placeholder="Value (e.g., 2.4 g/10min)"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecificationRow(index)}
                          className="p-2 border border-gray-300 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addSpecificationRow}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-dashed border-gray-300 bg-white text-gray-700 text-xs font-bold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Parameter Row
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Selected Existing Product: Read-Only Detail Card */
            <div className="space-y-6">
              {productPreview && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-100 pb-2">
                    Review Catalog Specifications
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                    {/* Catalog info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {productPreview.product_name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-600 capitalize">
                            {productPreview.category?.replace(/_/g, " ")}
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-bold text-gray-600 capitalize">
                            Type: {productPreview.product_type}
                          </span>
                          {productPreview.item_code && (
                            <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded-full text-xs font-mono font-bold text-zinc-700">
                              Item Code: {productPreview.item_code}
                            </span>
                          )}
                        </div>
                      </div>

                      {productPreview.description && (
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs leading-relaxed text-zinc-700">
                          <p className="font-bold text-zinc-800 mb-1">Product Description:</p>
                          <MarkdownRenderer content={productPreview.description} className="prose prose-xs text-zinc-600" />
                        </div>
                      )}

                      {productPreview.specifications && Object.keys(productPreview.specifications).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-800">Catalog Technical Matrix:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(productPreview.specifications).map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between border border-gray-150 rounded-lg p-2.5 bg-gray-50 text-xs">
                                <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="font-bold text-gray-900">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image gallery */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-800">Primary Catalog Image:</p>
                      <div className="aspect-square w-full rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                        {productPreview.images && productPreview.images.length > 0 ? (
                          <img
                            src={productPreview.images.find((img) => img.is_primary)?.image_url || productPreview.images[0].image_url}
                            alt={productPreview.product_name}
                            className="w-full h-full object-contain p-4"
                          />
                        ) : (
                          <div className="text-center text-gray-400 p-8">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-xs">No media uploaded in master catalog.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Specs Additions (optional spec updates) */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                  Append Custom Product Specifications (Optional)
                </h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  If this specific batch has additional technical details not represented above, specify them here. These are submitted as pending approval.
                </p>

                <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  {specifications.map((specification, index) => (
                    <div key={specification.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                      <input
                        type="text"
                        value={specification.key}
                        onChange={(e) => updateSpecification(index, "key", e.target.value)}
                        placeholder="e.g. moisture_content"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      />
                      <input
                        type="text"
                        value={specification.value}
                        onChange={(e) => updateSpecification(index, "value", e.target.value)}
                        placeholder="e.g. <0.05%"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecificationRow(index)}
                        className="p-2 border border-gray-300 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSpecificationRow}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-dashed border-gray-300 bg-white text-gray-700 text-xs font-bold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Technical Param
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stepped buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5">
            <button
              onClick={handlePrevStep}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm flex items-center gap-1.5 bg-white"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Step
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-md shadow-blue-100 flex items-center gap-1.5"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 Container: Vendor Pricing, Stock & Image Uploads */}
      {activeStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Vendor pricing & inventory inputs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">
              Selling Quotations & Inventory Configuration
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Establish pricing, initial stock levels, and order restrictions for this catalog item.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Selling Price */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Unit Price (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Banknote className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-base font-semibold"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Specify your direct base price per item unit.</p>
              </div>

              {/* MOQ */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Minimum Order Qty (MOQ) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    placeholder="1"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-base font-semibold"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Minimum order volume required for purchase.</p>
              </div>

              {/* Initial Stock */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Available Stock Level *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-base font-semibold"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Current batch units available for direct checkout.</p>
              </div>

              {/* Quotation Option */}
              <div className="md:col-span-3 border-t border-gray-100 pt-5 mt-2">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 max-w-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-950">Enable Quotation Negotiation</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Allows large-volume corporate buyers to query bulk discounts and negotiate contract pricing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuotationEnabled((prev) => !prev)}
                    className="text-gray-700 outline-none transition-transform active:scale-95 shrink-0"
                    aria-pressed={quotationEnabled}
                  >
                    {quotationEnabled ? (
                      <ToggleRight className="h-8 w-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                </div>
                {!isCreatingNew && productPreview?.quotation_limit && (
                  <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2.5 max-w-lg">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900 block mb-0.5">Product Quotation Limit</span>
                      Orders above <strong className="font-extrabold text-blue-900">{productPreview.quotation_limit} units</strong> will require quotation negotiation.
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* S3 Image upload area */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">
              Upload Custom Product Photos
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Add clear catalog images. Vendor uploads will undergo verification before listing visibility activation.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-zinc-50/50 rounded-2xl p-8 text-center transition-all cursor-pointer select-none bg-zinc-50/20"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="font-bold text-sm text-gray-900">
                Drag and drop your images here, or <span className="text-blue-600 hover:underline">browse files</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Supports JPG, JPEG, and PNG formats (Max 5MB each file)
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

            {/* Uploaded Grid List */}
            {uploadedImages.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Uploaded Photos ({uploadedImages.length})
                  </p>
                  <p className="text-[10px] text-zinc-500 font-semibold italic">
                    * Click on any thumbnail image card to set it as the Primary Display Photo.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {uploadedImages.map((image, index) => {
                    const isPrimary = index === primaryImageIndex;
                    const objectUrl = URL.createObjectURL(image);

                    return (
                      <div
                        key={index}
                        onClick={() => setPrimaryImageIndex(index)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer shadow-xs transition-all duration-300 ${isPrimary
                          ? "border-emerald-500 ring-4 ring-emerald-50 scale-98"
                          : "border-gray-200 hover:border-blue-400"
                          }`}
                      >
                        <img
                          src={objectUrl}
                          alt={`Upload preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="bg-red-600/90 text-white rounded-lg p-2 hover:bg-red-700 transition-transform active:scale-95"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Badges */}
                        {isPrimary && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                            <Check className="w-3 h-3" /> Primary
                          </span>
                        )}

                        <span className="absolute bottom-2 right-2 inline-block rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold text-white uppercase">
                          {index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stepped buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-6">
            <button
              onClick={handlePrevStep}
              disabled={isSaving}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-bold text-sm flex items-center gap-1.5 bg-white"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Step
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || !price || !moq || !stockQuantity}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-bold shadow-md shadow-blue-100 text-sm flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="w-3 h-3 bg-white rounded-full animate-ping" />
                  Saving Listing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Submit & Publish Product
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
