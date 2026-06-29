import { apiClient } from './client';
import { Bus } from '../mock/transportData';

const BUS_TYPE_LABELS: Record<string, string> = {
  coach: 'Coach',
  mini: 'Mini',
  sprinter: 'Sprinter',
};

const formatBusTypeForApi = (type: string): string => {
  const key = type.trim().toLowerCase();
  return BUS_TYPE_LABELS[key] ?? type.trim();
};

const formatBusTypeForDisplay = (type: string) => {
  const key = type.trim().toLowerCase();
  return BUS_TYPE_LABELS[key] ?? type;
};

const normalizeBus = (raw: any): Bus => ({
  id: raw.id,
  plate: raw.plate,
  type: formatBusTypeForDisplay(raw.type ?? ''),
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
  return normalizeBus(response?.data ?? response);
};

export const createBus = async (
  busData: {
    plate: string;
    type: string;
    capacity: number;
    device_id?: string;
    driver_id?: string;
    route_ids?: string[];
  },
  options?: { orgId?: string; includeOrgIdInBody?: boolean },
) => {
  const body: Record<string, unknown> = {
    plate: busData.plate.trim().toUpperCase(),
    type: formatBusTypeForApi(busData.type),
    capacity: busData.capacity,
  };

  if (busData.device_id?.trim()) body.device_id = busData.device_id.trim();
  if (busData.driver_id) body.driver_id = busData.driver_id;
  if (busData.route_ids?.length) body.route_ids = busData.route_ids;
  // Platform admins must send org_id. Org admins use JWT org context (X-Org-ID) — do not send org_id.
  if (options?.includeOrgIdInBody && options.orgId) body.org_id = options.orgId;

  console.log('createBus payload:', JSON.stringify(body));

  const response = await apiClient('/buses', {
    method: 'POST',
    body,
  });
  return normalizeBus(response?.data ?? response);
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
  return normalizeBus(response?.data ?? response);
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
