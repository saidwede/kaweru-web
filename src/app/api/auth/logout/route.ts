import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Déconnexion réussie" });
  response.cookies.delete("kaweru_session");
  return response;
}

