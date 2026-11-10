import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthSession, requireSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { ReferralConfig } from "@/models/ReferralConfig";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Les points ne sont visibles que par leur propriétaire (plus de consultation par uid/téléphone arbitraire).
    const session = await getAuthSession(req);

    let config = await ReferralConfig.findOne({ key: "GLOBAL_REFERRAL_CONFIG" });
    if (!config) {
      config = await ReferralConfig.create({
        key: "GLOBAL_REFERRAL_CONFIG",
        pointsPerFilleulPurchase: 100,
        fcfaValuePerPoint: 5,
        isActive: true,
      });
    }

    const user = session?.user ?? null;

    // Le parrainage utilise l'identifiant unique de l'utilisateur (firebaseUid ou _id)
    const referralId = user ? (user.firebaseUid || user._id.toString()) : "USER";
    const referralLinkWeb = `https://kaweru-reactiver.vercel.app/login?ref=${referralId}`;

    return NextResponse.json({
      success: true,
      referralCode: referralId,
      referralId,
      referralLinkWeb,
      referralPoints: user?.referralPoints || 0,
      referralsCount: user?.referralsCount || 0,
      config: {
        pointsPerFilleulPurchase: config.pointsPerFilleulPurchase,
        fcfaValuePerPoint: config.fcfaValuePerPoint,
        isActive: config.isActive,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur parrainage";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireSession(req, ["SUPER_ADMIN"]);

    const body = await req.json();
    const { pointsPerFilleulPurchase, fcfaValuePerPoint, isActive } = body;

    const points = Number(pointsPerFilleulPurchase);
    if (isNaN(points) || points < 0 || points > 100000) {
      return NextResponse.json(
        { success: false, error: "Nombre de points par achat invalide." },
        { status: 400 }
      );
    }

    const fcfaVal = fcfaValuePerPoint !== undefined ? Number(fcfaValuePerPoint) : 5;

    const updated = await ReferralConfig.findOneAndUpdate(
      { key: "GLOBAL_REFERRAL_CONFIG" },
      {
        $set: {
          pointsPerFilleulPurchase: points,
          fcfaValuePerPoint: isNaN(fcfaVal) || fcfaVal < 1 ? 5 : fcfaVal,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          updatedBy: "ADMIN",
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      message: "Configuration du programme de parrainage mise à jour.",
      config: {
        pointsPerFilleulPurchase: updated?.pointsPerFilleulPurchase ?? points,
        fcfaValuePerPoint: updated?.fcfaValuePerPoint ?? fcfaVal,
        isActive: updated?.isActive ?? true,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[referrals PUT]", error);
    return NextResponse.json({ success: false, error: "Erreur de mise à jour parrainage" }, { status: 500 });
  }
}

