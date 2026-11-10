"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bus,
  QrCode,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  LogOut,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface TripSummary {
  _id: string;
  tripCode: string;
  companyName: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  busPlateNumber?: string;
  status: string;
}

export default function ConductorListPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/trips");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTrips(data.data);
      } else {
        setError(data.error?.message || "Impossible de charger les trajets.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#FF6500]/20 selection:text-[#FF6500]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-10 w-10 rounded-2xl bg-[#FF6500] text-white flex items-center justify-center font-black shadow-sm shadow-[#FF6500]/20 hover:scale-105 transition-transform"
            >
              <Bus className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">
                  Espace Convoyeur & Chauffeur
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6500] border border-orange-200">
                  Embarquement
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Pointage des passagers, scan QR code et suivi des descentes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchTrips}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">Sélectionnez votre départ</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Choisissez votre bus pour démarrer le pointage et le scan des billets passagers.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#FF6500]" />
            <p className="text-sm font-semibold">Recherche des trajets en cours...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs">
            <Bus className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Aucun bus en attente</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Aucun départ n&apos;est programmé actuellement pour votre compte.
            </p>
            <button
              onClick={fetchTrips}
              className="bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
            >
              Recharger
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip._id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {trip.tripCode}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {trip.status}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-[#FF6500] transition-colors">
                    {trip.companyName}
                  </h3>
                  {trip.busPlateNumber && (
                    <p className="text-[11px] font-mono text-slate-400 font-bold mt-0.5">
                      Immatriculation : {trip.busPlateNumber}
                    </p>
                  )}

                  <div className="my-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-4 w-4 text-[#FF6500] shrink-0" />
                      <span className="font-black text-slate-900">{trip.originCity}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-black text-slate-900">{trip.destinationCity}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Heure : <strong>{trip.departureTime}</strong> ({trip.departureDate})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/conductor/${trip._id}`}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF6500] hover:bg-[#e55a00] text-white font-black py-2.5 px-4 rounded-xl text-xs transition shadow-xs"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Démarrer le pointage passagers</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
