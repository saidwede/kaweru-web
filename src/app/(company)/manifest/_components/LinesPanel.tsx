"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Pause, Play, Pencil, Check, X } from "lucide-react";

interface LineItem {
  _id: string;
  originCity: string;
  destinationCity: string;
  times: string[];
  daysOfWeek: number[];
  priceFcfa: number;
  quota: number;
  isActive: boolean;
}

interface LinesPanelProps {
  /** Compagnie affichée (vide pour un Super Admin qui n'en a pas encore choisi). */
  companyId: string;
  isSuperAdmin: boolean;
  /** Incrémenté par la page après une création, pour recharger la liste. */
  refreshKey: number;
  onChanged: (message: string, isError?: boolean) => void;
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const daysText = (d: number[]) =>
  d.length === 7 ? "Tous les jours" : [1, 2, 3, 4, 5, 6, 0].filter((x) => d.includes(x)).map((x) => DAY_LABELS[x]).join(" · ");

export default function LinesPanel({ companyId, isSuperAdmin, refreshKey, onChanged }: LinesPanelProps) {
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQuota, setEditQuota] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    if (isSuperAdmin && !companyId) return;
    let cancelled = false;
    fetch(companyId ? `/api/lines?companyId=${encodeURIComponent(companyId)}` : "/api/lines")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setLines(json.success ? json.data : []);
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, isSuperAdmin, refreshKey, reloadTick]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/lines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      onChanged(json.success ? json.message : json.error || "Modification impossible.", !json.success);
      if (json.success) {
        setEditing(null);
        reload();
      }
    } catch {
      onChanged("Erreur réseau.", true);
    } finally {
      setBusy(null);
    }
  };

  if (isSuperAdmin && !companyId) {
    return (
      <div className="p-4 rounded-3xl border border-dashed border-slate-200 text-xs text-slate-500">
        Choisissez une compagnie dans l&apos;en-tête pour voir ses lignes régulières.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-[#FF6500]" />
            Lignes régulières
          </h3>
          <p className="text-[11px] text-slate-500">Départs ouverts automatiquement 14 jours à l&apos;avance, sans date de fin.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Chargement…</p>
      ) : lines.length === 0 ? (
        <p className="text-xs text-slate-500">Aucune ligne. Créez-en une avec « Programmer des départs ».</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {lines.map((l) => (
            <li key={l._id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">
                  {l.originCity} → {l.destinationCity}
                  {!l.isActive && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">En pause</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {daysText(l.daysOfWeek)} · {l.times.join(", ")}
                </p>
              </div>

              {editing === l._id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-24 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    title="Prix (FCFA)"
                  />
                  <input
                    type="number"
                    value={editQuota}
                    onChange={(e) => setEditQuota(e.target.value)}
                    className="w-16 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    title="Places Kaweru"
                  />
                  <button
                    type="button"
                    disabled={busy === l._id}
                    onClick={() => patch(l._id, { priceFcfa: Number(editPrice), quota: Number(editQuota) })}
                    className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50"
                    title="Enregistrer"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="h-7 w-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center" title="Annuler">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-black text-slate-900">{l.priceFcfa.toLocaleString("fr-FR")} F</span>
                  <span className="text-slate-500">{l.quota} places Kaweru</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(l._id);
                      setEditPrice(String(l.priceFcfa));
                      setEditQuota(String(l.quota));
                    }}
                    className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                    title="Modifier le prix ou les places"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busy === l._id}
                    onClick={() => {
                      if (l.isActive && !window.confirm("Mettre la ligne en pause ? Les départs sans vente seront retirés ; les billets déjà vendus restent valables.")) return;
                      void patch(l._id, { isActive: !l.isActive });
                    }}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 ${
                      l.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {l.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {l.isActive ? "Pause" : "Reprendre"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-slate-400 mt-3">
        Un changement de prix ou de places s&apos;applique aux départs à venir encore invendus ; les billets déjà payés ne changent pas.
      </p>
    </section>
  );
}
