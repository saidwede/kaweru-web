import { NextRequest, NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/config";
import { getAuthSession } from "@/lib/auth";
import { applySessionCookie, signSession, SessionData } from "@/lib/session";
import { User } from "@/models/User";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function isPlaceholderPhone(phone?: string | null): boolean {
  return !phone || phone.startsWith("email_") || phone.startsWith("google_");
}

/**
 * POST /api/auth/complete-profile
 * Complète le profil de l'utilisateur CONNECTÉ uniquement (session signée obligatoire).
 * Le rôle et l'e-mail ne sont jamais modifiables ici : ils proviennent d'une connexion vérifiée.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expirée. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, phone, residenceCity } = body;

    const cleanFirstName = String(firstName || "").trim();
    const cleanLastName = String(lastName || "").trim();
    const cleanCity = String(residenceCity || "").trim();

    if (!cleanFirstName || !cleanLastName) {
      return NextResponse.json(
        { success: false, error: "Veuillez renseigner votre nom et votre prénom." },
        { status: 400 }
      );
    }
    if (!cleanCity) {
      return NextResponse.json(
        { success: false, error: "Veuillez sélectionner votre ville de résidence." },
        { status: 400 }
      );
    }

    const userDoc = session.user;
    let finalPhone = userDoc.phone;

    if (phone && String(phone).trim().length >= 8) {
      const normalized = normalizePhoneNumber(String(phone));
      // Le numéro ne peut être renseigné qu'une seule fois (comptes créés par e-mail / Google), jamais remplacé.
      if (normalized !== userDoc.phone && !isPlaceholderPhone(userDoc.phone)) {
        return NextResponse.json(
          { success: false, error: "Le numéro de téléphone ne peut pas être modifié. Contactez le support Kaweru." },
          { status: 403 }
        );
      }
      if (normalized !== userDoc.phone) {
        const taken = await User.exists({ phone: normalized, _id: { $ne: userDoc._id } });
        if (taken) {
          return NextResponse.json(
            { success: false, error: "Ce numéro est déjà associé à un autre compte Kaweru." },
            { status: 409 }
          );
        }
        finalPhone = normalized;
      }
    }

    if (isPlaceholderPhone(finalPhone)) {
      return NextResponse.json(
        { success: false, error: "Veuillez saisir votre numéro de téléphone (+229)." },
        { status: 400 }
      );
    }

    userDoc.firstName = cleanFirstName;
    userDoc.lastName = cleanLastName;
    userDoc.fullName = `${cleanFirstName} ${cleanLastName}`;
    userDoc.phone = finalPhone;
    userDoc.residenceCity = cleanCity;
    userDoc.isProfileCompleted = true;
    await userDoc.save();

    const role = userDoc.role;
    let redirectUrl = "/";
    if (role === "SUPER_ADMIN") redirectUrl = "/admin";
    else if (role === "STATION_MANAGER" || role === "COMPANY_ADMIN" || role === "TICKET_AGENT") redirectUrl = "/manifest";
    else if (role === "ONBOARD_CONDUCTOR") redirectUrl = "/conductor";

    const sessionData: SessionData = {
      ...session.token,
      uid: session.uid,
      role,
      companyId: userDoc.companyId ? userDoc.companyId.toString() : null,
      phone: finalPhone,
      email: userDoc.email,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: userDoc.fullName,
      residenceCity: cleanCity,
      isProfileCompleted: true,
      referralCode: userDoc.referralCode,
      referralPoints: userDoc.referralPoints,
    };

    const token = signSession(sessionData);
    const response = NextResponse.json({ success: true, token, user: sessionData, redirectUrl });
    applySessionCookie(response, token);
    return response;
  } catch (error: unknown) {
    console.error("[auth/complete-profile]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
