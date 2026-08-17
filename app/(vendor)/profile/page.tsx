"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building2,
  LogOut,
  ChevronRight,
  Camera,
  X,
  MapPin,
  Star,
  Plus,
  Trash2,
  Store,
  ShoppingBag,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import MapPicker, { MapLocationData } from "@/components/shared/MapPicker";

type Address = {
  id: string | number;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
};

type VendorDetails = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_is_active: boolean;
  vendor_phone?: string;
  vendor_company_name?: string;
  vendor_gst_number?: string;
  vendor_address?: string;
  vendor_city?: string;
  vendor_state?: string;
  vendor_country?: string;
  vendor_pincode?: string;
  vendor_latitude?: number;
  vendor_longitude?: number;
  vendor_application_number?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export default function ProfilePage() {
  const { user, fetchUser, logout, deleteAccount } = useAuthStore();
  const router = useRouter();
  const isService = user?.vendorType === "service";
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Vendor details from backend
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agreeDeleteTerms, setAgreeDeleteTerms] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Address management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | number | null>(null);
  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch vendor details from backend
  useLayoutEffect(() => {
    async function fetchVendorDetails() {
      try {
        const response = await fetch(`${API_BASE}/api/vendors/getVendorDetails`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVendorDetails(data.data);

          if (data.data?.vendor_address) {
            const addressObj: Address = {
              id: 1,
              address: data.data.vendor_address,
              city: data.data.vendor_city || "",
              state: data.data.vendor_state || "",
              country: data.data.vendor_country || "India",
              pincode: data.data.vendor_pincode || "",
              latitude: data.data.vendor_latitude || 0,
              longitude: data.data.vendor_longitude || 0,
              is_default: true,
            };
            setAddresses([addressObj]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch vendor details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVendorDetails();
  }, []);

  async function handleLogout() {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  }

  async function confirmAccountDeletion() {
    if (!agreeDeleteTerms) {
      toast.error("Please confirm that you understand the 14-day deletion policy.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Your vendor account has been deactivated.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to process deletion request.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  function resetAddressForm() {
    setAddressForm({
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      latitude: 0,
      longitude: 0,
    });
    setEditingAddressId(null);
    setIsAddingAddress(false);
  }

  const handleMapLocationChange = (lat: number, lng: number, locData?: MapLocationData) => {
    setAddressForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: locData?.addressDetails?.road || locData?.displayName || prev.address,
      city: locData?.addressDetails?.city || prev.city,
      state: locData?.addressDetails?.state || prev.state,
      country: locData?.addressDetails?.country || prev.country,
      pincode: locData?.addressDetails?.postcode || prev.pincode,
    }));
  };

  async function handleAddAddress() {
    try {
      const response = await fetch(`${API_BASE}/api/vendors/createVendorAddress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        toast.success("Address saved successfully");
        const data = await response.json();
        setAddresses((prev) => [...prev, data.vendorAddress || addressForm]);
        resetAddressForm();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add address");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleUpdateAddress() {
    if (!editingAddressId) return;

    try {
      const response = await fetch(`${API_BASE}/api/vendors/updateVendorAddress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        toast.success("Address updated successfully");
        const data = await response.json();
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingAddressId ? data.vendorAddress || addressForm : addr))
        );
        resetAddressForm();
      } else {
        toast.error("Failed to update address");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteAddress(addressId: string | number) {
    toast.error("Address deletion is restricted. Contact admin to change registered address.");
  }

  function startEditAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressForm({
      address: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <main className="flex-1 bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-zinc-500">
              <Link href="/" className="hover:text-zinc-800 transition-colors">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-800 font-medium">My Profile</span>
            </nav>

            {/* Vendor Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Link
                href={isService ? "/services" : "/products"}
                className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Store size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {isService ? "My Services" : "My Products"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {isService ? "Manage your services" : "Manage your products"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-400 group-hover:text-zinc-600" />
              </Link>

              <Link
                href={isService ? "/bookings" : "/orders"}
                className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {isService ? "Service Bookings" : "Store Orders"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {isService ? "View service bookings" : "View customer orders"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-400 group-hover:text-zinc-600" />
              </Link>
            </div>

            {/* Profile Header Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              {/* Header Banner */}
              <div className="h-28 bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6]" />

              <div className="px-6 pb-6 sm:px-8">
                {/* Avatar + Info Row */}
                <div className="-mt-14 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="relative group">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-zinc-100 text-zinc-600 shadow-lg overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={20} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 flex flex-col justify-center text-center sm:text-left pt-3">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-xl font-bold text-zinc-900">
                        {user?.username || "Vendor"}
                      </h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <ShieldCheck size={12} /> Verified Seller
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {user?.email || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-semibold">
                    <Lock size={13} /> Official Merchant Identity
                  </div>
                </div>

                {/* Account Information (Read-only for Name, Email, Phone) */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-zinc-900">
                      Merchant Credentials
                    </h2>
                    <span className="text-xs text-zinc-400">Identity details are verified & protected</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <User size={14} /> Full Name
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded font-mono">Protected</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {user?.username || "—"}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Mail size={14} /> Email Address
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded font-mono">Verified</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {user?.email || "—"}
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Phone size={14} /> Registered Mobile
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded font-mono">Verified</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {vendorDetails?.vendor_phone || "—"}
                      </p>
                    </div>

                    {/* Company */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Building2 size={14} /> Business / Entity Name
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded font-mono">Onboarded</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {vendorDetails?.vendor_company_name || "—"}
                      </p>
                    </div>

                    {/* Application ID */}
                    {vendorDetails?.vendor_application_number && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 sm:col-span-2">
                        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                          <span className="flex items-center gap-1.5 font-medium">
                            <FileText size={14} /> Vendor License / Application Number
                          </span>
                        </div>
                        <p className="text-sm font-mono font-bold text-blue-700">
                          {vendorDetails.vendor_application_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Section */}
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900">
                        Registered Warehouse & Billing Location
                      </h2>
                      <p className="text-xs text-zinc-500">Pick-up and dispatch point used for deliveries</p>
                    </div>
                    {!isAddingAddress && editingAddressId === null && addresses.length === 0 && (
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] transition-colors text-sm font-semibold cursor-pointer"
                      >
                        <Plus size={14} />
                        Add Address
                      </button>
                    )}
                  </div>

                  {/* Add/Edit Address Form with OpenStreetMap */}
                  {(isAddingAddress || editingAddressId !== null) && (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 space-y-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                          <MapPin className="text-emerald-600" size={16} />
                          {editingAddressId ? "Update Location & Address" : "Set Warehouse Location"}
                        </h3>
                        <button
                          onClick={resetAddressForm}
                          className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Integrated OpenStreetMap MapPicker */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700 block">
                          Pinpoint on Map (OpenStreetMap)
                        </label>
                        <MapPicker
                          latitude={addressForm.latitude}
                          longitude={addressForm.longitude}
                          onChange={handleMapLocationChange}
                          height="240px"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                          Street / Facility Address
                        </label>
                        <input
                          type="text"
                          value={addressForm.address}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#1d4ed8]"
                          placeholder="e.g. Plot 42, MIDC Industrial Area"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 mb-1 block">City</label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                city: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 mb-1 block">State</label>
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                state: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 mb-1 block">Country</label>
                          <input
                            type="text"
                            value={addressForm.country}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                country: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 mb-1 block">Pincode</label>
                          <input
                            type="text"
                            value={addressForm.pincode}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                pincode: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                        >
                          {editingAddressId ? "Update Address" : "Save Address"}
                        </button>
                        <button
                          onClick={resetAddressForm}
                          className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Address Display */}
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                <MapPin size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 text-sm">
                                  {addr.address}
                                </p>
                                <p className="text-sm text-zinc-600 mt-0.5">
                                  {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {addr.country}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <Star size={11} fill="currentColor" /> Primary Location
                                  </span>
                                  {addr.latitude && addr.longitude ? (
                                    <span className="text-[11px] font-mono text-zinc-400">
                                      GPS: {Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditAddress(addr)}
                                className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                                title="Edit address"
                              >
                                <MapPin size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center">
                      <MapPin size={32} className="mx-auto text-zinc-300 mb-2" />
                      <p className="text-sm text-zinc-500">No warehouse address saved yet</p>
                      {!isAddingAddress && (
                        <button
                          onClick={() => setIsAddingAddress(true)}
                          className="mt-2 text-[#1d4ed8] text-sm font-semibold hover:underline cursor-pointer"
                        >
                          Add warehouse address with map
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="mt-8 pt-6 border-t border-red-100">
                  <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        Danger Zone: Delete Vendor Account
                      </h3>
                      <p className="text-xs text-red-700 mt-1 max-w-xl">
                        Request permanent deactivation and deletion of your vendor profile and product catalogs under the 14-day recovery cycle policy.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm whitespace-nowrap cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Delete Account
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-6 w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-red-600 transition-colors font-semibold text-sm shadow-xs cursor-pointer"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </>
        )}
      </div>

      {/* Delete Account Modal with 14-Day Cycle Policy */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5 border-b border-zinc-100 pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  Delete Vendor Account
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  14-Day Cycle & Data Purge Policy
                </p>
              </div>
            </div>

            {/* Policy Explanations */}
            <div className="space-y-3 rounded-xl bg-amber-50/70 border border-amber-200/60 p-4 text-xs text-amber-900 leading-relaxed">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p>
                  <strong>Immediate Deactivation:</strong> Your vendor storefront, products, and active quotations will be hidden from buyers immediately.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p>
                  <strong>14-Day Recovery Cycle:</strong> If you change your mind, simply log back into this portal within <strong>14 days</strong> to automatically restore and reactivate your account.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p>
                  <strong>Permanent Data Deletion:</strong> After the 14-day cycle expires, all your business listings, catalog images, and profile data will be permanently purged from our database.
                </p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 text-xs text-zinc-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreeDeleteTerms}
                onChange={(e) => setAgreeDeleteTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span>
                I understand that my vendor account will be deactivated now and permanently deleted after 14 days if not recovered.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAgreeDeleteTerms(false);
                }}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAccountDeletion}
                disabled={!agreeDeleteTerms || isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Deletion"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
