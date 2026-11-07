import mongoose, { Schema, Document, Model } from "mongoose";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "MISSED"
  | "EXPIRED"
  | "CANCELLED"
  | "USED";

export type BoardingStatus = "NOT_BOARDED" | "BOARDED" | "DISEMBARKED";

export interface IBooking extends Document {
  shortCode: string; // Ex: "A7K-92B"
  tripId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  userId: string; // Firebase UID ou guest ID
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string | null;
  seatsCount: number;
  seatNumber?: number | null;
  originCity: string;
  destinationCity: string;
  departureDateTime: Date;
  basePriceFcfa: number;
  serviceFeeFcfa: number;
  discountFcfa: number;
  totalPaidFcfa: number;
  companySettlementAmountFcfa: number;
  status: BookingStatus;
  paymentProvider: "FEDAPAY" | "KKIAPAY" | "CASH";
  paymentReference?: string;
  lockedUntil: Date;
  qrSignature: string;
  boardingStatus: BoardingStatus;
  boardedAt?: Date | null;
  disembarkedAt?: Date | null;
  rescheduledToTripId?: mongoose.Types.ObjectId | null;
  rescheduledAt?: Date | null;
  rescheduleFeeFcfa?: number;
  isSettledToCompany: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    shortCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    userId: { type: String, required: true, index: true },
    passengerName: { type: String, required: true },
    passengerPhone: { type: String, required: true },
    passengerEmail: { type: String, default: null },
    seatsCount: { type: Number, default: 1, min: 1 },
    seatNumber: { type: Number, default: null },
    originCity: { type: String, required: true },
    destinationCity: { type: String, required: true },
    departureDateTime: { type: Date, required: true },
    basePriceFcfa: { type: Number, required: true },
    serviceFeeFcfa: { type: Number, default: 0 },
    discountFcfa: { type: Number, default: 0 },
    totalPaidFcfa: { type: Number, required: true },
    companySettlementAmountFcfa: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "CONFIRMED", "RESCHEDULED", "MISSED", "EXPIRED", "CANCELLED", "USED"],
      default: "PENDING_PAYMENT",
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ["FEDAPAY", "KKIAPAY", "CASH"],
      default: "FEDAPAY",
    },
    paymentReference: { type: String },
    lockedUntil: { type: Date, required: true, index: true },
    qrSignature: { type: String, required: true },
    boardingStatus: {
      type: String,
      enum: ["NOT_BOARDED", "BOARDED", "DISEMBARKED"],
      default: "NOT_BOARDED",
    },
    boardedAt: { type: Date, default: null },
    disembarkedAt: { type: Date, default: null },
    rescheduledToTripId: { type: Schema.Types.ObjectId, ref: "Trip", default: null },
    rescheduledAt: { type: Date, default: null },
    rescheduleFeeFcfa: { type: Number, default: 0 },
    isSettledToCompany: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
