import { NextRequest, NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/config";
import { connectToDatabase } from "@/lib/mongodb";
import { consumeOtp } from "@/lib/otp";
import { applySessionCookie, signSession } from "@/lib/session";
import { verifyGoogleIdToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { User, UserRole } from "@/models/User";

function getSuperAdminEmails(): Set<string> {
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const list = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set(list);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loginMethod, phone, email, otp, name, idToken, referredBy } = body;
    const cleanRef = referredBy ? String(referredBy).trim().toUpperCase() : null;

    let userRole: UserRole = "PASSENGER";
    let userName = "";
    let firstName = "";
    let lastName = "";
    let residenceCity = "";
    let isProfileCompleted = false;
    let userPhone: string | undefined;
    let userEmail: string | undefined;
    let userUid = `usr_${Date.now()}`;
    let userCompanyId: string | null = null;
    let referralCode = `KWR${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    let referralPoints = 0;
    const companyName = "Kaweru";

    await connectToDatabase();

    // =========================================================================
    // 1. CONNEXION PAR NUMÉRO DE TÉLÉPHONE + CODE OTP
    // =========================================================================
    if (loginMethod === "PHONE") {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "Numéro de téléphone requis" },
          { status: 400 }
        );
      }
      const cleanOtp = String(otp || "").trim();
      if (!cleanOtp || cleanOtp.length < 4) {
        return NextResponse.json(
          { success: false, error: "Veuillez saisir le code OTP à 6 chiffres." },
          { status: 400 }
        );
      }

      userPhone = normalizePhoneNumber(String(phone));

      if (!(await consumeOtp(userPhone, "PHONE", cleanOtp))) {
        return NextResponse.json(
          { success: false, error: "Code OTP invalide ou expiré. Veuillez demander un nouveau code." },
          { status: 401 }
        );
      }

      userName = `Voyageur ${userPhone.slice(-4)}`;

      const existingUser = await User.findOne({ phone: userPhone });
      if (existingUser) {
        if (!existingUser.isActive) {
          return NextResponse.json(
            { success: false, error: "Votre compte a été désactivé par l'administrateur." },
            { status: 403 }
          );
        }
        userRole = existingUser.role;
        userName = existingUser.fullName;
        firstName = existingUser.firstName || "";
        lastName = existingUser.lastName || "";
        residenceCity = existingUser.residenceCity || "";
        userCompanyId = existingUser.companyId ? existingUser.companyId.toString() : null;
        referralCode = existingUser.referralCode || referralCode;
        referralPoints = existingUser.referralPoints || 0;
        isProfileCompleted = Boolean(
          existingUser.isProfileCompleted &&
          existingUser.residenceCity &&
          !existingUser.fullName.startsWith("Voyageur ") &&
          !existingUser.fullName.startsWith("Utilisateur ")
        );
        userEmail = existingUser.email;
        userUid = existingUser.firebaseUid || existingUser._id.toString();
      } else {
        try {
          const validSponsor = cleanRef
            ? await User.findOne({
                $or: [{ referralCode: cleanRef }, { firebaseUid: cleanRef }, { _id: cleanRef.length === 24 ? cleanRef : undefined }],
              })
            : null;
          const newUser = await User.create({
            firebaseUid: userUid,
            phone: userPhone,
            fullName: userName,
            isProfileCompleted: false,
            role: "PASSENGER",
            referralCode: userUid,
            referredBy: validSponsor ? (validSponsor.firebaseUid || validSponsor._id.toString()) : null,
            referralPoints: 0,
            referralsCount: 0,
            walletCreditsFcfa: 0,
            isActive: true,
          });
          if (validSponsor) {
            await User.updateOne({ _id: validSponsor._id }, { $inc: { referralsCount: 1 } });
          }
          userUid = newUser.firebaseUid;
          referralCode = newUser.referralCode;
        } catch {
          // Ignorer si déjà présent
        }
      }
    }

    // =========================================================================
    // 2. CONNEXION PAR EMAIL + CODE OTP (SANS MOT DE PASSE)
    // =========================================================================
    else if (loginMethod === "EMAIL") {
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Adresse e-mail requise" },
          { status: 400 }
        );
      }
      const cleanOtp = String(otp || "").trim();
      if (!cleanOtp || cleanOtp.length < 4) {
        return NextResponse.json(
          { success: false, error: "Veuillez saisir le code OTP à 6 chiffres reçu par e-mail." },
          { status: 400 }
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();
      userEmail = cleanEmail;

      if (!(await consumeOtp(cleanEmail, "EMAIL", cleanOtp))) {
        return NextResponse.json(
          { success: false, error: "Code OTP invalide ou expiré. Vérifiez votre boîte mail." },
          { status: 401 }
        );
      }

      userName = cleanEmail.split("@")[0];

      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        if (!existingUser.isActive) {
          return NextResponse.json(
            { success: false, error: "Votre compte a été désactivé par l'administrateur." },
            { status: 403 }
          );
        }
        const superAdmins = getSuperAdminEmails();
        if (superAdmins.has(cleanEmail) && existingUser.role !== "SUPER_ADMIN") {
          existingUser.role = "SUPER_ADMIN";
          await User.updateOne({ _id: existingUser._id }, { $set: { role: "SUPER_ADMIN" } });
        }
        userRole = superAdmins.has(cleanEmail) ? "SUPER_ADMIN" : existingUser.role;
        userName = existingUser.fullName;
        firstName = existingUser.firstName || "";
        lastName = existingUser.lastName || "";
        residenceCity = existingUser.residenceCity || "";
        userCompanyId = existingUser.companyId ? existingUser.companyId.toString() : null;
        referralCode = existingUser.referralCode || referralCode;
        referralPoints = existingUser.referralPoints || 0;
        const hasRealPhone = Boolean(
          existingUser.phone &&
          !existingUser.phone.startsWith("email_") &&
          !existingUser.phone.startsWith("google_")
        );
        userPhone = hasRealPhone ? existingUser.phone : undefined;
        isProfileCompleted = Boolean(
          existingUser.isProfileCompleted && hasRealPhone && existingUser.residenceCity
        );
        userUid = existingUser.firebaseUid || existingUser._id.toString();
      } else {
        try {
          const superAdmins = getSuperAdminEmails();
          const initialRole: UserRole = superAdmins.has(cleanEmail) ? "SUPER_ADMIN" : "PASSENGER";
          const validSponsor = cleanRef
            ? await User.findOne({
                $or: [{ referralCode: cleanRef }, { firebaseUid: cleanRef }, { _id: cleanRef.length === 24 ? cleanRef : undefined }],
              })
            : null;
          const placeholderPhone = `email_${cleanEmail}`;
          const newUser = await User.create({
            firebaseUid: userUid,
            phone: placeholderPhone,
            email: cleanEmail,
            fullName: userName,
            isProfileCompleted: false,
            role: initialRole,
            referralCode: userUid,
            referredBy: validSponsor ? (validSponsor.firebaseUid || validSponsor._id.toString()) : null,
            referralPoints: 0,
            referralsCount: 0,
            walletCreditsFcfa: 0,
            isActive: true,
          });
          if (validSponsor) {
            await User.updateOne({ _id: validSponsor._id }, { $inc: { referralsCount: 1 } });
          }
          userRole = initialRole;
          userUid = newUser.firebaseUid;
          referralCode = newUser.referralCode;
        } catch {
          // Ignorer doublon
        }
      }
    }

    // =========================================================================
    // 3. CONNEXION AVEC GOOGLE (OAUTH 1-CLIC)
    // =========================================================================
    else if (loginMethod === "GOOGLE") {
      if (!idToken) {
        return NextResponse.json(
          { success: false, error: "Jeton Google manquant. Veuillez mettre à jour l'application." },
          { status: 400 }
        );
      }

      // L'identité (email, uid) provient UNIQUEMENT du jeton vérifié par Firebase, jamais du corps de la requête.
      let google;
      try {
        google = await verifyGoogleIdToken(String(idToken));
      } catch (err) {
        const message = err instanceof AppError ? err.message : "Jeton Google invalide.";
        return NextResponse.json({ success: false, error: message }, { status: 401 });
      }

      const cleanEmail = google.email;
      const displayName = String(google.name || name || "").trim();
      userEmail = cleanEmail;
      userName = displayName || cleanEmail.split("@")[0];
      if (displayName.includes(" ")) {
        const parts = displayName.split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }
      userUid = google.uid;

      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { firebaseUid: userUid }],
      });

      if (existingUser) {
        if (!existingUser.isActive) {
          return NextResponse.json(
            { success: false, error: "Votre compte a été désactivé par l'administrateur." },
            { status: 403 }
          );
        }
        const superAdmins = getSuperAdminEmails();
        if (superAdmins.has(cleanEmail) && existingUser.role !== "SUPER_ADMIN") {
          existingUser.role = "SUPER_ADMIN";
          await User.updateOne({ _id: existingUser._id }, { $set: { role: "SUPER_ADMIN" } });
        }
        userRole = superAdmins.has(cleanEmail) ? "SUPER_ADMIN" : existingUser.role;
        userName = existingUser.fullName || userName;
        firstName = existingUser.firstName || firstName;
        lastName = existingUser.lastName || lastName;
        residenceCity = existingUser.residenceCity || "";
        userCompanyId = existingUser.companyId ? existingUser.companyId.toString() : null;
        referralCode = existingUser.referralCode || referralCode;
        referralPoints = existingUser.referralPoints || 0;
        const hasRealPhone = Boolean(
          existingUser.phone &&
          !existingUser.phone.startsWith("email_") &&
          !existingUser.phone.startsWith("google_")
        );
        userPhone = hasRealPhone ? existingUser.phone : undefined;
        isProfileCompleted = Boolean(
          existingUser.isProfileCompleted && hasRealPhone && existingUser.residenceCity
        );
        userUid = existingUser.firebaseUid || existingUser._id.toString();
      } else {
        try {
          const superAdmins = getSuperAdminEmails();
          const initialRole: UserRole = superAdmins.has(cleanEmail) ? "SUPER_ADMIN" : "PASSENGER";
          const validSponsor = cleanRef
            ? await User.findOne({
                $or: [{ referralCode: cleanRef }, { firebaseUid: cleanRef }, { _id: cleanRef.length === 24 ? cleanRef : undefined }],
              })
            : null;
          const newUser = await User.create({
            firebaseUid: userUid,
            phone: `google_${userUid}`,
            email: cleanEmail,
            firstName,
            lastName,
            fullName: userName,
            isProfileCompleted: false,
            role: initialRole,
            referralCode: userUid,
            referredBy: validSponsor ? (validSponsor.firebaseUid || validSponsor._id.toString()) : null,
            referralPoints: 0,
            referralsCount: 0,
            walletCreditsFcfa: 0,
            isActive: true,
          });
          if (validSponsor) {
            await User.updateOne({ _id: validSponsor._id }, { $inc: { referralsCount: 1 } });
          }
          userRole = initialRole;
          userUid = newUser.firebaseUid;
          referralCode = newUser.referralCode;
        } catch {
          // Ignorer si déjà créé
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Méthode d'authentification non supportée." },
        { status: 400 }
      );
    }

    let redirectUrl = "/";
    if (userRole === "SUPER_ADMIN") {
      redirectUrl = "/admin";
    } else if (
      userRole === "STATION_MANAGER" ||
      userRole === "COMPANY_ADMIN"
    ) {
      redirectUrl = "/manifest";
    } else if (userRole === "ONBOARD_CONDUCTOR") {
      redirectUrl = "/conductor";
    }

    const sessionData = {
      uid: userUid,
      role: userRole,
      companyId: userCompanyId,
      phone: userPhone,
      email: userEmail,
      firstName,
      lastName,
      name: userName,
      residenceCity,
      isProfileCompleted,
      referralCode,
      referralPoints,
      companyName,
    };

    // Le mobile (Flutter) stocke le jeton signé et l'envoie en Authorization: Bearer
    const token = signSession(sessionData);
    const response = NextResponse.json({
      success: true,
      token,
      user: sessionData,
      needsProfileCompletion: !isProfileCompleted,
      redirectUrl,
    });
    applySessionCookie(response, token);
    return response;
  } catch (error: unknown) {
    console.error("[auth/login]", error);
    return NextResponse.json({ success: false, error: "Erreur de connexion" }, { status: 500 });
  }
}
