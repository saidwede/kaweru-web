import Link from "next/link";
import {
  Bus,
  Clock,
  Building,
  PhoneCall,
} from "lucide-react";
import type { CurrentUser } from "./types";

interface SiteFooterProps {
  currentUser: CurrentUser | null;
}

export default function SiteFooter({ currentUser }: SiteFooterProps) {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/80 py-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne 1 : À propos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#FF6500] text-white flex items-center justify-center font-black">
                <Bus className="h-4 w-4" />
              </div>
              <span className="font-black text-slate-900 tracking-tight text-lg">
                KAWERU BÉNIN
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Plateforme interurbaine de billetterie et de gestion de gares routières en République du Bénin. Embarquement par QR code hors-ligne et conciliation directe Mobile Money.
            </p>
          </div>

          {/* Colonne 2 : Liens rapides */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Navigation Rapide
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#departs" className="hover:text-[#FF6500] transition">
                  Consulter les départs du jour
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#FF6500] transition">
                  Comment ça marche
                </a>
              </li>
              <li>
                <Link
                  href={currentUser ? "/profile" : "/login"}
                  className="hover:text-[#FF6500] transition"
                >
                  {currentUser ? "Mon Profil & Parrainage" : "Se connecter / Créer un compte"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Contact & Support Kaweru */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Contact & Assistance
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-[#FF6500] shrink-0" />
                <a
                  href="tel:+2290197000000"
                  className="font-bold text-slate-800 hover:text-[#FF6500] transition"
                >
                  +229 01 97 00 00 00 (Appel & WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-[#FF6500] shrink-0" />
                <span>Cotonou, République du Bénin</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#FF6500] shrink-0" />
                <span>Assistance client : 7j/7 de 06h00 à 22h00</span>
              </li>
              <li className="pt-1">
                <a
                  href="mailto:contact@kaweru.bj"
                  className="inline-flex items-center gap-1.5 font-extrabold text-[#FF6500] hover:underline"
                >
                  contact@kaweru.bj
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Kaweru Bénin. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <a href="mailto:contact@kaweru.bj" className="hover:text-slate-700 transition">
              Service client
            </a>
            <Link
              href={currentUser ? "/profile" : "/login"}
              className="hover:text-slate-700 transition"
            >
              {currentUser ? "Mon compte" : "Connexion"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
