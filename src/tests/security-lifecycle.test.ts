/**
 * Tests de non-régression : sessions signées, QR, OTP et cycle de vie paiement / sièges.
 * Lancement : npm run test:security
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { signSession, verifySessionToken } from "../lib/session";
import { generateShortCode, generateQrSignature, verifyQrSignature, escapeRegex } from "../lib/security";
import { verifyFedapaySignature } from "../lib/fedapay";
import { consumeOtp, OTP_MAX_ATTEMPTS } from "../lib/otp";
import {
  expireBookingIfStale,
  releaseExpiredBookings,
  confirmPaidBooking,
  cancelPendingBooking,
} from "../lib/bookingLifecycle";
import { Booking } from "../models/Booking";
import { Trip } from "../models/Trip";
import { Otp } from "../models/Otp";

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

async function makeTrip(available: number) {
  return Trip.create({
    tripCode: `T-${crypto.randomUUID().slice(0, 8)}`,
    companyId: new mongoose.Types.ObjectId(),
    companyName: "Test Lines",
    originCity: "Cotonou",
    destinationCity: "Parakou",
    departureDate: "2030-01-01",
    departureTime: "08:00",
    departureDateTime: new Date("2030-01-01T08:00:00Z"),
    cutoffMinutes: 120,
    totalQuota: available,
    availableSeats: available,
    lockedSeats: 0,
    soldSeats: 0,
    status: "OPEN",
    stops: [],
    pricing: [{ from: "Cotonou", to: "Parakou", price: 8000 }],
    seats: [],
  });
}

/** Simule le verrou atomique fait par POST /api/bookings. */
async function makePendingBooking(tripId: mongoose.Types.ObjectId, seats: number, lockedUntil: Date) {
  await Trip.updateOne({ _id: tripId }, { $inc: { availableSeats: -seats, lockedSeats: seats } });
  return Booking.create({
    shortCode: generateShortCode(),
    tripId,
    companyId: new mongoose.Types.ObjectId(),
    userId: "guest_user",
    passengerName: "Test",
    passengerPhone: `+22901${crypto.randomInt(10000000, 99999999)}`,
    seatsCount: seats,
    originCity: "Cotonou",
    destinationCity: "Parakou",
    departureDateTime: new Date("2030-01-01T08:00:00Z"),
    basePriceFcfa: 8000 * seats,
    totalPaidFcfa: 8000 * seats,
    companySettlementAmountFcfa: 8000 * seats,
    status: "PENDING_PAYMENT",
    lockedUntil,
    qrSignature: "x",
  });
}

async function seatsOf(tripId: mongoose.Types.ObjectId) {
  const t = await Trip.findById(tripId).lean();
  return { available: t!.availableSeats, locked: t!.lockedSeats, sold: t!.soldSeats };
}

