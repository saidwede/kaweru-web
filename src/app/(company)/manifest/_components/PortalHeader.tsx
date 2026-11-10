"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  Bus,
  RefreshCw,
  Search,
  Building2,
  PlusCircle,
} from "lucide-react";
import type { CompanyItem, TabType, UserProfile, ValidateTicketFn } from "./types";

interface PortalHeaderProps {
  validateQuery: string;
  setValidateQuery: Dispatch<SetStateAction<string>>;
  handleValidateTicket: ValidateTicketFn;
  userProfile: UserProfile | null;
  companies: CompanyItem[];
  selectedCompanyId: string;
  handleCompanyChange: (compId: string) => void;
  setShowAddTripModal: Dispatch<SetStateAction<boolean>>;
  fetchTrips: (compFilter?: string) => Promise<void>;
  fetchAgents: (compFilter?: string) => Promise<void>;
  fetchBookings: (compFilter?: string, q?: string) => Promise<void>;
  loading: boolean;
  activeTab: TabType;
  setActiveTab: Dispatch<SetStateAction<TabType>>;
  stopCameraScanner: () => Promise<void>;
}

export default function PortalHeader({
  validateQuery,
  setValidateQuery,
  handleValidateTicket,
  userProfile,
  companies,
  selectedCompanyId,
  handleCompanyChange,
  setShowAddTripModal,
  fetchTrips,
  fetchAgents,
  fetchBookings,
  loading,
  activeTab,
  setActiveTab,
  stopCameraScanner,
}: PortalHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3.5 shadow-xs flex items-center justify-between gap-4">
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
              placeholder="Rechercher un billet, un bus, une destination, un passager..."
              value={validateQuery}
              onChange={(e) => setValidateQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleValidateTicket(validateQuery, "VERIFY");
              }}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-100/80 border border-transparent focus:border-slate-300 focus:bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Si SUPER_ADMIN : Sélecteur de Compagnie transversal */}
          {userProfile?.role === "SUPER_ADMIN" && companies.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Building2 className="h-4 w-4 text-slate-500" />
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">Toutes les Compagnies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bouton d'action Rapide : Programmer un Départ */}
          {(userProfile?.role === "COMPANY_ADMIN" || userProfile?.role === "SUPER_ADMIN") && (
            <button
              onClick={() => setShowAddTripModal(true)}
              className="inline-flex items-center gap-2 bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-4 py-2 rounded-2xl text-xs transition shadow-sm cursor-pointer shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Programmer</span> Départ
            </button>
          )}

          <button
            onClick={() => {
              fetchTrips(selectedCompanyId);
              fetchAgents(selectedCompanyId);
              fetchBookings(selectedCompanyId);
            }}
            disabled={loading}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Actualiser les données"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#FF6500]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs Mobile (Visible uniquement sur mobile / tablette) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-slate-200/80 no-scrollbar">
        {(
          [
            ["VALIDATOR", "Pointage"],
            ["TRIPS", "Départs"],
            ["TICKETS", "Billets"],
            ["AGENTS", "Personnel"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              stopCameraScanner();
            }}
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
