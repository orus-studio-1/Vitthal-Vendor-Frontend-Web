"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

type VendorSessionHydratorProps = {
  session: {
    id: string;
    role: string;
    approvalStatus: "pending" | "agreement_sent" | "approved" | "rejected" | null;
  };
};

export function VendorSessionHydrator({ session }: VendorSessionHydratorProps) {
  const setVendorSession = useAuthStore((state) => state.setVendorSession);

  useEffect(() => {
    setVendorSession(session);
  }, [session, setVendorSession]);

  return null;
}
