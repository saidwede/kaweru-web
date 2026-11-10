"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  RefreshCw,
  Search,
  Camera,
  QrCode,
  CheckCircle,
} from "lucide-react";
import type { BookingItem, ValidationMode, ValidateTicketFn } from "./types";

interface ValidatorTabProps {
  validationMode: ValidationMode;
  setValidationMode: Dispatch<SetStateAction<ValidationMode>>;
  startCameraScanner: () => Promise<void>;
  stopCameraScanner: () => Promise<void>;
  isCameraActive: boolean;
  validateQuery: string;
  setValidateQuery: Dispatch<SetStateAction<string>>;
  handleValidateTicket: ValidateTicketFn;
  validating: boolean;
  validationResult: BookingItem | null;
  searchResults: BookingItem[];
}

export default function ValidatorTab({
  validationMode,
  setValidationMode,
  startCameraScanner,
  stopCameraScanner,
  isCameraActive,
  validateQuery,
  setValidateQuery,
  handleValidateTicket,
  validating,
  validationResult,
  searchResults,
}: ValidatorTabProps) {
  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#FF6500]" />
              Pointage & Contrôle d&apos;Embarquement Passagers
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Validez instantanément les passagers par scan caméra, code court ou numéro de téléphone.
            </p>
          </div>

          {/* Sélecteur de Mode Tactile Soft-UI */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-black">
            <button
              onClick={() => {
                setValidationMode("CODE");
                stopCameraScanner();
              }}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                validationMode === "CODE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
              }`}
            >
              Code Billet
            </button>
            <button
              onClick={() => {
                setValidationMode("PHONE");
                stopCameraScanner();
              }}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                validationMode === "PHONE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
              }`}
            >
              N° Téléphone
            </button>
            <button
              onClick={() => {
                setValidationMode("CAMERA");
                startCameraScanner();
              }}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                validationMode === "CAMERA" ? "bg-[#FF6500] text-white shadow-xs" : "text-slate-500"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              Scanner Caméra
            </button>
          </div>
        </div>

        {/* MODE 1 : SCANNER CAMÉRA QR CODE */}
        {validationMode === "CAMERA" && (
          <div className="space-y-4 text-center max-w-md mx-auto">
            <div className="p-4 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-lg">
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center">
                {!isCameraActive && (
                  <p className="text-xs text-slate-400">Caméra inactive</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {isCameraActive ? (
                <button
                  onClick={stopCameraScanner}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer"
                >
                  Arrêter la caméra
                </button>
              ) : (
                <button
                  onClick={startCameraScanner}
                  className="px-5 py-2.5 rounded-xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Démarrer la caméra
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 2 : VALIDATION PAR CODE COURT */}
        {validationMode === "CODE" && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex gap-2.5">
              <input
                type="text"
                placeholder="Ex: KWR-9X2 ou A7K-92B"
                value={validateQuery}
                onChange={(e) => setValidateQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidateTicket(validateQuery, "CONFIRM_BOARDING");
                }}
                className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-base font-mono font-black text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#FF6500] uppercase transition"
              />
              <button
                onClick={() => handleValidateTicket(validateQuery, "CONFIRM_BOARDING")}
                disabled={validating || !validateQuery.trim()}
                className="px-6 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2"
              >
                {validating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Valider Montée
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Tapez Entrée pour valider immédiatement l&apos;embarquement.
            </p>
          </div>
        )}

        {/* MODE 3 : VALIDATION PAR NUMÉRO DE TÉLÉPHONE */}
        {validationMode === "PHONE" && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex gap-2.5">
              <input
                type="tel"
                placeholder="Ex: 01 97 00 00 00 ou +229..."
                value={validateQuery}
                onChange={(e) => setValidateQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidateTicket(validateQuery, "VERIFY");
                }}
                className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#FF6500] transition"
              />
              <button
                onClick={() => handleValidateTicket(validateQuery, "VERIFY")}
                disabled={validating || !validateQuery.trim()}
                className="px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2"
              >
                {validating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Rechercher
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Retrouvez les billets d&apos;un voyageur même s&apos;il a égaré son SMS de confirmation.
            </p>
          </div>
        )}

        {/* RÉSULTAT DE LA VALIDATION / FICHE PASSAGER */}
        {validationResult && (
          <div className="mt-6 p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950">{validationResult.passengerName}</h4>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold">
                    Code : {validationResult.shortCode}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white">
                {validationResult.boardingStatus === "BOARDED" ? "À BORD" : "VALIDE"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Trajet</p>
                <p className="font-bold text-slate-900">
                  {validationResult.originCity} ➔ {validationResult.destinationCity}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Siège Affecté</p>
                <p className="font-black text-[#FF6500] text-sm">
                  {validationResult.seatNumber ? `Siège N° ${validationResult.seatNumber}` : "Placement Libre"}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Téléphone Passager</p>
                <p className="font-bold text-slate-900">{validationResult.passengerPhone}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/80 border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Paiement</p>
                <p className="font-black text-emerald-700">{validationResult.totalPaidFcfa} FCFA (Confirmé)</p>
              </div>
            </div>

            {validationResult.boardingStatus !== "BOARDED" && (
              <button
                onClick={() => handleValidateTicket(validationResult.shortCode, "CONFIRM_BOARDING")}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-xs"
              >
                Confirmer l&apos;Embarquement Immédiat
              </button>
            )}
          </div>
        )}

        {/* RÉSULTATS MULTIPLES (PAR EXEMPLE PAR TÉLÉPHONE) */}
        {searchResults.length > 1 && (
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-xs font-bold text-slate-500">
              {searchResults.length} réservations trouvées pour ce passager :
            </p>
            <div className="space-y-2">
              {searchResults.map((b) => (
                <div
                  key={b._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{b.passengerName}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {b.shortCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {b.originCity} ➔ {b.destinationCity} (Siège {b.seatNumber || "Libre"})
                    </p>
                  </div>
                  <button
                    onClick={() => handleValidateTicket(b.shortCode, "CONFIRM_BOARDING")}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition cursor-pointer"
                  >
                    Valider Montée
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
