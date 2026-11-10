import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { releaseExpiredBookings } from "@/lib/bookingLifecycle";
import { Trip } from "@/models/Trip";
import { Company } from "@/models/Company";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Données de démonstration : jamais en production.
    if (process.env.NODE_ENV !== "production" && (await Trip.estimatedDocumentCount()) === 0) {
      const { seedDatabase } = await import("@/scripts/seed");
      await seedDatabase();
    }

    // Rend les places des paiements abandonnés avant d'afficher les disponibilités.
    await releaseExpiredBookings();

    const { searchParams } = new URL(req.url);
    const origin = searchParams.get("origin")?.trim();
    const destination = searchParams.get("destination")?.trim();
    const date = searchParams.get("date")?.trim(); // Format: YYYY-MM-DD
    const companyId = searchParams.get("companyId")?.trim();

    // Si pas de filtre de trajet, retourne tous les voyages actifs pour les gares / tableaux de bord
    if (!origin || !destination) {
      const query: Record<string, unknown> = {
        status: { $in: ["OPEN", "CLOSED_CUTOFF", "BOARDING", "EN_ROUTE"] },
      };
      if (companyId && isValidObjectId(companyId)) {
        query.companyId = companyId;
      }
      if (date) {
        query.departureDate = date;
      }

      // Le plan des sièges (noms / téléphones des passagers guichet) n'est jamais exposé publiquement.
      const allActiveTrips = await Trip.find(query)
        .select("-seats")
        .sort({ departureDateTime: 1 })
        .limit(50);

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
    if (companyId && isValidObjectId(companyId)) {
      query.companyId = companyId;
    }

    const now = new Date();
    // Inutile de charger les départs déjà partis (la recherche voyageur ne porte que sur le futur).
    query.departureDateTime = { $gte: now };

    const trips = await Trip.find(query).select("-seats").sort({ departureDateTime: 1 }).limit(200);

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

// POST /api/trips - Création d'un départ / trajet (COMPANY_ADMIN ou SUPER_ADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isCompanyAdmin = session.role === "COMPANY_ADMIN";

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: "Seul un Responsable de Compagnie ou le Super Admin peut créer un départ." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      originCity,
      destinationCity,
      departureDate,
      departureTime,
      priceFcfa,
      busPlateNumber,
      totalQuota = 50,
      stops = [],
      targetCompanyId,
    } = body;

    if (!originCity || !destinationCity || !departureDate || !departureTime || !priceFcfa) {
      return NextResponse.json(
        { success: false, error: "Origine, destination, date, heure et prix requis." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Déterminer la compagnie
    const effectiveCompanyId = isSuperAdmin ? (targetCompanyId || session.companyId) : session.companyId;
    if (!effectiveCompanyId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de la compagnie manquant." },
        { status: 400 }
      );
    }

    const company = await Company.findById(effectiveCompanyId);
    if (!company) {
      return NextResponse.json({ success: false, error: "Compagnie introuvable." }, { status: 404 });
    }

    // Code du départ généré
    const codePrefix = company.code || company.name.slice(0, 3).toUpperCase();
    const destPrefix = destinationCity.slice(0, 3).toUpperCase();
    const hourClean = departureTime.replace(":", "");
    const tripCode = `${codePrefix}-${destPrefix}-${hourClean}`;

    const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);

    // 50 sièges initiaux
    const seatsCount = Number(totalQuota) || 50;
    const initialSeats = Array.from({ length: seatsCount }, (_, i) => ({
      seatNumber: i + 1,
      status: "VACANT" as const,
      bookingId: null,
      passengerName: null,
      passengerPhone: null,
      destinationCity: null,
      isBoarded: false,
    }));

    // Arrêts par défaut si non spécifiés
    const defaultStops = stops.length > 0 ? stops : [
      { order: 1, city: originCity, stationName: `Gare ${originCity}`, isReached: false },
      { order: 2, city: destinationCity, stationName: `Gare ${destinationCity}`, isReached: false },
    ];

    const pricing = [
      { from: originCity, to: destinationCity, price: Number(priceFcfa) },
    ];

    const newTrip = await Trip.create({
      tripCode,
      companyId: company._id,
      companyName: company.name,
      originCity,
      destinationCity,
      departureDate,
      departureTime,
      departureDateTime,
      cutoffMinutes: 120, // H-2 avant départ
      busPlateNumber: busPlateNumber || `BUS-${Math.floor(1000 + Math.random() * 9000)}`,
      totalQuota: seatsCount,
      availableSeats: seatsCount,
      lockedSeats: 0,
      soldSeats: 0,
      status: "OPEN",
      currentMilestone: `En gare à ${originCity}`,
      stops: defaultStops,
      pricing,
      seats: initialSeats,
    });

    return NextResponse.json({
      success: true,
      message: `Départ ${tripCode} programmé avec succès.`,
      data: newTrip,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
