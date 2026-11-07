import { NextRequest, NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/config";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, firstName, lastName, phone, email, residenceCity } = body;

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

    await connectToDatabase();

    // Trouver l'utilisateur par firebaseUid, email ou téléphone
    let userDoc = uid ? await User.findOne({ firebaseUid: String(uid) }) : null;
    if (!userDoc && email) {
      userDoc = await User.findOne({ email: String(email).trim().toLowerCase() });
    }
    if (!userDoc && phone) {
      const norm = normalizePhoneNumber(String(phone));
      userDoc = await User.findOne({ phone: norm });
    }

    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    let finalPhone = userDoc?.phone || "";

    // Si un numéro est fourni (obligatoire lors d'une inscription par Email ou Google)
    if (phone && String(phone).trim().length >= 8) {
      finalPhone = normalizePhoneNumber(String(phone));
    }

    if (!finalPhone || finalPhone.startsWith("email_") || finalPhone.startsWith("google_")) {
      return NextResponse.json(
        { success: false, error: "Veuillez saisir votre numéro de téléphone (+229)." },
        { status: 400 }
      );
    }

    let userRole: UserRole = "PASSENGER";
    let userUid = uid ? String(uid) : `usr_${Date.now()}`;
    let referralCode =
      userDoc?.referralCode || `KWR${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    let referralPoints = userDoc?.referralPoints || 0;
    const cleanEmail = email ? String(email).trim().toLowerCase() : userDoc?.email;
    const envSuperAdmins = (process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isSuperAdminEmail = Boolean(cleanEmail && envSuperAdmins.includes(cleanEmail));

    if (userDoc) {
      userDoc.firstName = cleanFirstName;
      userDoc.lastName = cleanLastName;
      userDoc.fullName = fullName;
      userDoc.phone = finalPhone;
      if (cleanEmail) userDoc.email = cleanEmail;
      if (isSuperAdminEmail) userDoc.role = "SUPER_ADMIN";
      userDoc.residenceCity = cleanCity;
      userDoc.isProfileCompleted = true;

      try {
        await userDoc.save();
      } catch {
        // Si le numéro existe déjà sur un autre document, fusionner proprement
        await User.updateOne(
          { _id: userDoc._id },
          {
            $set: {
              firstName: cleanFirstName,
              lastName: cleanLastName,
              fullName,
              residenceCity: cleanCity,
              isProfileCompleted: true,
              ...(isSuperAdminEmail ? { role: "SUPER_ADMIN" } : {}),
            },
          }
        );
      }

      userRole = isSuperAdminEmail ? "SUPER_ADMIN" : userDoc.role;
      userUid = userDoc.firebaseUid || userDoc._id.toString();
    } else {
      try {
        const created = await User.create({
          firebaseUid: userUid,
          phone: finalPhone,
          email: cleanEmail,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          fullName,
          residenceCity: cleanCity,
          isProfileCompleted: true,
          role: isSuperAdminEmail ? "SUPER_ADMIN" : "PASSENGER",
          referralCode: `KWR${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          walletCreditsFcfa: 0,
          isActive: true,
        });
        userRole = created.role;
        userUid = created.firebaseUid;
      } catch {
        // En cas de doublon téléphone, mettre à jour l'existant
        const existingByPhone = await User.findOneAndUpdate(
          { phone: finalPhone },
          {
            $set: {
              firstName: cleanFirstName,
              lastName: cleanLastName,
              fullName,
              residenceCity: cleanCity,
              isProfileCompleted: true,
              ...(cleanEmail ? { email: cleanEmail } : {}),
            },
          },
          { returnDocument: "after" }
        );
        if (existingByPhone) {
          userRole = existingByPhone.role;
          userUid = existingByPhone.firebaseUid;
        }
      }
    }

    let redirectUrl = "/";
    if (
      userRole === "STATION_MANAGER" ||
      userRole === "COMPANY_ADMIN" ||
      userRole === "SUPER_ADMIN"
    ) {
      redirectUrl = "/manifest";
    } else if (userRole === "ONBOARD_CONDUCTOR") {
      redirectUrl = "/conductor";
    }

    const sessionData = {
      uid: userUid,
      role: userRole,
      phone: finalPhone,
      email: cleanEmail,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: fullName,
      residenceCity: cleanCity,
      isProfileCompleted: true,
      referralCode,
      referralPoints,
      companyName: userRole === "PASSENGER" ? "Kaweru" : "Confort Lines",
    };

    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const response = NextResponse.json({
      success: true,
      token: encodedSession,
      user: sessionData,
      redirectUrl,
    });

    response.cookies.set("kaweru_session", encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour du profil";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
