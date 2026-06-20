import { apiClient } from './client';
import { Price } from '../mock/transportData';

export const getPrices = async (params?: {
  boarding_stop?: string;
  alighting_stop?: string;
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
    if (params?.boarding_stop) {
      searchParams.append('boarding_stop', params.boarding_stop);
    }
    if (params?.alighting_stop) {
      searchParams.append('alighting_stop', params.alighting_stop);
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
