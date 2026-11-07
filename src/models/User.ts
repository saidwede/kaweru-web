import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "STATION_MANAGER"
  | "TICKET_AGENT"
  | "ONBOARD_CONDUCTOR"
  | "PASSENGER";

export interface IUser extends Document {
  firebaseUid: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  residenceCity?: string;
  isProfileCompleted: boolean;
  role: UserRole;
  companyId?: mongoose.Types.ObjectId | null;
  stationId?: string | null;
  assignedTripId?: string | null;
  referralCode: string;
  referredBy?: string | null;
  referralPoints: number;
  referralsCount: number;
  walletCreditsFcfa: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    fullName: { type: String, required: true },
    residenceCity: { type: String, default: "" },
    isProfileCompleted: { type: Boolean, default: false },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "COMPANY_ADMIN",
        "STATION_MANAGER",
        "TICKET_AGENT",
        "ONBOARD_CONDUCTOR",
        "PASSENGER",
      ],
      default: "PASSENGER",
      index: true,
    },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    stationId: { type: String, default: null },
    assignedTripId: { type: String, default: null },
    referralCode: { type: String, required: true, unique: true, uppercase: true },
    referredBy: { type: String, default: null, index: true },
    referralPoints: { type: Number, default: 0, min: 0 },
    referralsCount: { type: Number, default: 0, min: 0 },
    walletCreditsFcfa: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
