import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || '"Kaweru" <onboarding@resend.dev>';
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export const mailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export interface TicketEmailData {
  to: string;
  passengerName: string;
  shortCode: string;
  companyName: string;
  originCity: string;
  destinationCity: string;
  departureDateTime: string;
  seatNumber?: number | null;
  totalPaidFcfa: number;
}

export interface OtpDeliveryResult {
  delivered: boolean;
  provider: "RESEND" | "SMTP" | "FALLBACK";
  note?: string;
}

/**
 * Envoie un email via l'API Resend (prioritaire) ou SMTP Nodemailer (secours)
 */
async function sendEmailInternal(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<OtpDeliveryResult> {
  // 1. Priorité Resend API si RESEND_API_KEY est configurée
  if (RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kaweru Bénin <onboarding@resend.dev>",
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
      });

      if (response.ok) {
        return { delivered: true, provider: "RESEND" };
      }

      const errData = await response.json().catch(() => ({}));
      console.warn("[Resend API Info]", response.status, errData);
    } catch (err) {
      console.error("[Resend Fetch Error]", err);
    }
  }

  // 2. Secours SMTP Nodemailer si configuré avec de vrais identifiants (hors placeholder)
  if (
    SMTP_USER &&
    SMTP_PASS &&
    !SMTP_USER.includes("votre-email") &&
    !SMTP_PASS.includes("votre-mot-de-passe")
  ) {
    try {
      await mailTransporter.sendMail({
        from: SMTP_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return { delivered: true, provider: "SMTP" };
    } catch (error) {
      console.error("[Nodemailer Error]", error);
    }
  }

  return {
    delivered: false,
    provider: "FALLBACK",
    note: "Canal email en mode bac à sable pour ce destinataire",
  };
}

/**
 * Envoie le code OTP à 6 chiffres par e-mail (sans mot de passe)
 */
export async function sendOtpEmail(
  to: string,
  otpCode: string
): Promise<OtpDeliveryResult> {
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: linear-gradient(135deg, #FFB800, #F06548); color: #ffffff; font-weight: 900; font-size: 20px; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; margin-bottom: 8px;">K</div>
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">KAWERU</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Vérification sécurisée sans mot de passe</p>
      </div>

      <div style="padding: 28px 0; text-align: center;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 20px 0;">
          Utilisez le code de vérification unique ci-dessous pour vous connecter à votre espace Kaweru :
        </p>

        <div style="background-color: #0f172a; border-radius: 16px; padding: 22px; margin: 0 auto; max-width: 280px;">
          <span style="display: block; font-size: 11px; color: #FFB800; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; margin-bottom: 6px;">Code OTP à 6 chiffres</span>
          <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${otpCode}</div>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
          Ce code est valable pendant <strong>10 minutes</strong>. Ne le partagez avec personne.
        </p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
        Kaweru Bénin • Réseau National de Mobilité Interurbaine
      </div>
    </div>
  `;

  return sendEmailInternal({
    to,
    subject: `${otpCode} est votre code de connexion Kaweru`,
    html,
  });
}

/**
 * Envoie le billet électronique au passager par email
 */
export async function sendTicketEmail(data: TicketEmailData): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="text-align: center; border-bottom: 2px solid #FFB800; padding-bottom: 10px;">
        <h1 style="color: #0f172a; margin: 0;">KAWERU</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Votre billet de bus est confirmé !</p>
      </div>

      <div style="padding: 20px 0;">
        <p>Bonjour <strong>${data.passengerName}</strong>,</p>
        <p>Votre réservation sur <strong>${data.companyName}</strong> a été validée avec succès.</p>

        <div style="background-color: #0f172a; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <span style="font-size: 12px; color: #FFB800; text-transform: uppercase; letter-spacing: 1.5px;">Code d'embarquement</span>
          <h2 style="font-size: 28px; letter-spacing: 4px; color: #ffffff; margin: 8px 0;">${data.shortCode}</h2>
          ${data.seatNumber ? `<span style="font-weight: bold; color: #FFB800;">Siège N° ${data.seatNumber}</span>` : ""}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Trajet :</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.originCity} ➔ ${data.destinationCity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Départ :</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.departureDateTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Total payé :</td>
            <td style="padding: 8px 0; font-weight: bold; color: #16a34a; text-align: right;">${data.totalPaidFcfa.toLocaleString()} FCFA</td>
          </tr>
        </table>

        <div style="background-color: #fef3c7; border-left: 4px solid #FFB800; padding: 10px; margin-top: 20px; font-size: 13px; color: #92400e;">
          <strong>Consigne :</strong> Présentez-vous en gare au moins 30 minutes avant l'heure de départ muni de votre pièce d'identité (CIP/Passeport).
        </div>
      </div>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        Assistance Kaweru Bénin • Réseau National Interurbain
      </div>
    </div>
  `;

  const res = await sendEmailInternal({
    to: data.to,
    subject: `Votre Billet Kaweru [${data.shortCode}] : ${data.originCity} ➔ ${data.destinationCity}`,
    html,
  });

  return res.delivered;
}
