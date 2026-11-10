import crypto from "crypto";
import { safeEqual } from "./session";

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/**
 * Vérifie l'en-tête X-FEDAPAY-SIGNATURE.
 * Format FedaPay : "t=<timestamp>,s=<hmac_sha256_hex(`${t}.${rawBody}`)>".
 * Un HMAC hexadécimal brut du corps est aussi accepté (ancien format).
 */
export function verifyFedapaySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;

  if (header.includes("=")) {
    const parts = Object.fromEntries(
      header.split(",").map((kv) => {
        const i = kv.indexOf("=");
        return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
      })
    );
    const t = Number(parts.t);
    const s = parts.s;
    if (!t || !s) return false;
    if (Math.abs(Date.now() / 1000 - t) > SIGNATURE_TOLERANCE_SECONDS) return false;
    const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
    return safeEqual(expected, s);
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, header);
}

export interface FedapayTransaction {
  id: number | string;
  status: string;
  amount: number;
  reference?: string;
}

/**
 * Relit la transaction auprès de l'API FedaPay (source de vérité) si la clé secrète est configurée.
 * Renvoie null si la vérification n'est pas possible (clé absente).
 */
export async function fetchFedapayTransaction(id: string | number): Promise<FedapayTransaction | null> {
  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  if (!secretKey) return null;

  const base =
    process.env.FEDAPAY_ENVIRONMENT === "live"
      ? "https://api.fedapay.com/v1"
      : "https://sandbox-api.fedapay.com/v1";

  const res = await fetch(`${base}/transactions/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`FedaPay API ${res.status} pour la transaction ${id}`);
  }
  const json = await res.json();
  const tx = json["v1/transaction"] ?? json.transaction ?? json;
  return { id: tx.id, status: String(tx.status), amount: Number(tx.amount), reference: tx.reference };
}
