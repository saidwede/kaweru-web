import { Booking, IBooking } from "@/models/Booking";
import { Trip } from "@/models/Trip";
import { Company } from "@/models/Company";
import { Coupon } from "@/models/Coupon";
import { User } from "@/models/User";
import { ReferralConfig } from "@/models/ReferralConfig";
import type { Types } from "mongoose";
import { sendTicketEmail } from "./mailer";

type Id = Types.ObjectId | string;

/**
 * Cycle de vie d'une réservation et comptabilité des sièges.
 *
 * Invariant : chaque transition de statut est un findOneAndUpdate conditionné sur le
 * statut précédent. Une seule requête concurrente peut gagner une transition, donc les
 * compteurs du voyage (available / locked / sold) ne sont modifiés qu'une seule fois.
 */

const seats = (b: Pick<IBooking, "seatsCount">) => Math.max(1, b.seatsCount || 1);

/** PENDING_PAYMENT → EXPIRED si le verrou de 7 minutes est dépassé ; rend TOUTES les places. */
export async function expireBookingIfStale(bookingId: Id): Promise<boolean> {
  const expired = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "PENDING_PAYMENT", lockedUntil: { $lt: new Date() } },
    { $set: { status: "EXPIRED" } },
    { returnDocument: "before" }
  );
  if (!expired) return false;

  const n = seats(expired);
  await Trip.updateOne({ _id: expired.tripId }, { $inc: { availableSeats: n, lockedSeats: -n } });
  return true;
}

/** Libère toutes les réservations en attente dont le verrou a expiré (optionnellement pour un voyage). */
export async function releaseExpiredBookings(filter: { tripId?: Id } = {}): Promise<number> {
  const stale = await Booking.find({
    ...(filter.tripId ? { tripId: filter.tripId } : {}),
    status: "PENDING_PAYMENT",
    lockedUntil: { $lt: new Date() },
  })
    .select("_id")
    .limit(500)
    .lean();

  let released = 0;
  for (const b of stale) {
    if (await expireBookingIfStale(b._id)) released++;
  }
  return released;
}

/** Paiement refusé / annulé : PENDING_PAYMENT → EXPIRED et restitution des places. */
export async function cancelPendingBooking(bookingId: Id): Promise<boolean> {
  const cancelled = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "PENDING_PAYMENT" },
    { $set: { status: "EXPIRED" } },
    { returnDocument: "before" }
  );
  if (!cancelled) return false;

  const n = seats(cancelled);
  await Trip.updateOne({ _id: cancelled.tripId }, { $inc: { availableSeats: n, lockedSeats: -n } });
  return true;
}

export type ConfirmOutcome = "CONFIRMED" | "ALREADY_CONFIRMED" | "LATE_CONFIRMED" | "NEEDS_REFUND" | "NOT_FOUND";

/**
 * Paiement approuvé. Idempotent : les renvois du webhook ne comptent jamais deux fois.
 * - Cas normal : PENDING_PAYMENT → CONFIRMED, places verrouillées → vendues.
 * - Paiement tardif (réservation déjà expirée) : on tente de reprendre les places ;
 *   s'il n'y en a plus, la réservation est marquée needsRefund.
 */
export async function confirmPaidBooking(bookingId: Id, paymentReference: string): Promise<ConfirmOutcome> {
  const confirmed = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "PENDING_PAYMENT" },
    { $set: { status: "CONFIRMED", paymentReference } },
    { returnDocument: "after" }
  );

  if (confirmed) {
    const n = seats(confirmed);
    await Trip.updateOne({ _id: confirmed.tripId }, { $inc: { lockedSeats: -n, soldSeats: n } });
    await afterConfirmation(confirmed);
    return "CONFIRMED";
  }

  const existing = await Booking.findById(bookingId);
  if (!existing) return "NOT_FOUND";
  if (existing.status === "CONFIRMED" || existing.status === "USED") return "ALREADY_CONFIRMED";

  if (existing.status === "EXPIRED" && !existing.needsRefund) {
    const n = seats(existing);
    const retaken = await Trip.findOneAndUpdate(
      { _id: existing.tripId, availableSeats: { $gte: n } },
      { $inc: { availableSeats: -n, soldSeats: n } }
    );
    if (retaken) {
      const late = await Booking.findOneAndUpdate(
        { _id: existing._id, status: "EXPIRED" },
        { $set: { status: "CONFIRMED", paymentReference } },
        { returnDocument: "after" }
      );
      if (late) {
        await afterConfirmation(late);
        return "LATE_CONFIRMED";
      }
      // Transition perdue entre-temps : on rend les places reprises.
      await Trip.updateOne({ _id: existing.tripId }, { $inc: { availableSeats: n, soldSeats: -n } });
    }
    await Booking.updateOne({ _id: existing._id }, { $set: { needsRefund: true, paymentReference } });
    console.error(`[Paiement] ${existing.shortCode} payé après expiration sans place disponible : REMBOURSEMENT REQUIS.`);
    return "NEEDS_REFUND";
  }

  return "ALREADY_CONFIRMED";
}

/** Effets secondaires d'un paiement confirmé — ne doivent jamais faire échouer la confirmation. */
async function afterConfirmation(booking: IBooking): Promise<void> {
  if (booking.couponCode) {
    await Coupon.updateOne({ code: booking.couponCode }, { $inc: { usedCount: 1 } }).catch(() => undefined);
  }

  await creditReferrer(booking).catch((err) => console.error("[Parrainage]", err));

  if (booking.passengerEmail) {
    try {
      const company = await Company.findById(booking.companyId).select("name");
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
    } catch (err) {
      console.error("[Email billet]", err);
    }
  }
}

/** Points de parrainage crédités uniquement sur achat PAYÉ (plus à la simple réservation). */
async function creditReferrer(booking: IBooking): Promise<void> {
  const conditions: Record<string, unknown>[] = [{ phone: booking.passengerPhone }];
  if (booking.userId && booking.userId !== "guest_user") conditions.push({ firebaseUid: booking.userId });

  const buyer = await User.findOne({ $or: conditions }).select("referredBy");
  if (!buyer?.referredBy) return;

  const config = await ReferralConfig.findOne({ key: "GLOBAL_REFERRAL_CONFIG" });
  const isActive = config ? config.isActive : true;
  const points = config ? config.pointsPerFilleulPurchase : 100;
  if (!isActive || points <= 0) return;

  const ref = buyer.referredBy;
  const sponsorConditions: Record<string, unknown>[] = [{ referralCode: ref }, { firebaseUid: ref }];
  if (/^[a-f0-9]{24}$/i.test(ref)) sponsorConditions.push({ _id: ref });

  await User.updateOne({ $or: sponsorConditions }, { $inc: { referralPoints: points } });
}
