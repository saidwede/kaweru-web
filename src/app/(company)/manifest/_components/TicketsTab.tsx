"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Clock,
  Phone,
  Search,
} from "lucide-react";
import type { BookingItem, TicketDateFilter, TicketStatusFilter, TimeSlotFilter, ValidateTicketFn } from "./types";

interface TicketsTabProps {
  ticketSearch: string;
  setTicketSearch: Dispatch<SetStateAction<string>>;
  ticketDateFilter: TicketDateFilter;
  setTicketDateFilter: Dispatch<SetStateAction<TicketDateFilter>>;
  ticketCustomDate: string;
  setTicketCustomDate: Dispatch<SetStateAction<string>>;
  ticketTimeFilter: TimeSlotFilter;
  setTicketTimeFilter: Dispatch<SetStateAction<TimeSlotFilter>>;
  ticketStatusFilter: TicketStatusFilter;
  setTicketStatusFilter: Dispatch<SetStateAction<TicketStatusFilter>>;
  bookings: BookingItem[];
  filteredBookings: BookingItem[];
  handleValidateTicket: ValidateTicketFn;
}

export default function TicketsTab({
  ticketSearch,
  setTicketSearch,
  ticketDateFilter,
  setTicketDateFilter,
  ticketCustomDate,
  setTicketCustomDate,
  ticketTimeFilter,
  setTicketTimeFilter,
  ticketStatusFilter,
  setTicketStatusFilter,
  bookings,
  filteredBookings,
  handleValidateTicket,
}: TicketsTabProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Registre des Billets Émis</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Filtrez par journée (J, J+1, J-1), tranche horaire, trajet et statut d&apos;embarquement.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche passager, code, téléphone..."
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6500]"
          />
        </div>
      </div>

      {/* BARRE DE FILTRES MULTI-CRITÈRES DATE & HEURE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date :</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setTicketDateFilter("ALL")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                ticketDateFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Toutes dates
            </button>
            <button
              onClick={() => setTicketDateFilter("TODAY")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                ticketDateFilter === "TODAY" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Aujourd&apos;hui (J)
            </button>
            <button
              onClick={() => setTicketDateFilter("YESTERDAY")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                ticketDateFilter === "YESTERDAY" ? "bg-white text-amber-800 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Hier (J-1 / Raté)
            </button>
            <button
              onClick={() => setTicketDateFilter("TOMORROW")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                ticketDateFilter === "TOMORROW" ? "bg-white text-blue-800 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Demain (J+1)
            </button>
          </div>

          <input
            type="date"
            value={ticketCustomDate}
            onChange={(e) => {
              setTicketCustomDate(e.target.value);
              setTicketDateFilter("CUSTOM");
            }}
            className="px-3 py-1 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6500]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
          {/* Tranche Horaire */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Heure :</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl font-bold text-slate-600 text-[11px]">
              <button
                onClick={() => setTicketTimeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketTimeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setTicketTimeFilter("MORNING")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketTimeFilter === "MORNING" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Matin (05h-11h)
              </button>
              <button
                onClick={() => setTicketTimeFilter("AFTERNOON")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketTimeFilter === "AFTERNOON" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Après-midi (12h-17h)
              </button>
              <button
                onClick={() => setTicketTimeFilter("EVENING")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketTimeFilter === "EVENING" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Soir (18h-23h)
              </button>
            </div>
          </div>

          {/* Statut d'embarquement */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Statut :</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl font-bold text-slate-600 text-[11px]">
              <button
                onClick={() => setTicketStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketStatusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : ""
                }`}
              >
                Tous ({bookings.length})
              </button>
              <button
                onClick={() => setTicketStatusFilter("NOT_BOARDED")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketStatusFilter === "NOT_BOARDED" ? "bg-white text-amber-700 shadow-xs" : ""
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setTicketStatusFilter("BOARDED")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketStatusFilter === "BOARDED" ? "bg-white text-emerald-700 shadow-xs" : ""
                }`}
              >
                À bord
              </button>
              <button
                onClick={() => setTicketStatusFilter("DISEMBARKED")}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  ticketStatusFilter === "DISEMBARKED" ? "bg-white text-slate-700 shadow-xs" : ""
                }`}
              >
                Débarqué
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLEAU DES BILLETS FILTRÉS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs overflow-x-auto">
        {filteredBookings.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400 font-bold">
            Aucun billet ne correspond aux critères de date, heure et filtres sélectionnés.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3">Code Billet</th>
                <th className="pb-3">Date & Heure Départ</th>
                <th className="pb-3">Passager</th>
                <th className="pb-3">Trajet</th>
                <th className="pb-3">Siège</th>
                <th className="pb-3">Montant Payé</th>
                <th className="pb-3">Statut Quai</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const tripDate = b.tripId?.departureDate || (b.departureDateTime ? new Date(b.departureDateTime).toISOString().split("T")[0] : "N/A");
                const tripTime = b.tripId?.departureTime || (b.departureDateTime ? new Date(b.departureDateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "N/A");
                const todayStr = new Date().toISOString().split("T")[0];
                const isPastDay = tripDate < todayStr && tripDate !== "N/A";

                return (
                  <tr key={b._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3">
                      <span className="font-mono font-black text-[#FF6500] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                        {b.shortCode}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{tripTime}</span>
                        <span className="text-[11px] text-slate-500 font-medium">({tripDate})</span>
                      </div>
                      {isPastDay && (
                        <span className="inline-block mt-0.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Départ Passé (J-1)
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-slate-900">{b.passengerName}</p>
                      <a href={`tel:${b.passengerPhone}`} className="text-[11px] text-[#FF6500] font-medium hover:underline flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" />
                        {b.passengerPhone}
                      </a>
                    </td>
                    <td className="py-3 font-semibold text-slate-700">
                      {b.originCity} ➔ {b.destinationCity}
                    </td>
                    <td className="py-3 font-black text-slate-900">
                      {b.seatNumber ? `N° ${b.seatNumber}` : "Libre"}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {b.totalPaidFcfa ? `${b.totalPaidFcfa.toLocaleString("fr-FR")} F` : "N/A"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          b.boardingStatus === "BOARDED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.boardingStatus === "BOARDED" ? "À bord" : "Non embarqué"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {b.boardingStatus !== "BOARDED" && (
                        <button
                          onClick={() => handleValidateTicket(b.shortCode, "CONFIRM_BOARDING")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition cursor-pointer shadow-xs"
                        >
                          Monter
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
