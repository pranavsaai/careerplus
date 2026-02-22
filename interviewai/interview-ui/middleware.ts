import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const jwt = request.cookies.get("jwt")?.value;

  const publicPaths = ["/login", "/register", "/forgot-password"];

  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some(path =>
    pathname.startsWith(path)
  );

  if (!jwt && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  if (jwt && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico).*)",
  ],
};