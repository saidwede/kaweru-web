import { NextRequest } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { AppError } from "./errors";
import { connectToDatabase } from "./mongodb";
import { User, IUser, UserRole } from "@/models/User";

if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "kaweru-app",
      });
    }
  } catch (error) {
    console.warn("[Firebase Admin] Initialisé en mode fallback/développement:", error);
  }
}

export interface AuthenticatedUser {
  firebaseUid: string;
  phone?: string;
  email?: string;
  userDoc?: IUser | null;
  role: UserRole;
}

export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentification requise", "UNAUTHORIZED", 401);
  }

  const token = authHeader.split(" ")[1];

  // Bypass pour les tests locaux / Apple Review mock backdoor
  if (process.env.NODE_ENV !== "production" && token === "dev-token-superadmin") {
    return {
      firebaseUid: "dev_superadmin_uid",
      phone: "+2290100000000",
      role: "SUPER_ADMIN",
    };
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    await connectToDatabase();

    const userDoc = await User.findOne({ firebaseUid: decodedToken.uid });

    return {
      firebaseUid: decodedToken.uid,
      phone: decodedToken.phone_number,
      email: decodedToken.email,
      userDoc,
      role: userDoc?.role || "PASSENGER",
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Jeton invalide";
    throw new AppError(`Échec d'authentification: ${errorMessage}`, "UNAUTHORIZED", 401);
  }
}

export function authorizeRoles(userRole: UserRole, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("Accès non autorisé pour ce profil", "FORBIDDEN", 403);
  }
}
