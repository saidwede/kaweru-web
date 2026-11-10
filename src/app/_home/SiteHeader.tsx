"use client";

import Link from "next/link";
import {
  Bus,
  User,
  Ticket,
  Building,
  LogOut,
} from "lucide-react";
import type { CurrentUser } from "./types";

interface SiteHeaderProps {
  authChecked: boolean;
  currentUser: CurrentUser | null;
  handleLogout: () => void;
}

export default function SiteHeader({
  authChecked,
  currentUser,
  handleLogout,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FFB800] to-[#F06548] flex items-center justify-center text-white shadow-md shadow-[#FFB800]/30">
              <Bus className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              KAWERU
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#FF6500] border border-orange-200 px-2 py-0.5 rounded-full">
                Bénin 🇧🇯
              </span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          <a href="#departs" className="hover:text-[#FF6500] transition">
            Départs du jour
          </a>
          <a href="#experience" className="hover:text-[#FF6500] transition">
            Comment ça marche
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {authChecked && currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.role === "SUPER_ADMIN" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-2xl bg-slate-900 text-[#FFB800] hover:bg-slate-800 transition shadow-sm"
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Console Admin</span>
                </Link>
              )}
              {(currentUser.role === "COMPANY_ADMIN" || currentUser.role === "STATION_MANAGER") && (
                <Link
                  href="/manifest"
                  className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-2xl bg-slate-900 text-[#FF6500] hover:bg-slate-800 transition shadow-sm"
                >
                  <Bus className="h-3.5 w-3.5" />
                  <span>Espace Gare</span>
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6500] hover:bg-orange-100 transition shadow-sm"
              >
                <User className="h-3.5 w-3.5" />
                <span>
                  {currentUser.firstName
                    ? currentUser.firstName
                    : currentUser.email?.split("@")[0] || "Mon Profil"}
                </span>
                {typeof currentUser.referralPoints === "number" && (
                  <span className="text-[10px] font-black bg-[#FF6500] text-white px-1.5 py-0.5 rounded-full">
                    {currentUser.referralPoints} pts
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Se déconnecter"
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-[#FF6500] hover:text-[#FF6500] shadow-sm transition"
            >
              <User className="h-3.5 w-3.5 text-[#FF6500]" />
              Se connecter
            </Link>
          )}

          <a
            href="#search-card"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#EA580C] text-white shadow-md shadow-[#FF6500]/25 transition"
          >
            <Ticket className="h-3.5 w-3.5" />
            Réserver
          </a>
        </div>
      </div>
    </header>
  );
}
