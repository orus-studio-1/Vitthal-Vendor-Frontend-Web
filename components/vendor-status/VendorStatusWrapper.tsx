'use client';

import { useEffect, useState } from 'react';
import VendorStatusDisplay from './VendorStatusDisplay';
import { toast } from 'sonner';

interface VendorStatusData {
  id: string;
  role: string;
  approval_status: string | null;
  application_number: string | null;
  reconsideration_notes: string | null;
}

export default function VendorStatusWrapper({ children }: { children: React.ReactNode }) {
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  const [reconsiderationNotes, setReconsiderationNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchVendorStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/vendorIdStatus`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(true);
        toast.error(data?.message || "Unable to fetch vendor status");
        return;
      }
      setVendorStatus(data.approval_status);
      setIsBlocked(data.is_blocked || false);
      setApplicationNumber(data.application_number);
      setReconsiderationNotes(data.reconsideration_notes || null);
    } catch (err) {
      console.error('Failed to fetch vendor status:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorStatus();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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

  // Show blocked screen if vendor is blocked
  if (isBlocked) {
    return <VendorStatusDisplay status="blocked" applicationNumber={applicationNumber} />;
  }

  // Show status screen if vendor is not approved
  if (vendorStatus !== 'approved') {
    return (
      <VendorStatusDisplay
        status={vendorStatus}
        applicationNumber={applicationNumber}
        reconsiderationNotes={reconsiderationNotes}
        onStatusUpdated={fetchVendorStatus}
      />
    );
  }

  // Show children if vendor is approved
  return <>{children}</>;
}