"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { 
  Bus, 
  Printer, 
  UserCheck, 
  RefreshCw, 
  Search, 
  Phone, 
  MapPin, 
  AlertCircle 
} from "lucide-react";

interface SeatData {
  seatNumber: number;
  status: "VACANT" | "RESERVED_KAWERU" | "CASH_GUICHET";
  passengerName: string | null;
  passengerPhone: string | null;
  destinationCity: string | null;
  shortCode?: string;
  isBoarded?: boolean;
}

interface ManifestResponse {
  trip: {
    id: string;
    tripCode: string;
    companyName: string;
    originCity: string;
    destinationCity: string;
    departureDate: string;
    departureTime: string;
    status: string;
    totalBusSeats: number;
    stats: {
      reservedKaweruCount: number;
      cashGuichetCount: number;
      vacantCount: number;
      occupancyRate: number;
    };
  };
  seats: SeatData[];
  passengersList: Array<{
    bookingId: string;
    shortCode: string;
    passengerName: string;
    passengerPhone: string;
    originCity: string;
    destinationCity: string;
    boardingStatus: string;
    seatNumber?: number;
  }>;
}

function ManifestContent({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);

  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // État formulaire modal guichet cash
  const [cashName, setCashName] = useState("");
  const [cashPhone, setCashPhone] = useState("");
  const [cashDest, setCashDest] = useState("");
  const [isUpdatingSeat, setIsUpdatingSeat] = useState(false);

  const fetchManifest = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/manifest`);
      const data = await res.json();
      if (data.success) {
        setManifest(data.data);
      }
    } catch (err) {
      console.error("Erreur chargement manifeste:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
    const interval = setInterval(fetchManifest, 15000); // Polling 15s pour le guichet
    return () => clearInterval(interval);
  }, [tripId]);

  const handleSeatClick = (seat: SeatData) => {
    setSelectedSeat(seat);
    if (seat.status === "CASH_GUICHET") {
      setCashName(seat.passengerName || "");
      setCashPhone(seat.passengerPhone || "");
      setCashDest(seat.destinationCity || manifest?.trip.destinationCity || "");
    } else {
      setCashName("");
      setCashPhone("");
      setCashDest(manifest?.trip.destinationCity || "");
    }
  };

  const handleAssignCash = async () => {
    if (!selectedSeat || !cashName.trim()) return;
    setIsUpdatingSeat(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatNumber: selectedSeat.seatNumber,
          action: "ASSIGN_CASH",
          passengerName: cashName.trim(),
          passengerPhone: cashPhone.trim(),
          destinationCity: cashDest.trim(),
        }),
      });

      if (res.ok) {
        await fetchManifest();
        setSelectedSeat(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingSeat(false);
    }
  };

  const handleFreeSeat = async () => {
    if (!selectedSeat) return;
    setIsUpdatingSeat(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatNumber: selectedSeat.seatNumber,
          action: "FREE_SEAT",
        }),
      });

      if (res.ok) {
        await fetchManifest();
        setSelectedSeat(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingSeat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-3 text-slate-600 font-medium">Chargement de la Fiche de Chargement...</p>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center text-slate-600">Voyage introuvable ou erreur de connexion.</div>
      </div>
    );
  }

  const { trip, seats, passengersList } = manifest;

  const filteredPassengers = passengersList.filter(
    (p) =>
      p.passengerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.shortCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.passengerPhone.includes(searchFilter)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* En-tête Fiche de Chargement */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm print:static print:border-none">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800 uppercase">
                  {trip.companyName}
                </span>
                <span className="text-xs text-slate-500">Bus N° {trip.tripCode}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Fiche de Chargement : {trip.originCity} ➔ {trip.destinationCity}
              </h1>
              <p className="text-sm text-slate-500">
                Départ prévu : <strong className="text-slate-800">{trip.departureDate} à {trip.departureTime}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={() => fetchManifest()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Imprimer la Feuille
              </button>
            </div>
          </div>

          {/* Statistiques de Remplissage */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <span className="text-xs font-semibold text-emerald-800">Réservés Kaweru (MoMo)</span>
              <p className="text-2xl font-black text-emerald-700">{trip.stats.reservedKaweruCount}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <span className="text-xs font-semibold text-amber-800">Vendus Guichet (Cash)</span>
              <p className="text-2xl font-black text-amber-700">{trip.stats.cashGuichetCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-3">
              <span className="text-xs font-semibold text-slate-600">Sièges Vacants</span>
              <p className="text-2xl font-black text-slate-800">{trip.stats.vacantCount}</p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3">
              <span className="text-xs font-semibold text-orange-800">Taux de Remplissage</span>
              <p className="text-2xl font-black text-orange-600">{trip.stats.occupancyRate}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne Gauche : Plan du Bus (50 Sièges) */}
        <section className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-slate-900">Plan Interactif du Bus</h2>
            </div>
            <span className="text-xs font-medium text-slate-500">50 Sièges</span>
          </div>

          {/* Légende */}
          <div className="flex items-center gap-4 text-xs font-semibold mb-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500 ring-2 ring-emerald-200"></span>
              <span>Kaweru (MoMo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-500 ring-2 ring-amber-200"></span>
              <span>Guichet (Cash)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-slate-200"></span>
              <span>Vacant</span>
            </div>
          </div>

          {/* Représentation Chauffeur */}
          <div className="rounded-lg bg-slate-100 p-2 text-center text-xs font-bold text-slate-500 tracking-wider uppercase mb-6">
            🚐 Cabine Chauffeur & Porte d'embarquement
          </div>

          {/* Grille des 50 sièges (Disposition bus interurbain 2x2 avec allée centrale) */}
          {(() => {
            const getSeatData = (num: number) => seats.find((s) => s.seatNumber === num);

            const renderSeatButton = (num: number) => {
              const s = getSeatData(num);
              if (!s) return null;

              let colorClasses = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300";
              if (s.status === "RESERVED_KAWERU") {
                colorClasses = "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600 font-bold shadow-sm";
              } else if (s.status === "CASH_GUICHET") {
                colorClasses = "bg-amber-500 text-white hover:bg-amber-600 border-amber-600 font-bold shadow-sm";
              }

              const isSelected = selectedSeat?.seatNumber === num;

              return (
                <button
                  key={num}
                  onClick={() => handleSeatClick(s)}
                  className={`h-11 w-11 rounded-lg border text-xs flex flex-col items-center justify-center transition-all ${colorClasses} ${
                    isSelected ? "ring-4 ring-orange-400 scale-105" : ""
                  }`}
                >
                  <span>{num}</span>
                  {s.destinationCity && (
                    <span className="text-[9px] truncate max-w-[36px] opacity-90">
                      {s.destinationCity.substring(0, 3)}
                    </span>
                  )}
                </button>
              );
            };

            return (
              <div className="grid grid-cols-5 gap-2.5 max-w-sm mx-auto">
                {Array.from({ length: 12 }).map((_, rowIndex) => {
                  const seatA = rowIndex * 4 + 1;
                  const seatB = rowIndex * 4 + 2;
                  const seatC = rowIndex * 4 + 3;
                  const seatD = rowIndex * 4 + 4;

                  return (
                    <React.Fragment key={rowIndex}>
                      {renderSeatButton(seatA)}
                      {renderSeatButton(seatB)}
                      {/* Allée centrale */}
                      <div className="flex items-center justify-center text-slate-300 text-[10px] select-none">
                        •
                      </div>
                      {renderSeatButton(seatC)}
                      {renderSeatButton(seatD)}
                    </React.Fragment>
                  );
                })}

                {/* Rangée arrière (Sièges 49 et 50) */}
                <div className="col-span-5 grid grid-cols-5 gap-2.5 mt-2 pt-2 border-t border-slate-100">
                  {renderSeatButton(49)}
                  {renderSeatButton(50)}
                  <div className="col-span-3"></div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Colonne Droite : Détail Siège & Manifeste Passagers */}
        <section className="lg:col-span-7 space-y-6">
          {/* Panneau Action Siège Sélectionné */}
          {selectedSeat ? (
            <div className="bg-white p-6 rounded-2xl border-2 border-orange-300 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase">Gestion du Siège</span>
                  <h3 className="text-lg font-black text-slate-900">Siège N° {selectedSeat.seatNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Fermer
                </button>
              </div>

              {selectedSeat.status === "RESERVED_KAWERU" ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">RÉSERVÉ SUR KAWERU</span>
                      <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border">
                        {selectedSeat.shortCode}
                      </span>
                    </div>
                    <p className="text-base font-bold text-slate-900 mt-2">{selectedSeat.passengerName}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {selectedSeat.passengerPhone}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Descente : <strong>{selectedSeat.destinationCity}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    Ce siège a été payé par Mobile Money. Seul le contrôleur ou le passager peut le modifier.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Nom et Prénom du passager guichet
                    </label>
                    <input
                      type="text"
                      value={cashName}
                      onChange={(e) => setCashName(e.target.value)}
                      placeholder="Ex: BIO Saïd"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Téléphone (Optionnel)
                      </label>
                      <input
                        type="text"
                        value={cashPhone}
                        onChange={(e) => setCashPhone(e.target.value)}
                        placeholder="01 97 XX XX XX"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Ville de descente
                      </label>
                      <input
                        type="text"
                        value={cashDest}
                        onChange={(e) => setCashDest(e.target.value)}
                        placeholder={trip.destinationCity}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleAssignCash}
                      disabled={isUpdatingSeat || !cashName.trim()}
                      className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {selectedSeat.status === "CASH_GUICHET" ? "Enregistrer Modifications" : "Vendre au Guichet (Cash)"}
                    </button>
                    {selectedSeat.status === "CASH_GUICHET" && (
                      <button
                        onClick={handleFreeSeat}
                        disabled={isUpdatingSeat}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                      >
                        Libérer le siège
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-400">
              <UserCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Cliquez sur un siège dans le plan du bus pour enregistrer une vente physique au guichet ou consulter les détails d'un billet.</p>
            </div>
          )}

          {/* Tableau du Manifeste des Passagers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Manifeste Officiel d'Embarquement</h3>
                <p className="text-xs text-slate-500">Liste nominative des passagers pour le contrôle</p>
              </div>

              <div className="relative print:hidden">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, code, tél..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-orange-500 focus:outline-none w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Siège</th>
                    <th className="px-4 py-3">Passager</th>
                    <th className="px-4 py-3">Code Billet</th>
                    <th className="px-4 py-3">Descente</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPassengers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Aucun passager correspondant.
                      </td>
                    </tr>
                  ) : (
                    filteredPassengers.map((p) => (
                      <tr key={p.bookingId} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {p.seatNumber ? `N° ${p.seatNumber}` : "Non assigné"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{p.passengerName}</p>
                          <span className="text-xs text-slate-500">{p.passengerPhone}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {p.shortCode}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {p.destinationCity}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              p.boardingStatus === "BOARDED"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.boardingStatus === "DISEMBARKED"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.boardingStatus === "BOARDED"
                              ? "Embarqué"
                              : p.boardingStatus === "DISEMBARKED"
                              ? "Débarqué"
                              : "En attente"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ManifestPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ManifestContent params={params} />
    </Suspense>
  );
}
