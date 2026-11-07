"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bus,
  ArrowLeft,
  MoreVertical,
  Star,
  Wind,
  Zap,
  Luggage,
  ArrowRight,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Ticket,
  Smartphone,
  QrCode,
  Building,
  PhoneCall,
  Check
} from "lucide-react";

export default function Home() {
  const [origin, setOrigin] = useState("Cotonou");
  const [destination, setDestination] = useState("Parakou");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#FF6500] selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FFB800] to-[#F06548] flex items-center justify-center text-white shadow-md shadow-[#FFB800]/30">
                <Bus className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                KAWERU
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#FF6500] border border-orange-200 px-2 py-0.5 rounded-full">
                  Bénin 🇧🇯
                </span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#departs" className="hover:text-[#FF6500] transition">Départs du jour</a>
            <a href="#experience" className="hover:text-[#FF6500] transition">Comment ça marche</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-[#FF6500] hover:text-[#FF6500] shadow-sm transition"
            >
              <User className="h-3.5 w-3.5 text-[#FF6500]" />
              Connexion
            </Link>

            <Link
              href="#search-card"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#EA580C] text-white shadow-md shadow-[#FF6500]/25 transition"
            >
              <Ticket className="h-3.5 w-3.5" />
              Réserver
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION : SEARCH & THE SIGNATURE MOCKUP CARD */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* LEFT: Presentation & Search Form (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Voyagez à travers le Bénin avec un confort absolu.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Visualisez votre bus, choisissez votre siège en temps réel et payez par Mobile Money (MTN MoMo & Moov). Zéro déplacement inutile en gare, zéro surbooking.
              </p>

              {/* Interactive Search Card */}
              <div id="search-card" className="bg-[#F8FAFC] rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#FF6500]" /> Ville de départ
                    </label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]/20 focus:border-[#FF6500] transition"
                    >
                      <option value="Cotonou">Cotonou (Étoile Rouge)</option>
                      <option value="Bohicon">Bohicon (Carrefour Zakpo)</option>
                      <option value="Dassa-Zoumè">Dassa-Zoumè (Centre)</option>
                      <option value="Parakou">Parakou (Gare Arafat)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#FF6500]" /> Destination
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]/20 focus:border-[#FF6500] transition"
                    >
                      <option value="Parakou">Parakou (Gare Arafat)</option>
                      <option value="Dassa-Zoumè">Dassa-Zoumè</option>
                      <option value="Bohicon">Bohicon</option>
                      <option value="Cotonou">Cotonou</option>
                      <option value="Natitingou">Natitingou</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>4 départs disponibles aujourd&apos;hui sur cette ligne</span>
                  </div>

                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-lg shadow-[#FF6500]/25"
                  >
                    Rechercher un départ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* 3 Quick Badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-sm">
                  <Clock className="h-5 w-5 text-[#FF6500] mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-800">Verrouillage 7 min</p>
                  <p className="text-[10px] text-slate-400">Siège réservé à l&apos;achat</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-sm">
                  <Smartphone className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-800">Mobile Money</p>
                  <p className="text-[10px] text-slate-400">MTN MoMo, Moov, Celtis</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-sm">
                  <QrCode className="h-5 w-5 text-sky-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-800">QR Code Hors-ligne</p>
                  <p className="text-[10px] text-slate-400">Embarquement sans signal</p>
                </div>
              </div>
            </div>

            {/* RIGHT: THE EXACT CARD PATTERN FROM YOUR SCREENSHOT (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[360px] bg-white rounded-[40px] shadow-2xl shadow-slate-300/60 border-[8px] border-slate-900 overflow-hidden flex flex-col justify-between">
                
                {/* Phone Status Bar (9:41) */}
                <div className="px-6 pt-3 pb-1 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">📶</span>
                    <span className="text-[11px]">􀙇</span>
                    <div className="w-5 h-2.5 rounded-sm border border-slate-800 p-0.5 flex items-center">
                      <div className="w-full h-full bg-slate-900 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* Top in-card bar with Back Arrow and 3 Dots Menu */}
                <div className="px-5 py-2 flex items-center justify-between">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {/* Hero Visual on subtle plate (from reference screenshot) */}
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

                {/* Title, Subtitle, Star rating & Big Price on the right */}
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

                  {/* 4 Services Inclus (Identical grid of 4 rounded square cards) */}
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

                {/* Bottom Action Bar (Orange Primary + Peach Secondary) */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                  <Link
                    href="/manifest"
                    className="flex-1 bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3.5 px-4 rounded-2xl text-center text-sm transition shadow-lg shadow-[#FF6500]/25"
                  >
                    Réserver ma place
                  </Link>

                  <Link
                    href="/manifest"
                    title="Voir le plan de sièges"
                    className="h-12 w-12 rounded-2xl bg-[#FFF4ED] hover:bg-[#FFE8DA] flex items-center justify-center text-[#FF6500] transition shadow-sm shrink-0"
                  >
                    <Ticket className="h-5 w-5" />
                  </Link>
                </div>

                {/* iPhone gesture bar */}
                <div className="pb-2 pt-1 flex justify-center">
                  <div className="w-32 h-1 bg-slate-900 rounded-full" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SECTION NOUVELLE : L'EXPÉRIENCE EN ACTION AVEC LA NOUVELLE IMAGE CRÉÉE */}
      <section id="experience" className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Image de la personne qui réserve depuis son smartphone */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/kaweru_hero_passenger.jpg"
                  alt="Voyageur béninois réservant son bus sur Kaweru"
                  className="w-full h-auto object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center gap-3 max-w-sm">
                    <div className="h-10 w-10 rounded-xl bg-[#FF6500] text-white flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Billet validé en 90 secondes</p>
                      <p className="text-[11px] text-slate-500">Paiement MTN MoMo reçu • Siège N° 14 garanti</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Texte Explicatif 3 étapes simples */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-xs font-bold text-[#FF6500]">
                Simplicité & Rapidité
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                Réservez votre place de bus sans faire la queue au guichet.
              </h2>

              <p className="text-base text-slate-600 leading-relaxed">
                Plus besoin de vous lever à l&apos;aube pour espérer avoir une place. Depuis chez vous ou votre bureau à Cotonou, Bohicon ou Parakou, verrouillez votre siège en toute tranquillité.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6500] flex items-center justify-center font-black text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Choisissez votre départ</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Accédez aux départs réels de Confort Lines, Pax Express et de nos partenaires.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6500] flex items-center justify-center font-black text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Verrouillage de votre siège</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Votre place est réservée de manière atomique pendant 7 minutes pendant le paiement.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6500] flex items-center justify-center font-black text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Embarquez avec votre QR Code</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Présentez votre billet sur votre téléphone même en zone blanche sans internet.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SECTION DES CARTES DE DÉPARTS AU PATTERN DU SCREENSHOT */}
      <section id="departs" className="py-16 sm:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FF6500]">Lignes en vedette</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Les départs les plus demandés
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Chaque voyage applique la grille de confort, le tarif par tronçon et la garantie zéro surbooking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* CARTE 1 : Cotonou -> Parakou VIP */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col justify-between hover:border-[#FF6500] transition">
              <div>
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80"
                    alt="Bus Confort Lines"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#FF6500] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    VIP Climatisé
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Cotonou ➔ Parakou</h3>
                    <p className="text-xs font-semibold text-slate-500">Confort Lines • Départ 07:00</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700">4.8</span>
                      <span className="text-[10px] text-slate-400">(142 avis)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">8 000 F</span>
                    <p className="text-[10px] font-bold text-emerald-600">5 places dispo</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Départ direct de la Gare Étoile Rouge. Escales express à Bohicon et Dassa. Arrivée 14:30.
                </p>

                {/* 4 Cards de commodités */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Wind className="h-4 w-4 text-sky-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">Clim</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Zap className="h-4 w-4 text-amber-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">USB</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Luggage className="h-4 w-4 text-emerald-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">25kg</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Clock className="h-4 w-4 text-[#FF6500] mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">Direct</span>
                  </div>
                </div>
              </div>

              <Link
                href="/manifest"
                className="w-full bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3 px-4 rounded-2xl text-center text-xs transition shadow-md shadow-[#FF6500]/20 flex items-center justify-center gap-2"
              >
                Réserver ce trajet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* CARTE 2 : Cotonou -> Bohicon Direct */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col justify-between hover:border-[#FF6500] transition">
              <div>
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80"
                    alt="Bus Pax Express"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    Navette Express
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Cotonou ➔ Bohicon</h3>
                    <p className="text-xs font-semibold text-slate-500">Pax Express • Départ 09:30</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700">4.7</span>
                      <span className="text-[10px] text-slate-400">(98 avis)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">3 500 F</span>
                    <p className="text-[10px] font-bold text-emerald-600">8 places dispo</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Départ direct de la Gare Jonquet. Trajet rapide sans arrêt intermédiaire. Arrivée à 11h45.
                </p>

                {/* 4 Cards de commodités */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Wind className="h-4 w-4 text-sky-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">Clim</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Zap className="h-4 w-4 text-amber-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">USB</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Luggage className="h-4 w-4 text-emerald-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">20kg</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Clock className="h-4 w-4 text-[#FF6500] mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">Direct</span>
                  </div>
                </div>
              </div>

              <Link
                href="/manifest"
                className="w-full bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3 px-4 rounded-2xl text-center text-xs transition shadow-md shadow-[#FF6500]/20 flex items-center justify-center gap-2"
              >
                Réserver ce trajet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* CARTE 3 : Cotonou -> Dassa-Zoumè */}
            <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col justify-between hover:border-[#FF6500] transition">
              <div>
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80"
                    alt="Bus Confort Lines Après-midi"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    Départ 13:30
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Cotonou ➔ Dassa-Zoumè</h3>
                    <p className="text-xs font-semibold text-slate-500">Confort Lines • Après-midi</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700">4.9</span>
                      <span className="text-[10px] text-slate-400">(67 avis)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">5 000 F</span>
                    <p className="text-[10px] font-bold text-emerald-600">6 places dispo</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Voyage confortable de début d&apos;après-midi. Climatisation continue, arrivée Gare Centrale Dassa à 17h00.
                </p>

                {/* 4 Cards de commodités */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Wind className="h-4 w-4 text-sky-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">Clim</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Zap className="h-4 w-4 text-amber-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">USB</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Luggage className="h-4 w-4 text-emerald-500 mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">25kg</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <Clock className="h-4 w-4 text-[#FF6500] mx-auto" />
                    <span className="text-[9px] font-bold text-slate-600 mt-1 block">Direct</span>
                  </div>
                </div>
              </div>

              <Link
                href="/manifest"
                className="w-full bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold py-3 px-4 rounded-2xl text-center text-xs transition shadow-md shadow-[#FF6500]/20 flex items-center justify-center gap-2"
              >
                Réserver ce trajet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SECTION PARTENAIRES COMPAGNIES */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                Devenir Partenaire
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 mb-4">
                Vous êtes une compagnie de transport interurbain ?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Rejoignez le réseau Kaweru pour proposer vos lignes aux voyageurs en ligne, simplifier la réservation de vos passagers et développer votre activité à travers tout le Bénin.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:partenaires@kaweru.bj"
                  className="bg-[#FF6500] hover:bg-[#EA580C] text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-lg shadow-[#FF6500]/25 flex items-center gap-2"
                >
                  Contacter l&apos;équipe Kaweru
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Compagnies partenaires au Bénin</h3>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Confort Lines Bénin</h4>
                  <p className="text-xs text-slate-400">Gare Étoile Rouge • Cotonou ⇄ Parakou</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                  Disponible
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Pax Express</h4>
                  <p className="text-xs text-slate-400">Gare Jonquet • Cotonou ⇄ Bohicon ⇄ Parakou</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                  Disponible
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER AVEC INFORMATIONS DE CONTACT DE KAWERU */}
      <footer className="border-t border-slate-200 bg-white pt-14 pb-10 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-100">
            {/* Colonne 1 : Marque */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#F06548] flex items-center justify-center text-white text-xs font-black shadow-sm">
                  <Bus className="h-4 w-4" />
                </div>
                <span className="text-base font-black text-slate-900 tracking-tight">KAWERU</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Plateforme de réservation de billets de bus interurbains au Bénin. Réservez votre place simplement et voyagez en toute sérénité.
              </p>
            </div>

            {/* Colonne 2 : Navigation */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li>
                  <a href="#departs" className="hover:text-[#FF6500] transition">
                    Départs disponibles
                  </a>
                </li>
                <li>
                  <a href="#experience" className="hover:text-[#FF6500] transition">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#FF6500] transition">
                    Se connecter / Créer un compte
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Contact Kaweru */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Contact & Assistance
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-[#FF6500] shrink-0" />
                  <a href="tel:+2290197000000" className="font-bold text-slate-800 hover:text-[#FF6500] transition">
                    +229 01 97 00 00 00 (Appel & WhatsApp)
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-[#FF6500] shrink-0" />
                  <span>Cotonou, République du Bénin</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#FF6500] shrink-0" />
                  <span>Assistance client : 7j/7 de 06h00 à 22h00</span>
                </li>
                <li className="pt-1">
                  <a
                    href="mailto:contact@kaweru.bj"
                    className="inline-flex items-center gap-1.5 font-extrabold text-[#FF6500] hover:underline"
                  >
                    contact@kaweru.bj
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} Kaweru Bénin. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <a href="mailto:contact@kaweru.bj" className="hover:text-slate-700 transition">Service client</a>
              <Link href="/login" className="hover:text-slate-700 transition">Mon compte</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
