"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInitializer() {
  const { fetchUser, setVendorSession } = useAuthStore();

  useEffect(() => {
    // Try to fetch user data on mount to restore session
    const initializeAuth = async () => {
        try {
          const statusRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/vendorIdStatus`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "x-request-from": "vendor",
              },
            },
          );

          if (statusRes.ok) {
            const status = await statusRes.json();
            setVendorSession({
              id: status.id,
              role: status.role,
              approvalStatus: status.approval_status,
            });
          }
        } catch (statusError) {
          console.warn("Failed to check vendor status in AuthInitializer:", statusError);
        }

        // Then fetch the full user details
        try {
          await fetchUser();
        } catch (userError) {
          console.warn("Failed to fetch user in AuthInitializer:", userError);
        }
    };

    initializeAuth();
  }, [fetchUser, setVendorSession]);

  return null;
}
