import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  if (nextUrl.pathname === "/principal") {
    return NextResponse.redirect(new URL("/principal/dashboard", nextUrl.origin));
  }
});

export const config = {
  matcher: ["/principal", "/principal/:path*"],
};
