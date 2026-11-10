"use client";

import Link from "next/link";
import { Bus, Building2, LogOut, ShieldCheck, Wallet, LayoutDashboard, ArrowUpRight, Ticket, Gift, Compass } from "lucide-react";
import type { CompanyItem, StateSetter, TabType } from "./types";

interface AdminSidebarProps {
  activeTab: TabType;
  setActiveTab: StateSetter<TabType>;
  companies: CompanyItem[];
  handleLogout: () => Promise<void>;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  companies,
  handleLogout,
}: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 hidden lg:flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40 shadow-xs">
      <div>
        {/* Logo Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#FF6500] to-amber-500 text-white flex items-center justify-center font-black shadow-sm shadow-[#FF6500]/30">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-base tracking-tight">KAWERU</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">Direction Générale Bénin</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3.5 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Pilotage Central
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("OVERVIEW")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "OVERVIEW"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Vue d&apos;ensemble</span>
              </button>

              <button
                onClick={() => setActiveTab("COMPANIES")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "COMPANIES"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4" />
                  <span>Compagnies</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                    activeTab === "COMPANIES" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {companies.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("OPERATIONS")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "OPERATIONS"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>Départs & Lignes</span>
              </button>
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Finance & Gouvernance
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("FINANCES")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "FINANCES"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span>Reversements MoMo</span>
              </button>

              <button
                onClick={() => setActiveTab("RBAC")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "RBAC"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Équipes & Rôles</span>
              </button>

              <button
                onClick={() => setActiveTab("REFERRAL")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "REFERRAL"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Gift className="h-4 w-4" />
                <span>Moteur de Parrainage</span>
              </button>
            </div>
          </div>

          {/* Accès rapide direct Exploitation */}
          <div className="pt-2">
            <Link
              href="/manifest"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition group"
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="h-4 w-4 text-[#FF6500]" />
                <span className="text-xs font-bold text-slate-700">Espace Gares</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900 transition" />
            </Link>
          </div>
        </nav>
      </div>

      {/* Super Admin User Footer */}
      <div className="p-3.5 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
              DG
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Super Admin</p>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connecté
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
