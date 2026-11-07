import mongoose, { Schema, Document, Model } from "mongoose";

export type CommissionType = "FIXED" | "PERCENTAGE";
export type CommissionPaidBy = "PASSENGER" | "COMPANY";

export interface ICompany extends Document {
  name: string;
  code: string;
  logoUrl?: string;
  commission: {
    type: CommissionType;
    value: number; // Ex: 500 (FCFA) ou 6 (pour 6%)
    paidBy: CommissionPaidBy;
  };
  settlementMomo: {
    operator: "MTN" | "MOOV" | "CELTIS";
    number: string;
    holderName: string;
    preferredTime: "H_MINUS_1" | "DAILY_19H";
  };
  stations: Array<{
    stationId: string;
    name: string;
    city: string;
    address?: string;
    gpsCoordinates?: { lat: number; lng: number };
    managerPhone?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    logoUrl: { type: String },
    commission: {
      type: {
        type: String,
        enum: ["FIXED", "PERCENTAGE"],
        default: "FIXED",
      },
      value: { type: Number, required: true, default: 500 },
      paidBy: {
        type: String,
        enum: ["PASSENGER", "COMPANY"],
        default: "PASSENGER",
      },
    },
    settlementMomo: {
      operator: { type: String, enum: ["MTN", "MOOV", "CELTIS"], default: "MTN" },
      number: { type: String, required: true },
      holderName: { type: String, required: true },
      preferredTime: {
        type: String,
        enum: ["H_MINUS_1", "DAILY_19H"],
        default: "H_MINUS_1",
      },
    },
    stations: [
      {
        stationId: { type: String, required: true },
        name: { type: String, required: true },
        city: { type: String, required: true, index: true },
        address: { type: String },
        gpsCoordinates: {
          lat: { type: Number },
          lng: { type: Number },
        },
        managerPhone: { type: String },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);
