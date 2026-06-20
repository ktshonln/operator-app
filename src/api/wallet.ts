import { apiClient } from './client';
import { orgMeUrl, withOrgIdBody } from './orgScope';

export interface OrgWallet {
  id: string;
  balance: number;
  currency: string;
  pending_balance: number;
  total_withdrawals: number;
  status: string;
  org_id?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  reference?: string;
  created_at: string;
}

const extractList = (response: any): any[] => {
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const normalizeWallet = (raw: any): OrgWallet => ({
  id: raw.id ?? raw.wallet_id ?? 'wallet',
  balance: Number(raw.balance ?? raw.available_balance ?? 0),
  currency: raw.currency ?? 'RWF',
  pending_balance: Number(raw.pending_balance ?? raw.pending_payouts ?? raw.pending ?? 0),
  total_withdrawals: Number(raw.total_withdrawals ?? raw.withdrawn_total ?? 0),
  status: raw.status ?? 'active',
  org_id: raw.org_id ?? raw.organization_id,
  updated_at: raw.updated_at,
});

const normalizeTransaction = (raw: any): WalletTransaction => ({
  id: raw.id,
  type: raw.type ?? (Number(raw.amount) < 0 ? 'debit' : 'credit'),
  amount: Math.abs(Number(raw.amount ?? 0)),
  currency: raw.currency ?? 'RWF',
  description: raw.description ?? raw.narration ?? raw.label ?? 'Transaction',
  status: raw.status ?? 'success',
  reference: raw.reference ?? raw.transaction_id ?? raw.ticket_number,
  created_at: raw.created_at ?? raw.date ?? new Date().toISOString(),
});

const tryGet = async <T>(buildUrl: () => string, parse: (response: any) => T): Promise<T | null> => {
  try {
    const response = await apiClient(buildUrl(), { method: 'GET' });
    return parse(response);
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
};

export const getOrgWallet = async (orgId?: string): Promise<OrgWallet> => {
  const walletPaths = ['/wallet', '/wallets'];

  for (const suffix of walletPaths) {
    const result = await tryGet(
      () => orgMeUrl(suffix, orgId),
      (response) => {
        const raw = response?.data ?? response;
        if (Array.isArray(raw)) return normalizeWallet(raw[0] ?? {});
        return normalizeWallet(raw);
      },
    );
    if (result) return result;
  }

  return normalizeWallet({});
};

export const getWalletTransactions = async (orgId?: string, limit = 50): Promise<WalletTransaction[]> => {
  const transactionPaths = ['/wallet/transactions', '/wallets/transactions'];

  for (const suffix of transactionPaths) {
    const result = await tryGet(
      () => orgMeUrl(suffix, orgId, { page: 1, limit }),
      (response) => extractList(response).map(normalizeTransaction),
    );
    if (result) return result;
  }

  return [];
};

export const requestWalletWithdrawal = async (
  data: { amount: number; bank_account_id: string; note?: string },
  orgId?: string,
) => {
  const endpoints = ['/wallet/withdrawals', '/withdrawals'];
  let lastError: any;

  for (const suffix of endpoints) {
    try {
      return await apiClient(orgMeUrl(suffix, orgId), {
        method: 'POST',
        body: withOrgIdBody(data, orgId),
      });
    } catch (error: any) {
      lastError = error;
      if (error.status === 404) continue;
      throw error;
    }
  }

  throw lastError ?? new Error('Withdrawal endpoint not available');
};
