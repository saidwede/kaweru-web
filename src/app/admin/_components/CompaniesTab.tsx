"use client";

import Link from "next/link";
import { PlusCircle, Phone, UserCheck, Search, Wallet, ChevronRight } from "lucide-react";
import type { CompanyItem, CompanyStatusFilter, StateSetter } from "./types";

interface CompaniesTabProps {
  companies: CompanyItem[];
  filteredCompanies: CompanyItem[];
  companyStatusFilter: CompanyStatusFilter;
  setCompanyStatusFilter: StateSetter<CompanyStatusFilter>;
  searchQuery: string;
  setSearchQuery: StateSetter<string>;
  setShowAddModal: StateSetter<boolean>;
}

export default function CompaniesTab({
  companies,
  filteredCompanies,
  companyStatusFilter,
  setCompanyStatusFilter,
  searchQuery,
  setSearchQuery,
  setShowAddModal,
}: CompaniesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Compagnies Conventionnées</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gestion des conventions, coordonnées Mobile Money de reversement et comptes Responsable.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-sm cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          Conventionner une Compagnie
        </button>
      </div>

      {/* BARRE DE FILTRE COMPAGNIES (STATUT & RECHERCHE) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Statut :</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setCompanyStatusFilter("ALL")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                companyStatusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Toutes ({companies.length})
            </button>
            <button
              onClick={() => setCompanyStatusFilter("ACTIVE")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                companyStatusFilter === "ACTIVE" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Actives ({companies.filter((c) => c.isActive).length})
            </button>
            <button
              onClick={() => setCompanyStatusFilter("INACTIVE")}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                companyStatusFilter === "INACTIVE" ? "bg-white text-slate-800 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Inactives ({companies.filter((c) => !c.isActive).length})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Nom, code, responsable, tél..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF6500]"
          />
        </div>
      </div>

      {/* Grille des compagnies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((c) => (
          <div
            key={c._id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#FF6500] font-black text-sm flex items-center justify-center">
                    {c.code || c.name.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#FF6500] transition-colors leading-tight">
                      {c.name}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-slate-400">ID: {c.code}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    c.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                  />
                  {c.isActive ? "Conventionnée" : "Suspendue"}
                </span>
              </div>

              {/* Coordonnées MoMo */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-slate-500" />
                    Reversement MoMo
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-800">
                    {c.settlementMomo?.operator || "MTN"}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-800">
                  {c.settlementMomo?.number || "Non configuré"}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Titulaire : {c.settlementMomo?.holderName || "N/A"}
                </p>
              </div>

              {/* Responsable désigné */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-[#FF6500]" />
                  Responsable Exploitation (Admin)
                </p>
                {c.adminUser ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">{c.adminUser.fullName}</p>
                    {c.adminUser.phone && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {c.adminUser.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700/80 italic">Aucun compte rattaché</p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/manifest?companyId=${c._id}`}
                className="inline-flex items-center gap-1 text-xs font-black text-[#FF6500] hover:text-[#e55a00] transition"
              >
                <span>Gérer ses départs & agents</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
