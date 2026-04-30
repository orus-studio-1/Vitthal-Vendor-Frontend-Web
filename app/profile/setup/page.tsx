"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Loader2, Building2, Phone, FileText, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type SetupStep = "company" | "address";

const validateGST = (gst: string): boolean => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  return gstRegex.test(gst);
};

export default function SetupProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState<SetupStep>("company");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Company details
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  
  // GST parts - split into 5 components
  const [gstState, setGstState] = useState("");      // 2 digits
  const [gstPan, setGstPan] = useState("");          // 10 chars
  const [gstEntity, setGstEntity] = useState("");  // 1 digit
  const [gstCheck, setGstCheck] = useState("");     // 1 letter
  const [gstZ, setGstZ] = useState("Z");             // 1 letter (usually Z)

  // Address details
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/checkSetupStatus`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        setIsSetupComplete(data.isSetupComplete);
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsGettingLocation(false);
        toast.success("Location captured successfully!");
      },
      (error) => {
        setIsGettingLocation(false);
        toast.error("Failed to get location. Please enable location services.");
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const gstNumber = gstState + gstPan + gstEntity + gstZ + gstCheck;

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone) {
      toast.error("Please fill all company details");
      return;
    }

    if (gstState.length !== 2 || gstPan.length !== 10 || gstEntity.length !== 1 || gstCheck.length !== 1 || gstZ.length !== 1) {
      toast.error("Please complete all GST fields");
      return;
    }

    if (!validateGST(gstNumber)) {
      toast.error("Please enter valid GST details");
      return;
    }

    setStep("address");
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !city || !state || !country || !pincode) {
      toast.error("Please fill all address details");
      return;
    }

    if (latitude === null || longitude === null) {
      toast.error("Please capture your location");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, create/update vendor details
      const vendorRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/createVendor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            companyName,
            phone,
            gstNumber,
          }),
        }
      );

      const vendorData = await vendorRes.json();

      if (!vendorRes.ok) {
        // If vendor already exists, try updating
        if (vendorData.message?.includes("already exists") || vendorData.message?.includes("duplicate")) {
          const updateRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/updateVendorBasicDetails`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                companyName,
                phone,
                gstNumber,
              }),
            }
          );

          const updateData = await updateRes.json();
          if (!updateRes.ok) {
            toast.error(updateData.message || "Failed to update vendor details");
            setIsSubmitting(false);
            return;
          }
        } else {
          toast.error(vendorData.message || "Failed to create vendor profile");
          setIsSubmitting(false);
          return;
        }
      }

      // Then, create/update address
      const addressRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/createVendorAddress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            address,
            city,
            state,
            country,
            pincode,
            latitude,
            longitude,
          }),
        }
      );

      const addressData = await addressRes.json();

      if (!addressRes.ok) {
        // If address already exists, try updating
        if (addressData.message?.includes("already exists")) {
          const updateAddressRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/updateVendorAddress`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                address,
                city,
                state,
                country,
                pincode,
                latitude,
                longitude,
              }),
            }
          );

          const updateAddressData = await updateAddressRes.json();
          if (!updateAddressRes.ok) {
            toast.error(updateAddressData.message || "Failed to update address");
            setIsSubmitting(false);
            return;
          }
        } else {
          toast.error(addressData.message || "Failed to create address");
          setIsSubmitting(false);
          return;
        }
      }

      toast.success("Profile setup completed successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {isCheckingSetup ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : isSetupComplete ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Profile Already Set Up
            </h1>
            <p className="text-sm text-zinc-600 mb-6">
              You have already completed your vendor profile setup. You can edit your details from the profile page.
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Go to Profile
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-zinc-900">
                {step === "company" ? "Company Details" : "Business Address"}
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                {step === "company"
                  ? "Tell us about your business to get started"
                  : "Provide your business location for shipping and logistics"}
              </p>
              {/* Progress indicator */}
              <div className="mt-6 flex justify-center gap-2">
                <div
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step === "company" ? "bg-blue-600" : "bg-blue-600"
                  }`}
                />
                <div
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step === "address" ? "bg-blue-600" : "bg-zinc-300"
                  }`}
                />
              </div>
            </div>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              {step === "company" ? (
                <form onSubmit={handleCompanySubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="companyName"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company name"
                        className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 w-full rounded-md border border-zinc-300 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-800">
                      GST Number
                    </label>
                    <div className="flex items-center gap-1.5">
                      {/* State Code - 2 digits */}
                      <input
                        id="gst-state"
                        type="text"
                        required
                        maxLength={2}
                        value={gstState}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const val = rawVal.replace(/\D/g, "").slice(0, 2);
                          setGstState(val);
                          // Only auto-focus forward when adding chars (not on backspace/delete)
                          if (val.length === 2 && rawVal.length >= gstState.length) {
                            document.getElementById("gst-pan")?.focus();
                          }
                        }}
                        placeholder="22"
                        className="h-11 w-14 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                      <span className="text-zinc-400">-</span>
                      {/* PAN - 5 letters + 4 digits + 1 letter */}
                      <input
                        id="gst-pan"
                        type="text"
                        required
                        maxLength={10}
                        value={gstPan}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const val = rawVal.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                          setGstPan(val);
                          if (val.length === 10 && rawVal.length >= gstPan.length) {
                            document.getElementById("gst-entity")?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !gstPan) {
                            e.preventDefault();
                            document.getElementById("gst-state")?.focus();
                          }
                        }}
                        placeholder="AAAAA0000A"
                        className="h-11 w-32 rounded-md border border-zinc-300 px-2 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                      <span className="text-zinc-400">-</span>
                      {/* Entity - 1 char */}
                      <input
                        id="gst-entity"
                        type="text"
                        required
                        maxLength={1}
                        value={gstEntity}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const val = rawVal.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 1);
                          setGstEntity(val);
                          if (val.length === 1 && rawVal.length >= gstEntity.length) {
                            document.getElementById("gst-z")?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !gstEntity) {
                            e.preventDefault();
                            document.getElementById("gst-pan")?.focus();
                          }
                        }}
                        placeholder="1"
                        className="h-11 w-10 rounded-md border border-zinc-300 px-1 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                      <span className="text-zinc-400">-</span>
                      {/* Z - 1 letter (usually Z) */}
                      <input
                        id="gst-z"
                        type="text"
                        required
                        maxLength={1}
                        value={gstZ}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const val = rawVal.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
                          const newVal = val || "Z";
                          setGstZ(newVal);
                          if (val && rawVal.length >= gstZ.length) {
                            document.getElementById("gst-check")?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && gstZ === "Z") {
                            e.preventDefault();
                            document.getElementById("gst-entity")?.focus();
                          }
                        }}
                        placeholder="Z"
                        className="h-11 w-10 rounded-md border border-zinc-300 px-1 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                      <span className="text-zinc-400">-</span>
                      {/* Check Digit - 1 char */}
                      <input
                        id="gst-check"
                        type="text"
                        required
                        maxLength={1}
                        value={gstCheck}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 1);
                          setGstCheck(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !gstCheck) {
                            e.preventDefault();
                            document.getElementById("gst-z")?.focus();
                          }
                        }}
                        placeholder="5"
                        className="h-11 w-10 rounded-md border border-zinc-300 px-1 text-center text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-zinc-500">
                        {gstState.length === 2 && gstPan.length === 10 && gstEntity.length === 1 && gstCheck.length === 1 && gstZ.length === 1 ? (
                          validateGST(gstNumber) ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> Valid GST: {gstNumber}
                            </span>
                          ) : (
                            <span className="text-red-500">Invalid GST format</span>
                          )
                        ) : (
                          "Format: 2 State + 10 PAN + 1 Entity + Z + 1 Check"
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="h-11 w-full rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Continue to Address
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-medium text-zinc-800"
                    >
                      Street Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Industrial Area, Sector 5"
                      className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mumbai"
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="country"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pincode"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        Pincode
                      </label>
                      <input
                        id="pincode"
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        placeholder="400001"
                        className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-800">
                      Location Coordinates
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex-1 flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            {latitude && longitude
                              ? "Update Location"
                              : "Get Current Location"}
                          </>
                        )}
                      </button>
                    </div>
                    {latitude && longitude && (
                      <div className="mt-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                        <p>
                          <strong>Latitude:</strong> {latitude.toFixed(6)}
                        </p>
                        <p>
                          <strong>Longitude:</strong> {longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("company")}
                      className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !latitude || !longitude}
                      className="h-11 flex-1 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}