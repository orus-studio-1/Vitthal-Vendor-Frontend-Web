"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  Building2,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Phone,
  Briefcase,
  Upload,
  Mail,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import MapPicker, { MapLocationData } from "@/components/shared/MapPicker";

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



const STEP_LABELS: Record<Step, string> = {
  identity: "Identity",
  business: "Business",
  categories: "Categories",
  contact: "Contact",
  password: "Password",
  verify: "Verify",
};

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

const DESIGNATION_OPTIONS = [
  "Manager",
  "Owner",
  "Director",
  "Partner",
  "Proprietor",
  "Sales Head",
  "Other",
];
function validateGST(gst: string) {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  return gstRegex.test(gst);
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [vendorType, setVendorType] = useState<"product" | "service" | "both">("product");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesOptions, setCategoriesOptions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/products/getCategories?type=${vendorType}`);
        if (res.ok) {
          const resData = await res.json();
          setCategoriesOptions(resData.data && resData.data.length > 0 ? resData.data : []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    // Clear previously selected categories whenever vendor type changes
    setSelectedCategories([]);
    fetchCategories();
  }, [vendorType]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  // vendorType and selectedCategories are declared earlier (above the useEffect that depends on them)
  const [gstState, setGstState] = useState("");
  const [gstPan, setGstPan] = useState("");
  const [gstEntity, setGstEntity] = useState("");
  const [gstCheck, setGstCheck] = useState("");
  const [gstZ, setGstZ] = useState("Z");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [selectedCityLabel, setSelectedCityLabel] = useState("");
  const [cityOptions, setCityOptions] = useState<Array<{ city: string; state: string; label: string }>>([]);
  const [cityFieldMode, setCityFieldMode] = useState<"manual" | "select" | "blocked">("manual");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [website, setWebsite] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(
    null,
  );
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [customDesignation, setCustomDesignation] = useState("");
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
  const combinedAddress = useMemo(() => {
    return [
      addressLine1.trim(),
      addressLine2.trim(),
      landmark.trim() ? `Landmark: ${landmark.trim()}` : "",
    ]
      .filter(Boolean)
      .join(", ");
  }, [addressLine1, addressLine2, landmark]);
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

  async function fetchCityAndStateFromPincode(pincodeValue: string) {
    if (pincodeValue.length !== 6) {
      setCityFieldMode("manual");
      setCityOptions([]);
      return;
    }

    setIsFetchingPincode(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/vendors/pincode/${pincodeValue}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (response.ok && data?.success) {
        const places = Array.isArray(data.places)
          ? (data.places as Array<{
            city?: unknown;
            state?: unknown;
            label?: unknown;
          }>)
          : [];
        const normalizedPlaces = places
          .filter(
            (place): place is { city: string; state: string; label: string } =>
              typeof place.city === "string" && typeof place.label === "string",
          )
          .map((place) => ({
            city: place.city,
            state: typeof place.state === "string" ? place.state : "",
            label: place.label,
          }));

        setState(data.state || "");
        setCity("");
        setSelectedCityLabel("");
        setCityOptions(normalizedPlaces.length > 0 ? normalizedPlaces : [{ city: data.city || "", state: data.state || "", label: data.city || "" }].filter((item) => Boolean(item.city)));
        setCityFieldMode("select");
        toast.success(`City and state auto-filled for ${pincodeValue}`);
      } else if (response.status === 404) {
        setState("");
        setCity("");
        setSelectedCityLabel("");
        setCityOptions([]);
        setCityFieldMode("blocked");
        toast.error(data?.message || "Invalid pincode. Please check and try again.");
      } else {
        setCityOptions([]);
        setSelectedCityLabel("");
        setCityFieldMode("manual");
        toast.error(data?.message || "Could not auto-fill city and state. Please enter them manually.");
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
      setCityOptions([]);
      setSelectedCityLabel("");
      setCityFieldMode("manual");
      toast.error("Failed to fetch city and state. Please enter them manually.");
    } finally {
      setIsFetchingPincode(false);
    }
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
    const effectiveDesignation =
      designation === "other" ? customDesignation.trim() : designation.trim();

    if (
      !addressLine1.trim() ||
      !addressLine2.trim() ||
      !city ||
      !state ||
      !pincode.trim() ||
      !phone.trim() ||
      !effectiveDesignation ||
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
      const formData = new FormData();
      formData.append("email", registeredEmail || email.trim());
      formData.append("otp", otp);
      formData.append("companyName", companyName.trim());
      formData.append("businessType", businessType);
      formData.append("vendorType", vendorType);
      formData.append("gstNumber", gstNumber);
      formData.append("companyWebsite", website.trim());
      formData.append("phone", phone.trim());
      formData.append("alternativeNumber", alternatePhone.trim());
      formData.append(
        "designation",
        designation === "other" ? customDesignation.trim() : designation.trim(),
      );
      formData.append("businessDescription", businessDescription.trim());
      formData.append("vendorCategories", JSON.stringify(selectedCategories));
      formData.append("address", combinedAddress);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("country", country);
      formData.append("pincode", pincode.trim());
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append(
        "creditCycle",
        creditCycle === "custom" ? customCreditCycle.trim() : creditCycle.trim(),
      );
      formData.append("minimumCommissionPercentage", String(parseInt(minCommission)));
      formData.append("maximumCommissionPercentage", String(parseInt(maxCommission)));
      if (gstCertificateFile) {
        formData.append("gstCertificate", gstCertificateFile);
      }
      const res = await fetch(`${API_BASE}/api/auth/verify-registration`, {
        method: "POST",
        headers: {
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: formData,
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
      if (data.user) {
        useAuthStore.getState().setUser(data.user);
        await useAuthStore.getState().fetchUser();
      }
    } catch {
      toast.error("Failed to verify OTP. Please try again.");
      console.error("Error verifying OTP.");
    } finally {
      setIsVerifyingOTP(false);
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
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-colors ${index <= activeStepIndex
                      ? "bg-[#1d4ed8] text-white"
                      : "bg-zinc-200 text-zinc-600"
                      }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium whitespace-nowrap ${index <= activeStepIndex
                      ? "text-[#1d4ed8]"
                      : "text-zinc-500"
                      }`}
                  >
                    {STEP_LABELS[item]}
                  </span>
                  {index < STEP_ORDER.length - 1 && (
                    <div
                      className={`absolute w-16 h-0.5 translate-x-12 ${index < activeStepIndex ? "bg-[#1d4ed8]" : "bg-zinc-200"
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
                    ? vendorType === "both" ? "Select Your Categories" : vendorType === "service" ? "Select Your Service Categories" : "Select Your Product Categories"
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
                    ? vendorType === "both"
                      ? "Choose up to 3 product/service categories that best represent your business."
                      : vendorType === "service"
                        ? "Choose up to 3 service categories that best represent what you offer."
                        : "Choose up to 3 product categories that best represent your business."
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

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-800">
                  Vendor type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setVendorType("product")}
                    className={`flex items-center gap-3 rounded-lg border p-3.5 transition-all text-left ${vendorType === "product"
                        ? "border-[#1d4ed8] bg-blue-50/30 text-[#1d4ed8] font-semibold"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${vendorType === "product" ? "border-[#1d4ed8]" : "border-zinc-300"
                      }`}>
                      {vendorType === "product" && (
                        <div className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                      )}
                    </div>
                    <span className="text-sm">Product Seller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVendorType("service")}
                    className={`flex items-center gap-3 rounded-lg border p-3.5 transition-all text-left ${vendorType === "service"
                        ? "border-[#1d4ed8] bg-blue-50/30 text-[#1d4ed8] font-semibold"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      }`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${vendorType === "service" ? "border-[#1d4ed8]" : "border-zinc-300"
                      }`}>
                      {vendorType === "service" && (
                        <div className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                      )}
                    </div>
                    <span className="text-sm">Service Provider</span>
                  </button>
                </div>
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
                    Select {vendorType === "both" ? "product & service" : vendorType === "service" ? "service" : "product"} categories
                  </p>
                  <p className="text-xs text-zinc-500">
                    Pick up to 3 {vendorType === "both" ? "product & service" : vendorType === "service" ? "service" : "product"} categories. Required before registration completes.
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                  {selectedCategoryCount}/3 selected
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {categoriesOptions.length === 0 ? (
                  <div className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 py-10 text-center">
                    <p className="text-sm font-medium text-zinc-700">No {vendorType === "both" ? "product & service" : vendorType === "service" ? "service" : "product"} categories available</p>
                    <p className="mt-1 text-xs text-zinc-400">Please contact the administrator to add {vendorType === "both" ? "product & service" : vendorType === "service" ? "service" : "product"} categories.</p>
                  </div>
                ) : (
                  categoriesOptions.map((category) => {
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
                            {category.min_commision_percentage !== undefined && (
                              <span className="mt-2 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200">
                                Commission: {category.min_commision_percentage}% - {category.max_commision_percentage}%
                              </span>
                            )}
                          </div>
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${isSelected ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-zinc-300 text-transparent"}`}
                          >
                            ✓
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
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
                    htmlFor="addressLine1"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Flat, House no., Building, Company name
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    placeholder="e.g., Shop No. 4, Ground Floor, Sai Plaza"
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
                      placeholder="+91 85300 90303"
                      className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="addressLine2"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Area, Street, Sector, Village
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    required
                    value={addressLine2}
                    onChange={(event) => setAddressLine2(event.target.value)}
                    placeholder="e.g., MIDC Industrial Area, Phase II"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="landmark"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Landmark <span className="text-xs text-zinc-500">(optional)</span>
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    value={landmark}
                    onChange={(event) => setLandmark(event.target.value)}
                    placeholder="e.g., Near Blue Star Factory"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="state"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    required
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    disabled={cityFieldMode === "blocked"}
                    placeholder="Auto-filled from pincode or enter manually"
                    className={`h-11 w-full rounded-md border px-3 text-sm outline-none placeholder:text-zinc-400 ${cityFieldMode === "blocked" ? "border-zinc-300 bg-zinc-100 text-zinc-500" : "border-zinc-300 text-zinc-900 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    City
                  </label>
                  {cityFieldMode === "select" ? (
                    <select
                      id="city"
                      required
                      value={selectedCityLabel}
                      onChange={(event) => {
                        const selectedLabel = event.target.value;
                        const selectedPlace = cityOptions.find((option) => option.label === selectedLabel);
                        setSelectedCityLabel(selectedLabel);
                        setCity(selectedPlace?.city || selectedLabel);
                        if (selectedPlace?.state) {
                          setState(selectedPlace.state);
                        }
                      }}
                      className="h-11 w-full appearance-none rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    >
                      <option value="">Select city</option>
                      {cityOptions.map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : cityFieldMode === "blocked" ? (
                    <select
                      id="city"
                      disabled
                      value=""
                      className="h-11 w-full appearance-none rounded-md border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-500 outline-none"
                    >
                      <option value="">Invalid pincode</option>
                    </select>
                  ) : (
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(event) => {
                        setCity(event.target.value);
                        setSelectedCityLabel("");
                      }}
                      placeholder="Auto-filled from pincode or enter manually"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                  >
                    Pincode
                  </label>
                  <div className="relative">
                    <input
                      id="pincode"
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(event) => {
                        const newPincode = event.target.value.replace(/\D/g, "");
                        setPincode(newPincode);
                        if (newPincode.length !== 6) {
                          setState("");
                          setCity("");
                          setCityOptions([]);
                          setCityFieldMode("manual");
                          return;
                        }
                        fetchCityAndStateFromPincode(newPincode);
                      }}
                      placeholder="400001"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    />
                    {isFetchingPincode && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Company website <span className="text-xs text-zinc-500">(optional)</span>
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

              {/* OpenStreetMap MapPicker for Warehouse / Office Pinpointing */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-800 uppercase tracking-wider block">
                    Warehouse / Office Location (OpenStreetMap)
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Search your location, use GPS, or drag the pin to set your dispatch and pickup coordinates.
                  </p>
                </div>

                <MapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(lat, lng, locData) => {
                    setLatitude(String(lat));
                    setLongitude(String(lng));
                    if (locData?.addressDetails) {
                      if (locData.addressDetails.city && !city) setCity(locData.addressDetails.city);
                      if (locData.addressDetails.state && !state) setState(locData.addressDetails.state);
                      if (locData.addressDetails.postcode && !pincode) setPincode(locData.addressDetails.postcode);
                      if (locData.addressDetails.road && !addressLine1) setAddressLine1(locData.addressDetails.road);
                    }
                  }}
                  height="260px"
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="latitude" className="mb-1 block text-xs font-medium text-zinc-600">
                      Latitude
                    </label>
                    <input
                      id="latitude"
                      type="text"
                      readOnly
                      value={latitude || ""}
                      placeholder="Coordinates set from map"
                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-700 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="mb-1 block text-xs font-medium text-zinc-600">
                      Longitude
                    </label>
                    <input
                      id="longitude"
                      type="text"
                      readOnly
                      value={longitude || ""}
                      placeholder="Coordinates set from map"
                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-700 outline-none font-mono"
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
                      placeholder="+91 85300 90304"
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
                    <select
                      id="designation"
                      required
                      value={designation}
                      onChange={(event) => {
                        setDesignation(event.target.value);
                        if (event.target.value !== "other") {
                          setCustomDesignation("");
                        }
                      }}
                      className="h-11 w-full appearance-none rounded-md border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                    >
                      <option value="">Select designation</option>
                      {DESIGNATION_OPTIONS.map((d) => (
                        <option key={d} value={d === "Other" ? "other" : d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {designation === "other" && (
                    <div className="mt-3">
                      <label
                        htmlFor="customDesignation"
                        className="mb-1.5 block text-sm font-medium text-zinc-800"
                      >
                        Custom designation
                      </label>
                      <input
                        id="customDesignation"
                        type="text"
                        required
                        value={customDesignation}
                        onChange={(event) =>
                          setCustomDesignation(event.target.value)
                        }
                        placeholder="e.g., Chief Procurement Officer"
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                      />
                    </div>
                  )}
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
                  commission. Both values should be between 0-100%.
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
              {/* Premium Email Indicator Banner */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition-all hover:bg-zinc-100/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1d4ed8]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Signing up as
                    </p>
                    <p className="text-sm font-semibold text-zinc-800 break-all">{email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-[#1d4ed8] hover:bg-blue-50 hover:text-[#1e40af] transition-all focus:outline-none"
                  aria-label="Change email"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Change
                </button>
              </div>

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
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-semibold text-[#1d4ed8] hover:underline"
                    >
                      Privacy Policy
                    </Link>
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
