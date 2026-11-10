import type { Dispatch, SetStateAction } from "react";

export interface AdminOverviewData {
  financials: {
    totalGmvFcfa: number;
    totalCommissionFcfa: number;
    pendingSettlementFcfa: number;
    paidSettlementFcfa: number;
  };
  operations: {
    activeCompaniesCount: number;
    totalCompaniesCount: number;
    totalTripsCount: number;
    totalCapacity: number;
    totalSoldSeats: number;
    totalAvailableSeats: number;
    networkOccupancyRate: number;
    activeAgentsCount: number;
    totalPassengersCount: number;
  };
  alerts: Array<{
    id: string;
    level: "CRITICAL" | "WARNING" | "INFO";
    title: string;
    description: string;
    actionUrl?: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: "BOOKING" | "BOARDING";
    passengerName: string;
    route: string;
    amountFcfa: number;
    shortCode: string;
    status: string;
    boardingStatus: string;
    createdAt: string;
  }>;
  trendData: Array<{
    day: string;
    date: string;
    tickets: number;
    volumeFcfa: number;
  }>;
  companies: Array<{
    _id: string;
    name: string;
    code: string;
    isActive: boolean;
    settlementMomo?: {
      operator: string;
      number: string;
      holderName: string;
    };
    stationsCount: number;
  }>;
  trips: Array<{
    _id: string;
    tripCode: string;
    companyName: string;
    originCity: string;
    destinationCity: string;
    departureTime: string;
    departureDate: string;
    soldSeats: number;
    totalQuota: number;
    status: string;
    currentMilestone: string;
  }>;
}

export interface CompanyItem {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  settlementMomo?: {
    operator: string;
    number: string;
    holderName: string;
  };
  adminUser?: {
    fullName: string;
    phone: string;
    email?: string;
    isActive: boolean;
  } | null;
}

export type TabType = "OVERVIEW" | "COMPANIES" | "OPERATIONS" | "FINANCES" | "RBAC" | "REFERRAL";

export type ActivityItem = AdminOverviewData["recentActivity"][number];
export type TripItem = AdminOverviewData["trips"][number];

export type ActivityDateFilter = "ALL" | "TODAY" | "YESTERDAY" | "CUSTOM";
export type TripDateFilter = "ALL" | "TODAY" | "TOMORROW" | "CUSTOM";
export type TimeSlotFilter = "ALL" | "MORNING" | "AFTERNOON" | "EVENING";
export type ActivityTypeFilter = "ALL" | "BOOKING" | "BOARDING";
export type CompanyStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

/** Setter de useState, passé en prop aux composants enfants. */
export type StateSetter<T> = Dispatch<SetStateAction<T>>;
