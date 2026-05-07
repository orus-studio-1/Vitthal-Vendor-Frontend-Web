
export type VendorIdStatusResponse = {
  id: string;
  role: string;
  approval_status: "pending" | "agreement_sent" | "approved" | "rejected" |null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";


export async function fetchVendorIdStatusServer(): Promise<VendorIdStatusResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/vendors/vendorIdStatus`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-request-from": "vendor",
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
