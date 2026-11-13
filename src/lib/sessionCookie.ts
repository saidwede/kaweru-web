import { decodeProtectedHeader, importX509, jwtVerify } from "jose";

/**
 * Vérification du cookie de session Firebase (`__session`) côté Next.js, sans firebase-admin.
 *
 * Sert UNIQUEMENT de garde d'interface (proxy.ts, layouts) : signature RS256 par les clés
 * publiques Google, émetteur session.firebase.google.com/<projet>, audience = projet, expiration.
 * Le rôle lu ici est un custom claim posé par le backend ; l'API (Cloud Functions) relit
 * toujours le rôle et le statut actif en base à chaque requête.
 */

export const SESSION_COOKIE = "__session";

const CERTS_URL = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kaweru-app";

export const STAFF_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "TICKET_AGENT", "ONBOARD_CONDUCTOR"];

export interface SessionClaims {
  uid: string;
  role: string | null;
  companyId: string | null;
}

let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`Clés Firebase indisponibles (${res.status})`);
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] || 3600);
  certCache = { certs: (await res.json()) as Record<string, string>, expiresAt: Date.now() + maxAge * 1000 };
  return certCache.certs;
}

export async function verifySessionCookie(cookie: string | undefined | null): Promise<SessionClaims | null> {
  if (!cookie) return null;
  try {
    const { kid, alg } = decodeProtectedHeader(cookie);
    if (alg !== "RS256" || !kid) return null;
    const pem = (await getCerts())[kid];
    if (!pem) return null;
    const { payload } = await jwtVerify(cookie, await importX509(pem, "RS256"), {
      issuer: `https://session.firebase.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });
    if (!payload.sub) return null;
    return {
      uid: payload.sub,
      role: typeof payload.role === "string" ? payload.role : null,
      companyId: typeof payload.companyId === "string" ? payload.companyId : null,
    };
  } catch {
    return null;
  }
}
