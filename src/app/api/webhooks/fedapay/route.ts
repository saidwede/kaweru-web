import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { verifyFedapaySignature, fetchFedapayTransaction } from "@/lib/fedapay";
import { confirmPaidBooking, cancelPendingBooking } from "@/lib/bookingLifecycle";

const APPROVED = new Set(["approved", "transferred"]);
const FAILED = new Set(["canceled", "cancelled", "declined", "refunded"]);

export async function POST(req: NextRequest) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET || "";
  if (!secret) {
    console.error("[Webhook FedaPay] FEDAPAY_WEBHOOK_SECRET non configuré : webhook refusé.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  if (!verifyFedapaySignature(rawBody, req.headers.get("x-fedapay-signature"), secret)) {
    console.error("[Webhook FedaPay] Signature absente ou invalide.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const entity = payload.entity || payload;
    const bookingId = entity.custom_metadata?.booking_id || entity.description;

    if (!entity.id || !isValidObjectId(bookingId)) {
      console.warn("[Webhook FedaPay] Événement sans transaction ou réservation exploitable.");
      return NextResponse.json({ received: true });
    }

    await connectToDatabase();
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.warn(`[Webhook FedaPay] Réservation ${bookingId} introuvable.`);
      return NextResponse.json({ received: true });
    }

    // Source de vérité : l'API FedaPay (si la clé secrète est configurée), sinon l'événement signé.
    const verified = await fetchFedapayTransaction(entity.id);
    const status = String(verified?.status ?? entity.status ?? "").toLowerCase();
    const amount = Number(verified?.amount ?? entity.amount);
    const paymentRef = String(entity.id);

    if (APPROVED.has(status)) {
      if (amount !== booking.totalPaidFcfa) {
        console.error(
          `[Webhook FedaPay] Montant incohérent pour ${booking.shortCode} : reçu ${amount}, attendu ${booking.totalPaidFcfa}.`
        );
        return NextResponse.json({ received: true, ignored: "amount_mismatch" });
      }
      const outcome = await confirmPaidBooking(booking._id, paymentRef);
      console.log(`[Webhook FedaPay] ${booking.shortCode} → ${outcome}`);
      return NextResponse.json({ success: true, outcome });
    }

    if (FAILED.has(status)) {
      const released = await cancelPendingBooking(booking._id);
      console.log(`[Webhook FedaPay] ${booking.shortCode} paiement ${status}, places libérées : ${released}`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Traitement idempotent : on renvoie 500 pour que FedaPay réessaie plutôt que de perdre un paiement.
    console.error("[Webhook FedaPay Error]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
