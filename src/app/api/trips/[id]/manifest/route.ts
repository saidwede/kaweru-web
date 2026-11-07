import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trip } from "@/models/Trip";
import { Booking } from "@/models/Booking";
import { handleApiError, AppError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const trip = await Trip.findById(id).populate("companyId", "name code logoUrl settlementMomo");
    if (!trip) {
      throw new AppError("Voyage introuvable", "NOT_FOUND", 404);
    }

    // Récupération de tous les billets confirmés pour ce voyage
    const bookings = await Booking.find({
      tripId: trip._id,
      status: "CONFIRMED",
    }).sort({ seatNumber: 1, createdAt: 1 });

    // Initialisation ou synchronisation de la grille des 50 sièges du bus
    const totalBusSeats = 50;
    const seatsMap = new Map();

    // Remplissage des sièges réservés sur Kaweru
    bookings.forEach((b, index) => {
      const assignedSeatNumber = b.seatNumber || index + 1;
      seatsMap.set(assignedSeatNumber, {
        seatNumber: assignedSeatNumber,
        status: "RESERVED_KAWERU",
        bookingId: b._id.toString(),
        shortCode: b.shortCode,
        passengerName: b.passengerName,
        passengerPhone: b.passengerPhone,
        originCity: b.originCity,
        destinationCity: b.destinationCity,
        boardingStatus: b.boardingStatus,
        totalPaidFcfa: b.totalPaidFcfa,
      });
    });

    // Remplissage des sièges déjà marqués au guichet physique
    if (trip.seats && trip.seats.length > 0) {
      trip.seats.forEach((s) => {
        if (s.status === "CASH_GUICHET" && !seatsMap.has(s.seatNumber)) {
          seatsMap.set(s.seatNumber, {
            seatNumber: s.seatNumber,
            status: "CASH_GUICHET",
            passengerName: s.passengerName || "Passager Guichet",
            passengerPhone: s.passengerPhone || "-",
            destinationCity: s.destinationCity || trip.destinationCity,
            isBoarded: s.isBoarded || false,
          });
        }
      });
    }

    // Génération de la liste complète des 50 sièges
    const completeSeats = [];
    for (let i = 1; i <= totalBusSeats; i++) {
      if (seatsMap.has(i)) {
        completeSeats.push(seatsMap.get(i));
      } else {
        completeSeats.push({
          seatNumber: i,
          status: "VACANT",
          passengerName: null,
          passengerPhone: null,
          destinationCity: null,
          isBoarded: false,
        });
      }
    }

    const reservedKaweruCount = completeSeats.filter((s) => s.status === "RESERVED_KAWERU").length;
    const cashGuichetCount = completeSeats.filter((s) => s.status === "CASH_GUICHET").length;
    const vacantCount = completeSeats.filter((s) => s.status === "VACANT").length;

    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          tripCode: trip.tripCode,
          companyName: trip.companyName,
          originCity: trip.originCity,
          destinationCity: trip.destinationCity,
          departureDate: trip.departureDate,
          departureTime: trip.departureTime,
          departureDateTime: trip.departureDateTime,
          status: trip.status,
          currentMilestone: trip.currentMilestone,
          stops: trip.stops,
          totalBusSeats,
          stats: {
            reservedKaweruCount,
            cashGuichetCount,
            vacantCount,
            occupancyRate: Math.round(((reservedKaweruCount + cashGuichetCount) / totalBusSeats) * 100),
          },
        },
        seats: completeSeats,
        passengersList: bookings.map((b) => ({
          bookingId: b._id,
          shortCode: b.shortCode,
          passengerName: b.passengerName,
          passengerPhone: b.passengerPhone,
          originCity: b.originCity,
          destinationCity: b.destinationCity,
          boardingStatus: b.boardingStatus,
          boardedAt: b.boardedAt,
          seatNumber: b.seatNumber,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
