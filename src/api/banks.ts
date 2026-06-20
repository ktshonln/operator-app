import { apiClient } from './client';
import { orgMeUrl, withOrgIdBody } from './orgScope';

export interface BankCatalogItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrgBankAccount {
  id: string;
  bank_id: string;
  bank?: BankCatalogItem;
  account_number: string;
  account_name: string;
  is_default: boolean;
  org_id?: string;
  created_at?: string;
  updated_at?: string;
}

const extractList = (response: any): any[] => {
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const normalizeBankAccount = (raw: any): OrgBankAccount => ({
  id: raw.id,
  bank_id: raw.bank_id ?? raw.bank?.id ?? '',
  bank: raw.bank
    ? {
        id: raw.bank.id,
        name: raw.bank.name,
        is_active: raw.bank.is_active ?? true,
      }
    : undefined,
  account_number: raw.account_number ?? raw.accountNumber ?? '',
  account_name: raw.account_name ?? raw.accountName ?? raw.holder_name ?? '',
  is_default: raw.is_default ?? raw.isDefault ?? raw.is_primary ?? false,
  org_id: raw.org_id ?? raw.organization_id,
  created_at: raw.created_at,
  updated_at: raw.updated_at,
});

/** Public catalog of Rwanda banks (for pickers). */
export const getBankCatalog = async (): Promise<BankCatalogItem[]> => {
  const response = await apiClient('/banks', { method: 'GET' });
  return extractList(response).map((item: any) => ({
    id: item.id,
    name: item.name,
    is_active: item.is_active ?? true,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
};

/** Operator bank accounts linked to an organization. */
export const getOrgBankAccounts = async (orgId?: string): Promise<OrgBankAccount[]> => {
  const accountPaths = ['/bank-accounts', '/banks'];

  for (const suffix of accountPaths) {
    try {
      const response = await apiClient(orgMeUrl(suffix, orgId), { method: 'GET' });
      const accounts = extractList(response)
        .map(normalizeBankAccount)
        .filter(item => item.account_number);

      if (suffix === '/bank-accounts') {
        return accounts;
      }

      if (accounts.length > 0) {
        return accounts;
      }
    } catch (error: any) {
      if (error.status === 404) continue;
      throw error;
    }
  }

  return [];
};

export const createOrgBankAccount = async (
  data: {
    bank_id: string;
    account_number: string;
    account_name: string;
    is_default?: boolean;
  },
  orgId?: string,
) => {
  const response = await apiClient(orgMeUrl('/bank-accounts', orgId), {
    method: 'POST',
    body: withOrgIdBody(data, orgId),
  });
  return normalizeBankAccount(response?.data ?? response);
};

export const updateOrgBankAccount = async (
  accountId: string,
  data: {
    bank_id?: string;
    account_number?: string;
    account_name?: string;
    is_default?: boolean;
  },
  orgId?: string,
) => {
  const response = await apiClient(orgMeUrl(`/bank-accounts/${accountId}`, orgId), {
    method: 'PATCH',
    body: withOrgIdBody(data, orgId),
  });
  return normalizeBankAccount(response?.data ?? response);
};

export const deleteOrgBankAccount = async (accountId: string, orgId?: string) => {
  return apiClient(orgMeUrl(`/bank-accounts/${accountId}`, orgId), { method: 'DELETE' });
};

export const maskAccountNumber = (accountNumber: string) => {
  const trimmed = accountNumber.replace(/\s/g, '');
  if (trimmed.length <= 4) return trimmed;
  return `**** ${trimmed.slice(-4)}`;
};
