"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Briefcase,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

type Step =
  | "identity"
  | "business"
  | "categories"
  | "contact"
  | "password"
  | "verify";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const STEP_ORDER: Step[] = [
  "identity",
  "business",
  "categories",
  "contact",
  "password",
  "verify",
];

const CATEGORY_OPTIONS = [
  {
    code: "plastic",
    label: "Plastic",
    description: "Polymers, granules, and molded plastic goods",
  },
  {
    code: "metal",
    label: "Metal",
    description: "Steel, aluminium, copper, and alloy products",
  },
  {
    code: "chemicals",
    label: "Chemicals",
    description: "Industrial chemicals, additives, and solvents",
  },
  {
    code: "construction",
    label: "Construction",
    description: "Cement, tiles, bricks, and building materials",
  },
  {
    code: "machinery",
    label: "Machinery",
    description: "Industrial equipment, tools, and machine parts",
  },
  {
    code: "packaging",
    label: "Packaging",
    description: "Boxes, containers, films, and packing supplies",
  },
  {
    code: "textiles",
    label: "Textiles",
    description: "Fabrics, yarns, and textile supplies",
  },
  {
    code: "automotive",
    label: "Automotive",
    description: "Vehicle parts and transport components",
  },
  {
    code: "agriculture",
    label: "Agriculture",
    description: "Seeds, fertilizers, and farm inputs",
  },
  {
    code: "electrical",
    label: "Electrical",
    description: "Cables, switches, wiring, and fittings",
  },
] as const;

const STEP_LABELS: Record<Step, string> = {
  identity: "Identity",
  business: "Business",
  categories: "Categories",
  contact: "Contact",
  password: "Password",
  verify: "Verify",
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Puducherry",
  "Lakshadweep",
  "Daman and Diu",
  "Dadra and Nagar Haveli",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Delhi",
  "Ladakh",
  "Jammu and Kashmir",
];

const INDIAN_CITIES = [
  "Ahmedabad",
  "Bangalore",
  "Bhopal",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Dehradun",
  "Delhi",
  "Ernakulam",
  "Ghaziabad",
  "Goa",
  "Gurgaon",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Kannur",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Ludhiana",
  "Mumbai",
  "Mysore",
  "Nagpur",
  "Noida",
  "Patna",
  "Pune",
  "Surat",
  "Thane",
  "Vadodara",
  "Visakhapatnam",
].sort();

const BUSINESS_TYPES = [
  "Manufacturing",
  "Trading",
  "Service Provider",
  "Distributor",
  "Dealer",
  "Exporter",
  "Importer",
  "Other",
];

function validateGST(gst: string) {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  return gstRegex.test(gst);
}

