import { cookies } from "next/headers";

export type VendorIdStatusResponse = {
  id: string;
  role: string;
  approval_status: "pending" | "agreement_sent" | "approved" | "rejected" |null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

async function buildCookieHeader() {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function fetchVendorIdStatusServer(): Promise<VendorIdStatusResponse | null> {
  try {
    const cookieHeader = await buildCookieHeader();

    const response = await fetch(`${API_BASE}/api/vendors/vendorIdStatus`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-request-from": "vendor",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VendorIdStatusResponse;
  } catch {
    return null;
  }
}
