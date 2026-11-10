export interface TripItem {
  id: string;
  tripCode: string;
  companyName: string;
  originCity: string;
  destinationCity: string;
  requestedOrigin?: string;
  requestedDestination?: string;
  departureDate: string;
  departureTime: string;
  departureDateTime: string;
  stationName: string;
  availableSeats: number;
  totalQuota: number;
  status: string;
  isBookable: boolean;
  busType?: string;
  amenities?: string[];
  price?: number;
  currency?: string;
}

export interface CurrentUser {
  id?: string;
  uid?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  referralPoints?: number;
}

export interface BookingSuccessData {
  bookingId: string;
  shortCode: string;
  passengerName: string;
  passengerPhone: string;
  originCity: string;
  destinationCity: string;
  departureDateTime: string;
  basePriceFcfa: number;
  serviceFeeFcfa: number;
  discountFcfa: number;
  totalToPayFcfa: number;
  lockedUntil: string;
}

export type FetchDepartures = (
  fromCity: string,
  toCity: string,
  travelDate?: string
) => Promise<void>;
