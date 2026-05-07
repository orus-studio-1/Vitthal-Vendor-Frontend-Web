"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInitializer() {
  const { isAuthenticated, fetchUser, setVendorSession } = useAuthStore();

  useEffect(() => {
    // Try to fetch user data on mount to restore session
    const initializeAuth = async () => {
      try {
        // First fetch the vendor status from server
        const statusRes = await fetch("/api/vendor-status", {
          credentials: "include",
        });

        if (statusRes.ok) {
          const status = await statusRes.json();
          // Set the vendor session info
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
