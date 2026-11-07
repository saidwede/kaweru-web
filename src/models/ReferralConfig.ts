import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferralConfig extends Document {
  key: string; // "GLOBAL_REFERRAL_CONFIG"
  pointsPerFilleulPurchase: number; // Points gagnés par le parrain à chaque achat d'un filleul
  fcfaValuePerPoint: number; // Valeur d'un point en FCFA
  isActive: boolean;
  updatedBy?: string;
  updatedAt: Date;
}

const ReferralConfigSchema = new Schema<IReferralConfig>(
  {
    key: { type: String, required: true, unique: true, default: "GLOBAL_REFERRAL_CONFIG" },
    pointsPerFilleulPurchase: { type: Number, required: true, default: 100, min: 0 },
    fcfaValuePerPoint: { type: Number, required: true, default: 5, min: 1 },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: String, default: "ADMIN" },
  },
  {
    timestamps: true,
  }
);

export const ReferralConfig: Model<IReferralConfig> =
  mongoose.models.ReferralConfig ||
  mongoose.model<IReferralConfig>("ReferralConfig", ReferralConfigSchema);

