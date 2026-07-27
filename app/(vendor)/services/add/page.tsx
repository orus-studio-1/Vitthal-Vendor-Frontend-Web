"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Check,
  Info,
  Wrench,
  DollarSign,
  Clock,
  Loader2,
  Calendar,
  Plus,
  Trash2,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  FileVideo,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { MarkdownRenderer } from "@/components/markdown-renderer";

type GlobalService = {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_label?: string;
  specifications?: Record<string, any>;
};

type Category = {
  id: string;
  code: string;
  label: string;
};

type SpecDraft = {
  id: string;
  key: string;
  value: string;
};

type MarkdownAction = "bold" | "italic" | "heading1" | "heading2" | "heading3" | "bullet" | "ordered" | "quote";

interface MarkdownEditResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function replaceRange(
  value: string,
  start: number,
  end: number,
  replacement: string,
) {
  return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
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

export default function AddServicePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [step, setStep] = useState(1);
  const [globalServices, setGlobalServices] = useState<GlobalService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection confirmation state
  const [selectedService, setSelectedService] = useState<GlobalService | null>(null);
  const [isCreatingCustomService, setIsCreatingCustomService] = useState(false);
  const [customName, setCustomName] = useState("");

  // Custom service proposal specifications state
  const [customDescription, setCustomDescription] = useState("");
  const [customCategoryId, setCustomCategoryId] = useState("");
  const [customSpecs, setCustomSpecs] = useState<SpecDraft[]>([]);
  const [customServiceType, setCustomServiceType] = useState("");

  // Pricing & Media Form State
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState<"flat" | "hourly" | "project" | "milestone">("flat");
  const [moq, setMoq] = useState("1");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [tokenPercentage, setTokenPercentage] = useState("");
  
  // Multi-image state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // Single-video state
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [customSubcategoryId, setCustomSubcategoryId] = useState("");
  const [isCreatingCustomSubcategory, setIsCreatingCustomSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  useEffect(() => {
    async function fetchSubcategories() {
      if (!customCategoryId) {
        setSubcategories([]);
        return;
      }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
        const res = await fetch(`${apiUrl}/api/services/subcategories?categoryId=${customCategoryId}`, {
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          }
        });
        if (res.ok) {
          const json = await res.json();
          setSubcategories(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch subcategories:", err);
      }
    }
    fetchSubcategories();
    setCustomSubcategoryId("");
    setIsCreatingCustomSubcategory(false);
    setNewSubcategoryName("");
  }, [customCategoryId]);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      
      // Fetch Approved Global Services
      const servicesRes = await fetch(`${apiUrl}/api/services`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });
      if (servicesRes.ok) {
        const json = await servicesRes.json();
        setGlobalServices(json.data || []);
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const categoriesRes = await fetch(`${apiUrl}/api/vendors/getVendorCategories`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
      });
      if (categoriesRes.ok) {
        const json = await categoriesRes.json();
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch startup data catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectService = (service: GlobalService) => {
    setSelectedService(service);
    setIsCreatingCustomService(false);
  };

  const handleStartCustomService = () => {
    setIsCreatingCustomService(true);
    setCustomName(searchTerm);
    setCustomDescription("");
    setCustomCategoryId("");
    setCustomServiceType("");
    setCustomSpecs([{ id: Math.random().toString(36).substring(2, 9), key: "", value: "" }]);
    setSelectedService(null);
  };

  const handleResetSelection = () => {
    setSelectedService(null);
    setIsCreatingCustomService(false);
  };

  const handleAddSpecRow = () => {
    setCustomSpecs([
      ...customSpecs,
      {
        id: Math.random().toString(36).substring(2, 9),
        key: "",
        value: "",
      },
    ]);
  };

  const handleRemoveSpecRow = (id: string) => {
    if (customSpecs.length === 1) {
      setCustomSpecs([{ id: Math.random().toString(36).substring(2, 9), key: "", value: "" }]);
    } else {
      setCustomSpecs(customSpecs.filter((s) => s.id !== id));
    }
  };

  const handleSpecChange = (id: string, field: "key" | "value", val: string) => {
    setCustomSpecs(
      customSpecs.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const applyMarkdown = (action: MarkdownAction) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const nextState = transformMarkdown(customDescription, start, end, action);
    setCustomDescription(nextState.value);

    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nextState.selectionStart, nextState.selectionEnd);
    }, 0);
  };

  // Image actions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validImages = Array.from(files).filter((file) => file.type.startsWith("image/"));
      const nextImages = [...uploadedImages, ...validImages].slice(0, 3);
      setUploadedImages(nextImages);
    }
  };

  const removeImage = (index: number) => {
    const nextImages = uploadedImages.filter((_, idx) => idx !== index);
    setUploadedImages(nextImages);
    if (primaryImageIndex >= nextImages.length) {
      setPrimaryImageIndex(Math.max(0, nextImages.length - 1));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      const validImages = Array.from(files).filter((file) => file.type.startsWith("image/"));
      const nextImages = [...uploadedImages, ...validImages].slice(0, 3);
      setUploadedImages(nextImages);
    }
  };

  // Video actions
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setUploadedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setUploadedVideo(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleAddOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:9001";
      let serviceId = selectedService?.id;

      // 1. If proposing a new custom service, hit create service endpoint first
      if (isCreatingCustomService) {
        if (!customName.trim() || !customCategoryId) {
          toast.error("Please fill in the custom service specifications");
          setSubmitting(false);
          return;
        }

        // Format description & technical parameters matrix to a unified markdown description
        let compiledDescription = customDescription.trim();
        const validSpecs = customSpecs.filter((spec) => spec.key.trim() && spec.value.trim());
        
        if (validSpecs.length > 0) {
          compiledDescription += "\n\n### Technical Specifications\n\n| Parameter | Value |\n| --- | --- |\n" +
            validSpecs.map((spec) => `| ${spec.key.trim()} | ${spec.value.trim()} |`).join("\n");
        }

        const specifications: Record<string, string> = {};
        validSpecs.forEach((spec) => {
          specifications[spec.key.trim().toLowerCase().replace(/\s+/g, "_")] = spec.value.trim();
        });

        const newServiceRes = await fetch(`${adminUrl}/api/services`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          body: JSON.stringify({
            name: customName.trim(),
            description: compiledDescription,
            categoryId: customCategoryId,
            specifications,
            subcategoryId: customSubcategoryId || undefined,
            newSubcategoryName: newSubcategoryName.trim() || undefined,
          }),
        });

        if (!newServiceRes.ok) {
          const data = await newServiceRes.json();
          toast.error(data.message || "Failed to propose new custom service catalog");
          setSubmitting(false);
          return;
        }

        const newServiceData = await newServiceRes.json();
        serviceId = newServiceData.data.id;
      }

      if (!serviceId) {
        toast.error("Service ID reference is missing");
        setSubmitting(false);
        return;
      }

      // 2. Upload image files sequentially (Max 3)
      for (let i = 0; i < uploadedImages.length; i++) {
        const file = uploadedImages[i];
        const formData = new FormData();
        formData.append("file", file);

        const mediaRes = await fetch(`${adminUrl}/api/services/${serviceId}/media`, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          },
          body: formData,
        });

        if (!mediaRes.ok) {
          console.warn(`Failed to upload service image ${i + 1}`);
        }
      }

      // 3. Upload video file (Max 1) if selected
      if (uploadedVideo) {
        const formData = new FormData();
        formData.append("file", uploadedVideo);

        const mediaRes = await fetch(`${adminUrl}/api/services/${serviceId}/media`, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          },
          body: formData,
        });

        if (!mediaRes.ok) {
          console.warn("Failed to upload service video file");
        }
      }

      // 4. Submit the vendor service offering
      const res = await fetch(`${adminUrl}/api/services/vendor/offerings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        body: JSON.stringify({
          serviceId,
          price: parseFloat(price),
          pricingType,
          moq: parseInt(moq),
          deliveryDays: deliveryDays ? parseInt(deliveryDays) : undefined,
          tokenPercentage: tokenPercentage ? parseFloat(tokenPercentage) : undefined,
        }),
      });

      if (res.ok) {
        toast.success(
          isCreatingCustomService
            ? "Custom service proposed and offering added to catalog!"
            : "Service offering added to your catalog!"
        );
        router.push("/services");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to add service offering");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error adding service offering");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter global services
  const filteredServices = globalServices.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toolbarButtonClass =
    "p-1.5 rounded hover:bg-gray-150 text-gray-600 transition-colors hover:text-gray-900 text-xs font-semibold flex items-center justify-center";

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans text-sm">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <Link
            href="/services"
            className="p-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Add Service to Catalog
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Identify the service, review specifications, and publish your service offering.
            </p>
          </div>
        </div>

        {/* Stepper Wizard Indicator */}
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">

            {/* Step 1 */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === 1
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50"
                  : step > 1
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-50"
                    : "bg-gray-100 text-gray-400"
              }`}>
                {step > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase ${step === 1 ? "text-blue-600" : step > 1 ? "text-emerald-600" : "text-gray-400"}`}>
                Match Catalog
              </span>
            </div>

            <div className="absolute top-5 left-[calc(16.67%+20px)] w-[calc(33.33%-40px)] h-[3px] bg-gray-100 -z-0">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${step > 1 ? "w-full bg-emerald-500" : "w-0"}`} />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === 2
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50"
                  : step > 2
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-50"
                    : "bg-gray-100 text-gray-400"
              }`}>
                {step > 2 ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase ${step === 2 ? "text-blue-600" : step > 2 ? "text-emerald-600" : "text-gray-400"}`}>
                Specifications
              </span>
            </div>

            <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(33.33%-40px)] h-[3px] bg-gray-100 -z-0">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${step > 2 ? "w-full bg-emerald-500" : "w-0"}`} />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === 3
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50"
                  : "bg-gray-100 text-gray-400"
              }`}>
                3
              </div>
              <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase ${step === 3 ? "text-blue-600" : "text-gray-400"}`}>
                Price & Media
              </span>
            </div>

          </div>
        </div>

        {/* STEP 1: MATCH CATALOG SERVICE */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 1: Match Catalog Service</h2>
              <p className="text-gray-500 mt-1 text-xs">
                Check if the service is already listed on MTWO to sync descriptions and prevent duplicates.
              </p>
            </div>

            {/* If choice has been locked in, show the green card success container */}
            {selectedService || isCreatingCustomService ? (
              <div className="space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between animate-in fade-in duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200/50 shadow-inner">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        {isCreatingCustomService ? "Creating Custom Service" : "Matched Catalog Service"}
                      </p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">
                        {isCreatingCustomService ? customName : selectedService?.name}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1 font-medium">
                        {isCreatingCustomService
                          ? "This will be submitted to the admin catalog queue for approval."
                          : "This matches an existing approved service in our registry."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-xs transition-colors shadow-xs whitespace-nowrap"
                  >
                    Change Item
                  </button>
                </div>

                {/* Bottom navigation action to step 2 */}
                <div className="flex justify-end pt-4 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* SEARCH FORM LOGIC */
              <div className="space-y-6 animate-in fade-in">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Start typing your service name (e.g. Soil Bearing Capacity & Compaction Testing)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-905 text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  />
                </div>

                {searchTerm.length > 0 && (
                  <div className="space-y-4">
                    {filteredServices.length === 0 ? (
                      /* No matches found placeholder block */
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center animate-in fade-in duration-300">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4 border border-gray-200/50 shadow-inner">
                          <Search className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1.5">No matching catalog items</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
                          We couldn't find a service matching "{searchTerm}" in our system registry. Feel free to create it from scratch.
                        </p>
                        <button
                          type="button"
                          onClick={handleStartCustomService}
                          className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create "{searchTerm}" as new service
                        </button>
                      </div>
                    ) : (
                      /* Matching results list with a custom link button at the bottom of dropdown box */
                      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-150 max-h-80 overflow-y-auto shadow-sm">
                        <div className="divide-y divide-gray-150">
                          {filteredServices.map((service) => (
                            <div
                              key={service.id}
                              className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                  <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{service.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{service.category_label || "Services"}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectService(service)}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                              >
                                Select & Link
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Match Dropdown Footer Link for custom service */}
                        <div className="p-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-150 text-xs">
                          <span className="text-gray-500 font-medium">Service model not found in catalog?</span>
                          <button
                            type="button"
                            onClick={handleStartCustomService}
                            className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-xs inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add custom service
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs text-blue-800 leading-relaxed">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900">Why search first?</p>
                    <p className="mt-1">
                      Linking your offering to an approved service helps clients compare prices instantly and ensures your specifications are synced with global search filters. Only create a new custom service request if the item is truly unique.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: REVIEW OR INPUT SPECIFICATIONS */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 2: Enter Service Specifications & Descriptions</h2>
              <p className="text-gray-500 mt-1 text-xs">
                Provide precise properties and details to publish a professional catalog listing.
              </p>
            </div>

            {/* IF CREATING CUSTOM SERVICE (VENDOR PROPOSAL FLOW) */}
            {isCreatingCustomService ? (
              <div className="space-y-6">
                
                {/* Service Name Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium"
                    placeholder="Enter custom service name..."
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Specify scope, key techniques, or type in the name.
                  </p>
                </div>

                {/* Category & Service Type Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Category *
                    </label>
                    <select
                      required
                      value={customCategoryId}
                      onChange={(e) => setCustomCategoryId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white font-medium"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Service Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. On-Site Inspection"
                      value={customServiceType}
                      onChange={(e) => setCustomServiceType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                {/* Subcategory selection / creation */}
                {customCategoryId && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-750 uppercase tracking-wide">
                        Subcategory
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCustomSubcategory(!isCreatingCustomSubcategory);
                          setCustomSubcategoryId("");
                          setNewSubcategoryName("");
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-none cursor-pointer"
                      >
                        {isCreatingCustomSubcategory ? "Select Existing Subcategory" : "Create New Subcategory"}
                      </button>
                    </div>

                    {isCreatingCustomSubcategory ? (
                      <div>
                        <input
                          type="text"
                          required
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium text-gray-800"
                          placeholder="Enter new subcategory name (e.g. TV Repair)..."
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          This subcategory will be created dynamically under the selected parent category.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <select
                          value={customSubcategoryId}
                          onChange={(e) => setCustomSubcategoryId(e.target.value)}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium text-gray-800"
                        >
                          <option value="">None (No Subcategory)</option>
                          {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Markdown Rich Editor Description with preview block side-by-side */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Service Description
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Write detailed characteristics. Highlight text and use formatting tools to style sections.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Rich text container */}
                    <div className="flex flex-col rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs">
                      {/* Editor toolbar */}
                      <div className="flex flex-wrap items-center gap-0.5 bg-gray-50 px-2.5 py-1.5 border-b border-gray-200">
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
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="w-full rounded-b-lg px-3.5 py-2.5 font-mono text-xs focus:ring-0 outline-none border-none resize-y min-h-48"
                        placeholder={`Start writing technical service specifications using markdown...\n\nUse headings to divide details.`}
                      />
                    </div>

                    {/* Live preview container */}
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
                        {customDescription ? (
                          <MarkdownRenderer
                            content={customDescription}
                            className="prose prose-sm max-w-none text-xs text-gray-700"
                          />
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            Your service description preview will render here in real-time.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parameters Matrix Builder */}
                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Service Parameters Matrix
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Add standard key-value attributes (e.g. turnaround_time, accreditation) to help search matching.
                  </p>

                  <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {customSpecs.map((spec, index) => (
                      <div key={spec.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => handleSpecChange(spec.id, "key", e.target.value)}
                          placeholder="Property (e.g., Turnaround Time)"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(spec.id, "value", e.target.value)}
                          placeholder="Value (e.g., 3-5 Working Days)"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(spec.id)}
                          className="p-2 border border-gray-300 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors bg-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddSpecRow}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-dashed border-gray-300 bg-white text-gray-750 text-xs font-bold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Parameter Row
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* STANDARD SYNCED CATALOG DETAILS */
              selectedService && (
                <div className="bg-gray-50 rounded-2xl border border-gray-150 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedService.name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                        {selectedService.category_label || "Service"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Description</h4>
                    <div className="bg-white border border-gray-150 rounded-xl p-4 text-xs text-gray-700 max-h-60 overflow-y-auto leading-relaxed">
                      {selectedService.description ? (
                        <MarkdownRenderer content={selectedService.description} />
                      ) : (
                        <p className="italic text-gray-400">No description provided for this catalog service.</p>
                      )}
                    </div>
                  </div>

                  {selectedService.specifications && Object.keys(selectedService.specifications).length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Technical Specs</h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                        {Object.entries(selectedService.specifications).map(([key, val]) => (
                          <div key={key} className="flex justify-between py-1.5 border-b border-gray-100">
                            <dt className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</dt>
                            <dd className="font-semibold text-gray-900">{String(val)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Stepper Wizard Footer Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-150">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 text-xs inline-flex items-center gap-1 transition-all"
              >
                &lt; Previous Step
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isCreatingCustomService && (!customName.trim() || !customCategoryId)) {
                    toast.error("Please enter service name and category");
                    return;
                  }
                  setStep(3);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm inline-flex items-center gap-1 transition-all"
              >
                Next Step &gt;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DEFINE PRICING & MEDIA */}
        {step === 3 && (selectedService || isCreatingCustomService) && (
          <form
            onSubmit={handleAddOffering}
            className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6 md:p-8 space-y-6 animate-in fade-in duration-300"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900">Step 3: Price & Media</h2>
              <p className="text-gray-500 mt-1 text-xs">
                Define the pricing model, price per unit, and upload service image references.
              </p>
            </div>

            {/* Price Configurations Box matching products Selling Quotations Exactly */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Selling Quotations & Booking Configuration
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Establish pricing, billing model, and order restrictions for this catalog service.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Unit Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Unit Price (₹) *
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-400 text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Specify your direct base price rate per job unit.</p>
                </div>

                {/* Pricing Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Pricing / Billing Model *
                  </label>
                  <select
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value as any)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none bg-white font-medium"
                  >
                    <option value="flat">Flat Price</option>
                    <option value="hourly">Hourly Billing</option>
                    <option value="project">Project Scope</option>
                    <option value="milestone">Milestone Billing</option>
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Choose how this service rate is billed.</p>
                </div>

                {/* MOQ */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Minimum Order Qty (MOQ) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Minimum order volume required for purchase.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
                {/* Execution Timeline */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Default Execution Timeline (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 7"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Estimated duration to complete the service request.</p>
                </div>

                {/* Default Token Money Percentage */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Default Token Money %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 10"
                    value={tokenPercentage}
                    onChange={(e) => setTokenPercentage(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Upfront deposit required to activate the booking request.</p>
                </div>
              </div>
            </div>

            {/* Media Upload Area (Photos Max 3) matching products page */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                Upload Custom Service Photos (Max 3)
              </h3>
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
                  Supports JPG, JPEG, and PNG formats (Max 5MB each file, up to 3 files total)
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

              {/* Uploaded Photos Grid matching products layout */}
              {uploadedImages.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Uploaded Photos ({uploadedImages.length}/3)
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

                          {/* Hover delete controls */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="bg-red-600 text-white rounded-lg p-2 hover:bg-red-700 transition-transform active:scale-95 shadow"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Primary display badge */}
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

            {/* Video Upload Area matching product page */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1.5">
                Upload Custom Service Video (Max 1)
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Add a service demonstration video. Vendor video uploads require admin review and approval.
              </p>

              {!uploadedVideo ? (
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-zinc-50/50 rounded-2xl p-8 text-center transition-all cursor-pointer select-none bg-zinc-50/20"
                >
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="font-bold text-sm text-gray-900">
                    Click to select a video file
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Supports MP4, WebM, and MOV formats (Max 20MB)
                  </p>
                </div>
              ) : (
                /* Video preview card matching products page style */
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 flex flex-col items-start gap-4">
                  <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border border-gray-200 bg-black group shadow">
                    <video
                      src={videoPreview || undefined}
                      controls
                      className="w-full h-full"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="bg-black/60 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow"
                        title="Remove Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FileVideo className="w-4 h-4 text-emerald-600" />
                    <span>{uploadedVideo.name} ({(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                </div>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </div>

            {/* Stepper Wizard Footer Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-150">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 text-xs inline-flex items-center gap-1 transition-all"
              >
                &lt; Previous Step
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-705 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center min-w-[150px] disabled:opacity-50 inline-flex items-center gap-1.5 transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit & Publish Service
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
