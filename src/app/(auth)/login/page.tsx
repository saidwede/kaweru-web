"use client";

import React, { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from "firebase/auth";
import { completeFirebaseLogin, getFirebaseAuth, type LoginResponse } from "@/lib/firebaseClient";
import { normalizePhoneNumber } from "@/lib/config";
import {
  Bus,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  User,
  MapPin,
} from "lucide-react";

type LoginMethod = "PHONE" | "EMAIL";
type AuthStep = "REQUEST" | "VERIFY" | "COMPLETE_PROFILE";

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
];

/** Messages lisibles pour les erreurs Firebase Auth les plus courantes. */
function firebaseErrorMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "Numéro de téléphone invalide.";
    case "auth/too-many-requests":
    case "auth/quota-exceeded":
      return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    case "auth/invalid-verification-code":
      return "Code incorrect. Vérifiez le SMS reçu.";
    case "auth/code-expired":
      return "Ce code a expiré. Demandez-en un nouveau.";
    case "auth/user-disabled":
      return "Votre compte a été désactivé par l'administrateur.";
    case "auth/captcha-check-failed":
      return "La vérification anti-robot a échoué. Rechargez la page.";
    case "auth/network-request-failed":
      return "Erreur réseau. Vérifiez votre connexion.";
    default:
      return fallback;
  }
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get("redirect");
  const referralParam = searchParams.get("ref") || undefined;

  const [method, setMethod] = useState<LoginMethod>("PHONE");
  const [step, setStep] = useState<AuthStep>("REQUEST");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Connexion SMS gérée par Firebase Auth (reCAPTCHA invisible + code envoyé par Firebase).
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Champs de complétion de profil (après 1ère inscription)
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string>("/");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [knownEmail, setKnownEmail] = useState("");
  const [residenceCity, setResidenceCity] = useState("Cotonou");
  const [needsNameFields, setNeedsNameFields] = useState(true);
  const [needsPhoneField, setNeedsPhoneField] = useState(false);

  const [instantCodeBanner, setInstantCodeBanner] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    // Si l'utilisateur a déjà une session active, le rediriger
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          router.replace(explicitRedirect || "/profile");
        }
      })
      .catch(() => {});
  }, [explicitRedirect, router]);

  React.useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  const switchMethod = (newMethod: LoginMethod) => {
    setMethod(newMethod);
    setStep("REQUEST");
    setOtp("");
    setErrorMessage(null);
    setInfoMessage(null);
    setInstantCodeBanner(null);
  };

  const resetRecaptcha = () => {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
  };

  // Étape 1 : Demander l'envoi du code (SMS via Firebase, ou e-mail via l'API Kaweru)
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setInstantCodeBanner(null);

    if (method === "PHONE" && phone.trim().length < 8) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide.");
      return;
    }
    if (method === "EMAIL" && (!email.includes("@") || email.trim().length < 5)) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    try {
      if (method === "PHONE") {
        let normalized: string;
        try {
          normalized = normalizePhoneNumber(phone);
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : "Numéro de téléphone invalide.");
          return;
        }
        const auth = getFirebaseAuth();
        if (!recaptchaRef.current) {
          recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        }
        confirmationRef.current = await signInWithPhoneNumber(auth, normalized, recaptchaRef.current);
        setStep("VERIFY");
        setInfoMessage(`Code SMS envoyé au ${normalized}`);
        return;
      }

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "EMAIL", email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("VERIFY");
        setInfoMessage(data.message);
        if (data.fallbackCode) setInstantCodeBanner(data.fallbackCode);
      } else {
        setErrorMessage(data.error || "Impossible d'envoyer le code OTP.");
      }
    } catch (err) {
      if (method === "PHONE") resetRecaptcha();
      setErrorMessage(
        method === "PHONE"
          ? firebaseErrorMessage(err, "Impossible d'envoyer le SMS. Réessayez.")
          : "Erreur réseau lors de l'envoi du code OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // Gérer la suite après connexion réussie (Profil complet vs Compléter uniquement ce qui manque)
  const handlePostAuthSuccess = (data: LoginResponse) => {
    const destination = explicitRedirect || data.redirectUrl || "/";
    if (data.needsProfileCompletion) {
      const uFirst = data.user?.firstName || "";
      const uLast = data.user?.lastName || "";
      const uPhone = data.user?.phone || "";
      const uEmail = data.user?.email || (method === "EMAIL" ? email : "");

      setFirstName(uFirst);
      setLastName(uLast);
      setProfilePhone(uPhone);
      setKnownEmail(uEmail);

      // Si le nom et prénom sont déjà connus (ex: fournis par Google), on ne les redemande pas
      setNeedsNameFields(!(uFirst.trim().length >= 2 && uLast.trim().length >= 2));
      // Si le numéro est déjà connu (ex: connexion par SMS), on ne le redemande pas
      setNeedsPhoneField(!uPhone);

      if (data.user?.residenceCity) {
        setResidenceCity(data.user.residenceCity);
      }
      setPendingRedirectUrl(destination);
      setStep("COMPLETE_PROFILE");
    } else {
      router.push(destination);
      router.refresh();
    }
  };

  // Étape 2 : Vérifier le code à 6 chiffres
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otp.trim().length < 6) {
      setErrorMessage("Veuillez saisir les 6 chiffres du code OTP.");
      return;
    }

    setLoading(true);
    try {
      let firebaseUser;
      if (method === "PHONE") {
        if (!confirmationRef.current) {
          setErrorMessage("Session SMS expirée. Demandez un nouveau code.");
          setStep("REQUEST");
          return;
        }
        firebaseUser = (await confirmationRef.current.confirm(otp.trim())).user;
      } else {
        const res = await fetch("/api/auth/email-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otp.trim() }),
        });
        const data = await res.json();
        if (!data.success || !data.customToken) {
          setErrorMessage(data.error || "Code OTP incorrect ou expiré.");
          return;
        }
        firebaseUser = (await signInWithCustomToken(getFirebaseAuth(), data.customToken)).user;
      }

      const login = await completeFirebaseLogin(firebaseUser, referralParam);
      if (login.success) {
        handlePostAuthSuccess(login);
      } else {
        setErrorMessage(login.error || "Connexion refusée.");
      }
    } catch (err) {
      setErrorMessage(firebaseErrorMessage(err, "Impossible de vérifier le code OTP."));
    } finally {
      setLoading(false);
    }
  };

  // Étape 3 : Enregistrer uniquement les informations manquantes du profil
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Veuillez renseigner votre prénom et votre nom.");
      return;
    }

    if (needsPhoneField && profilePhone.trim().length < 8) {
      setErrorMessage("Veuillez renseigner votre numéro de téléphone (+229).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: profilePhone.trim(),
          residenceCity,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const destination = explicitRedirect || data.redirectUrl || pendingRedirectUrl || "/";
        router.push(destination);
        router.refresh();
      } else {
        setErrorMessage(data.error || "Impossible d'enregistrer votre profil.");
      }
    } catch {
      setErrorMessage("Erreur réseau lors de l'enregistrement du profil.");
    } finally {
      setLoading(false);
    }
  };

  // Connexion Google officielle via le SDK Firebase (popup OAuth)
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(getFirebaseAuth(), provider);

      if (!cred.user.email) {
        setErrorMessage("Impossible de récupérer l'adresse e-mail de ce compte Google.");
        return;
      }

      const login = await completeFirebaseLogin(cred.user, referralParam);
      if (login.success) {
        handlePostAuthSuccess(login);
      } else {
        setErrorMessage(login.error || "Échec de l'authentification Google.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setErrorMessage(firebaseErrorMessage(err, "La connexion avec Google n'a pas pu aboutir. Veuillez réessayer."));
      }
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between mb-8">
        <Link
          href="/"
          className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FFB800] to-[#F06548] flex items-center justify-center text-white shadow-sm shadow-[#FFB800]/30">
            <Bus className="h-4 w-4" />
          </div>
          <span className="font-black text-slate-900 tracking-tight">KAWERU</span>
        </div>
        <div className="w-10" />
      </div>

      {/* =================================================================== */}
      {/* ÉTAPE 3 : COMPLÉTER VOTRE PROFIL (UNIQUEMENT CE QUI MANQUE)         */}
      {/* =================================================================== */}
      {step === "COMPLETE_PROFILE" ? (
        <div>
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FFB800]/20 text-slate-900 text-[11px] font-black uppercase tracking-wider mb-2">
              Dernière étape
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Complétez votre profil
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Renseignez les informations manquantes pour finaliser votre compte.
            </p>
          </div>

          {/* Récapitulatif des informations déjà connues */}
          {(knownEmail || (!needsPhoneField && profilePhone) || (!needsNameFields && firstName)) && (
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              {!needsNameFields && firstName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Voyageur :</span>
                  <span className="font-black text-slate-900">{firstName} {lastName}</span>
                </div>
              )}
              {knownEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">E-mail :</span>
                  <span className="font-bold text-slate-900">{knownEmail}</span>
                </div>
              )}
              {!needsPhoneField && profilePhone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Téléphone :</span>
                  <span className="font-bold text-slate-900">{profilePhone}</span>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCompleteProfile} className="space-y-4">
            {needsNameFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Prénom
                  </label>
                  <div className="relative flex items-center">
                    <User className="h-4 w-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="text"
                      placeholder="Ex: Koffi"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Nom de famille
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mensah"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:bg-white transition"
                    required
                  />
                </div>
              </div>
            )}

            {needsPhoneField && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Numéro de téléphone (+229)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-extrabold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                    <span>🇧🇯</span> +229
                  </span>
                  <input
                    type="tel"
                    placeholder="01 97 00 00 00"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full pl-28 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:bg-white transition"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Ville de résidence
              </label>
              <div className="relative flex items-center">
                <MapPin className="h-4 w-4 text-slate-400 absolute left-4 pointer-events-none" />
                <select
                  value={residenceCity}
                  onChange={(e) => setResidenceCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:bg-white transition"
                  required
                >
                  {BENIN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <span>Enregistrer et continuer</span>
                  <ArrowRight className="h-4 w-4 text-[#FFB800]" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* =================================================================== */
        /* ÉTAPES 1 & 2 : CONNEXION OTP (TÉLÉPHONE / EMAIL) + GOOGLE           */
        /* =================================================================== */
        <>
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Se connecter
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Entrez votre numéro de téléphone ou votre adresse e-mail.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === "VERIFY" && instantCodeBanner && (
            <div className="mb-5 p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Code de confirmation (mode test, e-mail non envoyé)
                </p>
                <p className="text-base font-black tracking-widest text-[#FFB800] font-mono">
                  {instantCodeBanner}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtp(instantCodeBanner)}
                className="px-3 py-2 rounded-xl bg-[#FFB800] text-slate-950 text-xs font-black hover:bg-[#e5a600] transition shrink-0 cursor-pointer"
              >
                Remplir
              </button>
            </div>
          )}

          {/* Onglets : Numéro de téléphone (SMS OTP) vs Email (Email OTP) */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => switchMethod("PHONE")}
              className={`py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                method === "PHONE"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              Numéro (SMS OTP)
            </button>
            <button
              type="button"
              onClick={() => switchMethod("EMAIL")}
              className={`py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                method === "EMAIL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              E-mail (Code OTP)
            </button>
          </div>

          {step === "REQUEST" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {method === "PHONE" ? (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Numéro de téléphone Bénin
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xs font-extrabold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                      <span>🇧🇯</span> +229
                    </span>
                    <input
                      type="tel"
                      placeholder="01 97 00 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-28 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:bg-white transition"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Votre adresse e-mail
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-4" />
                    <input
                      type="email"
                      placeholder="ex: voyageur@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:bg-white transition"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-lg shadow-slate-900/10 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Envoi du code en cours...</span>
                ) : (
                  <>
                    <span>
                      {method === "PHONE"
                        ? "Recevoir le code OTP par SMS"
                        : "Recevoir le code OTP par E-mail"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#FFB800]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    {infoMessage ||
                      `Code envoyé à ${method === "PHONE" ? `+229 ${phone}` : email}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("REQUEST");
                    setOtp("");
                  }}
                  className="text-[11px] font-extrabold text-emerald-700 underline hover:text-emerald-950 ml-2 shrink-0 cursor-pointer"
                >
                  Modifier
                </button>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Code de vérification OTP (6 chiffres)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 rounded-2xl bg-white border-2 border-slate-900 text-center text-2xl font-black tracking-[0.5em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFB800] transition"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Vérification en cours...</span>
                ) : (
                  <>
                    <span>Vérifier et Continuer</span>
                    <ArrowRight className="h-4 w-4 text-[#FFB800]" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Renvoyer un nouveau code OTP
                </button>
              </div>
            </form>
          )}

          {/* SÉPARATEUR OU */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                ou
              </span>
            </div>
          </div>

          {/* BOUTON CONTINUER AVEC GOOGLE (VRAI POPUP OAUTH GOOGLE) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border border-slate-200 shadow-xs transition flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{googleLoading ? "Ouverture de Google..." : "Continuer avec Google"}</span>
          </button>
        </>
      )}

      {/* Conteneur du reCAPTCHA invisible exigé par Firebase pour l'envoi des SMS */}
      <div id="recaptcha-container" />

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <Link
          href="/"
          className="font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white grid grid-cols-1 lg:grid-cols-12 font-sans">
      {/* LEFT PANEL : Photo & Sobriété Uber */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kaweru_hero_passenger.jpg"
          alt="Voyageur Kaweru"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#F06548] flex items-center justify-center text-white shadow-lg shadow-[#FFB800]/25">
              <Bus className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight">KAWERU</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
            Réservez votre place sans vous déplacer en gare.
          </h2>
          <p className="text-slate-300 text-sm mt-3">
            Cotonou • Bohicon • Dassa-Zoumè • Parakou • Natitingou
          </p>
        </div>
      </div>

      {/* RIGHT PANEL : Auth Form */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto text-center text-sm text-slate-400">
              Chargement...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
