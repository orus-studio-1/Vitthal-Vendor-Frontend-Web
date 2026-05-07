import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

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
      return NextResponse.json(null, { status: 401 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching vendor status:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
