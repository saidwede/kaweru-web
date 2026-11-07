import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Trip } from "@/models/Trip";
import { handleApiError, AppError } from "@/lib/errors";
import { authenticateRequest, authorizeRoles } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. Sécurité RBAC : Seul le personnel autorisé peut modifier les sièges au guichet
    const user = await authenticateRequest(req);
    authorizeRoles(user.role, ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "TICKET_AGENT"]);

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { seatNumber, action, passengerName, destinationCity, passengerPhone } = body;

    if (!seatNumber || !action) {
      throw new AppError("Le numéro de siège et l'action sont obligatoires.", "VALIDATION_ERROR", 400);
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      throw new AppError("Voyage introuvable.", "NOT_FOUND", 404);
    }

    // Recherche de l'index du siège dans le plan existant
    const existingIndex = trip.seats.findIndex((s) => s.seatNumber === seatNumber);

    if (action === "ASSIGN_CASH") {
      const newSeatData = {
        seatNumber,
        status: "CASH_GUICHET" as const,
        passengerName: passengerName?.trim() || "Passager Guichet",
        destinationCity: destinationCity || trip.destinationCity,
        passengerPhone: passengerPhone?.trim() || "-",
        isBoarded: false,
      };

      if (existingIndex >= 0) {
        if (trip.seats[existingIndex].status === "RESERVED_KAWERU") {
          throw new AppError("Impossible d'écraser un siège déjà payé sur Kaweru.", "VALIDATION_ERROR", 400);
        }
        trip.seats[existingIndex] = newSeatData;
      } else {
        trip.seats.push(newSeatData);
      }
    } else if (action === "FREE_SEAT") {
      if (existingIndex >= 0) {
        if (trip.seats[existingIndex].status === "RESERVED_KAWERU") {
          throw new AppError("Impossible de libérer un siège payé sur Kaweru sans annuler la réservation.", "VALIDATION_ERROR", 400);
        }
        trip.seats.splice(existingIndex, 1);
      }
    } else {
      throw new AppError("Action non reconnue.", "VALIDATION_ERROR", 400);
    }

    await trip.save();

    return NextResponse.json({
      success: true,
      message: `Siège N° ${seatNumber} mis à jour avec succès.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
