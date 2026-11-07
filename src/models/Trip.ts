import mongoose, { Schema, Document, Model } from "mongoose";

export type TripStatus = "OPEN" | "CLOSED_CUTOFF" | "BOARDING" | "EN_ROUTE" | "COMPLETED" | "CANCELLED";

export interface IStop {
  order: number;
  city: string;
  stationName: string;
  scheduledTime?: string;
  isReached?: boolean;
  reachedAt?: Date | null;
}

export interface ISegmentPrice {
  from: string;
  to: string;
  price: number;
}

export interface ISeatState {
  seatNumber: number;
  status: "VACANT" | "RESERVED_KAWERU" | "CASH_GUICHET";
  bookingId?: string | null;
  passengerName?: string | null;
  passengerPhone?: string | null;
  destinationCity?: string | null;
  isBoarded?: boolean;
}

export interface ITrip extends Document {
  tripCode: string;
  companyId: mongoose.Types.ObjectId;
  companyName: string;
  originCity: string;
  destinationCity: string;
  departureDate: string; // Format: "YYYY-MM-DD"
  departureTime: string; // Format: "HH:mm"
  departureDateTime: Date;
  cutoffMinutes: number;
  busPlateNumber?: string;
  conductorId?: mongoose.Types.ObjectId | null;
  totalQuota: number;
  availableSeats: number;
  lockedSeats: number;
  soldSeats: number;
  status: TripStatus;
  currentMilestone?: string;
  stops: IStop[];
  pricing: ISegmentPrice[];
  seats: ISeatState[];
  createdAt: Date;
  updatedAt: Date;
}

const StopSchema = new Schema<IStop>({
  order: { type: Number, required: true },
  city: { type: String, required: true },
  stationName: { type: String, required: true },
  scheduledTime: { type: String },
  isReached: { type: Boolean, default: false },
  reachedAt: { type: Date, default: null },
});

const SegmentPriceSchema = new Schema<ISegmentPrice>({
  from: { type: String, required: true },
  to: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
});

const SeatStateSchema = new Schema<ISeatState>({
  seatNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ["VACANT", "RESERVED_KAWERU", "CASH_GUICHET"],
    default: "VACANT",
  },
  bookingId: { type: String, default: null },
  passengerName: { type: String, default: null },
  passengerPhone: { type: String, default: null },
  destinationCity: { type: String, default: null },
  isBoarded: { type: Boolean, default: false },
});

const TripSchema = new Schema<ITrip>(
  {
    tripCode: { type: String, required: true, unique: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    companyName: { type: String, required: true },
    originCity: { type: String, required: true, index: true },
    destinationCity: { type: String, required: true, index: true },
    departureDate: { type: String, required: true, index: true },
    departureTime: { type: String, required: true },
    departureDateTime: { type: Date, required: true, index: true },
    cutoffMinutes: { type: Number, default: 120 },
    busPlateNumber: { type: String },
    conductorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    totalQuota: { type: Number, required: true, default: 8 },
    availableSeats: { type: Number, required: true, default: 8, min: 0 },
    lockedSeats: { type: Number, required: true, default: 0, min: 0 },
    soldSeats: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED_CUTOFF", "BOARDING", "EN_ROUTE", "COMPLETED", "CANCELLED"],
      default: "OPEN",
      index: true,
    },
    currentMilestone: { type: String, default: "En attente d'embarquement" },
    stops: [StopSchema],
    pricing: [SegmentPriceSchema],
    seats: [SeatStateSchema],
  },
  {
    timestamps: true,
  }
);

TripSchema.index({ originCity: 1, destinationCity: 1, departureDate: 1, status: 1 });

export const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);
