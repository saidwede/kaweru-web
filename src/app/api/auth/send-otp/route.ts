import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { normalizePhoneNumber } from "@/lib/config";
import { connectToDatabase } from "@/lib/mongodb";
import { Otp } from "@/models/Otp";
import { User } from "@/models/User";
import { sendOtpEmail } from "@/lib/mailer";

const OTP_SECRET = process.env.QR_SECRET_KEY || "kaweru_otp_hmac_secret_2026";

export function signOtpChallenge(identifier: string, code: string, expiresAtMs: number): string {
  const payload = `${identifier}:${code}:${expiresAtMs}`;
  const sig = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ identifier, expiresAtMs, sig })).toString("base64");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, phone, email } = body;

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes
    const expiresAt = new Date(expiresAtMs);

    await connectToDatabase();

    if (method === "PHONE") {
      if (!phone || String(phone).trim().length < 8) {
        return NextResponse.json(
          { success: false, error: "Veuillez saisir un numéro de téléphone valide." },
          { status: 400 }
        );
      }

      const normalizedPhone = normalizePhoneNumber(String(phone));

      await Otp.deleteMany({ identifier: normalizedPhone, method: "PHONE" });
      await Otp.create({
        identifier: normalizedPhone,
        method: "PHONE",
        code,
        expiresAt,
      });

      const challengeToken = signOtpChallenge(normalizedPhone, code, expiresAtMs);

      // Si l'utilisateur possède un email associé en base, lui envoyer aussi le code par email
      let emailBackupSent = false;
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser?.email) {
        const mailRes = await sendOtpEmail(existingUser.email, code);
        emailBackupSent = mailRes.delivered;
      }

      return NextResponse.json({
        success: true,
        method: "PHONE",
        identifier: normalizedPhone,
        challengeToken,
        delivered: emailBackupSent,
        // Tant qu'une passerelle SMS locale payante (Twilio / FasterMessage) n'est pas activée,
        // fournir le code en notification instantanée pour ne jamais bloquer l'utilisateur
        fallbackCode: code,
        message: emailBackupSent
          ? `Code OTP envoyé au ${normalizedPhone} (et copie sur votre e-mail)`
          : `Code SMS généré pour ${normalizedPhone}`,
      });
    }

    if (method === "EMAIL") {
      if (!email || !String(email).includes("@")) {
        return NextResponse.json(
          { success: false, error: "Veuillez saisir une adresse e-mail valide." },
          { status: 400 }
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();

      await Otp.deleteMany({ identifier: cleanEmail, method: "EMAIL" });
      await Otp.create({
        identifier: cleanEmail,
        method: "EMAIL",
        code,
        expiresAt,
      });

      const challengeToken = signOtpChallenge(cleanEmail, code, expiresAtMs);
      const delivery = await sendOtpEmail(cleanEmail, code);

      return NextResponse.json({
        success: true,
        method: "EMAIL",
        identifier: cleanEmail,
        challengeToken,
        delivered: delivery.delivered,
        provider: delivery.provider,
        // Si Resend est en mode sandbox (destinataire externe non vérifié sur le domaine),
        // renvoyer fallbackCode pour permettre la connexion immédiate sans blocage
        fallbackCode: delivery.delivered ? undefined : code,
        message: delivery.delivered
          ? `Code à 6 chiffres envoyé par e-mail à ${cleanEmail}`
          : `Code généré pour ${cleanEmail}`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Méthode d'envoi OTP non reconnue." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'envoi du code OTP";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

