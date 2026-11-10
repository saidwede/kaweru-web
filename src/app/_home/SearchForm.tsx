"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Smartphone,
  QrCode,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
import type { FetchDepartures, TripItem } from "./types";
import { BENIN_CITIES, formatFrenchDate } from "./utils";

interface SearchFormProps {
  origin: string;
  setOrigin: Dispatch<SetStateAction<string>>;
  destination: string;
  setDestination: Dispatch<SetStateAction<string>>;
  selectedDate: string;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  todayStr: string;
  tomorrowStr: string;
  trips: TripItem[];
  setTrips: Dispatch<SetStateAction<TripItem[]>>;
  loadingTrips: boolean;
  fetchDepartures: FetchDepartures;
  handleSearch: (e: FormEvent) => void;
  handleSwapCities: () => void;
}

export default function SearchForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  selectedDate,
  setSelectedDate,
  todayStr,
  tomorrowStr,
  trips,
  setTrips,
  loadingTrips,
  fetchDepartures,
  handleSearch,
  handleSwapCities,
}: SearchFormProps) {
  return (
    <>
      {/* CARTE DE RECHERCHE DYNAMIQUE */}
      <form
        id="search-card"
        onSubmit={handleSearch}
        className="bg-[#F8FAFC] rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#FF6500]" /> Ville de départ
            </label>
            <select
              value={origin}
              onChange={(e) => {
                const newOrigin = e.target.value;
                setOrigin(newOrigin);
                fetchDepartures(newOrigin, destination, selectedDate);
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]/20 focus:border-[#FF6500] transition"
            >
              {BENIN_CITIES.map((c) => (
                <option key={`origin-${c}`} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onClick={handleSwapCities}
              title="Inverser départ et destination"
              className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#FF6500] hover:border-[#FF6500] transition shadow-sm cursor-pointer"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#FF6500]" /> Destination
            </label>
            <select
              value={destination}
              onChange={(e) => {
                const newDest = e.target.value;
                setDestination(newDest);
                fetchDepartures(origin, newDest, selectedDate);
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]/20 focus:border-[#FF6500] transition"
            >
              {BENIN_CITIES.map((c) => (
                <option key={`dest-${c}`} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#FF6500]" /> Date de départ
            </label>
            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                if (newDate) {
                  fetchDepartures(origin, destination, newDate);
                } else {
                  setTrips([]);
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]/20 focus:border-[#FF6500] transition"
            />
          </div>
        </div>

        {/* Raccourcis de date rapide */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Date rapide :</span>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              fetchDepartures(origin, destination, todayStr);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition border cursor-pointer ${
              selectedDate === todayStr
                ? "bg-[#FF6500] text-white border-[#FF6500] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(tomorrowStr);
              fetchDepartures(origin, destination, tomorrowStr);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition border cursor-pointer ${
              selectedDate === tomorrowStr
                ? "bg-[#FF6500] text-white border-[#FF6500] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Demain
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${
              trips.length > 0 ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            {trips.length > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            )}
            <span>
              {loadingTrips ? (
                "Vérification des départs en cours..."
              ) : (
                <>
                  {trips.length} départ{trips.length > 1 ? "s" : ""} disponible{trips.length > 1 ? "s" : ""}{" "}
                  {selectedDate === todayStr
                    ? "aujourd'hui"
                    : selectedDate === tomorrowStr
                    ? "demain"
                    : `pour le ${formatFrenchDate(selectedDate)}`}{" "}
                  sur cette ligne
                </>
              )}
            </span>
          </div>

          <button
            type="submit"
            disabled={loadingTrips}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-lg shadow-[#FF6500]/25 disabled:opacity-50 cursor-pointer"
          >
            {loadingTrips ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Recherche en cours...</span>
              </>
            ) : (
              <>
                <span>Rechercher un départ</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3 Badges rapides de réassurance */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-sm">
          <Clock className="h-5 w-5 text-[#FF6500] mx-auto mb-1" />
          <p className="text-xs font-bold text-slate-800">Verrouillage 7 min</p>
          <p className="text-[10px] text-slate-400">Siège garanti à l&apos;achat</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-sm">
          <Smartphone className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xs font-bold text-slate-800">Mobile Money</p>
          <p className="text-[10px] text-slate-400">MTN MoMo, Moov, Celtis</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-sm">
          <QrCode className="h-5 w-5 text-sky-600 mx-auto mb-1" />
          <p className="text-xs font-bold text-slate-800">QR Code Hors-ligne</p>
          <p className="text-[10px] text-slate-400">Embarquement sans signal</p>
        </div>
      </div>
    </>
  );
}
