import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { normalizePhoneNumber } from "@/lib/config";
import { connectToDatabase } from "@/lib/mongodb";
import { isOtpFallbackAllowed } from "@/lib/otp";
import { Otp } from "@/models/Otp";
import { User } from "@/models/User";
import { sendOtpEmail } from "@/lib/mailer";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 envoi par minute et par identifiant

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/** Remplace l'OTP précédent ; refuse si un code a été émis il y a moins d'une minute. */
async function issueOtp(identifier: string, method: "PHONE" | "EMAIL"): Promise<string | null> {
  const recent = await Otp.findOne({
    identifier,
    method,
    createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
  });
  if (recent) return null;

  const code = crypto.randomInt(100000, 1000000).toString();
  await Otp.deleteMany({ identifier, method });
  await Otp.create({ identifier, method, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  return code;
}

const tooManyRequests = () =>
  NextResponse.json(
    { success: false, error: "Un code vient d'être envoyé. Patientez une minute avant d'en redemander un." },
    { status: 429 }
  );

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, phone, email } = body;
    const fallbackAllowed = isOtpFallbackAllowed();

    await connectToDatabase();

    if (method === "PHONE") {
      if (!phone || String(phone).trim().length < 8) {
        return NextResponse.json(
          { success: false, error: "Veuillez saisir un numéro de téléphone valide." },
          { status: 400 }
        );
      }

      const normalizedPhone = normalizePhoneNumber(String(phone));
      const code = await issueOtp(normalizedPhone, "PHONE");
      if (!code) return tooManyRequests();

      // TODO: brancher la passerelle SMS (FasterMessage / Twilio). En attendant, copie par e-mail si connu.
      let delivered = false;
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser?.email) {
        delivered = (await sendOtpEmail(existingUser.email, code)).delivered;
      }

      if (!delivered && !fallbackAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: "L'envoi de code par SMS n'est pas encore disponible. Connectez-vous par e-mail ou avec Google.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        method: "PHONE",
        identifier: normalizedPhone,
        delivered,
        // Uniquement en développement ou si OTP_INSECURE_FALLBACK=true est explicitement assumé.
        fallbackCode: !delivered && fallbackAllowed ? code : undefined,
        message: delivered
          ? `Code OTP envoyé sur l'e-mail associé au ${normalizedPhone}`
          : `Code généré pour ${normalizedPhone}`,
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
      const code = await issueOtp(cleanEmail, "EMAIL");
      if (!code) return tooManyRequests();

      const delivery = await sendOtpEmail(cleanEmail, code);

      if (!delivery.delivered && !fallbackAllowed) {
        return NextResponse.json(
          { success: false, error: "Impossible d'envoyer l'e-mail pour le moment. Réessayez dans quelques minutes." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        method: "EMAIL",
        identifier: cleanEmail,
        delivered: delivery.delivered,
        provider: delivery.provider,
        fallbackCode: !delivery.delivered && fallbackAllowed ? code : undefined,
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
    console.error("[auth/send-otp]", error);
    return NextResponse.json({ success: false, error: "Erreur lors de l'envoi du code OTP" }, { status: 500 });
  }
}
