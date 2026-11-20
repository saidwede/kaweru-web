import Link from "next/link";
import { ArrowLeft, Bus } from "lucide-react";
import { LEGAL_DOCS } from "@/lib/legal";

interface LegalPageProps {
  title: string;
  /** Résumé en quelques points, affiché en tête : ce que la plupart des gens liront. */
  essentials: string[];
  currentHref: string;
  /** Date de dernière mise à jour (modèle ou paramètres réglés par le Super Admin). */
  updatedLabel: string;
  children: React.ReactNode;
}

/** Gabarit commun des documents légaux : lisible sur téléphone, résumé en tête, navigation entre documents. */
export default function LegalPage({ title, essentials, currentHref, updatedLabel, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#FF6500] text-white flex items-center justify-center">
              <Bus className="h-4 w-4" />
            </span>
            <span className="font-black text-slate-900 tracking-tight">KAWERU</span>
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Documents légaux">
          {LEGAL_DOCS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                d.href === currentHref ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {d.label}
            </Link>
          ))}
        </nav>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-2">Dernière mise à jour : {updatedLabel}</p>

        <section className="mt-6 p-5 rounded-3xl bg-orange-50 border border-orange-100">
          <h2 className="text-sm font-black text-slate-900 mb-2">L&apos;essentiel</h2>
          <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
            {essentials.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>

        <article className="legal-text mt-8 space-y-8 text-sm leading-relaxed text-slate-700">{children}</article>
      </main>
    </div>
  );
}

/** Un article numéroté du document. */
export function Clause({ n, title, children }: { n: number | string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-black text-slate-900">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

/** Valeur légale à renseigner par le Super Admin (Console > Paramètres légaux). */
export function Fill({ value, label }: { value: string; label: string }) {
  if (value) return <>{value}</>;
  return <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">[à compléter : {label}]</span>;
}
