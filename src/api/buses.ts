import { apiClient } from './client';
import { Bus } from '../mock/transportData';

const normalizeBus = (raw: any): Bus => ({
  id: raw.id,
  plate: raw.plate,
  type: raw.type,
  capacity: raw.capacity,
  status: raw.status ?? 'active',
  driver: raw.driver ?? null,
  org: raw.org ?? undefined,
  device_id: raw.device_id,
  routes: raw.routes,
  created_at: raw.created_at,
  updated_at: raw.updated_at,
});

export const getBuses = async (params?: {
  q?: string;
  status?: 'active' | 'inactive';
  driver_id?: string;
  org_id?: string;
}) => {
  const allBuses: Bus[] = [];
  let page = 1;
  let total = 0;
  const limit = 100;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (params?.q) searchParams.append('q', params.q);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.driver_id) searchParams.append('driver_id', params.driver_id);
    if (params?.org_id) searchParams.append('org_id', params.org_id);

    const response = await apiClient(`/buses?${searchParams.toString()}`, {
      method: 'GET',
    });

    let batch: any[] = [];
    if (response?.data && Array.isArray(response.data)) {
      batch = response.data;
      total = response.total ?? batch.length;
    } else if (response?.buses && Array.isArray(response.buses)) {
      batch = response.buses;
      total = batch.length;
    } else if (Array.isArray(response)) {
      batch = response;
      total = batch.length;
    }

    allBuses.push(...batch.map(normalizeBus));
    page += 1;
  } while (allBuses.length < total);

  return allBuses;
};

export const getBusesCount = async () => {
  const response = await apiClient('/buses?limit=1', { method: 'GET' });
  return response?.total ?? response?.data?.length ?? 0;
};

export const getBusById = async (busId: string): Promise<Bus> => {
  const response = await apiClient(`/buses/${busId}`, { method: 'GET' });
  return normalizeBus(response);
};

export const createBus = async (busData: {
  plate: string;
  type: string;
  capacity: number;
  device_id?: string;
  driver_id?: string;
  route_ids?: string[];
  org_id?: string;
}) => {
  const response = await apiClient('/buses', {
    method: 'POST',
    body: busData,
  });
  return normalizeBus(response);
};

export const updateBus = async (
  busId: string,
  busData: {
    plate?: string;
    type?: string;
    capacity?: number;
    device_id?: string | null;
    status?: 'active' | 'inactive';
    driver_id?: string | null;
    route_ids?: string[];
  }
) => {
  const response = await apiClient(`/buses/${busId}`, {
    method: 'PATCH',
    body: busData,
  });
  return normalizeBus(response);
};

export const deleteBus = async (busId: string) => {
  return apiClient(`/buses/${busId}`, { method: 'DELETE' });
};

export interface BusTrip {
  id: string;
  departure_at: string;
  status: string;
  route: { id: string; name: string };
  booked_seats: number;
  total_seats: number;
  remaining_seats: number;
}

export const getBusTrips = async (busId: string, limit = 5) => {
  const response = await apiClient(`/buses/${busId}/trips?limit=${limit}`, {
    method: 'GET',
  });

  if (response?.data && Array.isArray(response.data)) {
    return response.data as BusTrip[];
  }

  if (Array.isArray(response)) {
    return response as BusTrip[];
  }

  return [];
};
