'use client';

import { useEffect, useState } from 'react';
import VendorStatusDisplay from './VendorStatusDisplay';
import { toast } from 'sonner';

interface VendorStatusData {
  id: string;
  role: string;
  approval_status: string | null;
}

export default function VendorStatusWrapper({ children }: { children: React.ReactNode }) {
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVendorStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/vendorIdStatus`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        },);
        const data = await response.json();
        if(!response.ok){
          setError(true);
          toast.error(data?.message || "Unable to fetch vendor status");
          return;
        }
        setVendorStatus(data.approval_status);
      } catch (err) {
        console.error('Failed to fetch vendor status:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorStatus();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load vendor status. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Show status screen if vendor is not approved
  if (vendorStatus !== 'approved') {
    return <VendorStatusDisplay status={vendorStatus} />;
  }

  // Show children if vendor is approved
  return <>{children}</>;
}
