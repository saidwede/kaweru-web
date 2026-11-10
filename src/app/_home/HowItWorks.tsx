import {
  Check,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <section id="experience" className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Image réelle */}
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

          {/* Texte Explicatif */}
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
                  <p className="text-xs text-slate-500 mt-0.5">Accédez aux départs réels de Confort Lines, Pax Express et des compagnies partenaires.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6500] flex items-center justify-center font-black text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verrouillage garanti de votre place</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Votre place est réservée de manière atomique pendant 7 minutes pour finaliser le paiement Mobile Money sans risque de doublon.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6500] flex items-center justify-center font-black text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Embarquez avec votre QR Code</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Présentez votre billet sur votre téléphone même en zone blanche sans connexion internet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
