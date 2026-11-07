import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trip } from "@/models/Trip";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const count = await Trip.countDocuments();
    if (count === 0) {
      const { seedDatabase } = await import("@/scripts/seed");
      await seedDatabase();
    }

    const { searchParams } = new URL(req.url);
    const origin = searchParams.get("origin")?.trim();
    const destination = searchParams.get("destination")?.trim();
    const date = searchParams.get("date")?.trim(); // Format: YYYY-MM-DD

    // Si pas de filtre de trajet, retourne tous les voyages actifs pour les gares / tableaux de bord
    if (!origin || !destination) {
      const allActiveTrips = await Trip.find({
        status: { $in: ["OPEN", "CLOSED_CUTOFF", "BOARDING"] },
      })
        .sort({ departureDateTime: 1 })
        .limit(30);

      return NextResponse.json({
        success: true,
        data: allActiveTrips,
      });
    }

    const query: Record<string, unknown> = {
      status: { $in: ["OPEN", "CLOSED_CUTOFF"] },
    };

    if (date) {
      query.departureDate = date;
    }

    const trips = await Trip.find(query).sort({ departureDateTime: 1 });

    const now = new Date();

    // Filtre et extrait uniquement les bus desservant le segment origin -> destination
    const matchingTrips = trips
      .map((trip) => {
        // 1. Vérification de la coupure automatique H-2
        const cutoffTime = new Date(
          trip.departureDateTime.getTime() - trip.cutoffMinutes * 60 * 1000
        );
        const isCutoffReached = now >= cutoffTime;

        let currentStatus = trip.status;
        if (isCutoffReached && currentStatus === "OPEN") {
          currentStatus = "CLOSED_CUTOFF";
        }

        // 2. Recherche du prix pour le segment précis
        const segmentPricing = trip.pricing.find(
          (p) =>
            p.from.toLowerCase() === origin.toLowerCase() &&
            p.to.toLowerCase() === destination.toLowerCase()
        );

        if (!segmentPricing) {
          return null; // Ce bus ne fait pas ce tronçon précis
        }

        // 3. Vérification de l'ordre des arrêts (origin doit être avant destination)
        const originStop = trip.stops.find(
          (s) => s.city.toLowerCase() === origin.toLowerCase()
        );
        const destStop = trip.stops.find(
          (s) => s.city.toLowerCase() === destination.toLowerCase()
        );

        if (originStop && destStop && originStop.order >= destStop.order) {
          return null; // Sens inverse
        }

        return {
          id: trip._id,
          tripCode: trip.tripCode,
          companyId: trip.companyId,
          companyName: trip.companyName,
          originCity: trip.originCity,
          destinationCity: trip.destinationCity,
          requestedOrigin: origin,
          requestedDestination: destination,
          departureDate: trip.departureDate,
          departureTime: trip.departureTime,
          departureDateTime: trip.departureDateTime,
          stationName: originStop ? originStop.stationName : trip.originCity,
          availableSeats: currentStatus === "OPEN" ? trip.availableSeats : 0,
          totalQuota: trip.totalQuota,
          status: currentStatus,
          isBookable: currentStatus === "OPEN" && trip.availableSeats > 0,
          priceFcfa: segmentPricing.price,
          stopsCount: trip.stops.length,
          stops: trip.stops.map((s) => ({
            order: s.order,
            city: s.city,
            stationName: s.stationName,
            isReached: s.isReached,
          })),
        };
      })
      .filter((t) => t !== null);

    return NextResponse.json({
      success: true,
      count: matchingTrips.length,
      data: matchingTrips,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

