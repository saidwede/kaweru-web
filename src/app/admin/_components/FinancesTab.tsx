"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import type { AdminOverviewData } from "./types";
import { BookOpen, RefreshCw, CheckCircle2, ShieldCheck, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface FinancesTabProps {
  overview: AdminOverviewData | null;
}

interface LedgerEntry {
  id: string;
  type: string;
  amountFcfa: number;
  currency: string;
  debitAccount: string;
  creditAccount: string;
  referenceType: string;
  referenceId: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function FinancesTab({
  overview,
}: FinancesTabProps) {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const fetchLedger = async () => {
    try {
      setLoadingLedger(true);
      setLedgerError(null);
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const res = await fetch("/api/admin/ledger?limit=50", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`Erreur ${res.status} lors de la récupération du grand livre`);
      }
      const data = await res.json();
      setLedgerEntries(data.entries || []);
    } catch (e: any) {
      setLedgerError(e?.message || "Impossible de charger le grand livre");
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const getEntryBadge = (type: string) => {
    switch (type) {
      case "BOOKING_PAYMENT":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Encaissement Billet",
        };
      case "COMMISSION_EARNED":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Commission Kaweru",
        };
      case "PAYOUT_INITIATED":
      case "PAYOUT_CONFIRMED":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          label: "Virement Compagnie",
        };
      case "REFUND_ISSUED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          label: "Remboursement",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          label: type,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Conciliation & Reversements Mobile Money</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Reversement automatique des recettes de billets aux compagnies partenaires déduction faite de la commission Kaweru.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Recettes Totales Encaissées</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {(overview?.financials.totalGmvFcfa || 0).toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-xs text-emerald-600 font-bold mt-1">Via FedaPay & MTN/Moov</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Commissions Kaweru Retenues</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {(overview?.financials.totalCommissionFcfa || 0).toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Marge nette plateforme</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">En Attente de Virement MoMo</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {(overview?.financials.pendingSettlementFcfa || 0).toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Paiement programmé H-1</p>
        </div>
      </div>

      {/* SECTION GRAND LIVRE COMPTABLE IMMUABLE (DOUBLE-ENTRY LEDGER) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Grand Livre Comptable (Ledger Immuable)</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  Source de Vérité
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Journal en partie double infalsifiable : traçabilité stricte de chaque mouvement d'argent, commission et dette.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchLedger}
            disabled={loadingLedger}
            className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingLedger ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        {ledgerError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {ledgerError}
          </div>
        )}

        {loadingLedger && ledgerEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            Chargement des écritures comptables...
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Aucune écriture comptable enregistrée pour l'instant. Les écritures apparaîtront dès le premier billet payé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Date / Heure</th>
                  <th className="pb-3 px-3">Opération</th>
                  <th className="pb-3 px-3">Référence</th>
                  <th className="pb-3 px-3">Débit</th>
                  <th className="pb-3 px-3">Crédit</th>
                  <th className="pb-3 px-3 text-right">Montant</th>
                  <th className="pb-3 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.map((entry) => {
                  const badge = getEntryBadge(entry.type);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {entry.referenceId.slice(0, 14)}...
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <ArrowDownLeft className="h-3 w-3 text-rose-500" />
                          <span>{entry.debitAccount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                          <span>{entry.creditAccount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {entry.amountFcfa.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900">Règles de Reversement en Vigueur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <p className="font-black text-slate-900">Paiement H-1 Départ</p>
            <p className="text-slate-600 font-medium leading-relaxed">
              1 heure avant le départ du bus, le montant des réservations en ligne est consolidé et viré directement sur le compte MTN MoMo ou Moov Africa du transporteur.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <p className="font-black text-slate-900">Protection Billet Non Présenté</p>
            <p className="text-slate-600 font-medium leading-relaxed">
              Si un voyageur rate son bus sans report préalable, le siège reste acquis et payé au transporteur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
