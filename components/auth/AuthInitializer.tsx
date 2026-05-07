"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInitializer() {
  const { fetchUser, setVendorSession } = useAuthStore();

  useEffect(() => {
    // Try to fetch user data on mount to restore session
    const initializeAuth = async () => {
      try {
        // Fetch the vendor status directly from the backend so the browser can
        // include the backend cookies issued during login.
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

        // Then fetch the full user details
        await fetchUser();
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      }
    };

    initializeAuth();
  }, [fetchUser, setVendorSession]);

  return null;
}
