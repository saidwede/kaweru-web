"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import type { BookingSuccessData, TripItem } from "./types";
import { formatFrenchDate } from "./utils";

interface BookingModalProps {
  selectedTripForBooking: TripItem;
  bookingSuccess: BookingSuccessData | null;
  bookingError: string | null;
  bookingLoading: boolean;
  passengerName: string;
  setPassengerName: Dispatch<SetStateAction<string>>;
  passengerPhone: string;
  setPassengerPhone: Dispatch<SetStateAction<string>>;
  passengerEmail: string;
  setPassengerEmail: Dispatch<SetStateAction<string>>;
  seatsCount: number;
  setSeatsCount: Dispatch<SetStateAction<number>>;
  isCustomSeats: boolean;
  setIsCustomSeats: Dispatch<SetStateAction<boolean>>;
  customSeatsCount: number;
  setCustomSeatsCount: Dispatch<SetStateAction<number>>;
  couponCode: string;
  setCouponCode: Dispatch<SetStateAction<string>>;
  calculatedTotal: number;
  handleCloseBooking: () => void;
  handleSubmitBooking: (e: FormEvent) => void;
}

export default function BookingModal({
  selectedTripForBooking,
  bookingSuccess,
  bookingError,
  bookingLoading,
  passengerName,
  setPassengerName,
  passengerPhone,
  setPassengerPhone,
  passengerEmail,
  setPassengerEmail,
  seatsCount,
  setSeatsCount,
  isCustomSeats,
  setIsCustomSeats,
  customSeatsCount,
  setCustomSeatsCount,
  couponCode,
  setCouponCode,
  calculatedTotal,
  handleCloseBooking,
  handleSubmitBooking,
}: BookingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleCloseBooking}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {!bookingSuccess ? (
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFB800]/20 text-slate-900 text-[11px] font-black uppercase tracking-wider mb-1.5">
                Réservation Express
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedTripForBooking.companyName}
              </h3>
              <div className="text-xs text-slate-600 mt-1 space-y-1">
                <p>
                  Trajet :{" "}
                  <strong className="text-slate-900">
                    {selectedTripForBooking.requestedOrigin ||
                      selectedTripForBooking.originCity}{" "}
                    ➔{" "}
                    {selectedTripForBooking.requestedDestination ||
                      selectedTripForBooking.destinationCity}
                  </strong>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[#FF6500] font-extrabold bg-orange-50 px-2.5 py-0.5 rounded-full">
                    <Calendar className="h-3 w-3" />
                    {formatFrenchDate(selectedTripForBooking.departureDate || selectedTripForBooking.departureDateTime)}
                  </span>
                  <span>• Départ à <strong>{selectedTripForBooking.departureTime}</strong></span>
                </p>
              </div>
            </div>

            {bookingError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Nom et Prénom du voyageur
              </label>
              <input
                type="text"
                required
                placeholder="Ex: SOUMANOU Abdoul"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Numéro de téléphone (+229)
              </label>
              <input
                type="tel"
                required
                placeholder="Ex: 0161006086 ou 61006086"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Accepte le format à 10 chiffres (01 XX XX XX XX) ou 8 chiffres.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Adresse e-mail (optionnelle pour le reçu PDF)
              </label>
              <input
                type="email"
                placeholder="Ex: voyageur@gmail.com"
                value={passengerEmail}
                onChange={(e) => setPassengerEmail(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            {/* Nombre de places avec option Autre */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nombre de places
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setSeatsCount(num);
                      setIsCustomSeats(false);
                    }}
                    className={`py-2.5 rounded-2xl text-xs font-black transition border cursor-pointer ${
                      !isCustomSeats && seatsCount === num
                        ? "bg-[#FF6500] text-white border-[#FF6500] shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {num} place{num > 1 ? "s" : ""}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomSeats(true)}
                  className={`py-2.5 rounded-2xl text-xs font-black transition border cursor-pointer ${
                    isCustomSeats
                      ? "bg-[#FF6500] text-white border-[#FF6500] shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Autre
                </button>
              </div>

              {isCustomSeats && (
                <div className="mt-2.5 p-3 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-800">
                    Précisez le nombre (1 à 50) :
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customSeatsCount}
                    onChange={(e) =>
                      setCustomSeatsCount(
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-24 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-sm font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Code promo / réduction (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: BIENVENUE2026"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            {/* Total récapitulatif */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Total à payer</span>
                <span className="text-xl font-black text-slate-900">
                  {calculatedTotal.toLocaleString("fr-FR")} F CFA
                </span>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="px-6 py-3.5 rounded-2xl bg-[#FF6500] hover:bg-[#EA580C] text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-[#FF6500]/25 cursor-pointer disabled:opacity-50"
              >
                {bookingLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verrouillage...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    <span>Payer par Mobile Money</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase mb-1">
                Siège Verrouillé pendant 7 min
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Billet N° {bookingSuccess.shortCode}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Passager : <strong>{bookingSuccess.passengerName}</strong> ({bookingSuccess.passengerPhone})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Trajet :</span>
                <span className="font-bold text-slate-900">
                  {bookingSuccess.originCity} ➔ {bookingSuccess.destinationCity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Date du voyage :</span>
                <span className="font-bold text-[#FF6500] flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatFrenchDate(bookingSuccess.departureDateTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Montant à régler :</span>
                <span className="font-black text-emerald-600 text-sm">
                  {bookingSuccess.totalToPayFcfa.toLocaleString("fr-FR")} F CFA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Mode :</span>
                <span className="font-bold text-slate-900">MTN MoMo / Moov Money</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Vous allez recevoir un push de confirmation de débit Mobile Money sur votre téléphone {bookingSuccess.passengerPhone}. Votre QR code d&apos;embarquement reste accessible hors-ligne.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/profile"
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition shadow-md"
              >
                Voir mes billets / profil
              </Link>
              <button
                type="button"
                onClick={handleCloseBooking}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
