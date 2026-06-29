import { Role } from '../types/role';

/** Platform-defined role slugs — lowercase, exact match on the API. */
export const PLATFORM_ROLE_SLUGS = ['driver', 'org-admin', 'document-reviewer', 'platform-admin'] as const;

/** True only for the bus-driver platform role slug `driver` (lowercase). */
export const isDriverRoleSlug = (slug: string): boolean => slug.toLowerCase() === 'driver';

export const isPlatformRoleSlug = (slug: string): boolean =>
  PLATFORM_ROLE_SLUGS.includes(slug.toLowerCase() as (typeof PLATFORM_ROLE_SLUGS)[number]);

export const formatRoleSlug = (slug: string): string =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Show the API slug for platform roles (e.g. `driver`), not a title-cased label. */
export const getRoleDisplayLabel = (role: Role): string =>
  isPlatformRoleSlug(role.slug) ? role.slug : formatRoleSlug(role.slug);

export const findRoleBySlug = (roles: Role[], slug: string): Role | undefined =>
  roles.find(role => role.slug.toLowerCase() === slug.toLowerCase());

export const resolveRoleNames = (slugs: string[] | undefined, roles?: Role[]): string => {
  if (!slugs?.length) return 'No Role';

  return slugs
    .map(slug => {
      const role = roles?.find(r => r.slug.toLowerCase() === slug.toLowerCase());
      if (role) return getRoleDisplayLabel(role);
      return isPlatformRoleSlug(slug) ? slug : formatRoleSlug(slug);
    })
    .join(', ');
};
