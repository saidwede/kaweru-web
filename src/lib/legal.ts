/**
 * Documents légaux de Kaweru.
 *
 * - TERMS_VERSION : version du MODÈLE des textes (identique à functions/src/lib/legal.ts et à l'appli
 *   mobile). À changer à chaque modification substantielle des textes eux-mêmes.
 * - L'identité de l'éditeur et les règles commerciales (frais, délais) sont réglées par le Super Admin
 *   (Console > Paramètres légaux) et lues ici via GET /api/config/legal.
 */
export const TERMS_VERSION = "2026-11-20";

/** Date du modèle des textes, affichée si les paramètres n'ont jamais été modifiés depuis. */
const TEMPLATE_DATE = new Date("2026-11-20T00:00:00+01:00");

export type CompanyCancellationPolicy = "CHOICE" | "RESCHEDULE_ONLY" | "REFUND_ONLY";

export interface LegalEntity {
  companyName: string;
  legalForm: string;
  rccm: string;
  ifu: string;
  address: string;
  publicationDirector: string;
  email: string;
  phone: string;
}

export interface LegalRules {
  rescheduleFeeFcfa: number;
  lateRescheduleFeeFcfa: number;
  missedRescheduleWindowHours: number;
  companyCancellationPolicy: CompanyCancellationPolicy;
  refundDelayDays: number;
  recommendedArrivalMinutes: number;
  claimDelayDays: number;
}

export interface LegalConfig {
  termsVersion: string;
  rulesVersion: string;
  updatedAt: string | null;
  entity: LegalEntity;
  rules: LegalRules;
}

export const DEFAULT_LEGAL_CONFIG: LegalConfig = {
  termsVersion: TERMS_VERSION,
  rulesVersion: "defaut",
  updatedAt: null,
  entity: {
    companyName: "",
    legalForm: "",
    rccm: "",
    ifu: "",
    address: "",
    publicationDirector: "",
    email: "contact@kaweru.bj",
    phone: "+229 01 97 00 00 00",
  },
  rules: {
    rescheduleFeeFcfa: 500,
    lateRescheduleFeeFcfa: 1000,
    missedRescheduleWindowHours: 48,
    companyCancellationPolicy: "CHOICE",
    refundDelayDays: 14,
    recommendedArrivalMinutes: 30,
    claimDelayDays: 30,
  },
};

export const CANCELLATION_POLICY_LABELS: Record<CompanyCancellationPolicy, string> = {
  CHOICE: "Au choix du voyageur : report gratuit ou remboursement intégral",
  RESCHEDULE_ONLY: "Report gratuit uniquement",
  REFUND_ONLY: "Remboursement intégral uniquement",
};

export const LEGAL_DOCS = [
  { href: "/cgu", label: "Conditions d'utilisation" },
  { href: "/cgv", label: "Conditions de vente" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/suppression-compte", label: "Supprimer mon compte" },
] as const;

const API_ORIGIN = (process.env.KAWERU_API_ORIGIN || "https://europe-west1-kaweru-app.cloudfunctions.net/api").replace(/\/$/, "");

/**
 * Paramètres en vigueur, pour les pages légales (côté serveur, mis en cache 60 s).
 * En cas d'indisponibilité de l'API, les valeurs par défaut sont affichées.
 */
export async function getLegalConfig(): Promise<LegalConfig & { updatedLabel: string }> {
  let config = DEFAULT_LEGAL_CONFIG;
  try {
    const res = await fetch(`${API_ORIGIN}/config/legal`, { next: { revalidate: 60 } });
    const json = await res.json();
    if (json?.success && json.data) {
      config = {
        ...DEFAULT_LEGAL_CONFIG,
        ...json.data,
        entity: { ...DEFAULT_LEGAL_CONFIG.entity, ...json.data.entity },
        rules: { ...DEFAULT_LEGAL_CONFIG.rules, ...json.data.rules },
      };
    }
  } catch {
    // API injoignable (build hors ligne, panne) : valeurs par défaut.
  }
  const updated = config.updatedAt ? new Date(config.updatedAt) : null;
  const date = updated && updated > TEMPLATE_DATE ? updated : TEMPLATE_DATE;
  const updatedLabel = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Porto-Novo" });
  return { ...config, updatedLabel };
}

export const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
