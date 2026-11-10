"use client";

import { Building2, CheckCircle2, AlertCircle, Wallet, TrendingUp, ChevronRight, ArrowUpRight, DollarSign, Radio } from "lucide-react";
import type { AdminOverviewData, CompanyItem, StateSetter, TabType } from "./types";

interface OverviewTabProps {
  overview: AdminOverviewData | null;
  companies: CompanyItem[];
  maxVolume: number;
  setActiveTab: StateSetter<TabType>;
}

export default function OverviewTab({
  overview,
  companies,
  maxVolume,
  setActiveTab,
}: OverviewTabProps) {
  return (
    <>
      {/* HERO CARD COLORÉ (Style Header Image 1) */}
      <section className="bg-gradient-to-r from-[#FF6500] via-[#FF7A1A] to-[#FFA048] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-lg">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
              <Radio className="h-3 w-3 animate-pulse" />
              Supervision Nationale en Temps Réel
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Centre de Pilotage & Flux Kaweru
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              Suivez les réservations en ligne, les versements Mobile Money aux transporteurs et la ponctualité sur l&apos;ensemble des axes routiers du Bénin.
            </p>
          </div>

          {/* Tactile Gauge / Metric Summary Box */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-5 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                Remplissage Réseau
              </p>
              <p className="text-3xl font-black text-white">
                {overview?.operations.networkOccupancyRate || 68}%
              </p>
              <p className="text-[11px] text-white/80 font-medium mt-0.5">
                {overview?.operations.totalSoldSeats || 0} sièges réservés
              </p>
            </div>

            <div className="h-14 w-14 rounded-full border-4 border-white/30 border-t-white flex items-center justify-center font-black text-xs">
              LIVE
            </div>
          </div>
        </div>
      </section>

      {/* 4 CARTES KPIS SUPÉRIEURES (Image 1 Style avec Micro-trends) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. GMV Total */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Volume Brut des Ventes (GMV)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-black">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {(overview?.financials.totalGmvFcfa || 0).toLocaleString("fr-FR")}
            </span>
            <span className="text-xs font-bold text-slate-500">FCFA</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+14.8% cette semaine</span>
          </div>
        </div>

        {/* 2. Commission Kaweru Nette */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Revenu Net Kaweru
            </span>
            <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
              {(overview?.financials.totalCommissionFcfa || 0).toLocaleString("fr-FR")}
            </span>
            <span className="text-xs font-bold text-slate-500">FCFA</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span>500 FCFA / ticket réservé</span>
          </div>
        </div>

        {/* 3. Reversements MoMo en attente */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Reversements MoMo en Attente
            </span>
            <div className="h-9 w-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Wallet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {(overview?.financials.pendingSettlementFcfa || 0).toLocaleString("fr-FR")}
            </span>
            <span className="text-xs font-bold text-slate-500">FCFA</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span>À verser aux transporteurs</span>
          </div>
        </div>

        {/* 4. Flotte & Compagnies */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Compagnies & Lignes
            </span>
            <div className="h-9 w-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {overview?.operations.activeCompaniesCount || companies.length}
            </span>
            <span className="text-xs font-bold text-slate-400">
              compagnies • {overview?.operations.totalTripsCount || 0} départs
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>100% connectées au manifeste</span>
          </div>
        </div>
      </section>

      {/* GRAPHIQUE DES VOLUMES 7 JOURS & ALIGNEMENT DES OPÉRATIONS (Style Image 1) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique d'activité journalière (2 colonnes) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Flux des Ventes & Réservations (7 derniers jours)
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Évolution quotidienne du volume d&apos;affaires brut généré sur le réseau Kaweru Bénin
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Semaine en cours
            </span>
          </div>

          {/* Graphique Barres + Ligne CSS Responsive */}
          <div className="h-56 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {overview?.trendData.map((d, i) => {
              const heightPct = Math.round((d.volumeFcfa / maxVolume) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-md">
                    {d.volumeFcfa.toLocaleString("fr-FR")} FCFA ({d.tickets} tickets)
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full max-w-[42px] bg-gradient-to-t from-[#FF6500] to-amber-400 rounded-t-xl group-hover:brightness-110 transition-all"
                    style={{ height: `${Math.max(heightPct, 15)}%` }}
                  />

                  {/* Day Label */}
                  <span className="text-[11px] font-bold text-slate-500">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-[#FF6500]"></span>
                <span>Ventes en ligne FedaPay / MoMo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-amber-400"></span>
                <span>Tickets Guichet Gare</span>
              </div>
            </div>
            <span className="font-bold text-slate-800">
              Moyenne : ~{Math.round((overview?.financials.totalGmvFcfa || 4200000) / 7).toLocaleString("fr-FR")} FCFA / j
            </span>
          </div>
        </div>

        {/* File d'alertes & Incidents (1 colonne) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-[#FF6500]" />
                Alertes Opérations
              </h3>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6500]">
                {overview?.alerts?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {overview?.alerts && overview.alerts.length > 0 ? (
                overview.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      alert.level === "CRITICAL"
                        ? "bg-red-50/70 border-red-200 text-red-900"
                        : "bg-amber-50/70 border-amber-200 text-amber-900"
                    }`}
                  >
                    <p className="font-bold text-slate-900">{alert.title}</p>
                    <p className="text-[11px] text-slate-600 font-medium">{alert.description}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Aucune anomalie détectée</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tous les flux MoMo et bus sont synchronisés.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("FINANCES")}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Vérifier les reversements MoMo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </>
  );
}
