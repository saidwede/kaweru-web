import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { getAuthSession, STAFF_ROLES } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Trip } from "@/models/Trip";
import { Company } from "@/models/Company";
import { Booking } from "@/models/Booking";
import { Coupon } from "@/models/Coupon";
import { AppError, handleApiError } from "@/lib/errors";
import { normalizePhoneNumber } from "@/lib/config";
import { generateShortCode, generateQrSignature, escapeRegex } from "@/lib/security";
import { checkRateLimit } from "@/lib/rateLimit";
import { releaseExpiredBookings } from "@/lib/bookingLifecycle";

const PAYMENT_LOCK_MS = 7 * 60 * 1000; // 7 minutes
const MAX_SEATS_PER_BOOKING = 50; // aligné sur l'interface (réservations de groupe)

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    if (!STAFF_ROLES.includes(session.role)) {
      return NextResponse.json({ success: false, error: "Accès réservé au personnel et aux administrateurs." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const tripId = searchParams.get("tripId")?.trim();
    const status = searchParams.get("status")?.trim();
    const targetCompanyId =
      session.role === "SUPER_ADMIN" ? searchParams.get("companyId") || session.companyId : session.companyId;

    // Un agent sans compagnie ne doit rien voir (au lieu de tout voir).
    if (session.role !== "SUPER_ADMIN" && !targetCompanyId) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    const query: Record<string, unknown> = {};
    if (targetCompanyId) query.companyId = targetCompanyId;
    if (tripId && isValidObjectId(tripId)) query.tripId = tripId;
    if (status) query.status = status;

    if (q) {
      const safe = escapeRegex(q);
      query.$or = [
        { shortCode: { $regex: safe, $options: "i" } },
        { passengerPhone: { $regex: escapeRegex(q.replace(/\s+/g, "")) } },
        { passengerName: { $regex: safe, $options: "i" } },
      ];
    }

    const bookings = await Booking.find(query)
      .select("-qrSignature")
      .populate("tripId", "tripCode originCity destinationCity departureDate departureTime busPlateNumber")
      .populate("companyId", "name code")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 0. Anti-spam (best effort : en serverless, la limite en mémoire est par instance)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous_ip";
    const ipLimit = checkRateLimit(`ip_${clientIp}`, { windowMs: 10 * 60 * 1000, max: 10 });
    if (!ipLimit.allowed) {
      throw new AppError(
        `Trop de tentatives depuis votre appareil. Veuillez réessayer dans ${ipLimit.resetInSeconds} secondes.`,
        "VALIDATION_ERROR",
        429
      );
    }

    await connectToDatabase();
    const session = await getAuthSession(req);

    const body = await req.json();
    const { tripId, originCity, destinationCity, passengerName, passengerPhone, passengerEmail, seatsCount = 1, couponCode } = body;

    // 1. Validations de base
    if (!tripId || !originCity || !destinationCity || !passengerName || !passengerPhone) {
      throw new AppError(
        "Tous les champs obligatoires doivent être renseignés (tripId, originCity, destinationCity, passengerName, passengerPhone).",
        "VALIDATION_ERROR",
        400
      );
    }
    if (!isValidObjectId(tripId)) {
      throw new AppError("Voyage introuvable.", "NOT_FOUND", 404);
    }

    const requestedSeats = Number(seatsCount);
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1 || requestedSeats > MAX_SEATS_PER_BOOKING) {
      throw new AppError(
        `Le nombre de places doit être un entier compris entre 1 et ${MAX_SEATS_PER_BOOKING}.`,
        "VALIDATION_ERROR",
        400
      );
    }

    // 2. Normalisation stricte du numéro de téléphone E.164 (+229...)
    const normalizedPhone = normalizePhoneNumber(String(passengerPhone));

    // Anti-blocage d'inventaire : max 3 réservations non payées en cours par numéro (vérifié en base).
    const pendingForPhone = await Booking.countDocuments({
      passengerPhone: normalizedPhone,
      status: "PENDING_PAYMENT",
      lockedUntil: { $gt: new Date() },
    });
    if (pendingForPhone >= 3) {
      throw new AppError(
        "Ce numéro a déjà plusieurs réservations en attente de paiement. Finalisez-les ou patientez quelques minutes.",
        "VALIDATION_ERROR",
        429
      );
    }

    // 3. Récupération et vérification du voyage
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError("Voyage introuvable.", "NOT_FOUND", 404);
    }

    const now = new Date();
    const cutoffTime = new Date(trip.departureDateTime.getTime() - trip.cutoffMinutes * 60 * 1000);
    if (now >= cutoffTime || trip.status !== "OPEN") {
      throw new AppError(
        "Les réservations sur l'application sont clôturées pour ce départ (délai H-2 atteint ou bus complet).",
        "OVERBOOKING_ERROR",
        409
      );
    }

    const segment = trip.pricing.find(
      (p) =>
        p.from.toLowerCase() === String(originCity).toLowerCase() &&
        p.to.toLowerCase() === String(destinationCity).toLowerCase()
    );
    if (!segment) {
      throw new AppError(
        `Ce bus ne dessert pas le trajet direct de ${originCity} vers ${destinationCity}.`,
        "VALIDATION_ERROR",
        400
      );
    }

    // 4. Rend d'abord les places des paiements abandonnés sur ce voyage, puis verrou atomique.
    await releaseExpiredBookings({ tripId: trip._id });

    const lockedTrip = await Trip.findOneAndUpdate(
      { _id: trip._id, status: "OPEN", availableSeats: { $gte: requestedSeats } },
      { $inc: { availableSeats: -requestedSeats, lockedSeats: requestedSeats } },
      { returnDocument: "after" }
    );
    if (!lockedTrip) {
      throw new AppError("Désolé, il ne reste plus assez de places disponibles sur ce départ.", "OVERBOOKING_ERROR", 409);
    }

    try {
      // 5. Calcul financier (tarif, frais Kaweru, commission, coupon)
      const company = await Company.findById(trip.companyId);
      const basePriceTotal = segment.price * requestedSeats;

      let serviceFeeTotal = 0;
      if (company && company.commission.paidBy === "PASSENGER") {
        serviceFeeTotal = company.commission.value * requestedSeats;
      }

      let discountTotal = 0;
      let appliedCoupon: string | null = null;
      if (couponCode) {
        const code = String(couponCode).trim().toUpperCase();
        const coupon = await Coupon.findOne({ code, isActive: true, expiresAt: { $gt: now } });
        if (coupon && basePriceTotal >= coupon.minTripAmount) {
          const usesByPassenger = await Booking.countDocuments({
            couponCode: code,
            passengerPhone: normalizedPhone,
            status: { $in: ["PENDING_PAYMENT", "CONFIRMED", "USED"] },
          });
          if (usesByPassenger < (coupon.maxUsesPerUser || 1)) {
            discountTotal = Math.min(coupon.discountAmount, basePriceTotal);
            appliedCoupon = code;
          }
        }
      }

      const totalToPay = Math.max(0, basePriceTotal + serviceFeeTotal - discountTotal);

      let companySettlement = basePriceTotal;
      if (company && company.commission.paidBy === "COMPANY") {
        companySettlement =
          company.commission.type === "FIXED"
            ? Math.max(0, basePriceTotal - company.commission.value * requestedSeats)
            : Math.max(0, Math.round(basePriceTotal * (1 - company.commission.value / 100)));
      }

      // 6. Création de la réservation (code court unique, quelques essais en cas de collision)
      let booking = null;
      for (let attempt = 0; attempt < 3 && !booking; attempt++) {
        const draft = new Booking({
          tripId: trip._id,
          companyId: trip.companyId,
          userId: session?.uid || "guest_user",
          passengerName: String(passengerName).trim(),
          passengerPhone: normalizedPhone,
          passengerEmail: passengerEmail ? String(passengerEmail).trim() : null,
          seatsCount: requestedSeats,
          originCity,
          destinationCity,
          departureDateTime: trip.departureDateTime,
          basePriceFcfa: basePriceTotal,
          serviceFeeFcfa: serviceFeeTotal,
          discountFcfa: discountTotal,
          totalPaidFcfa: totalToPay,
          companySettlementAmountFcfa: companySettlement,
          status: "PENDING_PAYMENT",
          paymentProvider: "FEDAPAY",
          lockedUntil: new Date(Date.now() + PAYMENT_LOCK_MS),
          boardingStatus: "NOT_BOARDED",
          isSettledToCompany: false,
          couponCode: appliedCoupon,
        });
        draft.shortCode = generateShortCode();
        draft.qrSignature = generateQrSignature(draft._id.toString(), draft.shortCode, totalToPay);
        try {
          booking = await draft.save();
        } catch (err) {
          const isDuplicate = (err as { code?: number })?.code === 11000;
          if (!isDuplicate || attempt === 2) throw err;
        }
      }
      if (!booking) throw new Error("Impossible de générer un code de réservation unique.");

      return NextResponse.json(
        {
          success: true,
          message: "Siège réservé temporairement pendant 7 minutes. Procédez au paiement Mobile Money.",
          data: {
            bookingId: booking._id,
            shortCode: booking.shortCode,
            passengerName: booking.passengerName,
            passengerPhone: booking.passengerPhone,
            originCity: booking.originCity,
            destinationCity: booking.destinationCity,
            departureDateTime: booking.departureDateTime,
            seatsCount: booking.seatsCount,
            basePriceFcfa: booking.basePriceFcfa,
            serviceFeeFcfa: booking.serviceFeeFcfa,
            discountFcfa: booking.discountFcfa,
            totalToPayFcfa: booking.totalPaidFcfa,
            lockedUntil: booking.lockedUntil,
            expiresInSeconds: PAYMENT_LOCK_MS / 1000,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      // La réservation n'a pas pu être créée : on rend les places verrouillées.
      await Trip.updateOne(
        { _id: trip._id },
        { $inc: { availableSeats: requestedSeats, lockedSeats: -requestedSeats } }
      );
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
