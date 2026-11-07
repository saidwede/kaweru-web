import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes d'exploitation nécessitant une authentification obligatoire et un rôle Pro
const PROTECTED_ROUTES = [
  { path: "/manifest", allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "TICKET_AGENT"] },
  { path: "/conductor", allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "ONBOARD_CONDUCTOR"] },
  { path: "/admin", allowedRoles: ["SUPER_ADMIN"] },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const matchedRule = PROTECTED_ROUTES.find(
    (rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`)
  );

  if (matchedRule) {
    const sessionCookie = req.cookies.get("kaweru_session")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const session = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));

      if (
        matchedRule.allowedRoles.length > 0 &&
        !matchedRule.allowedRoles.includes(session.role) &&
        session.role !== "SUPER_ADMIN"
      ) {
        const deniedUrl = new URL("/login", req.url);
        deniedUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(deniedUrl);
      }
    } catch {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("kaweru_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/manifest",
    "/manifest/:path*",
    "/conductor",
    "/conductor/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
