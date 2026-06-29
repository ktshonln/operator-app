import { apiClient } from './client';
import { Route, RouteStop } from '../mock/transportData';

const normalizeRouteStop = (raw: any): RouteStop => ({
  id: raw.id,
  location_id: raw.location_id ?? raw.stop?.id ?? raw.location?.id ?? '',
  name: raw.name ?? raw.stop?.name ?? raw.location?.name ?? 'Stop',
  order: raw.order ?? 0,
});

export const normalizeRoute = (raw: any): Route => {
  const data = raw?.data ?? raw;
  const stops = (data.stops ?? data.route_stops ?? []).map(normalizeRouteStop);
  const status = data.status ?? (data.is_active === true ? 'active' : 'inactive');

  return {
    id: data.id,
    name: data.name ?? 'Route',
    status,
    stops_count: data.stops_count ?? stops.length,
    origin: data.origin,
    destination: data.destination,
    org: data.org ?? (data.org_id ? { id: data.org_id, name: data.org_name ?? '' } : null),
    prices_complete: data.prices_complete,
    stops,
    created_at: data.created_at ?? new Date().toISOString(),
  };
};

// Route Management API functions
export const getRoutes = async (params?: { q?: string }) => {
  const allRoutes: any[] = [];
  let page = 1;
  let total = 0;
  const limit = 100;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (params?.q) {
      searchParams.append('q', params.q);
    }

    const response = await apiClient(`/routes?${searchParams.toString()}`, {
      method: 'GET',
    });

    let batch: any[] = [];
    if (response?.data && Array.isArray(response.data)) {
      batch = response.data;
      total = response.total ?? batch.length;
    } else if (response?.routes && Array.isArray(response.routes)) {
      batch = response.routes;
      total = batch.length;
    } else if (Array.isArray(response)) {
      batch = response;
      total = batch.length;
    }

    allRoutes.push(...batch.map(normalizeRoute));
    page += 1;
  } while (allRoutes.length < total);

  return allRoutes;
};

export const getRouteById = async (routeId: string) => {
  const response = await apiClient(`/routes/${routeId}`, {
    method: 'GET',
  });
  return normalizeRoute(response);
};

export const createRoute = async (
  routeData: {
    name?: string;
    stops: Array<{ location_id: string; order: number }>;
  },
  options?: { orgId?: string; includeOrgIdInBody?: boolean },
) => {
  const body: Record<string, unknown> = {
    stops: routeData.stops,
  };
  if (routeData.name?.trim()) {
    body.name = routeData.name.trim();
  }
  if (options?.includeOrgIdInBody && options.orgId) {
    body.org_id = options.orgId;
  }

  console.log('createRoute payload:', JSON.stringify(body));

  const response = await apiClient('/routes', {
    method: 'POST',
    body,
  });
  return normalizeRoute(response);
};

export const updateRoute = async (routeId: string, routeData: {
  name?: string;
  status?: 'active' | 'inactive';
}) => {
  return apiClient(`/routes/${routeId}`, {
    method: 'PATCH',
    body: routeData,
  });
};

export const deleteRoute = async (routeId: string) => {
  return apiClient(`/routes/${routeId}`, {
    method: 'DELETE',
  });
};
