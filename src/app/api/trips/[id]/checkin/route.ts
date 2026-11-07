import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trip } from "@/models/Trip";
import { Booking } from "@/models/Booking";
import { handleApiError, AppError } from "@/lib/errors";
import { authenticateRequest, authorizeRoles } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. Sécurité RBAC : Seul le chef de bord ou le chef de gare peut valider des embarquements/débarquements
    const user = await authenticateRequest(req);
    authorizeRoles(user.role, ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "ONBOARD_CONDUCTOR"]);

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { type, shortCode, bookingId, milestone, stopOrder } = body;

    const trip = await Trip.findById(id);
    if (!trip) {
      throw new AppError("Voyage introuvable.", "NOT_FOUND", 404);
    }

    // 1. Validation de l'embarquement (Scan QR ou saisie du code court)
    if (type === "VALIDATE_BOARDING") {
      if (!shortCode && !bookingId) {
        throw new AppError("Code court ou identifiant de réservation requis.", "VALIDATION_ERROR", 400);
      }

      const query: Record<string, unknown> = {
        tripId: trip._id,
        status: "CONFIRMED",
      };

      if (shortCode) {
        query.shortCode = shortCode.trim().toUpperCase();
      } else if (bookingId) {
        query._id = bookingId;
      }

      const booking = await Booking.findOne(query);
      if (!booking) {
        throw new AppError("Billet introuvable ou non confirmé pour ce départ.", "NOT_FOUND", 404);
      }

      if (booking.boardingStatus === "BOARDED") {
        return NextResponse.json({
          success: true,
          message: "Passager déjà embarqué précédemment.",
          data: {
            shortCode: booking.shortCode,
            passengerName: booking.passengerName,
            destinationCity: booking.destinationCity,
            boardedAt: booking.boardedAt,
          },
        });
      }

      booking.boardingStatus = "BOARDED";
      booking.boardedAt = new Date();
      await booking.save();

      return NextResponse.json({
        success: true,
        message: `Embarquement validé pour ${booking.passengerName}.`,
        data: {
          shortCode: booking.shortCode,
          passengerName: booking.passengerName,
          originCity: booking.originCity,
          destinationCity: booking.destinationCity,
          seatNumber: booking.seatNumber,
          boardedAt: booking.boardedAt,
        },
      });
    }

    // 2. Débarquement à une escale (ex: Moussa descend à Dassa)
    if (type === "DISEMBARK") {
      if (!bookingId) {
        throw new AppError("Identifiant de réservation requis pour le débarquement.", "VALIDATION_ERROR", 400);
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError("Billet introuvable.", "NOT_FOUND", 404);
      }

      booking.boardingStatus = "DISEMBARKED";
      booking.disembarkedAt = new Date();
      await booking.save();

      return NextResponse.json({
        success: true,
        message: `Passager ${booking.passengerName} débarqué avec succès à ${booking.destinationCity}.`,
      });
    }

    // 3. Mise à jour des jalons de route du bus (Tracking par étapes)
    if (type === "UPDATE_MILESTONE") {
      if (!milestone) {
        throw new AppError("Libellé du jalon requis.", "VALIDATION_ERROR", 400);
      }

      trip.currentMilestone = milestone;

      if (typeof stopOrder === "number") {
        const stop = trip.stops.find((s) => s.order === stopOrder);
        if (stop) {
          stop.isReached = true;
          stop.reachedAt = new Date();
        }
      }

      await trip.save();

      return NextResponse.json({
        success: true,
        message: `Statut du bus mis à jour : "${milestone}"`,
        data: {
          currentMilestone: trip.currentMilestone,
          stops: trip.stops,
        },
      });
    }

    throw new AppError("Type d'opération non supporté.", "VALIDATION_ERROR", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
