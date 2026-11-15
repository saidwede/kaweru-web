"use client";

import { useState, useMemo, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Bus, Plus, X, Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react";
import type { CompanyItem, UserProfile } from "./types";

interface AddTripModalProps {
  setShowAddTripModal: Dispatch<SetStateAction<boolean>>;
  onTripCreated: () => void;
  userProfile: UserProfile | null;
  companies: CompanyItem[];
  selectedCompanyId: string;
}

const DAYS_OF_WEEK = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];

const POPULAR_TIMES = ["06:30", "07:00", "08:30", "13:00", "15:30", "19:00", "22:00"];

export default function AddTripModal({
  setShowAddTripModal,
  onTripCreated,
  userProfile,
  companies,
  selectedCompanyId,
}: AddTripModalProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [newTripCompanyId, setNewTripCompanyId] = useState(selectedCompanyId || "");
  const [origin, setOrigin] = useState("Cotonou");
  const [destination, setDestination] = useState("Parakou");
  const [price, setPrice] = useState(8500);
  const [plate, setPlate] = useState("");

  // Mode Date Unique
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [singleDate, setSingleDate] = useState(todayStr);

  // Mode Récurrent
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Tous les jours par défaut

  // Multi-heures
  const [timesList, setTimesList] = useState<string[]>(["07:00"]);
  const [timeInput, setTimeInput] = useState("13:00");

  // État local de soumission & Erreur interne à la modale
  const [modalError, setModalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calcul dynamique des dates cibles
  const targetDates = useMemo(() => {
    if (!isRecurring) {
      return singleDate ? [singleDate] : [];
    }
    if (!startDate || !endDate) return [];
    const dates: string[] = [];
    const current = new Date(`${startDate}T12:00:00Z`);
    const end = new Date(`${endDate}T12:00:00Z`);

    while (current <= end && dates.length < 31) {
      const dayOfWeek = current.getUTCDay();
      if (selectedDays.includes(dayOfWeek)) {
        dates.push(current.toISOString().split("T")[0]);
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
  }, [isRecurring, singleDate, startDate, endDate, selectedDays]);

  // Nombre total de départs générés
  const totalTripsToCreate = targetDates.length * timesList.length;

  const handleAddTime = (timeToAdd: string) => {
    if (!timeToAdd) return;
    if (timesList.includes(timeToAdd)) return;
    if (timesList.length >= 10) {
      setModalError("Maximum 10 horaires de départ par jour.");
      return;
    }
    setTimesList((prev) => [...prev, timeToAdd].sort());
    setModalError(null);
  };

  const handleRemoveTime = (timeToRemove: string) => {
    if (timesList.length <= 1) {
      setModalError("Au moins une heure de départ est obligatoire.");
      return;
    }
    setTimesList((prev) => prev.filter((t) => t !== timeToRemove));
  };

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(dayVal);
      if (exists) {
        if (prev.length <= 1) {
          setModalError("Sélectionnez au moins un jour de circulation.");
          return prev;
        }
        return prev.filter((d) => d !== dayVal);
      }
      return [...prev, dayVal];
    });
    setModalError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setModalError("La ville de départ et la ville d'arrivée doivent être différentes.");
      return;
    }

    if (timesList.length === 0) {
      setModalError("Veuillez ajouter au moins une heure de départ.");
      return;
    }

    if (targetDates.length === 0) {
      setModalError("Aucune date sélectionnée ne correspond aux critères de circulation.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCity: origin.trim(),
          destinationCity: destination.trim(),
          departureDates: targetDates,
          departureTimes: timesList,
          priceFcfa: Number(price),
          busPlateNumber: plate.trim() || undefined,
          targetCompanyId: userProfile?.role === "SUPER_ADMIN" ? (newTripCompanyId || selectedCompanyId) : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        onTripCreated();
        setShowAddTripModal(false);
      } else {
        setModalError(json.error || "Échec de programmation des départs.");
      }
    } catch {
      setModalError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-bold">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Programmer des Départs</h3>
              <p className="text-[11px] text-slate-500 font-medium">Lignes régulières, multi-horaires & récurrence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTripModal(false)}
            className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* ALERTE D'ERREUR INTÉGRÉE DANS LA MODALE */}
        {modalError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start justify-between gap-2.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
            <button
              type="button"
              onClick={() => setModalError(null)}
              className="text-rose-400 hover:text-rose-700 shrink-0 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SÉLECTEUR DE COMPAGNIE (SUPER ADMIN) */}
          {userProfile?.role === "SUPER_ADMIN" && companies.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Compagnie de transport</label>
              <select
                value={newTripCompanyId || selectedCompanyId}
                onChange={(e) => setNewTripCompanyId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none"
              >
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* VILLES DE DÉPART ET D'ARRIVÉE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ville de Départ</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                placeholder="Ex: Cotonou"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ville d&apos;Arrivée</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                placeholder="Ex: Parakou"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none"
              />
            </div>
          </div>

          {/* COMMUTATEUR : DATE UNIQUE VS RÉCURRENCE */}
          <div className="p-1 bg-slate-100 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                !isRecurring ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Date unique
            </button>
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isRecurring ? "bg-white text-[#FF6500] shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Départs récurrents
            </button>
          </div>

          {/* CONFIGURATION DE DATE */}
          {!isRecurring ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date du départ</label>
              <input
                type="date"
                min={todayStr}
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none"
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date début</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date fin</label>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* SÉLECTEUR DE JOURS DE LA SEMAINE */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Jours de circulation</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = selectedDays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? "bg-[#FF6500] text-white shadow-xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                    className="text-[10px] text-[#FF6500] font-bold ml-1 hover:underline"
                  >
                    Tous les jours
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MULTI-HORAIRES DE DÉPART */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#FF6500]" />
                Heures de départ ({timesList.length})
              </label>
              <span className="text-[11px] text-slate-400">Plusieurs départs dans la journée</span>
            </div>

            {/* BADGES DES HEURES CHOISIES */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-2xl bg-slate-50 border border-slate-200">
              {timesList.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-2xs"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(t)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5"
                    title="Supprimer cette heure"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* AJOUT D'UNE NOUVELLE HEURE */}
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddTime(timeInput)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1 transition"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </button>

              {/* Raccourcis fréquents */}
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto text-[10px] text-slate-400 ml-auto">
                {POPULAR_TIMES.slice(0, 4).map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => handleAddTime(pt)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-orange-100 hover:text-[#FF6500] font-semibold"
                  >
                    +{pt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRIX ET PLAQUE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prix du Billet (FCFA)</label>
              <input
                type="number"
                min={1000}
                step={500}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plaque d&apos;immatriculation</label>
              <input
                type="text"
                placeholder="Ex: AY-4521-RB"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none"
              />
            </div>
          </div>

          {/* RÉCAPITULATIF DU NOMBRE DE DÉPARTS GÉNÉRÉS */}
          <div className="p-2.5 rounded-xl bg-slate-100/80 text-[11px] font-semibold text-slate-600 flex items-center justify-between">
            <span>
              Total programmé : <strong>{totalTripsToCreate}</strong> départ(s)
            </span>
            <span className="text-slate-400">
              {targetDates.length} jour(s) × {timesList.length} horaire(s)
            </span>
          </div>

          {/* BOUTONS D'ACTION */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddTripModal(false)}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || totalTripsToCreate === 0}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading
                ? "Création en cours..."
                : totalTripsToCreate > 1
                ? `Programmer les ${totalTripsToCreate} départs`
                : "Programmer le départ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