async function main() {
  console.log("\nSessions signées");
  await test("un jeton signé est accepté", () => {
    const token = signSession({ uid: "u1", role: "PASSENGER" });
    assert.equal(verifySessionToken(token)?.uid, "u1");
  });
  await test("un rôle modifié dans le jeton est rejeté", () => {
    const token = signSession({ uid: "u1", role: "PASSENGER" });
    const [payload, sig] = token.split(".");
    const forged = JSON.parse(Buffer.from(payload, "base64url").toString());
    forged.role = "SUPER_ADMIN";
    const forgedToken = `${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${sig}`;
    assert.equal(verifySessionToken(forgedToken), null);
  });
  await test("l'ancien cookie base64 non signé est rejeté", () => {
    const legacy = Buffer.from(JSON.stringify({ uid: "x", role: "SUPER_ADMIN" })).toString("base64");
    assert.equal(verifySessionToken(legacy), null);
  });

  console.log("\nQR, FedaPay, regex");
  await test("signature QR valide / montant falsifié rejeté / longueur invalide sans exception", () => {
    const code = generateShortCode();
    assert.match(code, /^KWR-[A-Z2-9]{6}$/);
    const sig = generateQrSignature("bk1", code, 8500);
    assert.ok(verifyQrSignature("bk1", code, 8500, sig));
    assert.ok(!verifyQrSignature("bk1", code, 8000, sig));
    assert.ok(!verifyQrSignature("bk1", code, 8500, "abc"));
  });
  await test("webhook FedaPay : signature absente, fausse ou périmée rejetée", () => {
    const secret = "wh_test_secret";
    const body = '{"entity":{"id":1}}';
    const t = Math.floor(Date.now() / 1000);
    const s = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
    assert.ok(verifyFedapaySignature(body, `t=${t},s=${s}`, secret));
    assert.ok(!verifyFedapaySignature(body, null, secret));
    assert.ok(!verifyFedapaySignature(body, `t=${t},s=${"0".repeat(64)}`, secret));
    const old = t - 3600;
    const sOld = crypto.createHmac("sha256", secret).update(`${old}.${body}`).digest("hex");
    assert.ok(!verifyFedapaySignature(body, `t=${old},s=${sOld}`, secret));
  });
  await test("escapeRegex neutralise les métacaractères", () => {
    assert.ok(new RegExp(escapeRegex("a|b.*")).test("xa|b.*y"));
    assert.ok(!new RegExp(escapeRegex("a|b")).test("b"));
  });

  console.log("\nOTP");
  await test("bon code accepté une seule fois", async () => {
    await Otp.create({ identifier: "+22901000001", method: "PHONE", code: "123456", expiresAt: new Date(Date.now() + 60000) });
    assert.ok(await consumeOtp("+22901000001", "PHONE", "123456"));
    assert.ok(!(await consumeOtp("+22901000001", "PHONE", "123456")));
  });
  await test(`code détruit après ${OTP_MAX_ATTEMPTS} erreurs (anti force brute)`, async () => {
    await Otp.create({ identifier: "+22901000002", method: "PHONE", code: "654321", expiresAt: new Date(Date.now() + 60000) });
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) assert.ok(!(await consumeOtp("+22901000002", "PHONE", "000000")));
    assert.ok(!(await consumeOtp("+22901000002", "PHONE", "654321")));
  });

  console.log("\nCycle de vie paiement / sièges");
  await test("expiration : TOUTES les places réservées sont rendues (3 places)", async () => {
    const trip = await makeTrip(10);
    const b = await makePendingBooking(trip._id, 3, new Date(Date.now() - 1000));
    assert.ok(await expireBookingIfStale(b._id));
    assert.deepEqual(await seatsOf(trip._id), { available: 10, locked: 0, sold: 0 });
    assert.ok(!(await expireBookingIfStale(b._id)), "une 2e expiration ne doit rien rendre");
    assert.deepEqual(await seatsOf(trip._id), { available: 10, locked: 0, sold: 0 });
  });
  await test("balayage : seules les réservations périmées sont libérées", async () => {
    const trip = await makeTrip(10);
    await makePendingBooking(trip._id, 2, new Date(Date.now() - 1000));
    await makePendingBooking(trip._id, 1, new Date(Date.now() + 60000));
    assert.equal(await releaseExpiredBookings({ tripId: trip._id }), 1);
    assert.deepEqual(await seatsOf(trip._id), { available: 9, locked: 1, sold: 0 });
  });
  await test("paiement confirmé : idempotent face aux renvois du webhook", async () => {
    const trip = await makeTrip(10);
    const b = await makePendingBooking(trip._id, 2, new Date(Date.now() + 60000));
    assert.equal(await confirmPaidBooking(b._id, "tx1"), "CONFIRMED");
    assert.equal(await confirmPaidBooking(b._id, "tx1"), "ALREADY_CONFIRMED");
    assert.deepEqual(await seatsOf(trip._id), { available: 8, locked: 0, sold: 2 });
  });
  await test("webhooks simultanés : un seul compte la vente", async () => {
    const trip = await makeTrip(10);
    const b = await makePendingBooking(trip._id, 1, new Date(Date.now() + 60000));
    await Promise.all(Array.from({ length: 5 }, () => confirmPaidBooking(b._id, "tx2")));
    assert.deepEqual(await seatsOf(trip._id), { available: 9, locked: 0, sold: 1 });
  });
  await test("paiement tardif avec place libre : billet reconfirmé", async () => {
    const trip = await makeTrip(10);
    const b = await makePendingBooking(trip._id, 1, new Date(Date.now() - 1000));
    await expireBookingIfStale(b._id);
    assert.equal(await confirmPaidBooking(b._id, "tx3"), "LATE_CONFIRMED");
    assert.deepEqual(await seatsOf(trip._id), { available: 9, locked: 0, sold: 1 });
  });
  await test("paiement tardif sans place : marqué à rembourser, pas de surbooking", async () => {
    const trip = await makeTrip(1);
    const b = await makePendingBooking(trip._id, 1, new Date(Date.now() - 1000));
    await expireBookingIfStale(b._id);
    await Trip.updateOne({ _id: trip._id }, { $inc: { availableSeats: -1, soldSeats: 1 } }); // place revendue
    assert.equal(await confirmPaidBooking(b._id, "tx4"), "NEEDS_REFUND");
    assert.equal((await Booking.findById(b._id))!.needsRefund, true);
    assert.deepEqual(await seatsOf(trip._id), { available: 0, locked: 0, sold: 1 });
  });
  await test("paiement refusé : places rendues", async () => {
    const trip = await makeTrip(10);
    const b = await makePendingBooking(trip._id, 4, new Date(Date.now() + 60000));
    assert.ok(await cancelPendingBooking(b._id));
    assert.deepEqual(await seatsOf(trip._id), { available: 10, locked: 0, sold: 0 });
  });

  console.log(`\n${passed} tests réussis.\n`);
}

(async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  try {
    await main();
  } catch (err) {
    console.error("\n✗ ÉCHEC :", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
})();
