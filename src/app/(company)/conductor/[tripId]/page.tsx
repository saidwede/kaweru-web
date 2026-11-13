"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { 
  Bus, 
  CheckCircle2, 
  MapPin, 
  UserCheck, 
  RefreshCw, 
  LogOut, 
  Phone, 
  QrCode,
  Navigation,
  ArrowLeft,
  Check,
  AlertCircle,
  Users
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
        setCheckinMessage({ text: (typeof json.error === "string" ? json.error : json.error?.message) || "Code invalide", isError: true });
      }
    } catch {
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
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#FF6500]" />
          <p className="mt-3 text-xs font-bold text-slate-500">Chargement de la feuille de route...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] p-6 text-center text-slate-600 font-bold text-sm">
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans antialiased">
      {/* En-tête Mobile Chef de Bord */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 sticky top-0 z-20">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/conductor" className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-[#FF6500] uppercase tracking-wider">
                {trip.companyName} • Chef de Bord
              </span>
            </div>
            <span className="text-xs bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg text-slate-800 font-mono font-bold">
              {trip.tripCode}
            </span>
          </div>

          <h1 className="text-lg font-black text-slate-900 mt-2">
            {trip.originCity} ➔ {trip.destinationCity}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Départ {trip.departureTime} • <strong className="text-slate-900">{boardedCount} / {totalBooked} passagers montés</strong>
          </p>

          {/* Jalon actuel */}
          <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#FF6500]" />
              <span className="text-xs text-slate-600 font-medium">
                Statut : <strong className="text-slate-900">{trip.currentMilestone}</strong>
              </span>
            </div>
            <button
              onClick={() => loadData()}
              className="text-xs text-[#FF6500] font-black hover:underline cursor-pointer"
            >
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-5 max-w-md mx-auto">
        {/* Module de Contrôle Billet Rapide (Scan / Saisie Code) */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-bold">
              <QrCode className="h-4 w-4" />
            </div>
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-wide">
              Contrôler un Billet (Scan / Code)
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={checkinInput}
              onChange={(e) => setCheckinInput(e.target.value.toUpperCase())}
              placeholder="Ex: KWR-9X2"
              className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-base font-mono font-black text-slate-900 placeholder:text-slate-400 focus:border-[#FF6500] focus:bg-white focus:outline-none uppercase"
            />
            <button
              onClick={() => handleValidateBoarding()}
              disabled={isSubmitting || !checkinInput.trim()}
              className="rounded-xl bg-[#FF6500] hover:bg-[#e55a00] px-4 text-xs font-black text-white disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              Valider
            </button>
          </div>

          {checkinMessage && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                checkinMessage.isError
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {checkinMessage.isError ? (
                <span>⚠️ {checkinMessage.text}</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{checkinMessage.text}</span>
                </>
              )}
            </div>
          )}
        </section>

        {/* Jalons de Route (Tracking par Boutons d'Étape) */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="h-4 w-4" />
            </div>
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-wide">
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
                  className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[#FF6500] text-white border-[#FF6500] font-bold shadow-sm"
                      : isReached
                      ? "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <span className={`block text-[10px] uppercase font-mono ${isCurrent ? "text-white/80" : "text-slate-400"}`}>
                    Arrêt {stop.order}
                  </span>
                  <span className="text-xs font-black">{stop.city}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Liste des Passagers groupés par Ville de Descente */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-wide">
              Passagers par Ville de Descente
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {Object.keys(passengersByDestination).length} escales
            </span>
          </div>

          {Object.entries(passengersByDestination).map(([city, passengers]) => (
            <div key={city} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#FF6500]" />
                  <h3 className="font-black text-slate-900 text-sm">{city}</h3>
                </div>
                <span className="bg-orange-50 text-[#FF6500] px-2.5 py-0.5 rounded-full text-xs font-black">
                  {passengers.length} passager{passengers.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {passengers.map((p) => (
                  <div key={p.bookingId} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">{p.passengerName}</span>
                        {p.seatNumber && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-bold">
                            Siège {p.seatNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-[#FF6500] font-bold">{p.shortCode}</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {p.passengerPhone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.boardingStatus === "NOT_BOARDED" && (
                        <button
                          onClick={() => handleValidateBoarding(p.shortCode)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-xs"
                        >
                          Monter
                        </button>
                      )}

                      {p.boardingStatus === "BOARDED" && (
                        <button
                          onClick={() => handleDisembark(p.bookingId, p.passengerName)}
                          className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <LogOut className="h-3 w-3 text-[#FF6500]" />
                          Débarquer
                        </button>
                      )}

                      {p.boardingStatus === "DISEMBARKED" && (
                        <span className="text-[11px] text-slate-400 font-bold italic">
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
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#FF6500]" />
        </div>
      }
    >
      <ConductorContent params={params} />
    </Suspense>
  );
}
