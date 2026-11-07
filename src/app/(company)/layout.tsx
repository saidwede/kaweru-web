import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, LogIn } from "lucide-react";

export const dynamic = "force-dynamic";

const STAFF_ROLES = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "STATION_MANAGER",
  "TICKET_AGENT",
  "ONBOARD_CONDUCTOR",
];

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("kaweru_session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let session: { uid?: string; role?: string; name?: string; email?: string } | null = null;
  try {
    session = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf-8"));
  } catch {
    redirect("/login");
  }

  if (!session || !session.role || !STAFF_ROLES.includes(session.role)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-5">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">
            Accès réservé à l&apos;exploitation
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Vous êtes actuellement connecté avec un profil <strong>Voyageur</strong>. Cet espace est strictement réservé aux chefs de gare, convoyeurs et administrateurs de compagnies partenaires.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Accueil Voyageur
            </Link>
            <Link
              href="/login"
              className="flex-1 py-3 px-4 rounded-xl bg-[#FFB800] hover:bg-[#e5a600] text-slate-950 text-xs font-black transition flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Compte Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

