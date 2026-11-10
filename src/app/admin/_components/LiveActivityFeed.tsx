"use client";

import { UserCheck, Search, Ticket, Activity, Calendar, Filter } from "lucide-react";
import type { ActivityDateFilter, ActivityItem, ActivityTypeFilter, StateSetter, TimeSlotFilter } from "./types";

interface LiveActivityFeedProps {
  filteredActivity: ActivityItem[];
  activityDateFilter: ActivityDateFilter;
  setActivityDateFilter: StateSetter<ActivityDateFilter>;
  activityCustomDate: string;
  setActivityCustomDate: StateSetter<string>;
  activityTimeFilter: TimeSlotFilter;
  setActivityTimeFilter: StateSetter<TimeSlotFilter>;
  activityTypeFilter: ActivityTypeFilter;
  setActivityTypeFilter: StateSetter<ActivityTypeFilter>;
  activitySearch: string;
  setActivitySearch: StateSetter<string>;
}

export default function LiveActivityFeed({
  filteredActivity,
  activityDateFilter,
  setActivityDateFilter,
  activityCustomDate,
  setActivityCustomDate,
  activityTimeFilter,
  setActivityTimeFilter,
  activityTypeFilter,
  setActivityTypeFilter,
  activitySearch,
  setActivitySearch,
}: LiveActivityFeedProps) {
  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#FF6500]" />
            Flux des Événements Réseau en Direct
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Réservations confirmées et pointages d&apos;embarquement horodatés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-orange-50 text-[#FF6500] border border-orange-100">
            {filteredActivity.length} événement(s)
          </span>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Mise à jour en direct</span>
        </div>
      </div>

      {/* BARRE DE FILTRES MULTI-CRITÈRES DATE, HEURE & TYPE */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date :</span>
          <div className="inline-flex p-1 bg-white rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600 shadow-2xs">
            <button
              onClick={() => setActivityDateFilter("ALL")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                activityDateFilter === "ALL" ? "bg-[#FF6500] text-white shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setActivityDateFilter("TODAY")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                activityDateFilter === "TODAY" ? "bg-[#FF6500] text-white shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Aujourd&apos;hui (J)
            </button>
            <button
              onClick={() => setActivityDateFilter("YESTERDAY")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                activityDateFilter === "YESTERDAY" ? "bg-[#FF6500] text-white shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Hier (J-1)
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-2xl border border-slate-200/80 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={activityCustomDate}
              onChange={(e) => {
                setActivityCustomDate(e.target.value);
                setActivityDateFilter("CUSTOM");
              }}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/60 text-xs">
          {/* Heure */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Heure :</span>
            <div className="inline-flex p-0.5 bg-white rounded-xl border border-slate-200/80 font-bold text-slate-600 text-[11px] shadow-2xs">
              <button
                onClick={() => setActivityTimeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  activityTimeFilter === "ALL" ? "bg-slate-900 text-white" : ""
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setActivityTimeFilter("MORNING")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  activityTimeFilter === "MORNING" ? "bg-slate-900 text-white" : ""
                }`}
              >
                Matin (05h-11h)
              </button>
              <button
                onClick={() => setActivityTimeFilter("AFTERNOON")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  activityTimeFilter === "AFTERNOON" ? "bg-slate-900 text-white" : ""
                }`}
              >
                Après-midi (12h-17h)
              </button>
              <button
                onClick={() => setActivityTimeFilter("EVENING")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  activityTimeFilter === "EVENING" ? "bg-slate-900 text-white" : ""
                }`}
              >
                Soir (18h-23h)
              </button>
            </div>

            {/* Type d'événement */}
            <div className="inline-flex p-0.5 bg-white rounded-xl border border-slate-200/80 font-bold text-slate-600 text-[11px] shadow-2xs ml-1">
              <button
                onClick={() => setActivityTypeFilter("ALL")}
                className={`px-2 py-1 rounded-lg cursor-pointer ${
                  activityTypeFilter === "ALL" ? "bg-slate-900 text-white" : ""
                }`}
              >
                Tous flux
              </button>
              <button
                onClick={() => setActivityTypeFilter("BOOKING")}
                className={`px-2 py-1 rounded-lg cursor-pointer ${
                  activityTypeFilter === "BOOKING" ? "bg-[#FF6500] text-white" : ""
                }`}
              >
                Ventes
              </button>
              <button
                onClick={() => setActivityTypeFilter("BOARDING")}
                className={`px-2 py-1 rounded-lg cursor-pointer ${
                  activityTypeFilter === "BOARDING" ? "bg-emerald-600 text-white" : ""
                }`}
              >
                Embarquements
              </button>
            </div>
          </div>

          {/* Recherche texte */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Passager, code, ligne..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6500] shadow-2xs"
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filteredActivity.length > 0 ? (
          filteredActivity.map((act) => (
            <div key={act.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition">
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                    act.type === "BOARDING"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-orange-50 text-[#FF6500] border border-orange-100"
                  }`}
                >
                  {act.type === "BOARDING" ? (
                    <UserCheck className="h-4.5 w-4.5" />
                  ) : (
                    <Ticket className="h-4.5 w-4.5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {act.passengerName}
                    <span className="text-[11px] font-mono text-slate-400 font-bold ml-2">
                      #{act.shortCode}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-slate-500 font-medium">{act.route}</p>
                    {act.createdAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-black text-slate-900">
                  {act.amountFcfa ? `${act.amountFcfa.toLocaleString("fr-FR")} FCFA` : "Confirmé"}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    act.boardingStatus === "BOARDED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {act.boardingStatus === "BOARDED" ? "À bord du bus" : "Billet Payé"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            <Filter className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
            Aucune activité ne correspond à ces critères de date et d&apos;heure.
          </div>
        )}
      </div>
    </section>
  );
}
