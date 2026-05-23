import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
  });

  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgetPassword",
    "/resetPassword",
  ];

  // Not Logged In
  if (
    !token &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/customer"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged In User Visiting Public Pages
  if (token && publicRoutes.includes(pathname)) {
    const role = token.role as string;

    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "STAFF") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }

    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
  }

  // ADMIN ROUTES
  if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // STAFF ROUTES
  if (pathname.startsWith("/staff") && token?.role !== "STAFF") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // CUSTOMER ROUTES
  if (pathname.startsWith("/customer") && token?.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/forgetPassword",
    "/resetPassword",
    "/admin/:path*",
    "/staff/:path*",
    "/customer/:path*",
  ],
};
