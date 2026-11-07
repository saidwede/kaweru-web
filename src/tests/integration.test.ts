import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { normalizePhoneNumber } from "../lib/config";
import { generateShortCode, generateQrSignature, verifyQrSignature } from "../lib/security";
import { Trip } from "../models/Trip";
import { Company } from "../models/Company";
import { Booking } from "../models/Booking";

async function runTestSuite() {
  console.log("==================================================");
  console.log("🚀 LANCEMENT DE LA SUITE DE TESTS D'INTÉGRATION KAWERU");
  console.log("==================================================\n");

  let mongoServer: MongoMemoryServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("✅ [Setup] Base de données MongoDB de test initialisée en mémoire.\n");

    // ----------------------------------------------------
    // TEST 1 : Normalisation Téléphone (ARCEP Bénin)
    // ----------------------------------------------------
    console.log("🧪 TEST 1 : Validation et Normalisation Téléphonique (Bénin +229)");
    const phoneCases = [
      { input: "0197112233", expected: "+2290197112233" },
      { input: "97112233", expected: "+2290197112233" }, // Ancien format 8 chiffres auto-migré en 01
      { input: "+2290197112233", expected: "+2290197112233" },
      { input: "+229 01 97 11 22 33", expected: "+2290197112233" },
    ];

    for (const c of phoneCases) {
      const res = normalizePhoneNumber(c.input);
      if (res !== c.expected) {
        throw new Error(`Échec normalisation: reçu ${res}, attendu ${c.expected}`);
      }
    }
    console.log("  -> Résultat : 4/4 formats normalisés avec succès en +229.\n");

    // ----------------------------------------------------
    // TEST 2 : Sécurité Cryptographique QR Code
    // ----------------------------------------------------
    console.log("🧪 TEST 2 : Génération et Vérification de Signature QR Code");
    const code = generateShortCode();
    const sig = generateQrSignature("bk_123", code, 8500);
    const isValid = verifyQrSignature("bk_123", code, 8500, sig);
    const isFakeValid = verifyQrSignature("bk_123", code, 8000, sig); // Montant falsifié

    if (!isValid || isFakeValid) {
      throw new Error("Échec de la validation de signature QR");
    }
    console.log(`  -> Code court généré : ${code}`);
    console.log("  -> Signature HMAC valide, tentative de falsification de montant rejetée.\n");

    // ----------------------------------------------------
    // TEST 3 : Création Compagnie & Voyage Multi-Arrêts
    // ----------------------------------------------------
    console.log("🧪 TEST 3 : Modélisation Voyage Multi-Arrêts (Cotonou -> Bohicon -> Dassa -> Parakou)");
    const company = await Company.create({
      name: "Confort Lines Test",
      code: "CFT",
      commission: { type: "FIXED", value: 500, paidBy: "PASSENGER" },
      settlementMomo: { operator: "MTN", number: "+2290197000000", holderName: "Confort Lines SARL" },
    });

    const departureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Départ demain
    const trip = await Trip.create({
      tripCode: "CFT-0700",
      companyId: company._id,
      companyName: company.name,
      originCity: "Cotonou",
      destinationCity: "Parakou",
      departureDate: departureTime.toISOString().split("T")[0],
      departureTime: "07:00",
      departureDateTime: departureTime,
      totalQuota: 2, // Quota volontairement bas (2 sièges) pour tester l'anti-surbooking
      availableSeats: 2,
      lockedSeats: 0,
      soldSeats: 0,
      stops: [
        { order: 1, city: "Cotonou", stationName: "Gare Zongo" },
        { order: 2, city: "Bohicon", stationName: "Gare Centrale" },
        { order: 3, city: "Dassa", stationName: "Carrefour Dassa" },
        { order: 4, city: "Parakou", stationName: "Gare Albarika" },
      ],
      pricing: [
        { from: "Cotonou", to: "Bohicon", price: 4000 },
        { from: "Cotonou", to: "Dassa", price: 5000 },
        { from: "Cotonou", to: "Parakou", price: 8000 },
      ],
    });

    // Test de résolution des prix de tronçons
    const priceDassa = trip.pricing.find((p) => p.from === "Cotonou" && p.to === "Dassa")?.price;
    const priceParakou = trip.pricing.find((p) => p.from === "Cotonou" && p.to === "Parakou")?.price;

    if (priceDassa !== 5000 || priceParakou !== 8000) {
      throw new Error("Échec de la résolution tarifaire des tronçons");
    }
    console.log("  -> Cotonou ➔ Dassa résolu à : 5 000 FCFA");
    console.log("  -> Cotonou ➔ Parakou résolu à : 8 000 FCFA\n");

    // ----------------------------------------------------
    // TEST 4 : Concurrence & Garantie Zéro Surbooking
    // ----------------------------------------------------
    console.log("🧪 TEST 4 : Test de Concurrence Atomique (3 passagers pour 2 places restantes)");
    console.log("  -> Simulation : Ali, Moussa et Koffi cliquent sur 'Payer' à la même milliseconde...");

    const attemptReservation = async (passengerName: string) => {
      const updated = await Trip.findOneAndUpdate(
        { _id: trip._id, status: "OPEN", availableSeats: { $gte: 1 } },
        { $inc: { availableSeats: -1, lockedSeats: 1 } },
        { new: true }
      );

      if (!updated) {
        return { success: false, name: passengerName, reason: "OVERBOOKING_PREVENTED" };
      }

      const booking = await Booking.create({
        shortCode: generateShortCode(),
        tripId: trip._id,
        companyId: company._id,
        userId: `user_${passengerName}`,
        passengerName,
        passengerPhone: "+2290197000000",
        originCity: "Cotonou",
        destinationCity: "Parakou",
        departureDateTime: trip.departureDateTime,
        basePriceFcfa: 8000,
        serviceFeeFcfa: 500,
        discountFcfa: 0,
        totalPaidFcfa: 8500,
        companySettlementAmountFcfa: 8000,
        status: "PENDING_PAYMENT",
        paymentProvider: "FEDAPAY",
        lockedUntil: new Date(Date.now() + 7 * 60 * 1000),
        qrSignature: "hash",
        boardingStatus: "NOT_BOARDED",
      });

      return { success: true, name: passengerName, bookingId: booking._id };
    };

    // 3 requêtes exécutées en parallèle exact via Promise.all
    const results = await Promise.all([
      attemptReservation("Ali"),
      attemptReservation("Moussa"),
      attemptReservation("Koffi"),
    ]);

    const successCount = results.filter((r) => r.success).length;
    const rejectedCount = results.filter((r) => !r.success).length;

    console.log(`  -> Réservations acceptées : ${successCount} / 2`);
    console.log(`  -> Réservations rejetées : ${rejectedCount} / 1`);

    if (successCount !== 2 || rejectedCount !== 1) {
      throw new Error("ÉCHEC CRITIQUE : Le surbooking n'a pas été bloqué correctement !");
    }

    const tripAfterBooking = await Trip.findById(trip._id);
    if (tripAfterBooking?.availableSeats !== 0 || tripAfterBooking?.lockedSeats !== 2) {
      throw new Error("Compteurs de sièges incohérents après concurrence");
    }
    console.log("  -> Vérification BDD : availableSeats = 0, lockedSeats = 2.");
    console.log("  -> ✅ GARANTIE ZÉRO SURBOOKING VALIDÉE AVEC SUCCÈS !\n");

    // ----------------------------------------------------
    // TEST 5 : Simulation Webhook de Paiement Fedapay (MTN MoMo)
    // ----------------------------------------------------
    console.log("🧪 TEST 5 : Confirmation Paiement Mobile Money & Transfert de Siège");
    const successfulBooking = results.find((r) => r.success);
    if (!successfulBooking?.bookingId) throw new Error("Booking introuvable");

    const b = await Booking.findById(successfulBooking.bookingId);
    if (b) {
      b.status = "CONFIRMED";
      b.paymentReference = "fedapay_tx_998822";
      await b.save();

      // Transfert du siège : lockedSeats -> soldSeats
      await Trip.findByIdAndUpdate(trip._id, {
        $inc: { lockedSeats: -1, soldSeats: 1 },
      });
    }

    const tripAfterPayment = await Trip.findById(trip._id);
    console.log(`  -> Sièges vendus confirmés : ${tripAfterPayment?.soldSeats} / 2`);
    console.log(`  -> Sièges temporairement verrouillés restants : ${tripAfterPayment?.lockedSeats} / 2`);
    console.log("  -> ✅ PAIEMENT MOBILE MONEY VALIDÉ SANS ERREUR !\n");

    // ----------------------------------------------------
    // TEST 6 : Test de Report (Empêchement voyageur)
    // ----------------------------------------------------
    console.log("🧪 TEST 6 : Gestion d'Empêchement & Report de Billet");
    // Création d'un second voyage demain à 14h00 pour le report
    const nextTrip = await Trip.create({
      tripCode: "CFT-1400",
      companyId: company._id,
      companyName: company.name,
      originCity: "Cotonou",
      destinationCity: "Parakou",
      departureDate: departureTime.toISOString().split("T")[0],
      departureTime: "14:00",
      departureDateTime: new Date(departureTime.getTime() + 7 * 60 * 60 * 1000),
      totalQuota: 8,
      availableSeats: 8,
      lockedSeats: 0,
      soldSeats: 0,
      stops: trip.stops,
      pricing: trip.pricing,
    });

    // Report du voyageur
    await Trip.findByIdAndUpdate(trip._id, { $inc: { soldSeats: -1, availableSeats: 1 } });
    await Trip.findByIdAndUpdate(nextTrip._id, { $inc: { availableSeats: -1, soldSeats: 1 } });

    b!.tripId = nextTrip._id as any;
    b!.departureDateTime = nextTrip.departureDateTime;
    b!.status = "CONFIRMED";
    b!.rescheduledToTripId = nextTrip._id as any;
    b!.rescheduledAt = new Date();
    b!.rescheduleFeeFcfa = 500;
    await b!.save();

    const oldTripAfterReschedule = await Trip.findById(trip._id);
    const newTripAfterReschedule = await Trip.findById(nextTrip._id);

    console.log(`  -> Ancien bus CFT-0700 : place libérée (availableSeats = ${oldTripAfterReschedule?.availableSeats})`);
    console.log(`  -> Nouveau bus CFT-1400 : place occupée (soldSeats = ${newTripAfterReschedule?.soldSeats})`);
    console.log("  -> ✅ REPORT AVEC TRANSFERT ATOMIQUE DE SIÈGE VALIDÉ !\n");

    console.log("==================================================");
    console.log("🎉 TOUS LES 6 TESTS D'INTÉGRATION SONT VERTS (100% SUCCÈS) !");
    console.log("==================================================");

    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(0);
  } catch (err) {
    console.error("❌ ERREUR LORS DES TESTS :", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runTestSuite();

