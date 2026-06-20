import { apiClient } from './client';

// Location Management API functions
export const getLocations = async (params?: { q?: string }) => {
  let endpoint = '/locations';
  
  if (params?.q) {
    endpoint += `?q=${encodeURIComponent(params.q)}`;
  }
  
  const response = await apiClient(endpoint, {
    method: 'GET',
  });
  
  // Paginated API: { data: [...], total, page, limit }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }

  // Legacy shape: { locations: [...] }
  if (response?.locations && Array.isArray(response.locations)) {
    return response.locations;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
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
