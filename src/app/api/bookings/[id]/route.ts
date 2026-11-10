import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { isValidObjectId } from "mongoose";
import { expireBookingIfStale } from "@/lib/bookingLifecycle";
import { handleApiError, AppError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      throw new AppError("Réservation introuvable", "NOT_FOUND", 404);
    }

    const booking = await Booking.findById(id).populate("companyId", "name logoUrl");
    if (!booking) {
      throw new AppError("Réservation introuvable", "NOT_FOUND", 404);
    }

    // Libération à la volée si le verrou de paiement a expiré (rend toutes les places réservées)
    if (booking.status === "PENDING_PAYMENT" && new Date() > booking.lockedUntil) {
      if (await expireBookingIfStale(booking._id)) booking.status = "EXPIRED";
    }

    return NextResponse.json({
      success: true,
      data: {
        id: booking._id,
        shortCode: booking.shortCode,
        status: booking.status,
        passengerName: booking.passengerName,
        passengerPhone: booking.passengerPhone,
        originCity: booking.originCity,
        destinationCity: booking.destinationCity,
        departureDateTime: booking.departureDateTime,
        seatNumber: booking.seatNumber,
        totalPaidFcfa: booking.totalPaidFcfa,
        qrSignature: booking.qrSignature,
        lockedUntil: booking.lockedUntil,
        isExpired: booking.status === "EXPIRED",
        isConfirmed: booking.status === "CONFIRMED",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

