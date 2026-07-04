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
  Edit2,
  Camera,
  X,
  Check,
  MapPin,
  Star,
  Plus,
  Trash2,
  Store,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

type Address = {
  id: string | number;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
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
  const { user, fetchUser, logout } = useAuthStore();
  const router = useRouter();
  const isService = user?.vendorType === "service";
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Vendor details from backend
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Address management
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<
    string | number | null
  >(null);
  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch vendor details from backend
  useLayoutEffect(() => {
    async function fetchVendorDetails() {
      try {
        const response = await fetch(
          `${API_BASE}/api/vendors/getVendorDetails`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-request-from": "vendor",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setVendorDetails(data.data);

          // Handle address from the single address record
          if (data.data?.vendor_address) {
            const addressObj: Address = {
              id: 1, // Since it's a one-to-one relationship, we use a fixed ID
              address: data.data.vendor_address,
              city: data.data.vendor_city,
              state: data.data.vendor_state,
              country: data.data.vendor_country,
              pincode: data.data.vendor_pincode,
              is_default: true,
            };
            setAddresses([addressObj]);
          }

          if (data.data?.vendor_phone) setEditPhone(data.data.vendor_phone);
          if (data.data?.vendor_company_name)
            setEditCompany(data.data.vendor_company_name);
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

  function handleEdit() {
    setEditName(user?.username || "");
    setEditEmail(user?.email || "");
    setEditPhone(vendorDetails?.vendor_phone || "");
    setEditCompany(vendorDetails?.vendor_company_name || "");
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditName(user?.username || "");
    setEditEmail(user?.email || "");
    setEditPhone(vendorDetails?.vendor_phone || "");
    setEditCompany(vendorDetails?.vendor_company_name || "");
  }

  async function handleSave() {
    setIsEditing(false);
    toast.success("Profile updated successfully");
  }

  function resetAddressForm() {
    setAddressForm({
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    });
    setEditingAddressId(null);
    setIsAddingAddress(false);
  }

  async function handleAddAddress() {
    try {
      const response = await fetch(
        `${API_BASE}/api/vendors/createVendorAddress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          credentials: "include",
          body: JSON.stringify({
            ...addressForm,
            latitude: 0,
            longitude: 0,
          }),
        },
      );

      if (response.ok) {
        toast.success("Address added successfully");
        const data = await response.json();
        setAddresses((prev) => [...prev, data.vendorAddress]);
        resetAddressForm();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add address");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function handleUpdateAddress() {
    if (!editingAddressId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/vendors/updateVendorAddress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          credentials: "include",
          body: JSON.stringify({
            ...addressForm,
            latitude: 0,
            longitude: 0,
          }),
        },
      );

      if (response.ok) {
        toast.success("Address updated successfully");
        const data = await response.json();
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === editingAddressId ? data.vendorAddress : addr,
          ),
        );
        resetAddressForm();
      } else {
        toast.error("Failed to update address");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function handleDeleteAddress(addressId: string | number) {
    toast.error("Address deletion is not available yet.");
  }

  function startEditAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressForm({
      address: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
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
    <main className="flex-1 bg-zinc-50">
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
                <ChevronRight
                  size={20}
                  className="text-zinc-400 group-hover:text-zinc-600"
                />
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
                <ChevronRight
                  size={20}
                  className="text-zinc-400 group-hover:text-zinc-600"
                />
              </Link>
            </div>

            {/* Profile Header Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              {/* Header Banner */}
              <div className="h-28 bg-linear-to-r from-[#1d4ed8] to-[#3b82f6]" />

              <div className="px-6 pb-6 sm:px-8">
                {/* Avatar + Info Row */}
                <div className="-mt-14 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="relative group">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-zinc-100 text-zinc-600 shadow-lg overflow-hidden">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
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
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xl font-bold text-white border-b-2 border-[#1d4ed8] focus:outline-none bg-transparent text-center sm:text-left w-full sm:w-auto"
                        placeholder="Your Name"
                      />
                    ) : (
                      <h1 className="text-xl font-bold text-white">
                        {user?.username || "Vendor"}
                      </h1>
                    )}
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {user?.email || "—"}
                    </p>
                  </div>

                  <button
                    onClick={isEditing ? handleSave : handleEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] transition-colors font-medium text-sm"
                  >
                    {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </button>
                </div>

                {/* Account Information */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-zinc-900">
                      Account Details
                    </h2>
                    {isEditing && (
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors text-sm"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                        <User size={14} />
                        Full Name
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-sm font-medium text-zinc-900 border-b border-zinc-300 focus:outline-none focus:border-[#1d4ed8] bg-transparent py-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-zinc-900">
                          {user?.username || "—"}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                        <Mail size={14} />
                        Email Address
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-zinc-900">
                          {user?.email || "—"}
                        </p>
                        {isEditing && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">Locked</span>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                        <Phone size={14} />
                        Phone Number
                      </div>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full text-sm font-medium text-zinc-900 border-b border-zinc-300 focus:outline-none focus:border-[#1d4ed8] bg-transparent py-1"
                          placeholder="Add phone number"
                        />
                      ) : (
                        <p className="text-sm font-medium text-zinc-900">
                          {vendorDetails?.vendor_phone || "—"}
                        </p>
                      )}
                    </div>

                    {/* Company */}
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                        <Building2 size={14} />
                        Business Name
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className="w-full text-sm font-medium text-zinc-900 border-b border-zinc-300 focus:outline-none focus:border-[#1d4ed8] bg-transparent py-1"
                          placeholder="Add business name"
                        />
                      ) : (
                        <p className="text-sm font-medium text-zinc-900">
                          {vendorDetails?.vendor_company_name ||
                            editCompany ||
                            "—"}
                        </p>
                      )}
                    </div>

                    {/* Application ID */}
                    {vendorDetails?.vendor_application_number && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                          <FileText size={14} />
                          Application ID
                        </div>
                        <p className="text-sm font-mono font-semibold text-blue-600">
                          {vendorDetails.vendor_application_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Section */}
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-zinc-900">
                      My Addresses ({addresses.length})
                    </h2>
                    {!isAddingAddress && editingAddressId === null && (
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] transition-colors text-sm"
                      >
                        <Plus size={14} />
                        Add Address
                      </button>
                    )}
                  </div>

                  {/* Add/Edit Address Form */}
                  {(isAddingAddress || editingAddressId !== null) && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-zinc-900">
                          {editingAddressId
                            ? "Edit Address"
                            : "Add New Address"}
                        </h3>
                        <button
                          onClick={resetAddressForm}
                          className="p-1 rounded hover:bg-zinc-200 text-zinc-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">
                          Street Address
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
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#1d4ed8]"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            City
                          </label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                city: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            State
                          </label>
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                state: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            Country
                          </label>
                          <input
                            type="text"
                            value={addressForm.country}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                country: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            Pincode
                          </label>
                          <input
                            type="text"
                            value={addressForm.pincode}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                pincode: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#1d4ed8]"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={
                            editingAddressId
                              ? handleUpdateAddress
                              : handleAddAddress
                          }
                          className="flex-1 py-2 rounded-lg bg-[#1d4ed8] text-white text-sm font-medium hover:bg-[#1e40af] transition-colors"
                        >
                          {editingAddressId ? "Update Address" : "Save Address"}
                        </button>
                        <button
                          onClick={resetAddressForm}
                          className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Address List */}
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`rounded-lg border p-4 ${
                            addr.is_default
                              ? "border-blue-300 bg-blue-50/30"
                              : "border-zinc-200 bg-zinc-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  addr.is_default
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                <MapPin size={18} />
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900">
                                  {addr.address}
                                </p>
                                <p className="text-sm text-zinc-600 mt-0.5">
                                  {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-sm text-zinc-500">
                                  {addr.country}
                                </p>
                                {addr.is_default && (
                                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600">
                                    <Star size={12} fill="currentColor" />
                                    Default Address
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditAddress(addr)}
                                className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
                                title="Edit address"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-2 rounded-lg hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
                                title="Delete address"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center">
                      <MapPin
                        size={32}
                        className="mx-auto text-zinc-300 mb-2"
                      />
                      <p className="text-sm text-zinc-500">
                        No addresses saved yet
                      </p>
                      {!isAddingAddress && (
                        <button
                          onClick={() => setIsAddingAddress(true)}
                          className="mt-2 text-[#1d4ed8] text-sm font-medium hover:underline"
                        >
                          Add your first address
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-6 w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-medium text-sm"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </>
        )}
      </div>
    </main>
  );
}
