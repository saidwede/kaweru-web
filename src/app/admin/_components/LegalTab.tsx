"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, Check, ExternalLink, FileText, Scale } from "lucide-react";
import {
  CANCELLATION_POLICY_LABELS,
  DEFAULT_LEGAL_CONFIG,
  LEGAL_DOCS,
  type CompanyCancellationPolicy,
  type LegalEntity,
  type LegalRules,
} from "@/lib/legal";

const input =
  "w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]/30 focus:bg-white transition";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-extrabold text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

const ENTITY_FIELDS: Array<{ key: keyof LegalEntity; label: string; placeholder: string; required?: boolean }> = [
  { key: "companyName", label: "Raison sociale", placeholder: "KAWERU SARL" },
  { key: "legalForm", label: "Forme juridique et capital", placeholder: "SARL au capital de 1 000 000 FCFA" },
  { key: "rccm", label: "Numéro RCCM", placeholder: "RB/COT/26 B 12345" },
  { key: "ifu", label: "Numéro IFU", placeholder: "3202612345678" },
  { key: "address", label: "Adresse du siège", placeholder: "Quartier, rue, Cotonou" },
  { key: "publicationDirector", label: "Directeur de la publication", placeholder: "Prénom Nom" },
  { key: "email", label: "E-mail du service client", placeholder: "contact@kaweru.bj", required: true },
  { key: "phone", label: "Téléphone du service client", placeholder: "+229 01 00 00 00 00", required: true },
];

const RULE_FIELDS: Array<{ key: Exclude<keyof LegalRules, "companyCancellationPolicy">; label: string; unit: string; hint: string; max: number }> = [
  { key: "rescheduleFeeFcfa", label: "Frais de report", unit: "FCFA", hint: "Plus de 2 h avant le départ. 0 = report gratuit.", max: 50000 },
  { key: "lateRescheduleFeeFcfa", label: "Frais de report tardif", unit: "FCFA", hint: "Moins de 2 h avant le départ, ou départ manqué.", max: 50000 },
  { key: "missedRescheduleWindowHours", label: "Délai après un départ manqué", unit: "heures", hint: "Au-delà, le billet est perdu.", max: 168 },
  { key: "refundDelayDays", label: "Délai de remboursement", unit: "jours", hint: "Engagement affiché dans les CGV.", max: 90 },
  { key: "recommendedArrivalMinutes", label: "Arrivée en gare recommandée", unit: "min avant", hint: "0 = pas de recommandation.", max: 240 },
  { key: "claimDelayDays", label: "Délai de réclamation", unit: "jours", hint: "Après la date du voyage.", max: 365 },
];

/** Console Super Admin : identité de l'éditeur et règles commerciales affichées dans les documents légaux. */
export default function LegalTab() {
  const [entity, setEntity] = useState<LegalEntity>(DEFAULT_LEGAL_CONFIG.entity);
  const [rules, setRules] = useState<LegalRules>(DEFAULT_LEGAL_CONFIG.rules);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config/legal", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        setEntity({ ...DEFAULT_LEGAL_CONFIG.entity, ...json.data.entity });
        setRules({ ...DEFAULT_LEGAL_CONFIG.rules, ...json.data.rules });
        setUpdatedAt(json.data.updatedAt);
      })
      .catch(() => {
        if (!cancelled) setFeedback({ ok: false, text: "Impossible de charger les paramètres légaux." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/config/legal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, rules }),
      });
      const json = await res.json();
      if (json.success) {
        setUpdatedAt(json.data.updatedAt);
        setFeedback({ ok: true, text: json.message });
      } else {
        setFeedback({ ok: false, text: typeof json.error === "string" ? json.error : "Enregistrement refusé." });
      }
    } catch {
      setFeedback({ ok: false, text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  const missing = ENTITY_FIELDS.filter((f) => !entity[f.key].trim()).length;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Paramètres légaux</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Ces informations s&apos;affichent dans les CGU, les CGV, la politique de confidentialité et les mentions légales.
            {updatedAt && ` Dernière modification : ${new Date(updatedAt).toLocaleString("fr-FR")}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LEGAL_DOCS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              target="_blank"
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              {d.label}
              <ExternalLink className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border ${
            feedback.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#FF6500]" />
            Identité de la société
          </h3>
          {missing > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
              {missing} champ{missing > 1 ? "s" : ""} à compléter avant la mise en ligne
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ENTITY_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type={f.key === "email" ? "email" : "text"}
                value={entity[f.key]}
                placeholder={f.placeholder}
                required={f.required}
                disabled={loading}
                onChange={(e) => setEntity((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className={input}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#FF6500]" />
          Règles commerciales
        </h3>
        <p className="text-[11px] text-slate-500 -mt-2">
          Les frais et le délai de report sont appliqués immédiatement aux reports de billets. Les billets déjà vendus restent
          régis par les conditions acceptées lors de l&apos;achat.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RULE_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={f.max}
                  step={1}
                  required
                  disabled={loading}
                  value={rules[f.key]}
                  onChange={(e) => setRules((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  className={`${input} pr-20`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">{f.unit}</span>
              </div>
            </Field>
          ))}
        </div>

        <Field label="Si la compagnie annule un départ" hint="Le billet du client, lui, reste non remboursable s'il annule de lui-même.">
          <select
            value={rules.companyCancellationPolicy}
            disabled={loading}
            onChange={(e) => setRules((prev) => ({ ...prev, companyCancellationPolicy: e.target.value as CompanyCancellationPolicy }))}
            className={input}
          >
            {(Object.keys(CANCELLATION_POLICY_LABELS) as CompanyCancellationPolicy[]).map((p) => (
              <option key={p} value={p}>
                {CANCELLATION_POLICY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Chaque enregistrement est archivé : on sait quelles règles étaient en vigueur à chaque date.
        </p>
        <button
          type="submit"
          disabled={saving || loading}
          className="px-5 py-3 rounded-2xl bg-[#FF6500] hover:bg-[#EA580C] text-white text-xs font-black flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Check className="h-4 w-4" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
