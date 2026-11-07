import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb";
import { Company } from "../models/Company";
import { Trip, ISeatState } from "../models/Trip";
import { City } from "../models/City";

function generate50Seats(): ISeatState[] {
  const seats: ISeatState[] = [];
  for (let i = 1; i <= 50; i++) {
    seats.push({
      seatNumber: i,
      status: "VACANT",
      bookingId: null,
      passengerName: null,
      passengerPhone: null,
      destinationCity: null,
      isBoarded: false,
    });
  }
  return seats;
}

export async function seedDatabase() {
  console.log("🌱 Démarrage du peuplement des données réelles Kaweru...");
  await connectToDatabase();

  // 1. Initialiser les Villes
  const countCities = await City.countDocuments();
  if (countCities === 0) {
    console.log("  -> Création des 26 villes du Bénin...");
    const INITIAL_BENIN_CITIES = [
      { name: "Cotonou", code: "CTN", region: "LITTORAL", isPopular: true, order: 1 },
      { name: "Abomey-Calavi", code: "CAL", region: "ATLANTIQUE", isPopular: true, order: 2 },
      { name: "Bohicon", code: "BHO", region: "ZOU", isPopular: true, order: 3 },
      { name: "Parakou", code: "PKO", region: "BORGOU", isPopular: true, order: 4 },
      { name: "Dassa-Zoumè", code: "DAS", region: "COLLINES", isPopular: true, order: 5 },
      { name: "Djougou", code: "DJG", region: "DONGA", isPopular: true, order: 6 },
      { name: "Natitingou", code: "NAT", region: "ATACORA", isPopular: true, order: 7 },
      { name: "Porto-Novo", code: "PNO", region: "OUEME", isPopular: false, order: 8 },
    ];
    await City.insertMany(INITIAL_BENIN_CITIES);
  }

  // 2. Initialiser les Compagnies Réelles
  let confortLines = await Company.findOne({ code: "CFT" });
  if (!confortLines) {
    console.log("  -> Création de la compagnie Confort Lines...");
    confortLines = await Company.create({
      name: "Confort Lines",
      code: "CFT",
      logoUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=128&q=80",
      commission: { type: "FIXED", value: 500, paidBy: "PASSENGER" },
      settlementMomo: {
        operator: "MTN",
        number: "+2290197000001",
        holderName: "CONFORT LINES SARL",
        preferredTime: "DAILY_19H",
      },
      stations: [
        { stationId: "STN-CTN-1", name: "Gare Étoile Rouge", city: "Cotonou", managerPhone: "+2290197112233" },
        { stationId: "STN-BHO-1", name: "Gare Carrefour Zakpo", city: "Bohicon", managerPhone: "+2290197223344" },
        { stationId: "STN-DAS-1", name: "Gare Centrale Dassa", city: "Dassa-Zoumè", managerPhone: "+2290197334455" },
        { stationId: "STN-PKO-1", name: "Gare Albarika / Arafat", city: "Parakou", managerPhone: "+2290197445566" },
      ],
      isActive: true,
    });
  }

  let paxExpress = await Company.findOne({ code: "PAX" });
  if (!paxExpress) {
    console.log("  -> Création de la compagnie Pax Express...");
    paxExpress = await Company.create({
      name: "Pax Express",
      code: "PAX",
      logoUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=128&q=80",
      commission: { type: "FIXED", value: 500, paidBy: "PASSENGER" },
      settlementMomo: {
        operator: "MOOV",
        number: "+2290195000002",
        holderName: "PAX EXPRESS TRANSPORT",
        preferredTime: "DAILY_19H",
      },
      stations: [
        { stationId: "STN-CTN-2", name: "Gare Jonquet", city: "Cotonou", managerPhone: "+2290195112233" },
        { stationId: "STN-PKO-2", name: "Gare Titirou", city: "Parakou", managerPhone: "+2290195445566" },
      ],
      isActive: true,
    });
  }

  // 3. Initialiser les Départs Réels (Aujourd'hui et Demain)
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const existingTrips = await Trip.countDocuments({ departureDate: { $in: [todayStr, tomorrowStr] } });

  if (existingTrips === 0) {
    console.log("  -> Création des départs quotidiens réels (Cotonou <-> Parakou)...");

    const stopsCFT = [
      { order: 1, city: "Cotonou", stationName: "Gare Étoile Rouge", scheduledTime: "07:00", isReached: true },
      { order: 2, city: "Bohicon", stationName: "Carrefour Zakpo", scheduledTime: "09:30", isReached: false },
      { order: 3, city: "Dassa-Zoumè", stationName: "Gare Centrale", scheduledTime: "11:00", isReached: false },
      { order: 4, city: "Parakou", stationName: "Gare Albarika", scheduledTime: "14:30", isReached: false },
    ];

    const pricingCFT = [
      { from: "Cotonou", to: "Bohicon", price: 3500 },
      { from: "Cotonou", to: "Dassa-Zoumè", price: 5000 },
      { from: "Cotonou", to: "Parakou", price: 8000 },
      { from: "Bohicon", to: "Parakou", price: 5500 },
      { from: "Dassa-Zoumè", to: "Parakou", price: 4000 },
    ];

    // Bus 1 : Confort Lines Matin (07h00)
    const seatsTrip1 = generate50Seats();
    // Simuler 3 places déjà vendues pour rendre le manifeste vivant
    seatsTrip1[0] = { seatNumber: 1, status: "RESERVED_KAWERU", passengerName: "Saliou Bio", passengerPhone: "+2290197441122", destinationCity: "Parakou", isBoarded: true };
    seatsTrip1[1] = { seatNumber: 2, status: "RESERVED_KAWERU", passengerName: "Amina Kora", passengerPhone: "+2290195332211", destinationCity: "Parakou", isBoarded: false };
    seatsTrip1[4] = { seatNumber: 5, status: "CASH_GUICHET", passengerName: "Passager Guichet Cotonou", passengerPhone: "+2290196001122", destinationCity: "Dassa-Zoumè", isBoarded: false };

    await Trip.create({
      tripCode: "CFT-0700",
      companyId: confortLines._id,
      companyName: "Confort Lines",
      originCity: "Cotonou",
      destinationCity: "Parakou",
      departureDate: todayStr,
      departureTime: "07:00",
      departureDateTime: new Date(`${todayStr}T07:00:00Z`),
      cutoffMinutes: 120,
      busPlateNumber: "AB-2490-RB",
      totalQuota: 8,
      availableSeats: 5,
      lockedSeats: 0,
      soldSeats: 3,
      status: "OPEN",
      stops: stopsCFT,
      pricing: pricingCFT,
      seats: seatsTrip1,
    });

    // Bus 2 : Confort Lines Après-midi (13h30)
    await Trip.create({
      tripCode: "CFT-1330",
      companyId: confortLines._id,
      companyName: "Confort Lines",
      originCity: "Cotonou",
      destinationCity: "Parakou",
      departureDate: todayStr,
      departureTime: "13:30",
      departureDateTime: new Date(`${todayStr}T13:30:00Z`),
      cutoffMinutes: 120,
      busPlateNumber: "AC-1188-RB",
      totalQuota: 8,
      availableSeats: 8,
      lockedSeats: 0,
      soldSeats: 0,
      status: "OPEN",
      stops: stopsCFT,
      pricing: pricingCFT,
      seats: generate50Seats(),
    });

    // Bus 3 : Pax Express Matin (06h30)
    await Trip.create({
      tripCode: "PAX-0630",
      companyId: paxExpress._id,
      companyName: "Pax Express",
      originCity: "Cotonou",
      destinationCity: "Parakou",
      departureDate: todayStr,
      departureTime: "06:30",
      departureDateTime: new Date(`${todayStr}T06:30:00Z`),
      cutoffMinutes: 120,
      busPlateNumber: "AD-9922-RB",
      totalQuota: 10,
      availableSeats: 10,
      lockedSeats: 0,
      soldSeats: 0,
      status: "OPEN",
      stops: [
        { order: 1, city: "Cotonou", stationName: "Gare Jonquet", scheduledTime: "06:30", isReached: true },
        { order: 2, city: "Parakou", stationName: "Gare Titirou", scheduledTime: "13:30", isReached: false },
      ],
      pricing: [{ from: "Cotonou", to: "Parakou", price: 8500 }],
      seats: generate50Seats(),
    });

    // Bus 4 : Confort Lines Demain Matin (07h00)
    await Trip.create({
      tripCode: "CFT-TOMORROW",
      companyId: confortLines._id,
      companyName: "Confort Lines",
      originCity: "Cotonou",
      destinationCity: "Parakou",
      departureDate: tomorrowStr,
      departureTime: "07:00",
      departureDateTime: new Date(`${tomorrowStr}T07:00:00Z`),
      cutoffMinutes: 120,
      busPlateNumber: "AB-2490-RB",
      totalQuota: 8,
      availableSeats: 8,
      lockedSeats: 0,
      soldSeats: 0,
      status: "OPEN",
      stops: stopsCFT,
      pricing: pricingCFT,
      seats: generate50Seats(),
    });

    console.log("✅ Départs réels créés avec succès !");
  } else {
    console.log(`ℹ️ Des départs existent déjà (${existingTrips} trouvés).`);
  }
}

// Exécution directe si appelé via terminal
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding terminé !");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Erreur pendant le seeding :", err);
      process.exit(1);
    });
}

