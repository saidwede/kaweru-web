import { Otp } from "@/models/Otp";
import { safeEqual } from "./session";

export const OTP_MAX_ATTEMPTS = 5;

/**
 * Vérifie et consomme un code OTP stocké en base.
 * Le compteur de tentatives est persistant (fonctionne en serverless, contrairement
 * à une limite en mémoire) : au-delà de OTP_MAX_ATTEMPTS le code est détruit.
 */
export async function consumeOtp(
  identifier: string,
  method: "PHONE" | "EMAIL",
  code: string
): Promise<boolean> {
  const record = await Otp.findOne({
    identifier,
    method,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) return false;

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return false;
  }

  if (!safeEqual(record.code, code)) {
    await Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return false;
  }

  // Suppression atomique : un même code ne peut servir qu'une fois, même en cas de requêtes simultanées.
  const deleted = await Otp.deleteOne({ _id: record._id });
  return deleted.deletedCount === 1;
}

/**
 * Le code OTP n'est renvoyé au client que si aucun canal de livraison n'existe ET que
 * c'est explicitement autorisé (développement, ou pilote assumé via OTP_INSECURE_FALLBACK=true).
 */
export function isOtpFallbackAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.OTP_INSECURE_FALLBACK === "true";
}
