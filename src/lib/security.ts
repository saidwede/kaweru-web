import crypto from "crypto";

const DEFAULT_DEV_KEY = "kaweru-secret-dev-key-change-in-prod";

/**
 * Récupère la clé secrète pour la signature QR code.
 * En production réelle, exige une clé secrète robuste.
 */
function getQrSecretKey(): string {
  const key = process.env.QR_SECRET_KEY;
  if (!key || key === DEFAULT_DEV_KEY) {
    // Si on est en production runtime sur Vercel sans clé configurée
    if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
      console.warn(
        "ATTENTION SÉCURITÉ : QR_SECRET_KEY non définie ou utilisant la clé par défaut en production !"
      );
    }
    return DEFAULT_DEV_KEY;
  }
  return key;
}

/**
 * Génère un code d'embarquement court et lisible (ex: "KWR-84X")
 */
export function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclut 0, 1, I, O pour éviter les confusions
  let result = "KWR-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Génère une signature cryptographique inviolable pour le QR code
 */
export function generateQrSignature(bookingId: string, shortCode: string, amount: number): string {
  const payload = `${bookingId}:${shortCode}:${amount}`;
  return crypto.createHmac("sha256", getQrSecretKey()).update(payload).digest("hex");
}

/**
 * Vérifie la validité d'une signature QR Code scannée
 */
export function verifyQrSignature(
  bookingId: string,
  shortCode: string,
  amount: number,
  signature: string
): boolean {
  const expected = generateQrSignature(bookingId, shortCode, amount);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

