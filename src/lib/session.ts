import crypto from "crypto";
import type { NextResponse } from "next/server";
import type { UserRole } from "@/models/User";

/**
 * Sessions signées (HMAC-SHA256).
 *
 * Format du jeton : `<payload base64url>.<signature base64url>`.
 * Le même jeton sert de cookie httpOnly (web) et de jeton Bearer (mobile Flutter).
 * Ce module ne dépend pas de la base de données pour rester utilisable dans `proxy.ts`.
 */

export const SESSION_COOKIE = "kaweru_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

const DEV_ONLY_SECRET = "kaweru-dev-only-session-secret-never-use-in-production";

export interface SessionData {
  uid: string;
  role: UserRole;
  companyId?: string | null;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  residenceCity?: string;
  isProfileCompleted?: boolean;
  referralCode?: string;
  referralPoints?: number;
  companyName?: string;
}

interface SignedPayload extends SessionData {
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET doit être défini (32 caractères minimum) en production.");
  }
  return DEV_ONLY_SECRET;
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signSession(data: SessionData): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedPayload = { ...data, iat: now, exp: now + SESSION_MAX_AGE_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${hmac(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionData | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  try {
    if (!safeEqual(hmac(encoded), signature)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SignedPayload;
    if (!payload.uid || !payload.role) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { iat, exp, ...session } = payload;
    return session;
  } catch {
    return null;
  }
}

/** Lit le jeton depuis le cookie (web) ou l'en-tête Authorization: Bearer (mobile). */
export function readSessionToken(req: {
  cookies: { get(name: string): { value: string } | undefined };
  headers: Headers;
}): string | null {
  const fromCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (fromCookie) return fromCookie;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

/** Signe la session, la pose en cookie httpOnly et renvoie le jeton (pour le mobile). */
export function setSessionCookie(response: NextResponse, data: SessionData): string {
  const token = signSession(data);
  applySessionCookie(response, token);
  return token;
}

export function applySessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
