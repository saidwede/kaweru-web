import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { getAuthSession } from "@/lib/auth";
import { escapeRegex } from "@/lib/security";
import { safeEqual } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Trip } from "@/models/Trip";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    const allowedRoles = ["SUPER_ADMIN", "COMPANY_ADMIN", "STATION_MANAGER", "TICKET_AGENT", "ONBOARD_CONDUCTOR"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé. Réservé au personnel d'exploitation." },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const {
      searchQuery,
      shortCode,
      phone,
      bookingId,
      action = "VERIFY", // "VERIFY" (cherche et affiche les détails) ou "CONFIRM_BOARDING" (valide l'embarquement)
      forceBoarding = false, // Permet au chef de gare de forcer si besoin
    } = body;

    const rawInput = (searchQuery || shortCode || phone || bookingId || "").trim();
    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: "Veuillez fournir un code court, un numéro de téléphone ou un scan QR code." },
        { status: 400 }
      );
    }

    let cleanedCode = rawInput.toUpperCase();
    let scannedSignature: string | null = null;
    let scannedBookingId: string | null = null;

    if (rawInput.includes("|")) {
      // Format du QR mobile : "<bookingId>|<shortCode>|<signature>"
      const [idPart, codePart, sigPart] = rawInput.split("|");
      if (isValidObjectId(idPart)) scannedBookingId = idPart;
      if (codePart) cleanedCode = codePart.trim().toUpperCase();
      if (sigPart) scannedSignature = sigPart.trim();
    } else if (rawInput.includes("code=")) {
      const match = rawInput.match(/code=([A-Z0-9-]+)/i);
      if (match) cleanedCode = match[1].toUpperCase();
    } else if (rawInput.startsWith("{") && rawInput.includes("shortCode")) {
      try {
        const parsed = JSON.parse(rawInput);
        if (parsed.shortCode) cleanedCode = String(parsed.shortCode).toUpperCase();
        if (parsed.signature || parsed.qrSignature) scannedSignature = String(parsed.signature || parsed.qrSignature);
      } catch {
        // Ignorer
      }
    }

    const orConditions: Array<Record<string, unknown>> = scannedBookingId
      ? [{ _id: scannedBookingId, shortCode: cleanedCode }]
      : [
          { shortCode: cleanedCode },
          { passengerPhone: { $regex: escapeRegex(rawInput.replace(/\s+/g, "")) } },
          { passengerName: { $regex: escapeRegex(rawInput), $options: "i" } },
        ];

    if (!scannedBookingId && isValidObjectId(rawInput)) {
      orConditions.push({ _id: rawInput });
    }

    // Un agent ne voit que les billets de sa compagnie ; sans compagnie, il ne voit rien.
    if (session.role !== "SUPER_ADMIN" && !session.companyId) {
      return NextResponse.json(
        { success: false, error: "Votre compte n'est rattaché à aucune compagnie." },
        { status: 403 }
      );
    }
    const companyFilter: Record<string, unknown> =
      session.role === "SUPER_ADMIN" ? {} : { companyId: session.companyId };

    const bookings = await Booking.find({
      ...companyFilter,
      $or: orConditions,
    })
      .populate("tripId", "tripCode companyName originCity destinationCity departureDate departureTime busPlateNumber currentMilestone")
      .populate("companyId", "name code")
      .sort({ createdAt: -1 })
      .limit(10);

    if (bookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun billet correspondant trouvé. Vérifiez le code ou le numéro de téléphone.",
        },
        { status: 404 }
      );
    }

    const target = bookings[0];
    const trip = target.tripId as unknown as { departureDate?: string } | null;

    // Un QR scanné doit porter la signature émise par le serveur pour ce billet.
    if (scannedSignature !== null && !safeEqual(scannedSignature, target.qrSignature || "")) {
      return NextResponse.json(
        { success: false, error: "QR code falsifié ou invalide. Vérifiez l'identité du passager." },
        { status: 400 }
      );
    }

    // GESTION DU DÉCALAGE DE JOURNÉE (J / J+1 / J-1)
    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
    const tripDate = trip?.departureDate;

    let dateStatus: "TODAY" | "PAST_DAY" | "FUTURE_DAY" = "TODAY";
    let dateWarningMessage: string | null = null;

    if (tripDate) {
      if (tripDate < today) {
        dateStatus = "PAST_DAY";
        dateWarningMessage = `Attention : Ce billet était prévu pour le ${tripDate} (Départ passé). Le passager a raté son bus initial.`;
      } else if (tripDate > today) {
        dateStatus = "FUTURE_DAY";
        dateWarningMessage = `Attention : Ce billet est prévu pour le ${tripDate} (Date future). Le départ n'est pas aujourd'hui.`;
      }
    }

    // Si l'action demandée est "CONFIRM_BOARDING"
    if (action === "CONFIRM_BOARDING") {
      // Bloquer si la date est dépassée et que l'agent n'a pas explicitement forcé
      if (dateStatus === "PAST_DAY" && !forceBoarding) {
        return NextResponse.json({
          success: false,
          dateAlert: true,
          dateStatus,
          message: `${dateWarningMessage} Procédez au report officiel vers le bus du jour ou cochez 'Forcer l'embarquement exceptionnel'.`,
          data: target,
        }, { status: 400 });
      }

      if (dateStatus === "FUTURE_DAY" && !forceBoarding) {
        return NextResponse.json({
          success: false,
          dateAlert: true,
          dateStatus,
          message: `${dateWarningMessage} Ce passager ne peut pas embarquer avant le jour prévu sans report de date.`,
          data: target,
        }, { status: 400 });
      }

      // Seul un billet PAYÉ peut embarquer (pas de paiement en attente, expiré ou annulé).
      if (target.status !== "CONFIRMED") {
        return NextResponse.json(
          {
            success: false,
            message: `Billet non valide pour l'embarquement (statut : ${target.status}).`,
            data: target,
          },
          { status: 400 }
        );
      }

      // Transition atomique : deux scans simultanés ne valident qu'une seule fois.
      const boarded = await Booking.findOneAndUpdate(
        { _id: target._id, status: "CONFIRMED", boardingStatus: "NOT_BOARDED" },
        { $set: { boardingStatus: "BOARDED", boardedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!boarded) {
        return NextResponse.json({
          success: true,
          message: `Le passager ${target.passengerName} a DÉJÀ été marqué à bord précédemment.`,
          data: target,
          alreadyBoarded: true,
        });
      }
      target.boardingStatus = boarded.boardingStatus;
      target.boardedAt = boarded.boardedAt;

      // Mettre à jour l'état du siège dans le voyage correspondant
      if (target.tripId && target.seatNumber) {
        await Trip.updateOne(
          { _id: target.tripId, "seats.seatNumber": target.seatNumber },
          { $set: { "seats.$.isBoarded": true } }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Embarquement validé avec succès pour ${target.passengerName} (Siège ${target.seatNumber || "Non assigné"}).`,
        data: target,
        boardedNow: true,
      });
    }

    // Sinon action === "VERIFY", on renvoie les résultats avec indication de la journée
    return NextResponse.json({
      success: true,
      count: bookings.length,
      data: bookings,
      dateStatus,
      dateWarningMessage,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erreur vérification billet";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
