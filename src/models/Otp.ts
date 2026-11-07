import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  identifier: string; // Numéro normalisé (+22901...) ou Email en minuscule
  method: "PHONE" | "EMAIL";
  code: string; // Code à 6 chiffres
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    identifier: { type: String, required: true, index: true },
    method: { type: String, enum: ["PHONE", "EMAIL"], required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL automatique MongoDB
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);

