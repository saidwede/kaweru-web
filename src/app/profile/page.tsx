"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bus,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Gift,
  LogOut,
  Save,
} from "lucide-react";

const BENIN_CITIES = [
  "Cotonou",
  "Abomey-Calavi",
  "Porto-Novo",
  "Parakou",
  "Bohicon",
  "Dassa-Zoumè",
  "Natitingou",
  "Djougou",
  "Ouidah",
  "Abomey",
  "Lokossa",
  "Kandi",
  "Malanville",
  "Autre ville",
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [residenceCity, setResidenceCity] = useState("Cotonou");
  const [role, setRole] = useState("PASSENGER");
  const [referralCode, setReferralCode] = useState("");
  const [referralPoints, setReferralPoints] = useState(0);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setPhone(data.user.phone || "");
        setEmail(data.user.email || "");
        if (data.user.residenceCity) setResidenceCity(data.user.residenceCity);
        setRole(data.user.role || "PASSENGER");
        setReferralCode(data.user.referralCode || "");
        setReferralPoints(data.user.referralPoints || 0);
      } else {
        router.push("/login?redirect=/profile");
      }
    } catch {
      setError("Impossible de charger votre profil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          residenceCity,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Vos modifications ont bien été enregistrées.");
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || "Échec de l'enregistrement.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    const url = `https://kaweru-reactiver.vercel.app/login?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#F06548] flex items-center justify-center text-white font-black text-xs">
              <Bus className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-900 tracking-tight">KAWERU</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mon Profil
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gérez vos informations personnelles utilisées pour vos réservations et billets.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Accès privilégié Administrateur / Responsable Compagnie */}
        {role === "SUPER_ADMIN" && (
          <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FFB800] text-slate-900 flex items-center justify-center font-black shrink-0">
                ⚡
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#FFB800]">
                  Espace Super Administrateur
                </h2>
                <p className="text-xs text-slate-300">
                  Créez des compagnies de transport partenaires et désignez leurs responsables.
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl bg-[#FFB800] hover:bg-amber-400 text-slate-950 font-black text-xs transition text-center shrink-0"
            >
              Console Admin ➔
            </Link>
          </div>
        )}

        {(role === "COMPANY_ADMIN" || role === "STATION_MANAGER") && (
          <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FF6500] text-white flex items-center justify-center font-black shrink-0">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#FF6500]">
                  Espace Exploitation Compagnie
                </h2>
                <p className="text-xs text-slate-300">
                  Gérez vos agents (chefs de gare, guichetiers) et le manifeste des passagers.
                </p>
              </div>
            </div>
            <Link
              href="/manifest"
              className="px-4 py-2.5 rounded-xl bg-[#FF6500] hover:bg-[#EA580C] text-white font-black text-xs transition text-center shrink-0"
            >
              Espace Gare ➔
            </Link>
          </div>
        )}

        {/* Programme de Parrainage */}
        {referralCode && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#FF6500]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Programme de Parrainage
                </h2>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {referralPoints} points gagnés
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Partagez votre lien d&apos;inscription personnel : à chaque achat de billet effectué par votre filleul, vous recevez automatiquement des points configurés par l&apos;administrateur.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://kaweru-reactiver.vercel.app/login?ref=${referralCode}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-[#FFB800]" />
                <span>{copied ? "Copié !" : "Copier"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Formulaire de modification */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chargement de votre profil...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom de famille
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Numéro de téléphone (+229)
                </label>
                <input
                  type="tel"
                  disabled
                  value={phone}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Le numéro sert d&apos;identifiant et ne peut pas être modifié.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  L&apos;adresse e-mail est liée à votre compte et ne peut être modifiée.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ville de résidence
                </label>
                <select
                  value={residenceCity}
                  onChange={(e) => setResidenceCity(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                >
                  {BENIN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Save className="h-4 w-4 text-[#FFB800]" />
                  <span>{saving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

