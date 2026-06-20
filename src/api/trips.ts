import { apiClient } from './client';
import { Trip } from '../mock/transportData';

export interface TripTicket {
  id: string;
  passenger_name: string;
  phone: string;
  boarding_stop: { id: string; name: string };
  alighting_stop: { id: string; name: string };
  seats_count: number;
  amount: number;
  currency?: string;
  payment_method: string;
  status: string;
  booked_at: string;
}

const normalizeTrip = (raw: any): Trip => ({
  id: raw.id,
  departure_at: raw.departure_at,
  status: raw.status ?? 'scheduled',
  is_express: raw.is_express ?? false,
  total_seats: raw.total_seats ?? 0,
  booked_seats: raw.booked_seats ?? 0,
  remaining_seats: raw.remaining_seats ?? raw.available_seats ?? 0,
  route: raw.route ?? { id: '', name: 'Unknown route' },
  bus: raw.bus ?? { id: '', plate: 'Unassigned', type: '' },
  driver: raw.driver ?? null,
  series: raw.series ?? null,
  created_at: raw.created_at ?? raw.departure_at,
  updated_at: raw.updated_at ?? raw.departure_at,
});

export const getTrips = async (params?: {
  route_id?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  driver_id?: string;
  from?: string;
  to?: string;
  unassigned_only?: boolean;
  org_id?: string;
  limit?: number;
}) => {
  const allTrips: Trip[] = [];
  let page = 1;
  let total = 0;
  const limit = params?.limit ?? 100;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (params?.route_id) searchParams.append('route_id', params.route_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.driver_id) searchParams.append('driver_id', params.driver_id);
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    if (params?.unassigned_only) searchParams.append('unassigned_only', 'true');
    if (params?.org_id) searchParams.append('org_id', params.org_id);

    const response = await apiClient(`/trips?${searchParams.toString()}`, {
      method: 'GET',
    });

    let batch: any[] = [];
    if (response?.data && Array.isArray(response.data)) {
      batch = response.data;
      total = response.total ?? batch.length;
    } else if (response?.trips && Array.isArray(response.trips)) {
      batch = response.trips;
      total = batch.length;
    } else if (Array.isArray(response)) {
      batch = response;
      total = batch.length;
    }

    allTrips.push(...batch.map(normalizeTrip));
    page += 1;
  } while (allTrips.length < total);

  return allTrips;
};

export const getTripById = async (tripId: string): Promise<Trip> => {
  const response = await apiClient(`/trips/${tripId}`, { method: 'GET' });
  return normalizeTrip(response);
};

export const createTripSeries = async (tripData: {
  route_id: string;
  bus_id?: string;
  driver_id?: string;
  total_seats?: number;
  is_express?: boolean;
  departure_time: string;
  starts_on: string;
  repeat_daily?: boolean;
  frequency_minutes?: number;
  ends_on?: string;
}) => {
  const response = await apiClient('/trips', {
    method: 'POST',
    body: tripData,
  });

  const trips = (response?.trips ?? []).map(normalizeTrip);
  return {
    trips_created: response?.trips_created ?? trips.length,
    trips,
  };
};

export const updateTrip = async (
  tripId: string,
  tripData: {
    bus_id?: string | null;
    driver_id?: string | null;
    total_seats?: number;
    is_express?: boolean;
    departure_at?: string;
    scope?: 'this' | 'future';
  }
) => {
  const response = await apiClient(`/trips/${tripId}`, {
    method: 'PATCH',
    body: tripData,
  });
  return normalizeTrip(response);
};

export const deleteTrip = async (tripId: string, scope: 'this' | 'future' = 'this') => {
  return apiClient(`/trips/${tripId}?scope=${scope}`, { method: 'DELETE' });
};

export const activateTrip = async (tripId: string) => {
  const response = await apiClient(`/trips/${tripId}/activate`, { method: 'POST' });
  return normalizeTrip(response);
};

export const completeTrip = async (tripId: string) => {
  const response = await apiClient(`/trips/${tripId}/complete`, { method: 'POST' });
  return normalizeTrip(response);
};

export const getTripTickets = async (tripId: string, limit = 50) => {
  const response = await apiClient(`/trips/${tripId}/tickets?limit=${limit}`, {
    method: 'GET',
  });

  if (response?.data && Array.isArray(response.data)) {
    return response.data as TripTicket[];
  }

  if (Array.isArray(response)) {
    return response as TripTicket[];
  }

  return [];
};
