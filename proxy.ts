import { NextRequest, NextResponse } from "next/server";
import { decryptToken } from "@/lib/authHelper";
import { TokenPayload } from "@/types/auth";

const PROTECTED_API_ROUTES = [
  "/api/users",
  "/api/admin",
];

const ADMIN_ONLY_ROUTES = [
  "/api/users",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // 1. Try Authorization header first
  const authHeader = req.headers.get("authorization");
  let accessToken: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.split(" ")[1];
  }

  // 2. Fall back to cookie
  if (!accessToken) {
    accessToken = req.cookies.get("accessToken")?.value;
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Unauthorized: No access token provided" },
      { status: 401 }
    );
  }

  let payload: TokenPayload;
  try {
    payload = decryptToken(accessToken, "access") as TokenPayload;
  } catch {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }

  if (!payload?.id) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid token payload" },
      { status: 401 }
    );
  }

  // 3. Role check for admin-only routes
  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminRoute && payload.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admins only" },
      { status: 403 }
    );
  }

  // Pass user info downstream via headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-role", payload.role ?? "");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  runtime: "nodejs", // needed for your decryptToken (Node.js crypto)
  matcher: ["/api/users/:path*", "/api/admin/:path*"],
};