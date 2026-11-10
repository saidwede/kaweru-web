"use client";

import {
  ArrowLeft,
  MoreVertical,
  Star,
  Wind,
  Zap,
  Luggage,
  Clock,
  Ticket,
} from "lucide-react";
import type { TripItem } from "./types";

interface PhoneMockupProps {
  trips: TripItem[];
  handleOpenBooking: (trip: TripItem) => void;
}

export default function PhoneMockup({ trips, handleOpenBooking }: PhoneMockupProps) {
  return (
    <div className="lg:col-span-5 flex justify-center">
      <div className="w-full max-w-[360px] bg-white rounded-[40px] shadow-2xl shadow-slate-300/60 border-[8px] border-slate-900 overflow-hidden flex flex-col justify-between">
        {/* Phone Status Bar (9:41) */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between text-xs font-bold text-slate-900">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">📶</span>
            <span className="text-[11px]">4G</span>
            <div className="w-5 h-2.5 rounded-sm border border-slate-800 p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-900 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Top in-card bar */}
        <div className="px-5 py-2 flex items-center justify-between">
          <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-800">
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>

        {/* Hero Visual on subtle plate */}
        <div className="px-6 py-2 flex items-center justify-center">
          <div className="relative w-56 h-44 rounded-full bg-gradient-to-b from-slate-50 to-orange-50/40 p-3 flex items-center justify-center shadow-inner">
            <div className="relative w-48 h-36 rounded-3xl overflow-hidden bg-slate-900 shadow-lg flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80"
                alt="Bus VIP Confort Lines"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-[10px] font-bold text-white bg-[#FF6500] px-2 py-0.5 rounded-full">
                  Confort Lines #12
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Title, Subtitle, Star rating & Big Price */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                Cotonou ➔ Parakou
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Confort Lines • Bus VIP Climatisé
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-slate-700">4.8</span>
                <span className="text-[10px] text-slate-400">(142 avis)</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                8 000 <span className="text-xs font-bold text-slate-500">FCFA</span>
              </span>
              <p className="text-[10px] text-emerald-600 font-bold">5 places restantes</p>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Description</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Départ direct à 07h00 depuis la Gare Étoile Rouge. Arrêts express à Bohicon et Dassa. Arrivée prévue à 14h30 à Parakou.
            </p>
          </div>

          {/* Services Inclus */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-900 mb-2.5">Services à bord</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm">
                  <Wind className="h-5 w-5 text-sky-500" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1.5">Climatisé</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1.5">Prise USB</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm">
                  <Luggage className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1.5">Bagages</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm">
                  <Clock className="h-5 w-5 text-[#FF6500]" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 mt-1.5">Direct</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (trips.length > 0) {
                handleOpenBooking(trips[0]);
              } else {
                document.getElementById("search-card")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="flex-1 bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3.5 px-4 rounded-2xl text-center text-sm transition shadow-lg shadow-[#FF6500]/25 cursor-pointer"
          >
            Réserver ma place
          </button>

          <a
            href="#departs"
            title="Voir les départs"
            className="h-12 w-12 rounded-2xl bg-[#FFF4ED] hover:bg-[#FFE8DA] flex items-center justify-center text-[#FF6500] transition shadow-sm shrink-0"
          >
            <Ticket className="h-5 w-5" />
          </a>
        </div>

        {/* iPhone gesture bar */}
        <div className="pb-2 pt-1 flex justify-center">
          <div className="w-32 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}
