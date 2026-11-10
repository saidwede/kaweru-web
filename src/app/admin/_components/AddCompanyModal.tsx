"use client";

import type { FormEvent } from "react";
import { Building2, UserCheck, Wallet } from "lucide-react";
import type { StateSetter } from "./types";

interface AddCompanyModalProps {
  setShowAddModal: StateSetter<boolean>;
  handleCreateCompany: (e: FormEvent) => Promise<void>;
  creating: boolean;
  companyName: string;
  setCompanyName: StateSetter<string>;
  companyCode: string;
  setCompanyCode: StateSetter<string>;
  momoOperator: string;
  setMomoOperator: StateSetter<string>;
  momoNumber: string;
  setMomoNumber: StateSetter<string>;
  momoHolder: string;
  setMomoHolder: StateSetter<string>;
  adminFullName: string;
  setAdminFullName: StateSetter<string>;
  adminPhone: string;
  setAdminPhone: StateSetter<string>;
  adminEmail: string;
  setAdminEmail: StateSetter<string>;
}

export default function AddCompanyModal({
  setShowAddModal,
  handleCreateCompany,
  creating,
  companyName,
  setCompanyName,
  companyCode,
  setCompanyCode,
  momoOperator,
  setMomoOperator,
  momoNumber,
  setMomoNumber,
  momoHolder,
  setMomoHolder,
  adminFullName,
  setAdminFullName,
  adminPhone,
  setAdminPhone,
  adminEmail,
  setAdminEmail,
}: AddCompanyModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Conventionner une Compagnie</h3>
              <p className="text-xs text-slate-500 font-medium">Ouverture de dossier et compte Responsable</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la compagnie</label>
              <input
                type="text"
                placeholder="Ex: Confort Lines"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#FF6500] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Code court (3 à 5 lettres)</label>
              <input
                type="text"
                placeholder="Ex: CFL"
                maxLength={5}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#FF6500] focus:outline-none focus:bg-white focus:border-[#FF6500] uppercase transition"
              />
            </div>
          </div>

          {/* Coordonnées MoMo */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-[#FF6500]" />
              Reversement Mobile Money
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Opérateur</label>
                <select
                  value={momoOperator}
                  onChange={(e) => setMomoOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6500]"
                >
                  <option value="MTN">MTN MoMo</option>
                  <option value="MOOV">Moov Africa</option>
                  <option value="CELTIS">Celtis Cash</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Numéro Mobile Money</label>
                <input
                  type="tel"
                  placeholder="01 97 00 00 00"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6500]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Nom du titulaire officiel</label>
              <input
                type="text"
                placeholder="Ex: Confort Lines SARL"
                value={momoHolder}
                onChange={(e) => setMomoHolder(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6500]"
              />
            </div>
          </div>

          {/* Responsable de Compagnie */}
          <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 space-y-3">
            <p className="text-[11px] font-black text-[#FF6500] uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              Responsable de Compagnie (COMPANY_ADMIN)
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom complet</label>
              <input
                type="text"
                placeholder="Ex: M. Jean ADANHOUN"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6500]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Téléphone</label>
                <input
                  type="tel"
                  placeholder="01 61 00 00 00"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6500]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="direction@confortlines.bj"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6500]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {creating ? "Conventionnement..." : "Valider et Conventionner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
