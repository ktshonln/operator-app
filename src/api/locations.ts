import { apiClient } from './client';

const extractLocationBatch = (response: any): { batch: any[]; total: number } => {
  if (response?.data && Array.isArray(response.data)) {
    return { batch: response.data, total: response.total ?? response.data.length };
  }
  if (response?.locations && Array.isArray(response.locations)) {
    return { batch: response.locations, total: response.locations.length };
  }
  if (Array.isArray(response)) {
    return { batch: response, total: response.length };
  }
  return { batch: [], total: 0 };
};

export const getLocations = async (params?: { q?: string }) => {
  const allLocations: any[] = [];
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

    const response = await apiClient(`/locations?${searchParams.toString()}`, {
      method: 'GET',
    });

    const { batch, total: responseTotal } = extractLocationBatch(response);
    if (page === 1) {
      total = responseTotal;
    }

    allLocations.push(...batch);
    page += 1;
  } while (allLocations.length < total);

  return allLocations;
};

export const getLocationsCount = async () => {
  const response = await apiClient('/locations?limit=1', { method: 'GET' });
  return response?.total ?? response?.data?.length ?? 0;
};

export const createLocation = async (locationData: {
  name: string;
  city: string;
  lat: number;
  lng: number;
}) => {
  return apiClient('/locations', {
    method: 'POST',
    body: locationData,
  });
};

export const updateLocation = async (locationId: string, locationData: {
  name?: string;
  city?: string;
  lat?: number;
  lng?: number;
}) => {
  return apiClient(`/locations/${locationId}`, {
    method: 'PATCH',
    body: locationData,
  });
};

export const deleteLocation = async (locationId: string) => {
  return apiClient(`/locations/${locationId}`, {
    method: 'DELETE',
  });
};
