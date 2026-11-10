export interface UserProfile {
  uid: string;
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "STATION_MANAGER" | "TICKET_AGENT" | "ONBOARD_CONDUCTOR";
  companyId?: string | null;
  stationId?: string | null;
}

export interface TripSummary {
  _id: string;
  tripCode: string;
  companyId: string;
  companyName: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  busPlateNumber?: string;
  totalQuota: number;
  availableSeats: number;
  soldSeats: number;
  status: string;
  currentMilestone?: string;
}

export interface AgentItem {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: "STATION_MANAGER" | "TICKET_AGENT" | "ONBOARD_CONDUCTOR" | "COMPANY_ADMIN";
  stationId?: string;
  assignedTripId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface BookingItem {
  _id: string;
  shortCode: string;
  passengerName: string;
  passengerPhone: string;
  originCity: string;
  destinationCity: string;
  departureDateTime: string;
  totalPaidFcfa: number;
  status: string;
  boardingStatus: "NOT_BOARDED" | "BOARDED" | "DISEMBARKED";
  seatNumber?: number;
  tripId?: {
    _id: string;
    tripCode: string;
    departureDate: string;
    departureTime: string;
    busPlateNumber?: string;
  };
  companyId?: {
    name: string;
    code: string;
  };
  boardedAt?: string;
}

export interface CompanyItem {
  _id: string;
  name: string;
  code: string;
}

export type TabType = "VALIDATOR" | "TRIPS" | "TICKETS" | "AGENTS";
export type ValidationMode = "CAMERA" | "CODE" | "PHONE";

export type TripDateFilter = "TODAY" | "TOMORROW" | "ALL" | "CUSTOM";
export type TicketDateFilter = "ALL" | "TODAY" | "YESTERDAY" | "TOMORROW" | "CUSTOM";
export type TimeSlotFilter = "ALL" | "MORNING" | "AFTERNOON" | "EVENING";
export type TicketStatusFilter = "ALL" | "NOT_BOARDED" | "BOARDED" | "DISEMBARKED";
export type NotificationMsg = { type: "success" | "error" | "info"; text: string };
export type ValidateTicketFn = (queryInput?: string, action?: "VERIFY" | "CONFIRM_BOARDING") => Promise<void>;
