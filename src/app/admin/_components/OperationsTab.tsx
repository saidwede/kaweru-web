"use client";

import Link from "next/link";
import { PlusCircle, Search, Clock, Calendar, Filter } from "lucide-react";
import type { AdminOverviewData, StateSetter, TimeSlotFilter, TripDateFilter, TripItem } from "./types";

interface OperationsTabProps {
  overview: AdminOverviewData | null;
  filteredTrips: TripItem[];
  tripDateFilter: TripDateFilter;
  setTripDateFilter: StateSetter<TripDateFilter>;
  tripCustomDate: string;
  setTripCustomDate: StateSetter<string>;
  tripTimeFilter: TimeSlotFilter;
  setTripTimeFilter: StateSetter<TimeSlotFilter>;
  tripCompanyFilter: string;
  setTripCompanyFilter: StateSetter<string>;
  tripStatusFilter: string;
  setTripStatusFilter: StateSetter<string>;
  tripSearch: string;
  setTripSearch: StateSetter<string>;
}

export default function OperationsTab({
  overview,
  filteredTrips,
  tripDateFilter,
  setTripDateFilter,
  tripCustomDate,
  setTripCustomDate,
  tripTimeFilter,
  setTripTimeFilter,
  tripCompanyFilter,
  setTripCompanyFilter,
  tripStatusFilter,
  setTripStatusFilter,
  tripSearch,
  setTripSearch,
}: OperationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Départs Programmés & Flotte en Route</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Suivi réseau sur tous les axes interurbains du Bénin avec filtres de date et d&apos;heure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            {filteredTrips.length} / {overview?.trips.length || 0} trajet(s)
          </span>
          <Link
            href="/manifest"
            className="inline-flex items-center gap-2 bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-4 py-2 rounded-xl text-xs transition shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Programmer un Départ</span>
          </Link>
        </div>
      </div>

      {/* BARRE DE FILTRES MULTI-CRITÈRES DATE, HEURE & COMPAGNIE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date :</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setTripDateFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                tripDateFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Toutes dates
            </button>
            <button
              onClick={() => setTripDateFilter("TODAY")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                tripDateFilter === "TODAY" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Aujourd&apos;hui (J)
            </button>
            <button
              onClick={() => setTripDateFilter("TOMORROW")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                tripDateFilter === "TOMORROW" ? "bg-white text-blue-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Demain (J+1)
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-2xl border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={tripCustomDate}
              onChange={(e) => {
                setTripCustomDate(e.target.value);
                setTripDateFilter("CUSTOM");
              }}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Créneau Horaire */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Heure :</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl font-bold text-slate-600 text-[11px]">
              <button
                onClick={() => setTripTimeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  tripTimeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setTripTimeFilter("MORNING")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  tripTimeFilter === "MORNING" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Matin (05h-11h)
              </button>
              <button
                onClick={() => setTripTimeFilter("AFTERNOON")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  tripTimeFilter === "AFTERNOON" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Après-midi (12h-17h)
              </button>
              <button
                onClick={() => setTripTimeFilter("EVENING")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  tripTimeFilter === "EVENING" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Soir (18h-23h)
              </button>
            </div>

            {/* Filtre Compagnie */}
            <select
              value={tripCompanyFilter}
              onChange={(e) => setTripCompanyFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF6500]"
            >
              <option value="ALL">Toutes les compagnies</option>
              {Array.from(new Set(overview?.trips.map((t) => t.companyName) || [])).map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>

            {/* Filtre Statut */}
            <select
              value={tripStatusFilter}
              onChange={(e) => setTripStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF6500]"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="SCHEDULED">Prévu (SCHEDULED)</option>
              <option value="BOARDING">Embarquement (BOARDING)</option>
              <option value="IN_TRANSIT">En route (IN_TRANSIT)</option>
              <option value="COMPLETED">Arrivé (COMPLETED)</option>
            </select>
          </div>

          {/* Recherche textuelle */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ligne, code, ville..."
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6500]"
            />
          </div>
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs">
          <Filter className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">Aucun départ ne correspond à ces critères</p>
          <p className="text-xs text-slate-400 mt-1">
            Modifiez vos filtres de date, d&apos;heure ou de compagnie pour afficher les bus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const todayStr = new Date().toISOString().split("T")[0];
            const isPast = trip.departureDate < todayStr;

            return (
              <div
                key={trip._id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                    {trip.tripCode}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {trip.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{trip.companyName}</h3>
                  <p className="text-xs font-bold text-[#FF6500] mt-0.5">
                    {trip.originCity} ➔ {trip.destinationCity}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Départ {trip.departureTime} ({trip.departureDate})</span>
                    {isPast && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Passé (J-1)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Dernier jalon pointé</p>
                  <p className="font-bold text-slate-800">{trip.currentMilestone}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Remplissage</span>
                  <span className="text-slate-900">
                    {trip.soldSeats} / {trip.totalQuota} sièges
                  </span>
                </div>

                <Link
                  href={`/manifest/${trip._id}`}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Ouvrir la fiche de chargement
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
