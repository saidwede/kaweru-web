import type { AgentItem, BookingItem, TripSummary } from "./types";

interface KpiBannerProps {
  trips: TripSummary[];
  totalSeatsSold: number;
  totalCapacity: number;
  globalOccupancy: number;
  bookings: BookingItem[];
  agents: AgentItem[];
}

export default function KpiBanner({
  trips,
  totalSeatsSold,
  totalCapacity,
  globalOccupancy,
  bookings,
  agents,
}: KpiBannerProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Départs en Gare</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{trips.length}</p>
        <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Synchronisés en direct
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sièges Remplis</p>
        <div className="flex items-baseline gap-1 mt-1">
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalSeatsSold}</p>
          <p className="text-xs font-bold text-slate-400">/ {totalCapacity}</p>
        </div>
        <p className="text-[11px] font-bold text-slate-500 mt-1">{globalOccupancy}% d&apos;occupation moyenne</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billets Contrôlés</p>
        <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
          {bookings.filter((b) => b.boardingStatus === "BOARDED").length}
        </p>
        <p className="text-[11px] font-bold text-slate-500 mt-1">Passagers montés à bord</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Équipe d&apos;Opération</p>
        <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{agents.length}</p>
        <p className="text-[11px] font-bold text-slate-500 mt-1">Chefs de gare, guichets & convoyeurs</p>
      </div>
    </section>
  );
}
