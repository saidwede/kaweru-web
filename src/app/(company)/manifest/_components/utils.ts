import type { BookingItem, TicketDateFilter, TicketStatusFilter, TimeSlotFilter, TripDateFilter, TripSummary } from "./types";

export function filterTrips(
  trips: TripSummary[],
  tripSearch: string,
  dateFilter: TripDateFilter,
  customDate: string,
  tripTimeFilter: TimeSlotFilter
): TripSummary[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return trips.filter((t) => {
    // 1. Filtre de date
    if (dateFilter === "TODAY" && t.departureDate !== todayStr) return false;
    if (dateFilter === "TOMORROW" && t.departureDate !== tomorrowStr) return false;
    if (dateFilter === "CUSTOM" && t.departureDate !== customDate) return false;

    // 2. Filtre de créneau horaire
    if (tripTimeFilter !== "ALL" && t.departureTime) {
      const hour = parseInt(t.departureTime.split(":")[0], 10);
      if (tripTimeFilter === "MORNING" && (hour < 5 || hour >= 12)) return false;
      if (tripTimeFilter === "AFTERNOON" && (hour < 12 || hour >= 18)) return false;
      if (tripTimeFilter === "EVENING" && (hour < 18 || hour >= 24)) return false;
    }

    // 3. Filtre de recherche textuelle
    const q = tripSearch.toLowerCase();
    return (
      t.tripCode.toLowerCase().includes(q) ||
      t.companyName.toLowerCase().includes(q) ||
      t.originCity.toLowerCase().includes(q) ||
      t.destinationCity.toLowerCase().includes(q) ||
      (t.busPlateNumber && t.busPlateNumber.toLowerCase().includes(q))
    );
  });
}

export function filterBookings(
  bookings: BookingItem[],
  ticketSearch: string,
  ticketDateFilter: TicketDateFilter,
  ticketCustomDate: string,
  ticketTimeFilter: TimeSlotFilter,
  ticketStatusFilter: TicketStatusFilter
): BookingItem[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return bookings.filter((b) => {
    const departureDate = b.tripId?.departureDate || (b.departureDateTime ? new Date(b.departureDateTime).toISOString().split("T")[0] : "");
    const departureTime = b.tripId?.departureTime || (b.departureDateTime ? new Date(b.departureDateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");

    // 1. Filtre par Date
    if (ticketDateFilter === "TODAY" && departureDate !== todayStr) return false;
    if (ticketDateFilter === "YESTERDAY" && departureDate !== yesterdayStr) return false;
    if (ticketDateFilter === "TOMORROW" && departureDate !== tomorrowStr) return false;
    if (ticketDateFilter === "CUSTOM" && departureDate !== ticketCustomDate) return false;

    // 2. Filtre par Plage Horaire
    if (ticketTimeFilter !== "ALL" && departureTime) {
      const hour = parseInt(departureTime.split(":")[0], 10);
      if (ticketTimeFilter === "MORNING" && (hour < 5 || hour >= 12)) return false;
      if (ticketTimeFilter === "AFTERNOON" && (hour < 12 || hour >= 18)) return false;
      if (ticketTimeFilter === "EVENING" && (hour < 18 || hour >= 24)) return false;
    }

    // 3. Filtre par Statut d'Embarquement
    if (ticketStatusFilter !== "ALL" && b.boardingStatus !== ticketStatusFilter) return false;

    // 4. Recherche textuelle
    const q = ticketSearch.toLowerCase();
    return (
      b.shortCode.toLowerCase().includes(q) ||
      b.passengerName.toLowerCase().includes(q) ||
      b.passengerPhone.includes(q) ||
      b.originCity.toLowerCase().includes(q) ||
      b.destinationCity.toLowerCase().includes(q)
    );
  });
}
