import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Trip } from "@/models/Trip";
import { Company } from "@/models/Company";
import { sendTicketEmail } from "@/lib/mailer";

const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET || "";

if (process.env.NODE_ENV === "production" && !FEDAPAY_WEBHOOK_SECRET) {
  console.error("ALERTE SÉCURITÉ : FEDAPAY_WEBHOOK_SECRET n'est pas configuré en production.");
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-fedapay-signature");

    // 1. Vérification de la signature cryptographique (si secret configuré en production)
    if (FEDAPAY_WEBHOOK_SECRET && signature) {
      const computedSignature = crypto
        .createHmac("sha256", FEDAPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (computedSignature !== signature) {
        console.error("[Webhook Fedapay] Signature HMAC invalide.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.name || payload.event;
    const entity = payload.entity || payload;

    console.log(`[Webhook Fedapay] Événement reçu: ${event}, Transaction: ${entity.id}, Statut: ${entity.status}`);

    await connectToDatabase();

    // Recherche de la réservation via la référence personnalisée ou l'ID de transaction
    const bookingId = entity.custom_metadata?.booking_id || entity.description;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.warn(`[Webhook Fedapay] Réservation ${bookingId} introuvable.`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Si la transaction est approuvée (payée par Mobile Money)
    if (entity.status === "approved" || event === "transaction.approved") {
      if (booking.status === "PENDING_PAYMENT") {
        booking.status = "CONFIRMED";
        booking.paymentReference = String(entity.id || entity.reference);
        await booking.save();

        // Transfert définitif du siège : lockedSeats -> soldSeats
        const count = booking.seatsCount || 1;
        await Trip.findByIdAndUpdate(booking.tripId, {
          $inc: { lockedSeats: -count, soldSeats: count },
        });

        // Récupération de la compagnie pour le mail
        const company = await Company.findById(booking.companyId);

        // Envoi d'email automatique de confirmation si un email a été fourni
        if (booking.passengerEmail) {
          await sendTicketEmail({
            to: booking.passengerEmail,
            passengerName: booking.passengerName,
            shortCode: booking.shortCode,
            companyName: company?.name || "Compagnie Partenaire",
            originCity: booking.originCity,
            destinationCity: booking.destinationCity,
            departureDateTime: new Date(booking.departureDateTime).toLocaleString("fr-FR", {
              timeZone: "Africa/Porto-Novo",
            }),
            seatNumber: booking.seatNumber,
            totalPaidFcfa: booking.totalPaidFcfa,
          });
        }

        console.log(`[Webhook Fedapay] Billet ${booking.shortCode} confirmé pour ${booking.passengerName}`);
      }
    } else if (entity.status === "canceled" || entity.status === "declined") {
      if (booking.status === "PENDING_PAYMENT") {
        booking.status = "EXPIRED";
        await booking.save();

        // Restitution du siège
        await Trip.findByIdAndUpdate(booking.tripId, {
          $inc: { availableSeats: 1, lockedSeats: -1 },
        });
        console.log(`[Webhook Fedapay] Paiement échoué, siège libéré pour ${booking.shortCode}`);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook Fedapay Error]", error);
    // On répond 200 pour éviter que l'agrégateur ne boucle indéfiniment sur une erreur interne
    return NextResponse.json({ success: false, error: "Internal processing error" }, { status: 200 });
  }
}
