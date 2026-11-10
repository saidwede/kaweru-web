"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { TripItem, CurrentUser, BookingSuccessData } from "./_home/types";
import { getLocalDateString } from "./_home/utils";
import SiteHeader from "./_home/SiteHeader";
import SearchForm from "./_home/SearchForm";
import PhoneMockup from "./_home/PhoneMockup";
import HowItWorks from "./_home/HowItWorks";
import TripResults from "./_home/TripResults";
import BookingModal from "./_home/BookingModal";
import SiteFooter from "./_home/SiteFooter";

export default function Home() {
  const router = useRouter();

  const todayStr = useMemo(() => getLocalDateString(0), []);
  const tomorrowStr = useMemo(() => getLocalDateString(1), []);

  // Trajet sélectionné
  const [origin, setOrigin] = useState("Cotonou");
  const [destination, setDestination] = useState("Parakou");
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(0));

  // État utilisateur authentifié
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Départs réels
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [tripsError, setTripsError] = useState<string | null>(null);

  // Modal de réservation
  const [selectedTripForBooking, setSelectedTripForBooking] =
    useState<TripItem | null>(null);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [seatsCount, setSeatsCount] = useState<number>(1);
  const [isCustomSeats, setIsCustomSeats] = useState(false);
  const [customSeatsCount, setCustomSeatsCount] = useState<number>(5);
  const [couponCode, setCouponCode] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] =
    useState<BookingSuccessData | null>(null);

  // Vérification de la session utilisateur
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          const fullName =
            data.user.fullName ||
            [data.user.firstName, data.user.lastName].filter(Boolean).join(" ");
          if (fullName) setPassengerName(fullName);
          if (data.user.phone) setPassengerPhone(data.user.phone);
          if (data.user.email) setPassengerEmail(data.user.email);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Chargement des départs (filtrage par origine, destination et date)
  const fetchDepartures = async (
    fromCity: string,
    toCity: string,
    travelDate?: string
  ) => {
    try {
      setLoadingTrips(true);
      setTripsError(null);
      const dateToUse = travelDate !== undefined ? travelDate : selectedDate;
      if (!dateToUse || dateToUse.trim() === "") {
        setTrips([]);
        return;
      }
      const url = `/api/trips?origin=${encodeURIComponent(
        fromCity
      )}&destination=${encodeURIComponent(toCity)}&date=${encodeURIComponent(
        dateToUse
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTrips(data.data);
      } else {
        setTrips([]);
      }
    } catch {
      setTripsError("Impossible de charger les départs en temps réel.");
    } finally {
      setLoadingTrips(false);
    }
  };

  // Chargement initial des départs Cotonou -> Parakou avec la date du jour
  useEffect(() => {
    fetchDepartures(origin, destination, selectedDate);
  }, []);

  // Inverser départ et arrivée
  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    fetchDepartures(destination, temp, selectedDate);
  };

  // Clic sur "Rechercher un départ"
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin === destination) {
      alert("La ville de départ et la destination doivent être différentes.");
      return;
    }
    fetchDepartures(origin, destination, selectedDate);
    // Défilement doux vers la liste des départs
    const target = document.getElementById("departs");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Ouvrir le modal de réservation
  const handleOpenBooking = (trip: TripItem) => {
    setSelectedTripForBooking(trip);
    setBookingError(null);
    setBookingSuccess(null);
    setSeatsCount(1);
    setIsCustomSeats(false);
    setCouponCode("");

    if (currentUser) {
      const fullName =
        currentUser.fullName ||
        [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ");
      if (fullName) setPassengerName(fullName);
      if (currentUser.phone) setPassengerPhone(currentUser.phone);
      if (currentUser.email) setPassengerEmail(currentUser.email);
    }
  };

  // Fermer le modal
  const handleCloseBooking = () => {
    setSelectedTripForBooking(null);
    setBookingSuccess(null);
    setBookingError(null);
  };

  // Déconnexion
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.refresh();
  };

  // Soumission de la réservation
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripForBooking) return;

    if (!passengerName.trim()) {
      setBookingError("Veuillez renseigner le nom complet du voyageur.");
      return;
    }
    if (!passengerPhone.trim()) {
      setBookingError("Veuillez renseigner un numéro de téléphone béninois.");
      return;
    }

    const effectiveSeats = isCustomSeats ? customSeatsCount : seatsCount;
    if (effectiveSeats < 1 || effectiveSeats > 50) {
      setBookingError("Le nombre de places doit être compris entre 1 et 50.");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripForBooking.id,
          originCity:
            selectedTripForBooking.requestedOrigin ||
            selectedTripForBooking.originCity,
          destinationCity:
            selectedTripForBooking.requestedDestination ||
            selectedTripForBooking.destinationCity,
          passengerName: passengerName.trim(),
          passengerPhone: passengerPhone.trim(),
          passengerEmail: passengerEmail.trim() || undefined,
          seatsCount: effectiveSeats,
          couponCode: couponCode.trim() || undefined,
          userId: currentUser?.uid || currentUser?.id || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setBookingSuccess(data.data);
        // Rafraîchir les places disponibles sur le voyage
        fetchDepartures(origin, destination);
      } else {
        setBookingError(
          data.error?.message ||
            data.error ||
            "Impossible d'enregistrer la réservation."
        );
      }
    } catch {
      setBookingError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setBookingLoading(false);
    }
  };

  const effectiveSeats = isCustomSeats ? customSeatsCount : seatsCount;
  const unitPrice = selectedTripForBooking?.price || 8000;
  const calculatedTotal = unitPrice * effectiveSeats;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#FF6500] selection:text-white">
      {/* 1. TOP NAVBAR */}
      <SiteHeader
        authChecked={authChecked}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />

      {/* 2. HERO SECTION : RECHERCHE DE DÉPARTS & MOCKUP SIGNATURE */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* GAUCHE : Formulaire de recherche interactif (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Voyagez à travers le Bénin avec un confort absolu.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Visualisez votre bus, réservez sans faire la queue en gare et payez en direct par Mobile Money (MTN MoMo & Moov). Zéro déplacement inutile, zéro surbooking garanti.
              </p>

              <SearchForm
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                todayStr={todayStr}
                tomorrowStr={tomorrowStr}
                trips={trips}
                setTrips={setTrips}
                loadingTrips={loadingTrips}
                fetchDepartures={fetchDepartures}
                handleSearch={handleSearch}
                handleSwapCities={handleSwapCities}
              />
            </div>

            {/* DROITE : Mockup Smartphone Kaweru (5 cols) */}
            <PhoneMockup trips={trips} handleOpenBooking={handleOpenBooking} />
          </div>
        </div>
      </section>

      {/* 3. SECTION EXPÉRIENCE PASSAGER */}
      <HowItWorks />

      {/* 4. SECTION DES CARTES DE DÉPARTS RÉELS EN BDD */}
      <TripResults
        origin={origin}
        destination={destination}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        trips={trips}
        loadingTrips={loadingTrips}
        fetchDepartures={fetchDepartures}
        handleOpenBooking={handleOpenBooking}
      />

      {/* =================================================================== */}
      {/* MODAL DE RÉSERVATION EN DIRECT                                      */}
      {/* =================================================================== */}
      {selectedTripForBooking && (
        <BookingModal
          selectedTripForBooking={selectedTripForBooking}
          bookingSuccess={bookingSuccess}
          bookingError={bookingError}
          bookingLoading={bookingLoading}
          passengerName={passengerName}
          setPassengerName={setPassengerName}
          passengerPhone={passengerPhone}
          setPassengerPhone={setPassengerPhone}
          passengerEmail={passengerEmail}
          setPassengerEmail={setPassengerEmail}
          seatsCount={seatsCount}
          setSeatsCount={setSeatsCount}
          isCustomSeats={isCustomSeats}
          setIsCustomSeats={setIsCustomSeats}
          customSeatsCount={customSeatsCount}
          setCustomSeatsCount={setCustomSeatsCount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          calculatedTotal={calculatedTotal}
          handleCloseBooking={handleCloseBooking}
          handleSubmitBooking={handleSubmitBooking}
        />
      )}

      {/* 5. FOOTER AVEC CONTACT OFFICIEL KAWERU */}
      <SiteFooter currentUser={currentUser} />
    </div>
  );
}