function buildMockCertificateLink(file: File | null, uploadedAt: string) {
  if (!file) {
    return "";
  }

  return `mock-gst://${encodeURIComponent(file.name)}?uploadedBy=you&uploadedAt=${encodeURIComponent(uploadedAt)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [gstState, setGstState] = useState("");
  const [gstPan, setGstPan] = useState("");
  const [gstEntity, setGstEntity] = useState("");
  const [gstCheck, setGstCheck] = useState("");
  const [gstZ, setGstZ] = useState("Z");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [website, setWebsite] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(
    null,
  );
  const [gstUploadedAt, setGstUploadedAt] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [creditCycle, setCreditCycle] = useState("");
  const [customCreditCycle, setCustomCreditCycle] = useState("");
  const [minCommission, setMinCommission] = useState("");
  const [maxCommission, setMaxCommission] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);

  const hasMinLength = password.length >= 7;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) {
      return true;
    }
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const gstNumber = gstState + gstPan + gstEntity + gstZ + gstCheck;
  const activeStepIndex = STEP_ORDER.indexOf(step);
  const selectedCategoryCount = selectedCategories.length;
  const parsedMinCommission = Number(minCommission);
  const parsedMaxCommission = Number(maxCommission);
  const hasValidCommissionRange =
    Number.isFinite(parsedMinCommission) &&
    Number.isFinite(parsedMaxCommission) &&
    parsedMinCommission >= 0 &&
    parsedMinCommission <= 100 &&
    parsedMaxCommission >= 0 &&
    parsedMaxCommission <= 100 &&
    parsedMaxCommission > parsedMinCommission;

  function toggleCategory(code: string) {
    setSelectedCategories((current) => {
      if (current.includes(code)) {
        return current.filter((item) => item !== code);
      }

      if (current.length >= 3) {
        toast.error("You can select up to 3 categories");
        return current;
      }

      return [...current, code];
    });
  }

  function captureCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsLocating(false);
        toast.success("Location captured");
      },
      () => {
        setIsLocating(false);
        toast.error("Unable to fetch location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleGSTUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setGstCertificateFile(file);
    setGstUploadedAt(new Date().toISOString());
    toast.success("GST certificate selected");
  }

  async function handleIdentitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName || !normalizedEmail) {
      toast.error("Please enter your name and email");
      return;
    }

    if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setStep("business");
  }

  async function handleBusinessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyName.trim() || !businessType) {
      toast.error("Please fill all company details");
      return;
    }

    if (!gstCertificateFile) {
      toast.error("Please upload GST certificate");
      return;
    }

    if (
      gstState.length !== 2 ||
      gstPan.length !== 10 ||
      gstEntity.length !== 1 ||
      gstCheck.length !== 1 ||
      gstZ.length !== 1 ||
      !validateGST(gstNumber)
    ) {
      toast.error("Please enter valid GST details");
      return;
    }

    setStep("categories");
  }

  function handleCategoriesSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedCategories.length === 0) {
      toast.error("Please choose at least one category");
      return;
    }

    setStep("contact");
  }

  function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCreditCycle =
      creditCycle === "custom" ? customCreditCycle.trim() : creditCycle.trim();

    if (
      !address.trim() ||
      !city ||
      !state ||
      !pincode.trim() ||
      !phone.trim() ||
      !designation.trim() ||
      !businessDescription.trim() ||
      !creditCycle.trim() ||
      (creditCycle === "custom" && !customCreditCycle.trim()) ||
      !minCommission.trim() ||
      !maxCommission.trim()
    ) {
      toast.error(
        "Please fill all required contact, location, and commission fields",
      );
      return;
    }

    if (pincode.trim().length !== 6) {
      toast.error("Pincode must be 6 digits");
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      toast.error("Please capture latitude and longitude");
      return;
    }

    const minComm = parseInt(minCommission);
    const maxComm = parseInt(maxCommission);

    if (isNaN(minComm) || isNaN(maxComm)) {
      toast.error("Commission percentages must be valid numbers");
      return;
    }

    if (minComm < 0 || minComm > 100 || maxComm < 0 || maxComm > 100) {
      toast.error("Commission percentages must be between 0 and 100");
      return;
    }

    if (maxComm <= minComm) {
      toast.error("Maximum commission must be greater than minimum commission");
      return;
    }

    if (creditCycle === "custom" && normalizedCreditCycle.length < 3) {
      toast.error("Please enter a valid custom credit cycle");
      return;
    }

    setStep("password");
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordsMatch || !isPasswordStrong) {
      return;
    }

    if (!agreeToTerms) {
      toast.error("You must agree to the Terms and Conditions");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password,
          role: "vendor",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegisteredEmail(email.trim());
        setRegisteredName(fullName.trim());
        setOtp("");
        if (data.expiresAt) {
          setOtpExpiry(new Date(data.expiresAt));
        }
        setStep("verify");
        toast.success(data.message || "OTP sent to your email");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOTP() {
    setIsResendingOTP(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify({
          name: registeredName || fullName.trim(),
          email: registeredEmail || email.trim(),
          password,
          role: "vendor",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtp("");
        if (data.expiresAt) {
          setOtpExpiry(new Date(data.expiresAt));
        }
        toast.success("OTP resent to your email");
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResendingOTP(false);
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const uploadedAt = gstUploadedAt || new Date().toISOString();
      const res = await fetch(`${API_BASE}/api/auth/verify-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify({
          email: registeredEmail || email.trim(),
          otp,
          companyName: companyName.trim(),
          businessType,
          gstNumber,
          companyWebsite: website.trim(),
          gstCertificateLink: buildMockCertificateLink(
            gstCertificateFile,
            uploadedAt,
          ),
          phone: phone.trim(),
          alternativeNumber: alternatePhone.trim(),
          designation: designation.trim(),
          businessDescription: businessDescription.trim(),
          vendorCategories: selectedCategories,
          address: address.trim(),
          city,
          state,
          country,
          pincode: pincode.trim(),
          latitude,
          longitude,
          creditCycle:
            creditCycle === "custom"
              ? customCreditCycle.trim()
              : creditCycle.trim(),
          minimumCommissionPercentage: parseInt(minCommission),
          maximumCommissionPercentage: parseInt(maxCommission),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Registration complete!");
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
      setIsVerifyingOTP(false);
      if (data.user) {
        useAuthStore.getState().setUser(data.user);
        await useAuthStore.getState().fetchUser();
      }
    } catch {
      toast.error("Failed to verify OTP. Please try again.");
      console.error("Error verifying OTP.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="flex items-center justify-center text-xl font-semibold tracking-tight text-zinc-900"
          >
            <Image
              src="/favicon.ico"
              height="104"
              width="100"
              alt="MTWO Logo"
            />
          </Link>

          {/* Step Progress Indicator */}
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEP_ORDER.map((item, index) => (
                <div key={item} className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                      index <= activeStepIndex
                        ? "bg-[#1d4ed8] text-white"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium whitespace-nowrap ${
                      index <= activeStepIndex
                        ? "text-[#1d4ed8]"
                        : "text-zinc-500"
                    }`}
                  >
                    {STEP_LABELS[item]}
                  </span>
                  {index < STEP_ORDER.length - 1 && (
                    <div
                      className={`absolute w-16 h-0.5 translate-x-12 ${
                        index < activeStepIndex ? "bg-[#1d4ed8]" : "bg-zinc-200"
                      }`}
                      style={{ top: "20px" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Title and Description */}
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {step === "identity"
                ? "Create Your Vendor Account"
                : step === "business"
                  ? "Business Profile"
                  : step === "categories"
                    ? "Select Your Categories"
                    : step === "contact"
                      ? "Contact & Location"
                      : step === "password"
                        ? "Secure Your Account"
                        : "Verify Your Email"}
            </h1>
            <p className="mt-3 text-sm text-zinc-600 max-w-xl mx-auto">
              {step === "identity"
                ? "Start by providing your basic information. This will be used to create your vendor account."
                : step === "business"
                  ? "Tell us about your company. Add your GST certificate and business details."
                  : step === "categories"
                    ? "Choose up to 3 product categories that best represent your business."
                    : step === "contact"
                      ? "Provide your contact information, location, and commission preferences."
                      : step === "password"
                        ? "Create a strong password and agree to our terms and conditions."
                        : "Enter the OTP we sent to your email to verify your account."}
            </p>
          </div>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          {step === "identity" ? (
            <form
              onSubmit={handleIdentitySubmit}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder="Your full name"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>

              <button
                type="submit"
                className="h-11 w-full rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af]"
              >
                Continue to business profile
              </button>
            </form>
          ) : null}

          {step === "business" ? (
            <form
              onSubmit={handleBusinessSubmit}
              className="space-y-6"
              noValidate
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="companyName"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Company name
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Your company name"
                      className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="businessType"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Business type
                  </label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <select
                      id="businessType"
                      required
                      value={businessType}
                      onChange={(event) => setBusinessType(event.target.value)}
                      className="h-11 w-full appearance-none rounded-md border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    >
                      <option value="">Select business type</option>
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                  GST number
                </label>
                <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={gstState}
                    onChange={(event) =>
                      setGstState(
                        event.target.value.replace(/\D/g, "").slice(0, 2),
                      )
                    }
                    placeholder="22"
                    className="h-11 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <input
                    type="text"
                    maxLength={10}
                    value={gstPan}
                    onChange={(event) =>
                      setGstPan(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 10),
                      )
                    }
                    placeholder="AAAAA0000A"
                    className="h-11 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30 md:col-span-2"
                  />
                  <input
                    type="text"
                    maxLength={1}
                    value={gstEntity}
                    onChange={(event) =>
                      setGstEntity(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^0-9A-Z]/g, "")
                          .slice(0, 1),
                      )
                    }
                    placeholder="1"
                    className="h-11 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <input
                    type="text"
                    maxLength={1}
                    value={gstZ}
                    onChange={(event) =>
                      setGstZ(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z]/g, "")
                          .slice(0, 1) || "Z",
                      )
                    }
                    placeholder="Z"
                    className="h-11 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <input
                    type="text"
                    maxLength={1}
                    value={gstCheck}
                    onChange={(event) =>
                      setGstCheck(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^0-9A-Z]/g, "")
                          .slice(0, 1),
                      )
                    }
                    placeholder="5"
                    className="h-11 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {validateGST(gstNumber) ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-3 w-3" /> GST format looks valid
                    </span>
                  ) : (
                    "Format: 2 State + 10 PAN + 1 Entity + Z + 1 Check"
                  )}
                </p>
              </div>

              <div>
                <label
                  htmlFor="gstCertificate"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  GST certificate
                </label>
                <input
                  id="gstCertificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleGSTUpload}
                  className="hidden"
                />
                <label
                  htmlFor="gstCertificate"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 transition-colors hover:border-[#1d4ed8] hover:bg-blue-50"
                >
                  <Upload className="mb-2 h-7 w-7 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700">
                    {gstCertificateFile
                      ? gstCertificateFile.name
                      : "Click to upload GST certificate"}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    PDF or image, max 5MB
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white hover:bg-[#1e40af]"
                >
                  Continue to categories
                </button>
              </div>
            </form>
          ) : null}

          {step === "categories" ? (
            <form
              onSubmit={handleCategoriesSubmit}
              className="space-y-5"
              noValidate
            >
              <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Select categories
                  </p>
                  <p className="text-xs text-zinc-500">
                    Pick up to 3 categories. Required before registration
                    completes.
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                  {selectedCategoryCount}/3 selected
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {CATEGORY_OPTIONS.map((category) => {
                  const isSelected = selectedCategories.includes(category.code);
                  return (
                    <button
                      key={category.code}
                      type="button"
                      onClick={() => toggleCategory(category.code)}
                      className={`rounded-lg border p-4 text-left transition-all ${isSelected ? "border-[#1d4ed8] bg-blue-50 shadow-sm" : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {category.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {category.description}
                          </p>
                        </div>
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${isSelected ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-zinc-300 text-transparent"}`}
                        >
                          ✓
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("business")}
                  className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white hover:bg-[#1e40af]"
                >
                  Continue to contact details
                </button>
              </div>
            </form>
          ) : null}

          {step === "contact" ? (
            <form
              onSubmit={handleContactSubmit}
              className="space-y-6"
              noValidate
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="address"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Street address
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="123 Industrial Area, Sector 5"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label
                    htmlFor="state"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    State
                  </label>
                  <select
                    id="state"
                    required
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    className="h-11 w-full appearance-none rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    City
                  </label>
                  <select
                    id="city"
                    required
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="h-11 w-full appearance-none rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  >
                    <option value="">Select city</option>
                    {INDIAN_CITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    disabled
                    value={country}
                    className="h-11 w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-500 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(event) =>
                      setPincode(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="400001"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Company website{" "}
                  <span className="text-xs text-zinc-500">(optional)</span>
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://example.com"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-800">
                    Location coordinates
                  </p>
                  <button
                    type="button"
                    onClick={captureCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLocating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    {isLocating ? "Fetching..." : "Use current location"}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="latitude"
                      className="mb-1 block text-xs font-medium text-zinc-700"
                    >
                      Latitude
                    </label>
                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      placeholder="19.076090"
                      className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="longitude"
                      className="mb-1 block text-xs font-medium text-zinc-700"
                    >
                      Longitude
                    </label>
                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      placeholder="72.877426"
                      className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="alternatePhone"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Alternate phone{" "}
                    <span className="text-xs text-zinc-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="alternatePhone"
                      type="tel"
                      value={alternatePhone}
                      onChange={(event) =>
                        setAlternatePhone(event.target.value)
                      }
                      placeholder="+91 98765 43211"
                      className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="designation"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Personal designation
                  </label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="designation"
                      type="text"
                      required
                      value={designation}
                      onChange={(event) => setDesignation(event.target.value)}
                      placeholder="e.g., Manager, Owner, Director"
                      className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="businessDescription"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Business description
                </label>
                <textarea
                  id="businessDescription"
                  required
                  value={businessDescription}
                  onChange={(event) =>
                    setBusinessDescription(event.target.value)
                  }
                  placeholder="Describe your business, products or services..."
                  rows={4}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>

              {/* Commission & Payment Terms Section */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="mb-4 text-sm font-semibold text-zinc-900">
                  Commission & Payment Terms
                </h3>
                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="creditCycle"
                      className="mb-1.5 block text-sm font-medium text-zinc-800"
                    >
                      Credit cycle
                    </label>
                    <select
                      id="creditCycle"
                      required
                      value={creditCycle}
                      onChange={(event) => setCreditCycle(event.target.value)}
                      className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    >
                      <option value="">Select credit cycle</option>
                      <option value="net7">7 Days</option>
                      <option value="net10">10 Days</option>
                      <option value="net15">15 Days</option>
                      <option value="net20">20 Days</option>
                      <option value="immediate">Immediate Payment</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {creditCycle === "custom" ? (
                    <div>
                      <label
                        htmlFor="customCreditCycle"
                        className="mb-1.5 block text-sm font-medium text-zinc-800"
                      >
                        Custom credit cycle
                      </label>
                      <input
                        id="customCreditCycle"
                        type="text"
                        required
                        value={customCreditCycle}
                        onChange={(event) =>
                          setCustomCreditCycle(event.target.value)
                        }
                        placeholder="e.g., Net 45 after invoice approval"
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label
                      htmlFor="minCommission"
                      className="mb-1.5 block text-sm font-medium text-zinc-800"
                    >
                      Min. commission (%)
                    </label>
                    <input
                      id="minCommission"
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={minCommission}
                      onChange={(event) => setMinCommission(event.target.value)}
                      placeholder="e.g., 5"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="maxCommission"
                      className="mb-1.5 block text-sm font-medium text-zinc-800"
                    >
                      Max. commission (%)
                    </label>
                    <input
                      id="maxCommission"
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={maxCommission}
                      onChange={(event) => setMaxCommission(event.target.value)}
                      placeholder="e.g., 15"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-600">
                  ℹ️ Minimum commission cannot be greater than maximum
                  commission. Both values shou ju78ld be between 0-100%.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("categories")}
                  className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!hasValidCommissionRange}
                  className="h-11 flex-1 rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue to password
                </button>
              </div>
            </form>
          ) : null}

          {step === "password" ? (
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={7}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    aria-invalid={!isPasswordStrong && password.length > 0}
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p
                    className={
                      hasMinLength ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    At least 7 characters
                  </p>
                  <p
                    className={
                      hasUppercase ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains an uppercase letter
                  </p>
                  <p
                    className={
                      hasLowercase ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains a lowercase letter
                  </p>
                  <p
                    className={hasNumber ? "text-emerald-600" : "text-zinc-500"}
                  >
                    Contains at least 1 number
                  </p>
                  <p
                    className={
                      hasSpecialChar ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains at least 1 special character
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={7}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    aria-invalid={!passwordsMatch}
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {!passwordsMatch ? (
                  <p className="mt-1.5 text-xs text-red-600">
                    Passwords do not match.
                  </p>
                ) : null}
              </div>

              {/* Terms & Conditions */}
              <div className="rounded-lg border border-zinc-200 bg-blue-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeToTerms}
                    onChange={(event) => setAgreeToTerms(event.target.checked)}
                    className="mt-1 rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700">
                    I agree to the{" "}
                    <span className="font-semibold text-[#1d4ed8]">
                      Terms and Conditions
                    </span>{" "}
                    and{" "}
                    <span className="font-semibold text-[#1d4ed8]">
                      Privacy Policy
                    </span>
                    . I understand that by registering as a vendor, I am
                    agreeing to comply with all marketplace policies and
                    regulations.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !passwordsMatch ||
                    !isPasswordStrong ||
                    !agreeToTerms
                  }
                  className="h-11 flex-1 rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </div>
            </form>
          ) : null}

          {step === "verify" ? (
            <div className="space-y-5">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-2 text-sm text-zinc-600">
                  Enter the 6-digit OTP sent to your email
                  {otpExpiry ? (
                    <span className="mt-1 block text-xs text-zinc-500">
                      Expires at {otpExpiry.toLocaleTimeString()}
                    </span>
                  ) : null}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setOtp(value);
                    }}
                    className="h-11 flex-1 rounded-md border border-zinc-300 px-3 text-center text-lg font-medium tracking-widest text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || isVerifyingOTP}
                    className="h-11 whitespace-nowrap rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResendingOTP}
                className="h-11 w-full rounded-md bg-zinc-800 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResendingOTP ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          ) : null}

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#1d4ed8] hover:text-[#1e40af]"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
