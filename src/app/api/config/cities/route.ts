import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { City } from "@/models/City";
import { handleApiError } from "@/lib/errors";

const INITIAL_BENIN_CITIES = [
  { name: "Cotonou", code: "CTN", region: "LITTORAL", isPopular: true, order: 1 },
  { name: "Abomey-Calavi", code: "CAL", region: "ATLANTIQUE", isPopular: true, order: 2 },
  { name: "Bohicon", code: "BHO", region: "ZOU", isPopular: true, order: 3 },
  { name: "Parakou", code: "PKO", region: "BORGOU", isPopular: true, order: 4 },
  { name: "Dassa-Zoumè", code: "DAS", region: "COLLINES", isPopular: true, order: 5 },
  { name: "Djougou", code: "DJG", region: "DONGA", isPopular: true, order: 6 },
  { name: "Natitingou", code: "NAT", region: "ATACORA", isPopular: true, order: 7 },
  { name: "Porto-Novo", code: "PNO", region: "OUEME", isPopular: false, order: 8 },
  { name: "Abomey", code: "ABM", region: "ZOU", isPopular: false, order: 9 },
  { name: "Savè", code: "SVE", region: "COLLINES", isPopular: false, order: 10 },
  { name: "Savalou", code: "SVL", region: "COLLINES", isPopular: false, order: 11 },
  { name: "Kandi", code: "KND", region: "ALIBORI", isPopular: false, order: 12 },
  { name: "Malanville", code: "MLV", region: "ALIBORI", isPopular: false, order: 13 },
  { name: "Ouidah", code: "OUH", region: "ATLANTIQUE", isPopular: false, order: 14 },
  { name: "Comè", code: "CME", region: "MONO", isPopular: false, order: 15 },
  { name: "Lokossa", code: "LKS", region: "MONO", isPopular: false, order: 16 },
  { name: "Dogbo", code: "DGB", region: "COUFFO", isPopular: false, order: 17 },
  { name: "Azovè", code: "AZV", region: "COUFFO", isPopular: false, order: 18 },
  { name: "Pobè", code: "POB", region: "PLATEAU", isPopular: false, order: 19 },
  { name: "Kétou", code: "KET", region: "PLATEAU", isPopular: false, order: 20 },
  { name: "Sakété", code: "SKT", region: "PLATEAU", isPopular: false, order: 21 },
  { name: "N’Dali", code: "NDL", region: "BORGOU", isPopular: false, order: 22 },
  { name: "Nikki", code: "NKK", region: "BORGOU", isPopular: false, order: 23 },
  { name: "Bassila", code: "BSL", region: "DONGA", isPopular: false, order: 24 },
  { name: "Banikoara", code: "BNK", region: "ALIBORI", isPopular: false, order: 25 },
  { name: "Ségbana", code: "SGB", region: "ALIBORI", isPopular: false, order: 26 },
];

export async function GET() {
  try {
    await connectToDatabase();

    let cities = await City.find({ isActive: true }).sort({ order: 1, name: 1 });

    // Auto-seed initial si la collection est vide (premier lancement)
    if (cities.length === 0) {
      await City.insertMany(INITIAL_BENIN_CITIES);
      cities = await City.find({ isActive: true }).sort({ order: 1, name: 1 });
    }

    return NextResponse.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.warn("MongoDB non accessible ou en cours de configuration, retour du fallback statique :", error);
    // Résilience : retourne les 26 villes béninoises pour ne pas bloquer l'interface
    return NextResponse.json({
      success: true,
      data: INITIAL_BENIN_CITIES,
      isFallback: true,
    });
  }
}
