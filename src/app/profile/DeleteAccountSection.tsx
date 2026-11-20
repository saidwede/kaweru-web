"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { signOutEverywhere } from "@/lib/firebaseClient";

/** Suppression définitive du compte par son titulaire (exigence Google Play, droit à l'effacement). */
export default function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsRelogin, setNeedsRelogin] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    setNeedsRelogin(false);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(typeof json.error === "string" ? json.error : "Suppression impossible.");
        setNeedsRelogin(res.status === 401);
        return;
      }
      await signOutEverywhere().catch(() => undefined);
      router.push("/?compte=supprime");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-red-100 bg-white p-5 sm:p-6">
      <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-red-600" />
        Supprimer mon compte
      </h2>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        Votre nom, votre numéro, votre e-mail et vos points de parrainage sont effacés définitivement. Les billets passés
        sont conservés sans vos coordonnées, pour la comptabilité. Impossible tant qu&apos;un voyage est à venir.{" "}
        <Link href="/confidentialite" className="underline">
          En savoir plus
        </Link>
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 px-4 py-2.5 rounded-2xl border border-red-200 text-red-700 text-xs font-black hover:bg-red-50 cursor-pointer"
        >
          Supprimer mon compte…
        </button>
      ) : (
        <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100 space-y-3">
          <p className="text-xs font-bold text-red-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Cette action est définitive. Tapez SUPPRIMER pour confirmer.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SUPPRIMER"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-red-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          {error && (
            <p className="text-xs font-semibold text-red-700">
              {error}{" "}
              {needsRelogin && (
                <Link href="/login?redirect=/profile" className="underline font-black">
                  Se reconnecter
                </Link>
              )}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={busy || confirmText.trim().toUpperCase() !== "SUPPRIMER"}
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black disabled:opacity-40 cursor-pointer"
            >
              {busy ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
