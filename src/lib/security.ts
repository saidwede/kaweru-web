import crypto from "crypto";
import { safeEqual } from "./session";

const DEV_ONLY_QR_KEY = "kaweru-dev-only-qr-key-never-use-in-production";

/** Clé HMAC des QR codes : obligatoire en production (plus de repli silencieux sur une clé publique). */
function getQrSecretKey(): string {
  const key = process.env.QR_SECRET_KEY;
  if (key && key.length >= 32) return key;
  if (process.env.NODE_ENV === "production") {
    throw new Error("QR_SECRET_KEY doit être défini (32 caractères minimum) en production.");
  }
  return DEV_ONLY_QR_KEY;
}

const SHORT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0, 1, I, O
const SHORT_CODE_LENGTH = 6; // 32^6 ≈ 1 milliard de combinaisons

/** Code d'embarquement lisible (ex : "KWR-84XK7M"), tiré avec un générateur cryptographique. */
export function generateShortCode(): string {
  let result = "KWR-";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    result += SHORT_CODE_ALPHABET[crypto.randomInt(SHORT_CODE_ALPHABET.length)];
  }
  return result;
}

/** Signature HMAC du billet : liée à la réservation, au code et au montant. */
export function generateQrSignature(bookingId: string, shortCode: string, amount: number): string {
  const payload = `${bookingId}:${shortCode}:${amount}`;
  return crypto.createHmac("sha256", getQrSecretKey()).update(payload).digest("hex");
}

export function verifyQrSignature(
  bookingId: string,
  shortCode: string,
  amount: number,
  signature: string
): boolean {
  return safeEqual(generateQrSignature(bookingId, shortCode, amount), String(signature || ""));
}

/** Échappe une saisie utilisateur avant de l'utiliser dans une RegExp MongoDB. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
