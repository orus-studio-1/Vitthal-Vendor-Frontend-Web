const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
const STORAGE_KEY = "vendor_token";
const EXPIRY_MARGIN_MS = 60 * 1000;

function isFresh(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 - EXPIRY_MARGIN_MS > Date.now();
  } catch {
    return false;
  }
}

/** Token for Admin Backend calls. Login tokens last 30 minutes, so an expired one is swapped using the session cookies. */
export async function getAdminToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored !== "null" && stored !== "undefined" && isFresh(stored)) return stored;
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors/admin-session`, {
      credentials: "include",
      headers: { "x-request-from": "vendor" },
    });
    if (!res.ok) return null;
    const { accessToken } = await res.json();
    if (accessToken) localStorage.setItem(STORAGE_KEY, accessToken);
    return accessToken || null;
  } catch {
    return null;
  }
}
