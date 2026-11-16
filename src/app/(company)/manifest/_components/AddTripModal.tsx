"use client";

import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Bus, Plus, X, Clock, AlertCircle, RefreshCw, CalendarPlus } from "lucide-react";
import type { CompanyItem, UserProfile } from "./types";

interface AddTripModalProps {
  setShowAddTripModal: Dispatch<SetStateAction<boolean>>;
  onTripCreated: (message?: string) => void;
  userProfile: UserProfile | null;
  companies: CompanyItem[];
  selectedCompanyId: string;
}

type Mode = "LINE" | "EXTRA";

const DAYS_OF_WEEK = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const POPULAR_TIMES = ["06:30", "07:00", "08:30", "13:00", "15:30", "19:00", "22:00"];
const FALLBACK_CITIES = ["Cotonou", "Abomey-Calavi", "Porto-Novo", "Bohicon", "Parakou", "Dassa-Zoumè", "Djougou", "Natitingou"];

/** Date du jour au Bénin (UTC+1), et non en UTC. */
const beninToday = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

const inputCls =
  "w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500] outline-none";

export default function AddTripModal({
  setShowAddTripModal,
  onTripCreated,
  userProfile,
  companies,
  selectedCompanyId,
}: AddTripModalProps) {
  const isSuperAdmin = userProfile?.role === "SUPER_ADMIN";
  const [mode, setMode] = useState<Mode>("LINE");

  // Compagnie : la compagnie active du portail, sinon la première de la liste (jamais une valeur vide
  // affichée comme si elle était choisie).
  const [companyId, setCompanyId] = useState(selectedCompanyId || companies[0]?._id || "");

  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);
  const [origin, setOrigin] = useState("Cotonou");
  const [destination, setDestination] = useState("Parakou");
  const [price, setPrice] = useState("8500");
  const [quota, setQuota] = useState("");

  // Ligne régulière
  const [times, setTimes] = useState<string[]>(["07:00"]);
  const [timeInput, setTimeInput] = useState("13:00");
  const [everyDay, setEveryDay] = useState(true);
  const [days, setDays] = useState<number[]>(ALL_DAYS);

  // Départ exceptionnel
  const todayStr = useMemo(() => beninToday(), []);
  const [extraDate, setExtraDate] = useState(todayStr);
  const [extraTime, setExtraTime] = useState("07:00");

  const [modalError, setModalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/config/cities")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setCities(d.data.map((c: { name: string }) => c.name));
        }
      })
      .catch(() => {});
  }, []);

  const addTime = (t: string) => {
    if (!t || times.includes(t)) return;
    if (times.length >= 10) return setModalError("10 heures de départ maximum par jour.");
    setTimes((prev) => [...prev, t].sort());
    setModalError(null);
  };

  const removeTime = (t: string) => {
    if (times.length <= 1) return setModalError("Au moins une heure de départ est obligatoire.");
    setTimes((prev) => prev.filter((x) => x !== t));
  };

  const toggleDay = (d: number) => {
    setDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length <= 1) {
          setModalError("Sélectionnez au moins un jour de circulation.");
          return prev;
        }
        return prev.filter((x) => x !== d);
      }
      return [...prev, d];
    });
    setModalError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (origin === destination) return setModalError("La ville de départ et la ville d'arrivée doivent être différentes.");
    if (isSuperAdmin && !companyId) return setModalError("Choisissez la compagnie de transport.");
    const quotaNum = Number(quota);
    if (!Number.isInteger(quotaNum) || quotaNum < 1 || quotaNum > 100) {
      return setModalError("Indiquez le nombre de places confiées à Kaweru par départ (1 à 100).");
    }

    const common = {
      companyId: isSuperAdmin ? companyId : undefined,
      originCity: origin,
      destinationCity: destination,
      priceFcfa: Number(price),
      quota: quotaNum,
    };
    const request =
      mode === "LINE"
        ? { url: "/api/lines", body: { ...common, times, daysOfWeek: everyDay ? ALL_DAYS : days } }
        : { url: "/api/trips", body: { ...common, departureDate: extraDate, departureTime: extraTime } };

    setLoading(true);
    try {
      const res = await fetch(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        onTripCreated(json.message);
        setShowAddTripModal(false);
      } else {
        setModalError(json.error || "Échec de la programmation.");
      }
    } catch {
      setModalError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const daysLabel = everyDay ? "tous les jours" : `${days.length} jour(s) par semaine`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl my-6">
        {/* EN-TÊTE */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Programmer des départs</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {mode === "LINE" ? "Une ligne régulière : les départs s'ouvrent tout seuls, sans date de fin" : "Un bus en plus, une seule fois"}
              </p>
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

        {modalError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
            <button type="button" onClick={() => setModalError(null)} className="text-rose-400 hover:text-rose-700 shrink-0 font-bold">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TYPE : LIGNE RÉGULIÈRE / DÉPART EXCEPTIONNEL */}
          <div className="p-1 bg-slate-100 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode("LINE")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === "LINE" ? "bg-white text-[#FF6500] shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Ligne régulière
            </button>
            <button
              type="button"
              onClick={() => setMode("EXTRA")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === "EXTRA" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Départ exceptionnel
            </button>
          </div>

          {isSuperAdmin && companies.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Compagnie de transport</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required className={inputCls}>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TRAJET */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Départ</label>
              <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputCls}>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Arrivée</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputCls}>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {mode === "LINE" ? (
            <>
              {/* HORAIRES */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#FF6500]" />
                  Heures de départ ({times.length})
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-2xl bg-slate-50 border border-slate-200">
                  {times.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900">
                      {t}
                      <button type="button" onClick={() => removeTime(t)} className="text-slate-400 hover:text-rose-600 ml-0.5" title="Retirer">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addTime(timeInput)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </button>
                  <div className="flex items-center gap-1 text-[10px] ml-auto">
                    {POPULAR_TIMES.filter((t) => !times.includes(t)).slice(0, 4).map((t) => (
                      <button key={t} type="button" onClick={() => addTime(t)} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 hover:text-slate-900 font-bold">
                        +{t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* JOURS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jours de circulation</label>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={everyDay} onChange={() => setEveryDay(true)} className="accent-[#FF6500]" />
                    Tous les jours
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={!everyDay} onChange={() => setEveryDay(false)} className="accent-[#FF6500]" />
                    Certains jours
                  </label>
                </div>
                {!everyDay && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold transition ${
                          days.includes(d.value) ? "bg-[#FF6500] text-white" : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input type="date" min={todayStr} value={extraDate} onChange={(e) => setExtraDate(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Heure</label>
                <input type="time" value={extraTime} onChange={(e) => setExtraTime(e.target.value)} required className={inputCls} />
              </div>
            </div>
          )}

          {/* PRIX & PLACES KAWERU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prix du billet (FCFA)</label>
              <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Places Kaweru par départ</label>
              <input
                type="number"
                min={1}
                max={100}
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                required
                placeholder="ex : 8"
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 -mt-2">
            Places vendues en ligne sur chaque bus. Le reste du bus est vendu au guichet par la compagnie.
          </p>

          {/* RÉSUMÉ */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
            {mode === "LINE" ? (
              <>
                <strong className="text-slate-900">{origin} → {destination}</strong>, {daysLabel} à {times.join(", ")}.
                Les départs des 14 prochains jours sont ouverts tout de suite, puis renouvelés chaque nuit
                jusqu&apos;à la mise en pause de la ligne.
              </>
            ) : (
              <>
                <strong className="text-slate-900">{origin} → {destination}</strong>, le {extraDate} à {extraTime}, une seule fois.
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowAddTripModal(false)} className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : mode === "LINE" ? "Créer la ligne" : "Programmer ce départ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
