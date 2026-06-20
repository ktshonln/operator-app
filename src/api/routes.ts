import { apiClient } from './client';

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

    allRoutes.push(...batch);
    page += 1;
  } while (allRoutes.length < total);

  return allRoutes;
};

export const getRouteById = async (routeId: string) => {
  return apiClient(`/routes/${routeId}`, {
    method: 'GET',
  });
};

export const createRoute = async (routeData: {
  name?: string;
  stops: Array<{ location_id: string; order: number }>;
}) => {
  return apiClient('/routes', {
    method: 'POST',
    body: routeData,
  });
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
