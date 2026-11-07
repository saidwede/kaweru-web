import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Trip } from "@/models/Trip";
import { handleApiError, AppError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { newTripId } = body;

    if (!newTripId) {
      throw new AppError("L'identifiant du nouveau voyage (newTripId) est obligatoire.", "VALIDATION_ERROR", 400);
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new AppError("Réservation introuvable.", "NOT_FOUND", 404);
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "MISSED") {
      throw new AppError(
        `Impossible de reporter un billet au statut "${booking.status}". Seuls les billets confirmés ou manqués sont éligibles.`,
        "VALIDATION_ERROR",
        400
      );
    }

    const originalTrip = await Trip.findById(booking.tripId);
    const newTrip = await Trip.findById(newTripId);

    if (!newTrip) {
      throw new AppError("Nouveau voyage introuvable.", "NOT_FOUND", 404);
    }

    // Le report doit impérativement se faire sur la même compagnie
    if (newTrip.companyId.toString() !== booking.companyId.toString()) {
      throw new AppError(
        "Le report de date doit se faire avec la même compagnie de transport.",
        "VALIDATION_ERROR",
        400
      );
    }

    // Vérification de la disponibilité sur le nouveau bus
    const now = new Date();
    const newTripCutoff = new Date(newTrip.departureDateTime.getTime() - newTrip.cutoffMinutes * 60 * 1000);

    if (now >= newTripCutoff || newTrip.status !== "OPEN" || newTrip.availableSeats < 1) {
      throw new AppError(
        "Ce nouveau départ n'a plus de places disponibles ou les ventes sont clôturées.",
        "OVERBOOKING_ERROR",
        409
      );
    }

    // Calcul des frais de report selon la situation :
    // Cas A : Le client prévient > 2h avant le départ initial = 500 FCFA (Frais administratifs)
    // Cas B : Billet déjà manqué (No-Show dans la limite de 48h) = 1 000 FCFA (Pénalité de réactivation)
    let rescheduleFee = 500;
    const originalCutoff = originalTrip
      ? new Date(originalTrip.departureDateTime.getTime() - originalTrip.cutoffMinutes * 60 * 1000)
      : null;

    if (booking.status === "MISSED" || (originalCutoff && now >= originalCutoff)) {
      const maxMissedTime = originalTrip
        ? new Date(originalTrip.departureDateTime.getTime() + 48 * 60 * 60 * 1000)
        : null;

      if (maxMissedTime && now > maxMissedTime) {
        throw new AppError(
          "Le délai de 48h pour réactiver un départ manqué est dépassé. Ce billet n'est plus reportable.",
          "VALIDATION_ERROR",
          400
        );
      }

      rescheduleFee = 1000;
    }

    // 1. Verrouillage atomique sur le nouveau voyage
    const updatedNewTrip = await Trip.findOneAndUpdate(
      { _id: newTrip._id, status: "OPEN", availableSeats: { $gte: 1 } },
      { $inc: { availableSeats: -1, soldSeats: 1 } },
      { returnDocument: "after" }
    );

    if (!updatedNewTrip) {
      throw new AppError("La dernière place du nouveau départ vient d'être prise.", "OVERBOOKING_ERROR", 409);
    }

    // 2. Libération du siège sur l'ancien voyage (s'il n'est pas encore parti)
    if (originalTrip && originalCutoff && now < originalCutoff) {
      await Trip.findByIdAndUpdate(originalTrip._id, {
        $inc: { availableSeats: 1, soldSeats: -1 },
      });
    }

    // 3. Mise à jour de la réservation
    const previousTripId = booking.tripId;
    booking.tripId = newTrip._id;
    booking.departureDateTime = newTrip.departureDateTime;
    booking.status = "CONFIRMED";
    booking.boardingStatus = "NOT_BOARDED";
    booking.rescheduledToTripId = newTrip._id;
    booking.rescheduledAt = new Date();
    booking.rescheduleFeeFcfa = rescheduleFee;

    await booking.save();

    return NextResponse.json({
      success: true,
      message: `Votre voyage a été reporté avec succès au ${newTrip.departureDate} à ${newTrip.departureTime}.`,
      data: {
        bookingId: booking._id,
        shortCode: booking.shortCode,
        newDepartureDate: newTrip.departureDate,
        newDepartureTime: newTrip.departureTime,
        rescheduleFeeFcfa: rescheduleFee,
        previousTripId,
        newTripId: newTrip._id,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

