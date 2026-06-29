/** Build /organizations/me/* URLs with optional org_id for platform admins. */
export const orgMeUrl = (
  suffix: string,
  orgId?: string,
  params?: Record<string, string | number>,
) => {
  const searchParams = new URLSearchParams();
  if (orgId) searchParams.set('org_id', orgId);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
  }

  const normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
  const path = `/organizations/me${normalizedSuffix}`;
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
};

export const withOrgIdBody = <T extends Record<string, unknown>>(data: T, orgId?: string) =>
  orgId ? { ...data, org_id: orgId } : data;

/** Platform admins scope org-scoped POST/PATCH via query (body org_id is rejected on /trips) */
export const withOrgIdQuery = (path: string, orgId?: string): string => {
  if (!orgId) return path;
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  params.set('org_id', orgId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

/** @deprecated Gateway strips client X-Org-ID — use withOrgIdQuery for trip mutations */
export const withOrgIdHeader = (orgId?: string): Record<string, string> =>
  orgId ? { 'X-Org-ID': orgId } : {};
