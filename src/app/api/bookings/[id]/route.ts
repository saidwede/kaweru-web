import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Trip } from "@/models/Trip";
import { handleApiError, AppError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const booking = await Booking.findById(id).populate("companyId", "name logoUrl");
    if (!booking) {
      throw new AppError("Réservation introuvable", "NOT_FOUND", 404);
    }

    const now = new Date();

    // Libération automatique à la volée (Zéro Cron obligatoire) :
    // Si la réservation est toujours en attente et que les 7 minutes ont expiré
    if (booking.status === "PENDING_PAYMENT" && now > booking.lockedUntil) {
      booking.status = "EXPIRED";
      await booking.save();

      // Restitue les sièges au voyage
      await Trip.findByIdAndUpdate(booking.tripId, {
        $inc: { availableSeats: 1, lockedSeats: -1 },
      });
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

