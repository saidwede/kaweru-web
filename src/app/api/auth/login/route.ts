import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { normalizePhoneNumber } from "@/lib/config";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { Otp } from "@/models/Otp";

const OTP_SECRET = process.env.QR_SECRET_KEY || "kaweru_otp_hmac_secret_2026";

function verifyOtpChallenge(
  challengeToken: string | undefined,
  identifier: string,
  code: string
): boolean {
  if (!challengeToken) return false;
  try {
    const decoded = JSON.parse(Buffer.from(challengeToken, "base64").toString("utf-8"));
    if (decoded.identifier !== identifier) return false;
    if (Date.now() > Number(decoded.expiresAtMs)) return false;

    const payload = `${identifier}:${code}:${decoded.expiresAtMs}`;
    const expectedSig = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
    return expectedSig === decoded.sig;
  } catch {
    return false;
  }
}

function getSuperAdminEmails(): Set<string> {
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const list = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set(list);
}

function deduceRoleFromEmail(email: string): { role: UserRole; companyName: string } {
  const lower = email.trim().toLowerCase();
  const superAdmins = getSuperAdminEmails();
  if (superAdmins.has(lower)) {
    return { role: "SUPER_ADMIN", companyName: "Direction Kaweru" };
  }
  return { role: "PASSENGER", companyName: "Kaweru" };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loginMethod, phone, email, otp, challengeToken, name, googleUid, referredBy } = body;
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
    let referralCode = `KWR${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    let referralPoints = 0;
    let companyName = "Kaweru";

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

      const otpRecord = await Otp.findOne({
        identifier: userPhone,
        method: "PHONE",
        code: cleanOtp,
        expiresAt: { $gt: new Date() },
      });

      const isHmacValid = verifyOtpChallenge(challengeToken, userPhone, cleanOtp);

      if (!otpRecord && !isHmacValid) {
        return NextResponse.json(
          { success: false, error: "Code OTP invalide ou expiré. Veuillez demander un nouveau code." },
          { status: 401 }
        );
      }

      if (otpRecord) {
        await Otp.deleteOne({ _id: otpRecord._id });
      }

      userName = `Voyageur ${userPhone.slice(-4)}`;

      const existingUser = await User.findOne({ phone: userPhone });
      if (existingUser) {
        userRole = existingUser.role;
        userName = existingUser.fullName;
        firstName = existingUser.firstName || "";
        lastName = existingUser.lastName || "";
        residenceCity = existingUser.residenceCity || "";
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
          const validSponsor = cleanRef ? await User.findOne({ referralCode: cleanRef }) : null;
          const newUser = await User.create({
            firebaseUid: userUid,
            phone: userPhone,
            fullName: userName,
            isProfileCompleted: false,
            role: "PASSENGER",
            referralCode,
            referredBy: validSponsor ? cleanRef : null,
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

      const otpRecord = await Otp.findOne({
        identifier: cleanEmail,
        method: "EMAIL",
        code: cleanOtp,
        expiresAt: { $gt: new Date() },
      });

      const isHmacValid = verifyOtpChallenge(challengeToken, cleanEmail, cleanOtp);

      if (!otpRecord && !isHmacValid) {
        return NextResponse.json(
          { success: false, error: "Code OTP invalide ou expiré. Vérifiez votre boîte mail." },
          { status: 401 }
        );
      }

      if (otpRecord) {
        await Otp.deleteOne({ _id: otpRecord._id });
      }

      const deduced = deduceRoleFromEmail(cleanEmail);
      userRole = deduced.role;
      companyName = deduced.companyName;
      userName = cleanEmail.split("@")[0];

      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
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
          const validSponsor = cleanRef ? await User.findOne({ referralCode: cleanRef }) : null;
          const placeholderPhone = `email_${cleanEmail}`;
          const newUser = await User.create({
            firebaseUid: userUid,
            phone: placeholderPhone,
            email: cleanEmail,
            fullName: userName,
            isProfileCompleted: false,
            role: userRole,
            referralCode,
            referredBy: validSponsor ? cleanRef : null,
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
          // Ignorer doublon
        }
      }
    }

    // =========================================================================
    // 3. CONNEXION AVEC GOOGLE (OAUTH 1-CLIC)
    // =========================================================================
    else if (loginMethod === "GOOGLE") {
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Compte Google sans adresse e-mail valide." },
          { status: 400 }
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();
      userEmail = cleanEmail;
      userName = name ? String(name).trim() : cleanEmail.split("@")[0];
      if (name && String(name).trim().includes(" ")) {
        const parts = String(name).trim().split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }
      userUid = googleUid ? String(googleUid) : `ggl_${Date.now()}`;

      const deduced = deduceRoleFromEmail(cleanEmail);
      userRole = deduced.role;
      companyName = deduced.companyName;

      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { firebaseUid: userUid }],
      });

      if (existingUser) {
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
          const validSponsor = cleanRef ? await User.findOne({ referralCode: cleanRef }) : null;
          const newUser = await User.create({
            firebaseUid: userUid,
            phone: `google_${userUid}`,
            email: cleanEmail,
            firstName,
            lastName,
            fullName: userName,
            isProfileCompleted: false,
            role: userRole,
            referralCode,
            referredBy: validSponsor ? cleanRef : null,
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

    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const response = NextResponse.json({
      success: true,
      token: encodedSession,
      user: sessionData,
      needsProfileCompletion: !isProfileCompleted,
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
    const message = error instanceof Error ? error.message : "Erreur de connexion";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
