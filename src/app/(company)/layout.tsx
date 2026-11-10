import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, LogIn } from "lucide-react";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

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
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    redirect("/login");
  }

  if (!session || !session.role || !STAFF_ROLES.includes(session.role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-lg">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-5">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">
            Accès réservé à l&apos;exploitation
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
            Vous êtes actuellement connecté avec un profil <strong>Voyageur</strong>. Cet espace est strictement réservé aux chefs de gare, convoyeurs et administrateurs de compagnies partenaires.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Accueil Voyageur
            </Link>
            <Link
              href="/login"
              className="flex-1 py-3 px-4 rounded-xl bg-[#FF6500] hover:bg-[#e55a00] text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-xs"
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
