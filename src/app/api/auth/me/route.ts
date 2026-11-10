import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { normalizePhoneNumber } from "@/lib/config";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

// GET /api/auth/me - Récupérer les informations de profil de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non connecté" }, { status: 401 });
    }
    const user = session.user;

    return NextResponse.json({
      success: true,
      user: {
        uid: session.uid,
        id: user._id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        residenceCity: user.residenceCity,
        role: user.role,
        companyId: user.companyId ? user.companyId.toString() : null,
        stationId: user.stationId || null,
        referralCode: user.referralCode,
        referralPoints: user.referralPoints,
        isActive: user.isActive,
      },
    });
  } catch (error: unknown) {
    console.error("[auth/me GET]", error);
    return NextResponse.json({ success: false, error: "Erreur profil" }, { status: 500 });
  }
}

// PUT /api/auth/me - Modifier son profil (Nom, Prénom, Téléphone, Ville de résidence)
export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non connecté" }, { status: 401 });
    }
    const body = await req.json();
    const { firstName, lastName, phone, residenceCity } = body;

    const cleanFirst = String(firstName || "").trim();
    const cleanLast = String(lastName || "").trim();
    const cleanCity = String(residenceCity || "").trim();

    if (!cleanFirst || !cleanLast) {
      return NextResponse.json(
        { success: false, error: "Le prénom et le nom sont obligatoires." },
        { status: 400 }
      );
    }

    const user = session.user;
    user.firstName = cleanFirst;
    user.lastName = cleanLast;
    user.fullName = `${cleanFirst} ${cleanLast}`.trim();
    if (cleanCity) user.residenceCity = cleanCity;

    // Le numéro de téléphone est l'identifiant de connexion : il n'est jamais modifiable depuis le profil.
    if (phone && String(phone).trim().length >= 8 && normalizePhoneNumber(String(phone)) !== user.phone) {
      return NextResponse.json(
        { success: false, error: "Le numéro de téléphone ne peut pas être modifié. Contactez le support Kaweru." },
        { status: 403 }
      );
    }
    user.isProfileCompleted = true;
    await user.save();

    const updatedSession = {
      ...session.token,
      role: user.role,
      companyId: user.companyId ? user.companyId.toString() : null,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.fullName,
      phone: user.phone,
      residenceCity: user.residenceCity,
      isProfileCompleted: true,
    };

    const response = NextResponse.json({
      success: true,
      message: "Profil mis à jour avec succès.",
      user: updatedSession,
    });
    setSessionCookie(response, updatedSession);
    return response;
  } catch (error: unknown) {
    console.error("[auth/me PUT]", error);
    return NextResponse.json({ success: false, error: "Erreur modification" }, { status: 500 });
  }
}
