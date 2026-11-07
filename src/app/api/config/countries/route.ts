import { NextResponse } from "next/server";
import { SUPPORTED_COUNTRIES } from "@/lib/config";

export async function GET() {
  const activeCountries = SUPPORTED_COUNTRIES.filter((country) => country.isActive);

  return NextResponse.json({
    success: true,
    data: activeCountries,
  });
}
