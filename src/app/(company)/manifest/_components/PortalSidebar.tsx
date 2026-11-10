"use client";

import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  Bus,
  Users,
  LogOut,
  ShieldCheck,
  Ticket,
  QrCode,
  Compass,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import type { AgentItem, BookingItem, TabType, TripSummary, UserProfile } from "./types";

interface PortalSidebarProps {
  userProfile: UserProfile | null;
  activeTab: TabType;
  setActiveTab: Dispatch<SetStateAction<TabType>>;
  stopCameraScanner: () => Promise<void>;
  trips: TripSummary[];
  bookings: BookingItem[];
  agents: AgentItem[];
  setShowAddTripModal: Dispatch<SetStateAction<boolean>>;
  handleLogout: () => Promise<void>;
}

export default function PortalSidebar({
  userProfile,
  activeTab,
  setActiveTab,
  stopCameraScanner,
  trips,
  bookings,
  agents,
  setShowAddTripModal,
  handleLogout,
}: PortalSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 hidden lg:flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40 shadow-xs">
      <div>
        {/* Logo Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <Link
            href="/"
            className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#FF6500] to-amber-500 text-white flex items-center justify-center font-black shadow-sm shadow-[#FF6500]/30 hover:scale-105 transition-transform"
          >
            <Bus className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-base tracking-tight">KAWERU</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF6500] px-1.5 py-0.5 rounded-md">
                GARES
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold truncate max-w-[140px]">
              {userProfile?.role === "SUPER_ADMIN"
                ? "Régie Nationale"
                : userProfile?.role === "COMPANY_ADMIN"
                ? "Directeur Compagnie"
                : userProfile?.role === "STATION_MANAGER"
                ? "Chef de Gare"
                : "Exploitation Quai"}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3.5 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Contrôle & Quai
            </p>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab("VALIDATOR");
                  stopCameraScanner();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "VALIDATOR"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>Pointage & Scanner</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("TRIPS");
                  stopCameraScanner();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "TRIPS"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4" />
                  <span>Départs & Fiches</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                    activeTab === "TRIPS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {trips.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("TICKETS");
                  stopCameraScanner();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "TICKETS"
                    ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ticket className="h-4 w-4" />
                  <span>Registre Billets</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                    activeTab === "TICKETS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {bookings.length}
                </span>
              </button>
            </div>
          </div>

          {/* Gestion & Équipes (pour Company Admin et Super Admin) */}
          {(userProfile?.role === "COMPANY_ADMIN" || userProfile?.role === "SUPER_ADMIN") && (
            <div>
              <p className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                Équipe & Flotte
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("AGENTS");
                    stopCameraScanner();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === "AGENTS"
                      ? "bg-[#FF6500] text-white shadow-sm shadow-[#FF6500]/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4" />
                    <span>Personnel de Gare</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                      activeTab === "AGENTS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {agents.length}
                  </span>
                </button>

                <button
                  onClick={() => setShowAddTripModal(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#FF6500] hover:bg-orange-50 transition-all text-left cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Nouveau Départ Bus</span>
                </button>
              </div>
            </div>
          )}

          {/* Raccourcis Système */}
          <div className="pt-2 space-y-2">
            {userProfile?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-900">Console Super Admin</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )}

            <Link
              href="/"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition group"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">Portail Voyageurs</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900 transition" />
            </Link>
          </div>
        </nav>
      </div>

      {/* User Profile Pill Footer */}
      <div className="p-3.5 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
              {userProfile?.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : "OP"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 leading-tight truncate">
                {userProfile?.fullName || "Agent de Gare"}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                En service
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
