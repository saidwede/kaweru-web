"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Star,
  Wind,
  Zap,
  Luggage,
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { FetchDepartures, TripItem } from "./types";
import { formatFrenchDate } from "./utils";

interface TripResultsProps {
  origin: string;
  destination: string;
  selectedDate: string;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  trips: TripItem[];
  loadingTrips: boolean;
  fetchDepartures: FetchDepartures;
  handleOpenBooking: (trip: TripItem) => void;
}

export default function TripResults({
  origin,
  destination,
  selectedDate,
  setSelectedDate,
  trips,
  loadingTrips,
  fetchDepartures,
  handleOpenBooking,
}: TripResultsProps) {
  return (
    <section id="departs" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF6500]">
            Départs disponibles
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            Ligne : {origin} ➔ {destination}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Départs prévus pour le <strong className="text-slate-800">{formatFrenchDate(selectedDate)}</strong> • Grille tarifaire officielle, confort certifié et zéro surbooking.
          </p>
        </div>

        {loadingTrips ? (
          <div className="py-16 text-center">
            <RefreshCw className="h-8 w-8 text-[#FF6500] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">Recherche des départs en temps réel...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900 mb-1">
              Aucun départ programmé pour {origin} ➔ {destination} le {formatFrenchDate(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Modifiez la date de départ ou consultez l&apos;ensemble du réseau de nos gares partenaires.
            </p>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setSelectedDate(today);
                fetchDepartures(origin, destination, today);
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-md shadow-[#FF6500]/25 cursor-pointer"
            >
              Voir les départs d&apos;aujourd&apos;hui
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trips.map((trip) => {
              const displayPrice = trip.price || 8000;
              return (
                <div
                  key={trip.id}
                  className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col justify-between hover:border-[#FF6500] transition"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          trip.busType?.includes("Navette")
                            ? "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80"
                            : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80"
                        }
                        alt={trip.companyName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-[#FF6500] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                        {trip.busType || "VIP Climatisé"}
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {trip.tripCode}
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#FF6500] bg-orange-50 px-2.5 py-0.5 rounded-full mb-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatFrenchDate(trip.departureDate || trip.departureDateTime)}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">
                          {trip.requestedOrigin || trip.originCity} ➔{" "}
                          {trip.requestedDestination || trip.destinationCity}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500">
                          {trip.companyName} • Départ à <strong>{trip.departureTime}</strong>
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700">4.8</span>
                          <span className="text-[10px] text-slate-400">• Gare {trip.stationName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900">
                          {displayPrice.toLocaleString("fr-FR")} F
                        </span>
                        <p className="text-[10px] font-bold text-emerald-600">
                          {trip.availableSeats} places dispo
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      Départ direct depuis {trip.stationName}. Climatisation, bagages sécurisés en soute et verrouillage instantané.
                    </p>

                    {/* Commodités */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                        <Wind className="h-4 w-4 text-sky-500 mx-auto" />
                        <span className="text-[9px] font-bold text-slate-600 mt-1 block">Clim</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                        <Zap className="h-4 w-4 text-amber-500 mx-auto" />
                        <span className="text-[9px] font-bold text-slate-600 mt-1 block">USB</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                        <Luggage className="h-4 w-4 text-emerald-500 mx-auto" />
                        <span className="text-[9px] font-bold text-slate-600 mt-1 block">25kg</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                        <Clock className="h-4 w-4 text-[#FF6500] mx-auto" />
                        <span className="text-[9px] font-bold text-slate-600 mt-1 block">Direct</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={trip.availableSeats <= 0}
                    onClick={() => handleOpenBooking(trip)}
                    className="w-full bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3 px-4 rounded-2xl text-center text-xs transition shadow-md shadow-[#FF6500]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{trip.availableSeats > 0 ? "Réserver ce trajet" : "Bus Complet"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
