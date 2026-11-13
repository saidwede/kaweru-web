"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signOut, type Auth, type User } from "firebase/auth";

/**
 * Configuration Firebase Client pour Kaweru Web (projet kaweru-app).
 * Ces valeurs sont publiques par nature : la sécurité repose sur les jetons vérifiés
 * côté serveur et sur les règles Firestore (tout accès client direct est refusé).
 */
export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kaweru-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kaweru-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kaweru-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

let app: FirebaseApp | null = null;

export function getFirebaseAuth(): Auth {
  if (!app) app = getApps()[0] ?? initializeApp(firebaseClientConfig);
  const auth = getAuth(app);
  auth.languageCode = "fr";
  return auth;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
  user?: {
    uid?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    residenceCity?: string;
    role?: string;
  };
  needsProfileCompletion?: boolean;
  redirectUrl?: string;
}

/**
 * Après une connexion Firebase réussie (SMS, Google ou e-mail) :
 * 1. /api/auth/login crée ou met à jour le profil Kaweru (et les custom claims de rôle) ;
 * 2. le jeton est rafraîchi pour porter ces claims ;
 * 3. /api/auth/session le transforme en cookie httpOnly `__session` pour le site web.
 */
export async function completeFirebaseLogin(user: User, referredBy?: string): Promise<LoginResponse> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ referredBy: referredBy || undefined }),
  });
  const data = (await res.json()) as LoginResponse;
  if (!data.success) {
    await signOut(getFirebaseAuth()).catch(() => undefined);
    return data;
  }

  const freshToken = await user.getIdToken(true);
  const sessionRes = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
    body: "{}",
  });
  if (!sessionRes.ok) {
    const err = (await sessionRes.json().catch(() => ({}))) as { error?: string };
    return { success: false, error: err.error || "Impossible d'ouvrir la session. Réessayez." };
  }
  return data;
}

/** Ferme la session web (cookie) ET la session Firebase du navigateur. */
export async function signOutEverywhere(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => undefined);
  await signOut(getFirebaseAuth()).catch(() => undefined);
}
