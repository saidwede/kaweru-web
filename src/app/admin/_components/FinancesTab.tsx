import type { AdminOverviewData } from "./types";

interface FinancesTabProps {
  overview: AdminOverviewData | null;
}

export default function FinancesTab({
  overview,
}: FinancesTabProps) {
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
