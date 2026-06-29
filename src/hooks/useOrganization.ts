import { useState, useEffect, useCallback } from 'react';
import { getMyOrganization, updateOrganization } from '../api/client';
import { Organization } from '../types/organization';
import { useAuth } from '../contexts/AuthContext';

export const useOrganization = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = authUser;

      if (!user) {
        setOrganization(null);
        setIsPlatformAdmin(false);
        return;
      }

      if (!user.org_id) {
        console.log('useOrganization: Platform admin detected, no org fetch needed');
        setIsPlatformAdmin(true);
        setOrganization(null);
        setError(null);
        return;
      }

      console.log('useOrganization: Fetching organization for org admin');
      setIsPlatformAdmin(false);
      const orgData = await getMyOrganization();
      setOrganization(orgData);
    } catch (err: any) {
      console.error('Fetch organization error:', err);

      if (err.data?.error?.code === 'ORG_NOT_FOUND') {
        if (!user.org_id) {
          // Swagger: 404 when JWT has no org_id (passengers, platform admins)
          console.log('useOrganization: ORG_NOT_FOUND, no org_id on user — platform scope');
          setIsPlatformAdmin(true);
          setOrganization(null);
          setError(null);
        } else {
          // User has org_id but user-service returned 404 — data inconsistency
          console.error('useOrganization: ORG_NOT_FOUND despite org_id on profile:', user.org_id);
          setIsPlatformAdmin(false);
          setOrganization(null);
          setError(
            'Your organization profile could not be loaded. Log out and back in, or contact Katisha support.',
          );
        }
      } else {
        console.warn('Could not fetch organization:', err);
        setError(err.message || 'Failed to fetch organization');
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  const updateOrg = async (data: Partial<Organization>) => {
    if (!organization) return;
    
    try {
      setUpdating(true);
      setError(null);
      const updatedOrg = await updateOrganization(organization.id, data);
      setOrganization(updatedOrg);
      return updatedOrg;
    } catch (err: any) {
      console.error('Update organization error:', err);
      setError(err.message || 'Failed to update organization');
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setOrganization(null);
      setIsPlatformAdmin(false);
      setLoading(false);
      return;
    }
    void fetchOrganization();
  }, [isAuthenticated, authUser?.id, authUser?.org_id, fetchOrganization]);

  return {
    organization,
    loading,
    updating,
    error,
    isPlatformAdmin,
    refetch: fetchOrganization,
    updateOrganization: updateOrg,
  };
};