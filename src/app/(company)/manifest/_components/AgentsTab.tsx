"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  UserPlus,
} from "lucide-react";
import type { AgentItem } from "./types";

interface AgentsTabProps {
  setShowAddAgentModal: Dispatch<SetStateAction<boolean>>;
  agents: AgentItem[];
}

export default function AgentsTab({
  setShowAddAgentModal,
  agents,
}: AgentsTabProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Personnel de Gare & Flotte</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gestion des comptes des chefs de gare, guichetiers et convoyeurs de votre compagnie.
          </p>
        </div>

        <button
          onClick={() => setShowAddAgentModal(true)}
          className="inline-flex items-center gap-2 bg-[#FF6500] hover:bg-[#e55a00] text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-sm cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent._id}
            className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-xs">{agent.fullName}</p>
              <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-50 text-[#FF6500]">
                {agent.role}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">{agent.phone || agent.email}</p>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                agent.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {agent.isActive ? "Actif" : "Bloqué"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
