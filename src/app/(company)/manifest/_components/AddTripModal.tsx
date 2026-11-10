"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  Bus,
} from "lucide-react";
import type { CompanyItem, UserProfile } from "./types";

interface AddTripModalProps {
  setShowAddTripModal: Dispatch<SetStateAction<boolean>>;
  handleCreateTrip: (e: FormEvent) => Promise<void>;
  userProfile: UserProfile | null;
  companies: CompanyItem[];
  selectedCompanyId: string;
  newTripCompanyId: string;
  setNewTripCompanyId: Dispatch<SetStateAction<string>>;
  newOrigin: string;
  setNewOrigin: Dispatch<SetStateAction<string>>;
  newDestination: string;
  setNewDestination: Dispatch<SetStateAction<string>>;
  newDate: string;
  setNewDate: Dispatch<SetStateAction<string>>;
  newTime: string;
  setNewTime: Dispatch<SetStateAction<string>>;
  newPrice: number;
  setNewPrice: Dispatch<SetStateAction<number>>;
  newPlate: string;
  setNewPlate: Dispatch<SetStateAction<string>>;
  creatingTrip: boolean;
}

export default function AddTripModal({
  setShowAddTripModal,
  handleCreateTrip,
  userProfile,
  companies,
  selectedCompanyId,
  newTripCompanyId,
  setNewTripCompanyId,
  newOrigin,
  setNewOrigin,
  newDestination,
  setNewDestination,
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  newPrice,
  setNewPrice,
  newPlate,
  setNewPlate,
  creatingTrip,
}: AddTripModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-bold">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Programmer un Nouveau Départ</h3>
              <p className="text-[11px] text-slate-500 font-medium">Ouverture des 50 sièges à la vente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTripModal(false)}
            className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateTrip} className="space-y-3.5">
          {userProfile?.role === "SUPER_ADMIN" && companies.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Compagnie de transport</label>
              <select
                value={newTripCompanyId || selectedCompanyId}
                onChange={(e) => setNewTripCompanyId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              >
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ville de Départ</label>
              <input
                type="text"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ville d&apos;Arrivée</label>
              <input
                type="text"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date de Départ</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Heure de Départ</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prix du Billet (FCFA)</label>
              <input
                type="number"
                min={1000}
                step={500}
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plaque d&apos;immatriculation</label>
              <input
                type="text"
                placeholder="Ex: AY-4521-RB"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF6500]"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddTripModal(false)}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creatingTrip}
              className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {creatingTrip ? "Création en cours..." : "Programmer le départ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
