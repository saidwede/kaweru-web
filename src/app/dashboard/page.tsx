"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  Search,
  Gift,
  User,
  Bus,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Copy,
  Share2,
  QrCode,
  LogOut,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { signOutEverywhere } from "@/lib/firebaseClient";

interface BookingItem {
  id: string;
  _id?: string;
  shortCode: string;
  passengerName: string;
  passengerPhone: string;
  originCity: string;
  destinationCity: string;
  departureDateTime: string;
  seatNumber?: number;
  seatsCount: number;
  totalPaidFcfa: number;
  status: "CONFIRMED" | "PENDING_PAYMENT" | "BOARDED" | "EXPIRED" | "CANCELLED";
  boardingStatus: "NOT_BOARDED" | "BOARDED";
  tripId?: {
    tripCode?: string;
    companyName?: string;
    busPlateNumber?: string;
  } | null;
  companyId?: {
    name?: string;
    code?: string;
  } | null;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  referralLinkWeb: string;
  referralPoints: number;
  referralsCount: number;
  fcfaValuePerPoint: number;
}

interface UserProfile {
  uid: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  residenceCity?: string;
  role: string;
  referralPoints?: number;
}

export default function PassengerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"TICKETS" | "SEARCH" | "REFERRAL" | "PROFILE">("TICKETS");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<BookingItem | null>(null);

  // Profil edit state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editCity, setEditCity] = useState("Cotonou");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login?redirect=/dashboard");
        return;
      }
      const userData = await userRes.json();
      if (!userData.success || !userData.user) {
        router.push("/login?redirect=/dashboard");
        return;
      }
      setUser(userData.user);
      setEditFirstName(userData.user.firstName || "");
      setEditLastName(userData.user.lastName || "");
      setEditCity(userData.user.residenceCity || "Cotonou");

      // Charger les billets et le parrainage en parallèle
      const [bookingsRes, referralRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/referrals"),
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        if (bData.success && Array.isArray(bData.data)) {
          setBookings(bData.data);
        }
      }

      if (referralRes.ok) {
        const rData = await referralRes.json();
        if (rData.success) {
          setReferral(rData);
        }
      }
    } catch {
      router.push("/login?redirect=/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (!referral?.referralLinkWeb) return;
    navigator.clipboard.writeText(referral.referralLinkWeb);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          residenceCity: editCity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMsg({ type: "success", text: "Profil mis à jour avec succès !" });
        setUser((prev) => (prev ? { ...prev, firstName: editFirstName, lastName: editLastName, residenceCity: editCity } : prev));
      } else {
        setProfileMsg({ type: "error", text: data.error || "Impossible de mettre à jour le profil." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Erreur réseau." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOutEverywhere();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-[#FF6500] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Chargement de votre Espace Voyageur...</p>
        </div>
      </div>
    );
  }

  const points = user?.referralPoints || referral?.referralPoints || 0;
  const pointsFcfa = points * (referral?.fcfaValuePerPoint || 5);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER NAVIGATION ESPACE VOYAGEUR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#FFB800] to-[#FF6500] flex items-center justify-center text-white shadow-xs">
                <Bus className="h-4 w-4" />
              </div>
              <span className="font-black text-slate-900 tracking-tight text-lg">KAWERU</span>
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-bold text-slate-400 border-l border-slate-200 pl-3">
              Espace Voyageur
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* CARTE FIDÉLITÉ POINTS */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6500]">
              <Gift className="h-3.5 w-3.5" />
              <div className="text-left">
                <span className="text-xs font-black">{points} pts</span>
                <span className="hidden sm:inline text-[10px] text-orange-600/80 font-semibold ml-1">
                  ({pointsFcfa.toLocaleString()} FCFA)
                </span>
              </div>
            </div>

            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex text-xs font-bold px-3 py-2 rounded-xl bg-slate-900 text-[#FFB800] hover:bg-slate-800 transition"
              >
                Cockpit Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="h-9 w-9 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BANDEAU DE BIENVENUE VOYAGEUR */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-2">
              <CheckCircle2 className="h-3 w-3" />
              Compte vérifié
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Bonjour, {user?.firstName || user?.fullName || "Voyageur"} 👋
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
              Retrouvez vos billets d&apos;embarquement et gérez vos trajets en toute sérénité.
            </p>
          </div>

          <Link
            href="/#search-card"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black shadow-md shadow-[#FF6500]/25 transition"
          >
            <Ticket className="h-4 w-4" />
            Réserver un billet
          </Link>
        </div>

        {/* ONGLETS DU DASHBOARD */}
        <div className="max-w-6xl mx-auto mt-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("TICKETS")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "TICKETS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            Mes Billets ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("REFERRAL")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "REFERRAL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Gift className="h-3.5 w-3.5 text-[#FF6500]" />
            Parrainage & Réductions
          </button>
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === "PROFILE"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Mon Profil
          </button>
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ONGLET 1 : MES BILLETS */}
        {activeTab === "TICKETS" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="h-14 w-14 rounded-3xl bg-orange-50 text-[#FF6500] flex items-center justify-center mx-auto mb-4">
                  <Ticket className="h-7 w-7" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">Aucun billet pour le moment</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Vous n&apos;avez encore réservé aucun trajet. Réservez votre premier voyage en quelques clics par Mobile Money.
                </p>
                <Link
                  href="/#search-card"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF6500] text-white text-xs font-black shadow-xs hover:bg-[#e55a00] transition"
                >
                  <Search className="h-3.5 w-3.5" />
                  Trouver un départ
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => {
                  const isBoarded = b.boardingStatus === "BOARDED";
                  const isConfirmed = b.status === "CONFIRMED";
                  return (
                    <div
                      key={b.id || b._id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition relative overflow-hidden"
                    >
                      {/* BANDEAU LATÉRAL STATUS */}
                      <div
                        className={`absolute top-0 left-0 bottom-0 w-2 ${
                          isBoarded ? "bg-emerald-500" : isConfirmed ? "bg-[#FF6500]" : "bg-slate-300"
                        }`}
                      />

                      <div className="flex items-start justify-between gap-3 pl-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {b.companyId?.name || b.tripId?.companyName || "Compagnie Partenaire"}
                          </span>
                          <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                            {b.originCity} <ArrowRight className="h-3.5 w-3.5 text-[#FF6500]" /> {b.destinationCity}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isBoarded
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isConfirmed
                              ? "bg-orange-50 text-[#FF6500] border border-orange-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isBoarded ? "Embarqué" : isConfirmed ? "Confirmé" : b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-4 py-3 border-y border-slate-100 pl-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {b.departureDateTime ? new Date(b.departureDateTime).toLocaleDateString("fr-FR") : "Date non fixée"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>
                            {b.departureDateTime
                              ? new Date(b.departureDateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                              : "Horaire"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Code Court</p>
                          <p className="text-lg font-black text-slate-900 tracking-wider">{b.shortCode}</p>
                        </div>
                        <button
                          onClick={() => setSelectedTicketForQr(b)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs"
                        >
                          <QrCode className="h-3.5 w-3.5 text-[#FFB800]" />
                          Voir QR Code
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : PROGRAMME DE PARRAINAGE */}
        {activeTab === "REFERRAL" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#FFB800] text-xs font-bold backdrop-blur-xs">
                  <Gift className="h-3.5 w-3.5" />
                  Programme de fidélité Kaweru
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Gagnez 500 FCFA à chaque voyage de vos amis !
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Partagez votre lien exclusif. Dès qu&apos;un proche effectue son premier trajet payé, vous recevez
                  automatiquement <strong>100 points (= 500 FCFA)</strong> utilisables sur votre prochain billet.
                </p>

                {/* STATS RAPIDES */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-slate-400 font-medium">Solde de points</p>
                    <p className="text-2xl font-black text-[#FFB800] mt-0.5">{points} pts</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Valeur : {pointsFcfa.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-slate-400 font-medium">Filleuls actifs</p>
                    <p className="text-2xl font-black text-white mt-0.5">{referral?.referralsCount || 0}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Personnes parrainées</p>
                  </div>
                </div>

                {/* LIEN DE PARRAINAGE */}
                <div className="pt-2">
                  <label className="block text-[11px] text-slate-300 font-bold mb-1.5">Votre lien d&apos;invitation :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referral?.referralLinkWeb || `https://kaweru.bj/login?ref=${user?.uid}`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white outline-none select-all"
                    />
                    <button
                      onClick={handleCopyReferral}
                      className="px-4 py-2.5 rounded-xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 3 : MON PROFIL */}
        {activeTab === "PROFILE" && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 text-[#FF6500] flex items-center justify-center font-bold">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Mes Informations Personnelles</h3>
                <p className="text-xs text-slate-500">Mettez à jour vos coordonnées pour vos billets</p>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#FF6500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#FF6500]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de Téléphone (Identifiant)</label>
                <input
                  type="text"
                  disabled
                  value={user?.phone || "Non renseigné"}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">Le numéro de téléphone certifié ne peut pas être modifié.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville de Résidence</label>
                <select
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#FF6500]"
                >
                  <option value="Cotonou">Cotonou</option>
                  <option value="Abomey-Calavi">Abomey-Calavi</option>
                  <option value="Porto-Novo">Porto-Novo</option>
                  <option value="Parakou">Parakou</option>
                  <option value="Bohicon">Bohicon</option>
                  <option value="Dassa-Zoumè">Dassa-Zoumè</option>
                  <option value="Natitingou">Natitingou</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-2xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {profileSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODALE QR CODE D'EMBARQUEMENT */}
      {selectedTicketForQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-black text-slate-900 mb-1">Billet d&apos;Embarquement</h4>
            <p className="text-xs text-slate-500 mb-4">
              {selectedTicketForQr.originCity} ➔ {selectedTicketForQr.destinationCity}
            </p>

            {/* QR CODE OFFICIEL */}
            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-inner mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  selectedTicketForQr.shortCode
                )}`}
                alt="QR Code Embarquement"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code Court</p>
            <p className="text-2xl font-black text-[#FF6500] tracking-widest my-1">{selectedTicketForQr.shortCode}</p>
            <p className="text-[11px] text-slate-400">Présentez ce QR Code au convoyeur lors de la montée dans le bus.</p>

            <button
              onClick={() => setSelectedTicketForQr(null)}
              className="w-full mt-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
