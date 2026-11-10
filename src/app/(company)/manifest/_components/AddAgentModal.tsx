"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  UserPlus,
} from "lucide-react";

interface AddAgentModalProps {
  setShowAddAgentModal: Dispatch<SetStateAction<boolean>>;
  handleCreateAgent: (e: FormEvent) => Promise<void>;
  newAgentName: string;
  setNewAgentName: Dispatch<SetStateAction<string>>;
  newAgentRole: string;
  setNewAgentRole: Dispatch<SetStateAction<string>>;
  newAgentPhone: string;
  setNewAgentPhone: Dispatch<SetStateAction<string>>;
  newAgentEmail: string;
  setNewAgentEmail: Dispatch<SetStateAction<string>>;
  creatingAgent: boolean;
}

export default function AddAgentModal({
  setShowAddAgentModal,
  handleCreateAgent,
  newAgentName,
  setNewAgentName,
  newAgentRole,
  setNewAgentRole,
  newAgentPhone,
  setNewAgentPhone,
  newAgentEmail,
  setNewAgentEmail,
  creatingAgent,
}: AddAgentModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Ajouter un Membre d&apos;Équipe</h3>
              <p className="text-[11px] text-slate-500 font-medium">Chef de gare, guichetier, convoyeur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddAgentModal(false)}
            className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateAgent} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nom et Prénom</label>
            <input
              type="text"
              placeholder="Ex: Paul Bio"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rôle & Attribution</label>
            <select
              value={newAgentRole}
              onChange={(e) => setNewAgentRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
            >
              <option value="STATION_MANAGER">Chef de gare (Gestion quai & 50 sièges)</option>
              <option value="TICKET_AGENT">Guichetier (Vente directe au comptoir)</option>
              <option value="ONBOARD_CONDUCTOR">Convoyeur / Chef de bord (Pointage passagers)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de Téléphone</label>
            <input
              type="tel"
              placeholder="01 97 00 00 00"
              value={newAgentPhone}
              onChange={(e) => setNewAgentPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Adresse E-mail (optionnelle)</label>
            <input
              type="email"
              placeholder="agent@confortlines.bj"
              value={newAgentEmail}
              onChange={(e) => setNewAgentEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddAgentModal(false)}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creatingAgent}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {creatingAgent ? "Enregistrement..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
