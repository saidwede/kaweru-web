import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trip } from "@/models/Trip";
import { Company } from "@/models/Company";
import { Booking, IBooking } from "@/models/Booking";
import { Coupon } from "@/models/Coupon";
import { User } from "@/models/User";
import { ReferralConfig } from "@/models/ReferralConfig";
import { AppError, handleApiError } from "@/lib/errors";
import { normalizePhoneNumber } from "@/lib/config";
import { generateShortCode, generateQrSignature } from "@/lib/security";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // 0. Sécurité : Rate Limiting anti-spam / anti-déni d'inventaire
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

    const body = await req.json();
    const {
      tripId,
      originCity,
      destinationCity,
      passengerName,
      passengerPhone,
      passengerEmail,
      seatsCount = 1,
      couponCode,
      userId = "guest_user",
    } = body;

    // 1. Validations de base
    if (!tripId || !originCity || !destinationCity || !passengerName || !passengerPhone) {
      throw new AppError(
        "Tous les champs obligatoires doivent être renseignés (tripId, originCity, destinationCity, passengerName, passengerPhone).",
        "VALIDATION_ERROR",
        400
      );
    }

    const requestedSeats = Number(seatsCount) || 1;
    if (requestedSeats < 1 || requestedSeats > 50) {
      throw new AppError("Le nombre de places doit être compris entre 1 et 50.", "VALIDATION_ERROR", 400);
    }

    // 2. Normalisation stricte du numéro de téléphone E.164 (+229...)
    const normalizedPhone = normalizePhoneNumber(passengerPhone);

    // Rate Limiting par numéro de téléphone (Max 3 réservations temporaires actives en 10 min)
    const phoneLimit = checkRateLimit(`phone_${normalizedPhone}`, { windowMs: 10 * 60 * 1000, max: 3 });
    if (!phoneLimit.allowed) {
      throw new AppError(
        `Ce numéro de téléphone a déjà plusieurs réservations en cours. Veuillez finaliser le paiement ou attendre ${phoneLimit.resetInSeconds} secondes.`,
        "VALIDATION_ERROR",
        429
      );
    }

    // 3. Récupération et vérification du voyage
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError("Voyage introuvable.", "NOT_FOUND", 404);
    }

    // Vérification de la coupure H-2
    const now = new Date();
    const cutoffTime = new Date(trip.departureDateTime.getTime() - trip.cutoffMinutes * 60 * 1000);
    if (now >= cutoffTime || trip.status !== "OPEN") {
      throw new AppError(
        "Les réservations sur l'application sont clôturées pour ce départ (délai H-2 atteint ou bus complet).",
        "OVERBOOKING_ERROR",
        409
      );
    }

    // Récupération du prix pour le tronçon exact
    const segment = trip.pricing.find(
      (p) =>
        p.from.toLowerCase() === originCity.toLowerCase() &&
        p.to.toLowerCase() === destinationCity.toLowerCase()
    );
    if (!segment) {
      throw new AppError(
        `Ce bus ne dessert pas le trajet direct de ${originCity} vers ${destinationCity}.`,
        "VALIDATION_ERROR",
        400
      );
    }

    // 4. RÉSERVATION ATOMIQUE ANTI-SURBOOKING (Soft-lock 7 minutes)
    // Seul un appel atomique garantit qu'aucun autre utilisateur ne prenne le même siège
    const updatedTrip = await Trip.findOneAndUpdate(
      {
        _id: tripId,
        status: "OPEN",
        availableSeats: { $gte: seatsCount },
      },
      {
        $inc: { availableSeats: -seatsCount, lockedSeats: seatsCount },
      },
      { returnDocument: "after" }
    );

    if (!updatedTrip) {
      throw new AppError(
        "Désolé, il ne reste plus assez de places disponibles sur ce départ.",
        "OVERBOOKING_ERROR",
        409
      );
    }

    // 5. Calcul financier (Tarif de base, frais Kaweru, commissions et coupon)
    const company = await Company.findById(trip.companyId);
    const basePriceTotal = segment.price * seatsCount;

    let serviceFeeTotal = 0;
    if (company && company.commission.paidBy === "PASSENGER") {
      serviceFeeTotal = company.commission.value * seatsCount;
    }

    let discountTotal = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        expiresAt: { $gt: now },
      });

      if (coupon && basePriceTotal >= coupon.minTripAmount) {
        discountTotal = coupon.discountAmount;
      }
    }

    const totalToPay = Math.max(0, basePriceTotal + serviceFeeTotal - discountTotal);

    // Calcul de la part revenant obligatoirement à la compagnie
    let companySettlement = basePriceTotal;
    if (company && company.commission.paidBy === "COMPANY") {
      if (company.commission.type === "FIXED") {
        companySettlement = Math.max(0, basePriceTotal - company.commission.value * seatsCount);
      } else {
        companySettlement = Math.max(0, basePriceTotal * (1 - company.commission.value / 100));
      }
    }

    // 6. Génération des codes et clés de sécurité
    const shortCode = generateShortCode();
    const lockedUntil = new Date(Date.now() + 7 * 60 * 1000); // 7 minutes
    const qrSignature = generateQrSignature(shortCode, normalizedPhone, totalToPay);

    // 7. Création de la réservation
    const booking: IBooking = new Booking({
      shortCode,
      tripId: trip._id,
      companyId: trip.companyId,
      userId,
      passengerName: passengerName.trim(),
      passengerPhone: normalizedPhone,
      passengerEmail: passengerEmail?.trim() || null,
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
      lockedUntil,
      qrSignature,
      boardingStatus: "NOT_BOARDED",
      isSettledToCompany: false,
    });

    await booking.save();

    // 8. Programme de Parrainage : Si l'acheteur est un filleul (inscrit via le lien d'un parrain),
    // créditer automatiquement le parrain avec le nombre de points configuré par l'Admin à chaque achat
    try {
      const buyerUser = await User.findOne({
        $or: [
          ...(userId && userId !== "guest_user" ? [{ firebaseUid: userId }] : []),
          { phone: normalizedPhone },
        ],
      });

      if (buyerUser && buyerUser.referredBy) {
        const refConfig = await ReferralConfig.findOne({ key: "GLOBAL_REFERRAL_CONFIG" });
        const isRefActive = refConfig ? refConfig.isActive : true;
        const pointsToAward = refConfig ? refConfig.pointsPerFilleulPurchase : 100;

        if (isRefActive && pointsToAward > 0) {
          await User.updateOne(
            { referralCode: buyerUser.referredBy },
            { $inc: { referralPoints: pointsToAward } }
          );
        }
      }
    } catch {
      // Ne jamais bloquer la réservation si la mise à jour des points échoue
    }

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
          basePriceFcfa: booking.basePriceFcfa,
          serviceFeeFcfa: booking.serviceFeeFcfa,
          discountFcfa: booking.discountFcfa,
          totalToPayFcfa: booking.totalPaidFcfa,
          lockedUntil: booking.lockedUntil,
          expiresInSeconds: 420,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
