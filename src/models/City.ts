import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStationLocation {
  stationId: string;
  name: string;
  address?: string;
  gps?: { lat: number; lng: number };
}

export interface ICity extends Document {
  name: string; // Ex: "Cotonou", "Parakou", "Dassa"
  code: string; // Ex: "CTN", "PKO", "DAS"
  countryCode: string; // Ex: "BJ"
  region: "LITTORAL" | "ATLANTIQUE" | "OUEME" | "ZOU" | "COLLINES" | "BORGOU" | "ATACORA" | "ALIBORI" | "DONGA" | "MONO" | "COUFFO" | "PLATEAU";
  isPopular: boolean;
  order: number;
  stations: IStationLocation[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    countryCode: { type: String, required: true, default: "BJ", index: true },
    region: { type: String, required: true },
    isPopular: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 99 },
    stations: [
      {
        stationId: { type: String, required: true },
        name: { type: String, required: true },
        address: { type: String },
        gps: {
          lat: { type: Number },
          lng: { type: Number },
        },
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const City: Model<ICity> =
  mongoose.models.City || mongoose.model<ICity>("City", CitySchema);
