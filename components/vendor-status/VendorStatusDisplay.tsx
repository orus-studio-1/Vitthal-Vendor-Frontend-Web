'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit, 
  Upload, 
  Loader2, 
  MapPin, 
  Check, 
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorStatusDisplayProps {
  status: string | null;
  applicationNumber?: string | null;
  reconsiderationNotes?: string | null;
  onStatusUpdated?: () => void;
}

const CATEGORY_OPTIONS = [
  { code: 'metal_fabrication_parts', label: 'Metal & Fabrication Products', description: 'Steel, aluminium, copper, and fabricated parts' },
  { code: 'electrical_automation_components', label: 'Electrical & Electronics Manufacturing', description: 'Cables, switches, panels, automation, and electronics' },
  { code: 'industrial_machinery_equipment', label: 'Machinery & Industrial Equipment', description: 'Industrial equipment, tools, and machine parts' },
  { code: 'construction_building_materials', label: 'Construction & Building Material', description: 'Cement, tiles, bricks, and building materials' },
  { code: 'automotive_spare_parts', label: 'Automobile & Auto Parts', description: 'Vehicle parts and transport components' },
  { code: 'plastic_polymer_components', label: 'Plastic & Polymer Products', description: 'Polymers, granules, and molded plastic goods' },
  { code: 'food_agriculture_supplies', label: 'Food & Agriculture Processing', description: 'Seeds, fertilizers, farm inputs, and food processing supplies' },
  { code: 'laboratory_pharma_consumables', label: 'Chemical & Pharma Manufacturing', description: 'Industrial chemicals, pharma supplies, and lab consumables' },
  { code: 'modular_furniture_wood', label: 'Furniture & Wood Products', description: 'Furniture, wood products, and modular fittings' },
  { code: 'renewable_energy_systems', label: 'Renewable Energy Products', description: 'Solar, energy storage, and renewable energy systems' },
  { code: 'packaging_logistics_supplies', label: 'Packaging Industry', description: 'Boxes, containers, films, and packing supplies' },
  { code: 'textile_garment_materials', label: 'Textile & Garments', description: 'Fabrics, yarns, garments, and textile supplies' },
  { code: 'cnc_industrial_tooling', label: 'CNC & VMC Tooling Product Categories', description: 'CNC, VMC, tooling, fixtures, and machining supplies' }
];

const BUSINESS_TYPES = [
  'Manufacturing',
  'Trading',
  'Service Provider',
  'Distributor',
  'Dealer',
  'Exporter',
  'Importer',
  'Other'
];

const DESIGNATION_OPTIONS = [
  'Manager',
  'Owner',
  'Director',
  'Partner',
  'Proprietor',
  'Sales Head',
  'Other'
];

