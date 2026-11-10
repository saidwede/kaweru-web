"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  Bus,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  Search,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import type { TimeSlotFilter, TripDateFilter, TripSummary, UserProfile } from "./types";

interface TripsTabProps {
  dateFilter: TripDateFilter;
  setDateFilter: Dispatch<SetStateAction<TripDateFilter>>;
  customDate: string;
  setCustomDate: Dispatch<SetStateAction<string>>;
  tripTimeFilter: TimeSlotFilter;
  setTripTimeFilter: Dispatch<SetStateAction<TimeSlotFilter>>;
  tripSearch: string;
  setTripSearch: Dispatch<SetStateAction<string>>;
  loading: boolean;
  filteredTrips: TripSummary[];
  userProfile: UserProfile | null;
  setShowAddTripModal: Dispatch<SetStateAction<boolean>>;
}

export default function TripsTab({
  dateFilter,
  setDateFilter,
  customDate,
  setCustomDate,
  tripTimeFilter,
  setTripTimeFilter,
  tripSearch,
  setTripSearch,
  loading,
  filteredTrips,
  userProfile,
  setShowAddTripModal,
}: TripsTabProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Départs & Fiches de Chargement</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Visualisez les bus en ligne, les quotas de vente et le manifeste d&apos;embarquement des 50 sièges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtres de Journée (Aujourd'hui, Demain, Tous, Date personnalisée) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setDateFilter("TODAY")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dateFilter === "TODAY" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setDateFilter("TOMORROW")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dateFilter === "TOMORROW" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Demain
            </button>
            <button
              onClick={() => setDateFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                dateFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Tous les jours
            </button>
          </div>

          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter("CUSTOM");
            }}
            className="px-3 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6500]"
          />

          {/* Filtre de Plage Horaire Départs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setTripTimeFilter("ALL")}
              className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                tripTimeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Toutes heures
            </button>
            <button
              onClick={() => setTripTimeFilter("MORNING")}
              className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                tripTimeFilter === "MORNING" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Matin (05h-11h)
            </button>
            <button
              onClick={() => setTripTimeFilter("AFTERNOON")}
              className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                tripTimeFilter === "AFTERNOON" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Après-midi (12h-17h)
            </button>
            <button
              onClick={() => setTripTimeFilter("EVENING")}
              className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                tripTimeFilter === "EVENING" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Soir (18h-23h)
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer bus, code, ville..."
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6500]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-[#FF6500]" />
          <p className="text-xs font-bold">Chargement des trajets en direct...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs">
          <Bus className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Aucun départ actif trouvé</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Programmez un nouveau départ pour ouvrir les 50 sièges à la réservation en ligne et au guichet.
          </p>
          {(userProfile?.role === "COMPANY_ADMIN" || userProfile?.role === "SUPER_ADMIN") && (
            <button
              onClick={() => setShowAddTripModal(true)}
              className="bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-5 py-2.5 rounded-2xl text-xs transition cursor-pointer"
            >
              Programmer le premier départ
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const total = trip.totalQuota || 50;
            const sold = trip.soldSeats || 0;
            const occupancyPct = Math.round((sold / total) * 100);

            return (
              <div
                key={trip._id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                      {trip.tripCode}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {trip.status}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-[#FF6500] transition-colors">
                    {trip.companyName}
                  </h3>
                  {trip.busPlateNumber && (
                    <p className="text-[11px] font-mono text-slate-400 font-bold mt-0.5">
                      Bus : {trip.busPlateNumber}
                    </p>
                  )}

                  <div className="my-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-4 w-4 text-[#FF6500]" />
                      <span className="font-black text-slate-900">{trip.originCity}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="font-black text-slate-900">{trip.destinationCity}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Départ : <strong>{trip.departureTime}</strong> ({trip.departureDate})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Remplissage en ligne</span>
                      <span className="text-slate-900 font-black">
                        {sold} / {total} sièges ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-[#FF6500] rounded-full"
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {trip.availableSeats} places encore réservables en ligne
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Link
                    href={`/manifest/${trip._id}`}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-xs group-hover:bg-[#FF6500]"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Fiche 50 Sièges & Manifeste</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
