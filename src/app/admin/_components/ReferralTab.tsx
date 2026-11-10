"use client";

import type { FormEvent } from "react";
import { Check, Gift } from "lucide-react";
import type { StateSetter } from "./types";

interface ReferralTabProps {
  pointsPerPurchase: number;
  setPointsPerPurchase: StateSetter<number>;
  savingReferral: boolean;
  referralSaved: boolean;
  handleSaveReferral: (e: FormEvent) => Promise<void>;
}

export default function ReferralTab({
  pointsPerPurchase,
  setPointsPerPurchase,
  savingReferral,
  referralSaved,
  handleSaveReferral,
}: ReferralTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Moteur de Parrainage & Fidélité</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Incitations financières accordées aux utilisateurs pour accélérer l&apos;adoption de Kaweru.
        </p>
      </div>

      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Prime de Parrainage par Billet Acheté</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-xl">
              Chaque voyageur dispose d&apos;un lien et code de parrainage. Configurez le montant de points crédités à son portefeuille fidélité à chaque fois que son filleul voyage.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveReferral} className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-[#FF6500] focus-within:bg-white transition">
            <input
              type="number"
              min={0}
              max={100000}
              value={pointsPerPurchase}
              onChange={(e) => setPointsPerPurchase(Number(e.target.value))}
              className="w-24 bg-transparent text-sm font-black text-slate-900 focus:outline-none text-right pr-2"
            />
            <span className="text-xs font-bold text-slate-400">pts / billet</span>
          </div>

          <button
            type="submit"
            disabled={savingReferral}
            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {referralSaved ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Enregistré</span>
              </>
            ) : (
              <span>{savingReferral ? "Sauvegarde..." : "Appliquer"}</span>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
