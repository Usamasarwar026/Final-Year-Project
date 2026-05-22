import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
  });
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgetPassword",
    "/resetPassword"
    ,
  ];

  const protectedRoutes = ["/dashboard", "/editProfile", "/updatePassword", "/profile"];

  //protected routes
  if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  //public routes
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgetPassword",
    "/resetPassword",
    "/dashboard/:path*",
    "/editProfile",
    "/updatePassword",
    "/profile"
  ],
};
