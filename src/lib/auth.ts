import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AppError } from "./errors";
import { connectToDatabase } from "./mongodb";
import { readSessionToken, verifySessionToken, SessionData } from "./session";
import { User, IUser, UserRole } from "@/models/User";

// Clés publiques Google qui signent les ID tokens Firebase (mises en cache par jose).
// On n'utilise plus firebase-admin : il ne se charge pas sur le runtime Node de Vercel
// (jwks-rsa fait un require() du module ES « jose »), ce qui faisait planter toutes les routes.
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "STATION_MANAGER",
  "TICKET_AGENT",
  "ONBOARD_CONDUCTOR",
];

export interface AuthSession {
  uid: string;
  role: UserRole;
  companyId: string | null;
  phone?: string;
  email?: string;
  name?: string;
  token: SessionData;
  user: IUser;
}

export async function findUserBySessionUid(uid: string): Promise<IUser | null> {
  const conditions: Record<string, unknown>[] = [{ firebaseUid: uid }];
  if (isValidObjectId(uid)) conditions.push({ _id: uid });
  return User.findOne({ $or: conditions });
}

/**
 * Vérifie la signature de la session puis relit l'utilisateur en base :
 * le rôle, la compagnie et le statut actif viennent toujours de MongoDB,
 * jamais du jeton (un agent suspendu ou rétrogradé perd l'accès immédiatement).
 */
export async function getAuthSession(req: NextRequest): Promise<AuthSession | null> {
  const token = verifySessionToken(readSessionToken(req));
  if (!token) return null;

  await connectToDatabase();
  const user = await findUserBySessionUid(token.uid);
  if (!user || !user.isActive) return null;

  return {
    uid: token.uid,
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
    phone: user.phone,
    email: user.email,
    name: user.fullName,
    token,
    user,
  };
}

/** Variante qui lève une AppError (401 / 403) — à utiliser avec handleApiError. */
export async function requireSession(req: NextRequest, allowedRoles?: UserRole[]): Promise<AuthSession> {
  const session = await getAuthSession(req);
  if (!session) {
    throw new AppError("Authentification requise", "UNAUTHORIZED", 401);
  }
  if (allowedRoles) authorizeRoles(session.role, allowedRoles);
  return session;
}

/** Conservé pour compatibilité avec les routes existantes. */
export const authenticateRequest = (req: NextRequest) => requireSession(req);

export function authorizeRoles(userRole: UserRole, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("Accès non autorisé pour ce profil", "FORBIDDEN", 403);
  }
}

/** Un membre du personnel ne peut agir que sur sa propre compagnie (sauf Super Admin). */
export function assertCompanyAccess(session: AuthSession, companyId: unknown): void {
  if (session.role === "SUPER_ADMIN") return;
  if (!session.companyId || String(companyId) !== session.companyId) {
    throw new AppError("Ressource d'une autre compagnie", "FORBIDDEN", 403);
  }
}

export interface VerifiedGoogleIdentity {
  uid: string;
  email: string;
  name?: string;
}

/**
 * Vérifie un ID token Firebase (connexion Google) côté serveur, selon la procédure officielle :
 * signature RS256 par les clés Google, émetteur securetoken.google.com/<projet>, audience = projet, expiration.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kaweru-app";
  try {
    const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!payload.sub || !email || payload.email_verified !== true) {
      throw new AppError("Adresse e-mail Google non vérifiée.", "UNAUTHORIZED", 401);
    }
    return {
      uid: payload.sub,
      email: email.trim().toLowerCase(),
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Jeton Google invalide ou expiré.", "UNAUTHORIZED", 401);
  }
}
