import type {
  ActivityDateFilter,
  ActivityItem,
  ActivityTypeFilter,
  TimeSlotFilter,
  TripDateFilter,
  TripItem,
} from "./types";

export interface TripFilters {
  tripDateFilter: TripDateFilter;
  tripCustomDate: string;
  tripTimeFilter: TimeSlotFilter;
  tripCompanyFilter: string;
  tripStatusFilter: string;
  tripSearch: string;
}

export interface ActivityFilters {
  activityDateFilter: ActivityDateFilter;
  activityCustomDate: string;
  activityTimeFilter: TimeSlotFilter;
  activityTypeFilter: ActivityTypeFilter;
  activitySearch: string;
}

/** Filtre des départs (onglet OPERATIONS) : date, créneau horaire, compagnie, statut et recherche. */
export function filterTrips(trips: TripItem[], filters: TripFilters): TripItem[] {
  const { tripDateFilter, tripCustomDate, tripTimeFilter, tripCompanyFilter, tripStatusFilter, tripSearch } = filters;
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return trips.filter((t) => {
    // 1. Filtre par Date
    if (tripDateFilter === "TODAY" && t.departureDate !== todayStr) return false;
    if (tripDateFilter === "TOMORROW" && t.departureDate !== tomorrowStr) return false;
    if (tripDateFilter === "CUSTOM" && t.departureDate !== tripCustomDate) return false;

    // 2. Filtre par Créneau Horaire
    if (tripTimeFilter !== "ALL" && t.departureTime) {
      const hour = parseInt(t.departureTime.split(":")[0], 10);
      if (tripTimeFilter === "MORNING" && (hour < 5 || hour >= 12)) return false;
      if (tripTimeFilter === "AFTERNOON" && (hour < 12 || hour >= 18)) return false;
      if (tripTimeFilter === "EVENING" && (hour < 18 || hour >= 24)) return false;
    }

    // 3. Filtre par Compagnie
    if (tripCompanyFilter !== "ALL" && t.companyName !== tripCompanyFilter) return false;

    // 4. Filtre par Statut
    if (tripStatusFilter !== "ALL" && t.status !== tripStatusFilter) return false;

    // 5. Recherche textuelle
    if (tripSearch.trim()) {
      const q = tripSearch.toLowerCase();
      const matches =
        t.tripCode.toLowerCase().includes(q) ||
        t.companyName.toLowerCase().includes(q) ||
        t.originCity.toLowerCase().includes(q) ||
        t.destinationCity.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });
}

/** Filtre du flux d'activité réseau (onglet OVERVIEW) : date, créneau horaire, type et recherche. */
export function filterActivity(activity: ActivityItem[], filters: ActivityFilters): ActivityItem[] {
  const { activityDateFilter, activityCustomDate, activityTimeFilter, activityTypeFilter, activitySearch } = filters;
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  return activity.filter((act) => {
    const actDate = act.createdAt ? new Date(act.createdAt).toISOString().split("T")[0] : "";
    const actHour = act.createdAt ? new Date(act.createdAt).getHours() : 0;

    // 1. Filtre par Date
    if (activityDateFilter === "TODAY" && actDate !== todayStr) return false;
    if (activityDateFilter === "YESTERDAY" && actDate !== yesterdayStr) return false;
    if (activityDateFilter === "CUSTOM" && actDate !== activityCustomDate) return false;

    // 2. Filtre par Créneau Horaire
    if (activityTimeFilter === "MORNING" && (actHour < 5 || actHour >= 12)) return false;
    if (activityTimeFilter === "AFTERNOON" && (actHour < 12 || actHour >= 18)) return false;
    if (activityTimeFilter === "EVENING" && (actHour < 18 || actHour >= 24)) return false;

    // 3. Filtre par Type d'événement
    if (activityTypeFilter !== "ALL" && act.type !== activityTypeFilter) return false;

    // 4. Recherche textuelle
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const matches =
        act.passengerName.toLowerCase().includes(q) ||
        act.shortCode.toLowerCase().includes(q) ||
        act.route.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });
}
