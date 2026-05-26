import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type TokenType = "access" | "refresh";
type JwtPayload = { exp?: number; iat?: number;[key: string]: unknown };

type TokenPayload = JwtPayload & {
    userId: string;
    username: string;
    email: string;
    role: string;
    type: TokenType;
};

// Helper function to decode JWT payload without external libraries
function decodeJwt(token: string): TokenPayload | null {
    try {
        console.log("token", token);
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        // Decode base64 to string using atob (available in edge runtime)
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload) as TokenPayload;
    } catch {
        return null;
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Ignore Next.js internals and static files
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname === "/favicon.ico" ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg")
    ) {
        return NextResponse.next();
    }

    // Define the public pages an unauthenticated user can access
    const publicPaths = ["/", "/login", "/register"];
    const isPublicPath = publicPaths.includes(pathname);

    // Get the refresh token from the cookies
    const refreshToken = await request.cookies.get("vendorRefreshToken")?.value;

    if (!refreshToken) {
        // No token: user is unauthenticated
        // Block protected pages like Dashboard, Profile, Analytics, Products
        if (!isPublicPath) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.next();
    }

    const payload = decodeJwt(refreshToken);

    // If the token is invalid or missing role information
    if (!payload || !payload.role) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("vendorRefreshToken");
        return response;
    }

    // Check if the user has an allowed role
    const allowedRoles = ["vendor", "super_admin", "admin"];

    if (!allowedRoles.includes(payload.role)) {
        // Role is not authorized: remove token and redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("vendorRefreshToken");
        return response;
    }

    const publicPathForAuthenticatedUsers = ["/login", "/register"];
    // If fully authenticated and authorized user is trying to access a public path, redirect to dashboard
    if (publicPathForAuthenticatedUsers.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // User is fully authenticated and authorized
    return NextResponse.next();
}
