import { useState, useEffect } from 'react';
import { getMyOrganization, updateOrganization, apiClient } from '../api/client';
import { Organization } from '../types/organization';

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if user is platform admin
      const user = await apiClient('/users/me', { method: 'GET' });
      
      if (!user.org_id) {
        // User is platform admin (no organization)
        setIsPlatformAdmin(true);
        setOrganization(null);
        setError(null);
        return;
      }
      
      // User belongs to an organization, fetch it
      setIsPlatformAdmin(false);
      const orgData = await getMyOrganization();
      setOrganization(orgData);
    } catch (err: any) {
      console.error('Fetch organization error:', err);
      
      // If it's ORG_NOT_FOUND and user has no org_id, they're platform admin
      if (err.data?.error?.code === 'ORG_NOT_FOUND') {
        setIsPlatformAdmin(true);
        setOrganization(null);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch organization');
      }
    } finally {
      setLoading(false);
    }
  };

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
    fetchOrganization();
  }, []);

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