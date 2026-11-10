"use client";

import Link from "next/link";
import { Bus, PlusCircle, RefreshCw, Search, Bell } from "lucide-react";
import type { AdminOverviewData, StateSetter, TabType } from "./types";

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: StateSetter<string>;
  showAlertsDrawer: boolean;
  setShowAlertsDrawer: StateSetter<boolean>;
  overview: AdminOverviewData | null;
  setShowAddModal: StateSetter<boolean>;
  loadData: () => Promise<void>;
  loading: boolean;
  activeTab: TabType;
  setActiveTab: StateSetter<TabType>;
}

export default function AdminHeader({
  searchQuery,
  setSearchQuery,
  showAlertsDrawer,
  setShowAlertsDrawer,
  overview,
  setShowAddModal,
  loadData,
  loading,
  activeTab,
  setActiveTab,
}: AdminHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Menu & Omnibar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Logo Mobile */}
          <Link
            href="/"
            className="lg:hidden h-9 w-9 rounded-xl bg-[#FF6500] text-white flex items-center justify-center font-black shrink-0"
          >
            <Bus className="h-4.5 w-4.5" />
          </Link>

          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une compagnie, un bus, une destination, un passager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Réseau Bénin Opérationnel
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
            className="relative p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Centre d'alertes"
          >
            <Bell className="h-4 w-4" />
            {overview?.alerts && overview.alerts.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF6500] ring-2 ring-white"></span>
            )}
          </button>

          {/* Action Conventionner */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-4 py-2 rounded-2xl text-xs transition shadow-sm cursor-pointer shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Conventionner</span> Compagnie
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Actualiser les données"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#FF6500]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs Mobile (Visible on small screens) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-slate-200/80 no-scrollbar">
        {(
          [
            ["OVERVIEW", "Vue d'ensemble"],
            ["COMPANIES", "Compagnies"],
            ["OPERATIONS", "Départs"],
            ["FINANCES", "Finances"],
            ["RBAC", "Rôles"],
            ["REFERRAL", "Parrainage"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === t ? "bg-[#FF6500] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
