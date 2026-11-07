"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { 
  Bus, 
  CheckCircle2, 
  MapPin, 
  UserCheck, 
  RefreshCw, 
  LogOut, 
  Phone, 
  QrCode,
  Navigation
} from "lucide-react";

interface Stop {
  order: number;
  city: string;
  stationName: string;
  isReached?: boolean;
}

interface Passenger {
  bookingId: string;
  shortCode: string;
  passengerName: string;
  passengerPhone: string;
  originCity: string;
  destinationCity: string;
  boardingStatus: "NOT_BOARDED" | "BOARDED" | "DISEMBARKED";
  seatNumber?: number;
}

interface ConductorData {
  trip: {
    id: string;
    tripCode: string;
    companyName: string;
    originCity: string;
    destinationCity: string;
    departureTime: string;
    currentMilestone: string;
    stops: Stop[];
    stats: {
      reservedKaweruCount: number;
      cashGuichetCount: number;
      vacantCount: number;
    };
  };
  passengersList: Passenger[];
}

function ConductorContent({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);

  const [data, setData] = useState<ConductorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinInput, setCheckinInput] = useState("");
  const [checkinMessage, setCheckinMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/manifest`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [tripId]);

  const handleValidateBoarding = async (codeToValidate?: string) => {
    const code = (codeToValidate || checkinInput).trim().toUpperCase();
    if (!code) return;

    setIsSubmitting(true);
    setCheckinMessage(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VALIDATE_BOARDING",
          shortCode: code,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCheckinMessage({ text: json.message, isError: false });
        setCheckinInput("");
        await loadData();
      } else {
        setCheckinMessage({ text: json.error?.message || "Code invalide", isError: true });
      }
    } catch (e) {
      setCheckinMessage({ text: "Erreur de connexion", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisembark = async (bookingId: string, passengerName: string) => {
    if (!confirm(`Confirmer la descente de ${passengerName} ?`)) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DISEMBARK",
          bookingId,
        }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMilestone = async (milestone: string, stopOrder: number) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "UPDATE_MILESTONE",
          milestone,
          stopOrder,
        }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white p-6 text-center">
        Voyage introuvable ou erreur de chargement.
      </div>
    );
  }

  const { trip, passengersList } = data;

  // Regroupement des passagers par ville de descente
  const passengersByDestination: Record<string, Passenger[]> = {};
  passengersList.forEach((p) => {
    if (!passengersByDestination[p.destinationCity]) {
      passengersByDestination[p.destinationCity] = [];
    }
    passengersByDestination[p.destinationCity].push(p);
  });

  const boardedCount = passengersList.filter((p) => p.boardingStatus === "BOARDED").length;
  const totalBooked = passengersList.length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* En-tête Mobile Chef de Bord */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              {trip.companyName} • Chef de Bord
            </span>
          </div>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
            {trip.tripCode}
          </span>
        </div>

        <h1 className="text-lg font-black text-white mt-1">
          {trip.originCity} ➔ {trip.destinationCity}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Départ {trip.departureTime} • <strong>{boardedCount} / {totalBooked} passagers montés</strong>
        </p>

        {/* Jalon actuel */}
        <div className="mt-3 rounded-lg bg-slate-900/80 border border-slate-700 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-slate-300">
              Statut : <strong className="text-white">{trip.currentMilestone}</strong>
            </span>
          </div>
          <button
            onClick={() => loadData()}
            className="text-xs text-orange-400 font-semibold"
          >
            Rafraîchir
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        {/* Module de Contrôle Billet Rapide (Scan / Saisie Code) */}
        <section className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="h-5 w-5 text-orange-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wide">
              Contrôler un Billet (Scan / Code)
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={checkinInput}
              onChange={(e) => setCheckinInput(e.target.value.toUpperCase())}
              placeholder="Ex: KWR-9X2"
              className="flex-1 rounded-xl bg-slate-900 border border-slate-600 px-4 py-3 text-lg font-mono font-black text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none uppercase"
            />
            <button
              onClick={() => handleValidateBoarding()}
              disabled={isSubmitting || !checkinInput.trim()}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 text-sm font-black text-white disabled:opacity-50 transition-colors shadow"
            >
              Valider
            </button>
          </div>

          {checkinMessage && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                checkinMessage.isError
                  ? "bg-red-950/80 text-red-200 border border-red-800"
                  : "bg-emerald-950/80 text-emerald-200 border border-emerald-800"
              }`}
            >
              {checkinMessage.isError ? (
                <span>⚠️ {checkinMessage.text}</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{checkinMessage.text}</span>
                </>
              )}
            </div>
          )}
        </section>

        {/* Jalons de Route (Tracking par Boutons d'Étape) */}
        <section className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-orange-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wide">
              Jalons de Route (Valider passage)
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {trip.stops.map((stop) => {
              const isCurrent = trip.currentMilestone.includes(stop.city);
              const isReached = stop.isReached;

              return (
                <button
                  key={stop.order}
                  onClick={() => handleUpdateMilestone(`Arrivé à ${stop.city}`, stop.order)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    isCurrent
                      ? "bg-orange-500 text-white border-orange-400 font-bold shadow-md ring-2 ring-orange-300"
                      : isReached
                      ? "bg-slate-900/60 text-slate-400 border-slate-700 opacity-60"
                      : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <span className="block text-[10px] uppercase text-slate-400 font-mono">
                    Arrêt {stop.order}
                  </span>
                  <span className="text-sm font-black">{stop.city}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Liste des Passagers groupés par Ville de Descente */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm uppercase tracking-wide">
              Passagers par Ville de Descente
            </h2>
            <span className="text-xs text-slate-400">
              {Object.keys(passengersByDestination).length} escales
            </span>
          </div>

          {Object.entries(passengersByDestination).map(([city, passengers]) => (
            <div key={city} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <h3 className="font-bold text-white">{city}</h3>
                </div>
                <span className="bg-slate-900 px-2 py-0.5 rounded text-xs text-orange-300 font-bold">
                  {passengers.length} passager{passengers.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-3 divide-y divide-slate-700/60">
                {passengers.map((p) => (
                  <div key={p.bookingId} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{p.passengerName}</span>
                        {p.seatNumber && (
                          <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded text-slate-300 font-mono">
                            S.{p.seatNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-orange-400 font-bold">{p.shortCode}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {p.passengerPhone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.boardingStatus === "NOT_BOARDED" && (
                        <button
                          onClick={() => handleValidateBoarding(p.shortCode)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold"
                        >
                          Monter
                        </button>
                      )}

                      {p.boardingStatus === "BOARDED" && (
                        <button
                          onClick={() => handleDisembark(p.bookingId, p.passengerName)}
                          className="rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 text-xs font-semibold flex items-center gap-1"
                        >
                          <LogOut className="h-3 w-3 text-orange-400" />
                          Débarquer
                        </button>
                      )}

                      {p.boardingStatus === "DISEMBARKED" && (
                        <span className="text-[11px] text-slate-500 font-semibold italic">
                          Débarqué
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default function ConductorPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ConductorContent params={params} />
    </Suspense>
  );
}
