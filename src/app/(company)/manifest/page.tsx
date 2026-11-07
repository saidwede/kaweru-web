"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bus, Users, Clock, MapPin, ArrowRight, RefreshCw, AlertCircle, LogOut, Gift, Check } from "lucide-react";

interface TripSummary {
  _id: string;
  tripCode: string;
  companyName: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  busPlateNumber?: string;
  totalQuota: number;
  availableSeats: number;
  soldSeats: number;
  status: string;
}

export default function ManifestListPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration Admin des points de parrainage par achat du filleul
  const [pointsPerPurchase, setPointsPerPurchase] = useState<number>(100);
  const [savingReferral, setSavingReferral] = useState(false);
  const [referralSaved, setReferralSaved] = useState(false);

  const fetchReferralConfig = async () => {
    try {
      const res = await fetch("/api/referrals");
      const data = await res.json();
      if (data.success && data.config) {
        setPointsPerPurchase(data.config.pointsPerFilleulPurchase ?? 100);
      }
    } catch {
      // Ignorer
    }
  };

  const handleSaveReferralConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReferral(true);
    setReferralSaved(false);
    try {
      const res = await fetch("/api/referrals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsPerFilleulPurchase: pointsPerPurchase }),
      });
      const data = await res.json();
      if (data.success) {
        setReferralSaved(true);
        setTimeout(() => setReferralSaved(false), 3000);
      }
    } finally {
      setSavingReferral(false);
    }
  };

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
        setError(data.error?.message || "Impossible de charger les départs du jour.");
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
    fetchReferralConfig();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
              <Bus className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Espace Chef de Gare
                <span className="text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  Manifestes
                </span>
              </h1>
              <p className="text-xs text-slate-400">Sélectionnez le bus pour gérer les 50 sièges et ventes guichet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrips}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {/* Panneau Admin : Configuration des points de parrainage par achat de filleul */}
        <div className="mb-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Programme de Parrainage (Lien d&apos;inscription)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque client partage son lien d&apos;inscription. Configurez le nombre de points que le parrain gagne automatiquement à chaque achat de billet de son filleul.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveReferralConfig} className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <input
                type="number"
                min={0}
                max={100000}
                value={pointsPerPurchase}
                onChange={(e) => setPointsPerPurchase(Number(e.target.value))}
                className="w-20 bg-transparent text-sm font-black text-amber-400 focus:outline-none text-right pr-2"
              />
              <span className="text-xs font-bold text-slate-400">pts / achat filleul</span>
            </div>
            <button
              type="submit"
              disabled={savingReferral}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              {referralSaved ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Enregistré
                </>
              ) : (
                <span>{savingReferral ? "..." : "Appliquer"}</span>
              )}
            </button>
          </form>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Départs programmés</h2>
            <p className="text-sm text-slate-400">Tous les bus actifs de vos compagnies partenaires</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-orange-500" />
            <p className="text-sm">Chargement des départs réels...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <Bus className="h-12 w-12 mx-auto text-slate-600 mb-4" />
            <h3 className="text-base font-bold text-white mb-1">Aucun départ actif trouvé</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Assurez-vous que la base de données est initialisée avec vos trajets.
            </p>
            <button
              onClick={fetchTrips}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              Recharger
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip._id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 border border-slate-700">
                      {trip.tripCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                      {trip.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{trip.companyName}</h3>
                  {trip.busPlateNumber && (
                    <p className="text-xs text-slate-400 mb-3 font-mono">Bus : {trip.busPlateNumber}</p>
                  )}

                  <div className="space-y-2 py-3 border-y border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span className="font-semibold text-white">{trip.originCity}</span>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <span className="font-semibold text-white">{trip.destinationCity}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span>
                        Départ : <strong>{trip.departureTime}</strong> ({trip.departureDate})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span>
                        Places Kaweru : <strong>{trip.availableSeats} disponibles</strong> / {trip.totalQuota} (
                        {trip.soldSeats} vendues)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href={`/manifest/${trip._id}`}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-md shadow-orange-500/20"
                  >
                    Ouvrir le Manifeste
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
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

