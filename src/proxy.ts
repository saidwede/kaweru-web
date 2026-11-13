import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/sessionCookie";

// Garde d'interface : vérifie la signature du cookie de session Firebase et le rôle qu'il porte.
// L'API (Cloud Functions) revérifie toujours le rôle en base (Firestore) à chaque requête.
const PROTECTED_ROUTES = [
  { path: "/manifest", allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "TICKET_AGENT"] },
  { path: "/conductor", allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "ONBOARD_CONDUCTOR"] },
  { path: "/admin", allowedRoles: ["SUPER_ADMIN"] },
];

function redirectToLogin(req: NextRequest, pathname: string, clearCookie = false) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  if (clearCookie) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const matchedRule = PROTECTED_ROUTES.find(
    (rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`)
  );
  if (!matchedRule) return NextResponse.next();

  const rawCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!rawCookie) return redirectToLogin(req, pathname);

  const session = await verifySessionCookie(rawCookie);
  if (!session) return redirectToLogin(req, pathname, true);

  if (session.role !== "SUPER_ADMIN" && !matchedRule.allowedRoles.includes(session.role || "")) {
    return redirectToLogin(req, pathname);
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