export default function VendorStatusDisplay({ 
  status, 
  applicationNumber, 
  reconsiderationNotes,
  onStatusUpdated 
}: VendorStatusDisplayProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<any[]>(CATEGORY_OPTIONS);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/getCategories`);
        if (res.ok) {
          const resData = await res.json();
          if (resData.data && resData.data.length > 0) {
            setCategoriesOptions(resData.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(null);
  const [existingGstLink, setExistingGstLink] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [alternativeNumber, setAlternativeNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [creditCycle, setCreditCycle] = useState('');
  const [minCommission, setMinCommission] = useState('');
  const [maxCommission, setMaxCommission] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Address Fields State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Auxiliary States
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [locating, setLocating] = useState(false);

  const fetchDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/getVendorDetails`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        const d = resData.data;
        setCompanyName(d.vendor_company_name || '');
        setBusinessType(d.vendor_business_type || '');
        setGstNumber(d.vendor_gst_number || '');
        setExistingGstLink(d.vendor_gst_certificate_link || '');
        setCompanyWebsite(d.vendor_company_website || '');
        setPhone(d.vendor_phone || '');
        setAlternativeNumber(d.vendor_alternative_number || '');
        setDesignation(d.vendor_designation || '');
        setBusinessDescription(d.vendor_business_description || '');
        setCreditCycle(d.vendor_credit_cycle || '');
        setMinCommission(d.vendor_minimum_commision_percentage !== null ? String(d.vendor_minimum_commision_percentage) : '');
        setMaxCommission(d.vendor_maximum_commision_percentage !== null ? String(d.vendor_maximum_commision_percentage) : '');
        setSelectedCategories(d.vendor_categories?.map((c: any) => c.code) || []);
        
        setAddress(d.vendor_address || '');
        setCity(d.vendor_city || '');
        setStateName(d.vendor_state || '');
        setCountry(d.vendor_country || 'India');
        setPincode(d.vendor_pincode || '');
        setLatitude(d.vendor_latitude !== null ? String(d.vendor_latitude) : '');
        setLongitude(d.vendor_longitude !== null ? String(d.vendor_longitude) : '');
        
        setShowEditForm(true);
      } else {
        toast.error("Failed to load your existing application details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while loading details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    if (cleaned.length === 6) {
      setFetchingPincode(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/pincode/${cleaned}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setStateName(data.state || "");
          setCity(data.city || "");
          toast.success("City and state auto-filled");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  const captureLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Location coordinates captured!");
      },
      (err) => {
        setLocating(false);
        toast.error("Failed to capture location. Please check browser permissions.");
      }
    );
  };

  const handleGSTUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPEG/PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setGstCertificateFile(file);
    toast.success("New GST certificate selected");
  };

  const handleCategoryToggle = (code: string) => {
    setSelectedCategories(curr => {
      if (curr.includes(code)) {
        return curr.filter(c => c !== code);
      }
      if (curr.length >= 3) {
        toast.error("You can select up to 3 categories");
        return curr;
      }
      return [...curr, code];
    });
  };

  const handleResubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !companyName.trim() || 
      !businessType || 
      !gstNumber.trim() || 
      !phone.trim() || 
      !designation.trim() || 
      !businessDescription.trim() || 
      !address.trim() || 
      !city.trim() || 
      !stateName.trim() || 
      !pincode.trim() || 
      !creditCycle.trim() || 
      !minCommission.trim() || 
      !maxCommission.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error("Please select at least one vendor category.");
      return;
    }

    if (!latitude || !longitude) {
      toast.error("Please capture your location coordinates.");
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

    setSubmitting(true);

    try {
      let uploadedCertificateLink = existingGstLink;
      if (gstCertificateFile) {
        const formData = new FormData();
        formData.append("file", gstCertificateFile);
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.success) {
          uploadedCertificateLink = uploadData.fileName;
        } else {
          toast.error(uploadData.message || "Failed to upload GST certificate.");
          setSubmitting(false);
          return;
        }
      }

      if (!uploadedCertificateLink) {
        toast.error("GST Certificate is required.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/completeSetup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        credentials: "include",
        body: JSON.stringify({
          companyName: companyName.trim(),
          businessType,
          gstNumber: gstNumber.trim(),
          companyWebsite: companyWebsite.trim(),
          gstCertificateLink: uploadedCertificateLink,
          phone: phone.trim(),
          alternativeNumber: alternativeNumber.trim(),
          designation,
          businessDescription: businessDescription.trim(),
          vendorCategories: selectedCategories,
          address: address.trim(),
          city: city.trim(),
          state: stateName.trim(),
          country,
          pincode: pincode.trim(),
          latitude,
          longitude,
          creditCycle: creditCycle.trim(),
          minimumCommissionPercentage: minComm,
          maximumCommissionPercentage: maxComm,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Application details updated and resubmitted successfully!");
        setShowEditForm(false);
        if (onStatusUpdated) onStatusUpdated();
      } else {
        toast.error(data.message || "Resubmission failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to resubmit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'setup_required':
        return {
          icon: AlertCircle,
          title: 'Registration Incomplete',
          description: 'Your account exists, but the vendor application was not completed. Please register again with OTP verification, GST certificate, categories, and contact details.',
          bgColor: 'bg-amber-50',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-950',
          descriptionColor: 'text-amber-800',
          borderColor: 'border-amber-200'
        };
      case 'pending':
        return {
          icon: Clock,
          title: 'Application Under Review',
          description: 'Your vendor application is currently being reviewed by our team. We will notify you once there\'s an update.',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          descriptionColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'reconsideration':
        return {
          icon: AlertCircle,
          title: 'Reconsideration Requested',
          description: 'The administrator has requested updates to your vendor application. Please review the feedback below and update your details.',
          bgColor: 'bg-amber-50',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-950',
          descriptionColor: 'text-amber-800',
          borderColor: 'border-amber-200'
        };
      case 'agreement_sent':
      case 'agreement':
        return {
          icon: FileText,
          title: 'Application Under Review',
          description: 'Your uploaded documents are being reviewed by our team. We will notify you once there is an update.',
          bgColor: 'bg-amber-50',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          descriptionColor: 'text-amber-700',
          borderColor: 'border-amber-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Application Approved',
          description: 'Congratulations! Your vendor application has been approved. You can now access all vendor features.',
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          descriptionColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Application Rejected',
          description: 'Unfortunately, your vendor application has been rejected. Please contact support for more information.',
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          descriptionColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'blocked':
        return {
          icon: XCircle,
          title: 'Account Blocked',
          description: 'Your vendor account has been blocked by the Administrator. You cannot access the dashboard or perform any actions.',
          bgColor: 'bg-rose-50',
          iconColor: 'text-rose-600',
          titleColor: 'text-rose-900',
          descriptionColor: 'text-rose-700',
          borderColor: 'border-rose-200'
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Status Unknown',
          description: 'Unable to determine your application status. Please contact support.',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          descriptionColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (showEditForm) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="border-b border-zinc-200 bg-linear-to-r from-amber-50/50 to-white px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full">
                Edit & Resubmit
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 mt-2">Modify Application Details</h2>
              <p className="text-sm text-zinc-500 mt-1">Please correct the fields requested by the admin and resubmit.</p>
            </div>
            
            <button 
              onClick={() => setShowEditForm(false)}
              className="text-zinc-500 hover:text-zinc-800 text-sm font-semibold px-4 py-2 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition"
            >
              Back to Status
            </button>
          </div>

          {/* Admin Note Banner */}
          {reconsiderationNotes && (
            <div className="mx-6 sm:mx-8 mt-6 p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">Administrator's Review Note</p>
                <p className="text-sm text-amber-800 mt-1 leading-relaxed">{reconsiderationNotes}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleResubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* Section 1: Business Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-600 font-bold">1</span>
                Company Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Company Name *</span>
                  <input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Business Type *</span>
                  <select
                    required
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white transition"
                  >
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">GST Number *</span>
                  <input
                    required
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Company Website</span>
                  <input
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                    placeholder="e.g. www.company.com"
                  />
                </label>
              </div>

              {/* Document upload */}
              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 mt-4">
                <span className="text-xs font-semibold text-zinc-600 block mb-2">GST Certificate *</span>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer transition select-none">
                    <Upload className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium">Choose new file</span>
                    <input 
                      type="file" 
                      accept="application/pdf,image/png,image/jpeg,image/jpg" 
                      onChange={handleGSTUpload}
                      className="hidden" 
                    />
                  </label>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    {gstCertificateFile ? (
                      <p className="text-xs font-semibold text-blue-600 truncate flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Selected: {gstCertificateFile.name} ({(gstCertificateFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ) : existingGstLink ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 truncate">
                          Currently uploaded GST certificate exists
                        </span>
                        <a 
                          href={existingGstLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Eye className="h-3 w-3" /> View
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">PDF, PNG, or JPEG format (max 5MB)</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Section 2: Product Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-600 font-bold">2</span>
                Product Categories (Select 1 to 3)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categoriesOptions.map(cat => {
                  const isSelected = selectedCategories.includes(cat.code);
                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.code)}
                      className={`flex flex-col items-start text-left p-3.5 rounded-2xl border transition ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/10' 
                          : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 mt-1 leading-snug">{cat.description}</span>
                      {cat.min_commision_percentage !== undefined && (
                        <span className="mt-2 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200">
                          Commission: {cat.min_commision_percentage}% - {cat.max_commision_percentage}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Contact & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-600 font-bold">3</span>
                Contact & Location Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Phone Number *</span>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Alternative Number</span>
                  <input
                    type="tel"
                    value={alternativeNumber}
                    onChange={(e) => setAlternativeNumber(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Your Designation *</span>
                  <select
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 bg-white transition"
                  >
                    <option value="">Select designation</option>
                    {DESIGNATION_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Pincode *</span>
                  <div className="relative">
                    <input
                      required
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="6-digit pincode"
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                    />
                    {fetchingPincode && (
                      <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-zinc-400" />
                    )}
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-1 block md:col-span-2">
                  <span className="text-xs font-semibold text-zinc-600">Street Address *</span>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                    placeholder="Shop, building, street address"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">City *</span>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">State *</span>
                  <input
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Country *</span>
                  <input
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <div className="space-y-1 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={locating}
                    className="h-11 w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
                  >
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    ) : (
                      <MapPin className="h-4 w-4 text-zinc-500" />
                    )}
                    Capture Current Lat/Lng
                  </button>
                </div>
              </div>

              {/* Coordinates display */}
              {(latitude || longitude) && (
                <div className="p-3 bg-zinc-100 rounded-xl font-mono text-[11px] text-zinc-600 flex justify-between flex-wrap gap-2">
                  <span>Latitude: <strong className="text-zinc-800">{latitude || '—'}</strong></span>
                  <span>Longitude: <strong className="text-zinc-800">{longitude || '—'}</strong></span>
                </div>
              )}
            </div>

            {/* Section 4: Business Settings & Commission */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-600 font-bold">4</span>
                Business Settings & Preferences
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Credit Cycle *</span>
                  <input
                    required
                    value={creditCycle}
                    onChange={(e) => setCreditCycle(e.target.value)}
                    placeholder="e.g. Net 30, Net 45"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Min Commission % *</span>
                  <input
                    required
                    type="number"
                    value={minCommission}
                    onChange={(e) => setMinCommission(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-zinc-600">Max Commission % *</span>
                  <input
                    required
                    type="number"
                    value={maxCommission}
                    onChange={(e) => setMaxCommission(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-zinc-600">Business Description *</span>
                <textarea
                  required
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Describe your primary business activities, capacity, materials, etc."
                  className="w-full min-h-[100px] p-4 rounded-xl border border-zinc-300 outline-none text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition resize-y"
                />
              </label>
            </div>

            {/* Submit Button block */}
            <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-6 h-12 rounded-xl text-sm font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 h-12 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-98"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Resubmit Application
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full ${config.bgColor} rounded-2xl shadow-xl border ${config.borderColor} p-8 space-y-6 transition`}>
        
        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full bg-white shadow-md border ${config.borderColor} inline-flex`}>
            <Icon className={`h-10 w-10 ${config.iconColor}`} />
          </div>
          
          <div className="space-y-1">
            <h2 className={`text-xl font-extrabold ${config.titleColor}`}>
              {config.title}
            </h2>
            {applicationNumber && (
              <div className="inline-block px-3 py-0.5 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-xs font-mono text-[10px] font-bold text-gray-700">
                Application ID: <span className="text-blue-600">{applicationNumber}</span>
              </div>
            )}
          </div>
          
          <p className={`text-xs ${config.descriptionColor} leading-relaxed`}>
            {config.description}
          </p>
        </div>

        {/* Reconsideration Notes Card */}
        {status === 'reconsideration' && (
          <div className="bg-white/80 backdrop-blur-xs border border-amber-200/80 rounded-xl p-4.5 space-y-2.5 shadow-sm">
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Modification Feedback
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed italic">
              "{reconsiderationNotes || 'Please update your application form details.'}"
            </p>
          </div>
        )}

        {/* Action Button */}
        {status === 'reconsideration' && (
          <button
            onClick={fetchDetails}
            disabled={loadingDetails}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/10 hover:shadow-amber-700/20 transition active:scale-98 disabled:opacity-50"
          >
            {loadingDetails ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Loading Application Details...
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Edit and Resubmit Application
              </>
            )}
          </button>
        )}

        {status === 'setup_required' && (
          <button
            onClick={() => {
              window.location.href = '/register';
            }}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/10 hover:shadow-amber-700/20 transition active:scale-98"
          >
            Complete Vendor Registration
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Footer Support */}
        {(status === 'pending' || status === 'agreement' || status === 'agreement_sent' || status === 'reconsideration' || status === 'setup_required') && (
          <div className="pt-4 border-t border-gray-200/60 text-center">
            <p className="text-[10px] text-gray-400 mb-1.5">
              Need help? Contact our support team
            </p>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-500 transition">
              Contact Support
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
