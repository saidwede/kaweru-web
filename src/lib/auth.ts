import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { AppError } from "./errors";
import { connectToDatabase } from "./mongodb";
import { readSessionToken, verifySessionToken, SessionData } from "./session";
import { User, IUser, UserRole } from "@/models/User";

if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
    } else {
      // La vérification des ID tokens ne nécessite que le projectId.
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "kaweru-app" });
    }
  } catch (error) {
    console.warn("[Firebase Admin] Initialisation impossible:", error);
  }
}

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

/** Vérifie un ID token Firebase (connexion Google) côté serveur. */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    if (!decoded.email || decoded.email_verified !== true) {
      throw new AppError("Adresse e-mail Google non vérifiée.", "UNAUTHORIZED", 401);
    }
    return {
      uid: decoded.uid,
      email: decoded.email.trim().toLowerCase(),
      name: typeof decoded.name === "string" ? decoded.name : undefined,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Jeton Google invalide ou expiré.", "UNAUTHORIZED", 401);
  }
}
