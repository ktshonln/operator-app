import { apiClient } from './client';
import { Price } from '../mock/transportData';

export const getPrices = async (params?: {
  boarding_stop_id?: string;
  alighting_stop_id?: string;
}) => {
  const allPrices: Price[] = [];
  let page = 1;
  let total = 0;
  const limit = 100;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (params?.boarding_stop_id) {
      searchParams.append('boarding_stop_id', params.boarding_stop_id);
    }
    if (params?.alighting_stop_id) {
      searchParams.append('alighting_stop_id', params.alighting_stop_id);
    }

    const response = await apiClient(`/prices?${searchParams.toString()}`, {
      method: 'GET',
    });

    let batch: Price[] = [];
    if (response?.data && Array.isArray(response.data)) {
      batch = response.data;
      total = response.total ?? batch.length;
    } else if (response?.prices && Array.isArray(response.prices)) {
      batch = response.prices;
      total = batch.length;
    } else if (Array.isArray(response)) {
      batch = response;
      total = batch.length;
    }

    allPrices.push(...batch);
    page += 1;
  } while (allPrices.length < total);

  return allPrices;
};

/** Create or update one stop-pair fare (org-scoped) */
export const upsertPrice = async (data: {
  boarding_stop_id: string;
  alighting_stop_id: string;
  amount: number;
}) => {
  return apiClient('/prices', {
    method: 'PUT',
    body: data,
  });
};

/** Seed multiple stop-pair fares — body is { prices: [...] } only (no route_id) */
export const bulkUpsertPrices = async (
  prices: Array<{
    boarding_stop_id: string;
    alighting_stop_id: string;
    amount: number;
  }>,
) => {
  return apiClient('/prices/bulk', {
    method: 'POST',
    body: { prices },
  });
};

export const getPricesCount = async () => {
  const response = await apiClient('/prices?limit=1', { method: 'GET' });
  return response?.total ?? response?.data?.length ?? 0;
};

export const updatePrice = async (priceId: string, amount: number) => {
  return apiClient(`/prices/${priceId}`, {
    method: 'PATCH',
    body: { amount },
  });
};

/** @deprecated Use getPrices() — route-scoped prices endpoint is not available on the API */
export const getRoutePrices = async (routeId: string) => {
  return getPrices();
};

/** @deprecated Use updatePrice() */
export const updateRoutePrice = async (_routeId: string, priceId: string, amount: number) => {
  return updatePrice(priceId, amount);
};
