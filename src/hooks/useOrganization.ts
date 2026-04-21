import { useState, useEffect } from 'react';
import { getMyOrganization, updateOrganization } from '../api/client';
import { Organization } from '../types/organization';
import { authStore } from '../api/authStore';

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
      
      // Get user data from auth store instead of making API call
      const user = await authStore.getUser();
      
      if (!user) {
        setError('User not found');
        return;
      }
      
      if (!user.org_id) {
        // User is platform admin (no organization)
        console.log('useOrganization: Platform admin detected, no org fetch needed');
        setIsPlatformAdmin(true);
        setOrganization(null);
        setError(null);
        return;
      }
      
      // User belongs to an organization, fetch it
      // We need the full organization data because the Organization type has many required fields
      console.log('useOrganization: Fetching organization for org admin');
      setIsPlatformAdmin(false);
      const orgData = await getMyOrganization();
      setOrganization(orgData);
    } catch (err: any) {
      console.error('Fetch organization error:', err);
      
      // If it's ORG_NOT_FOUND, user might be platform admin
      if (err.data?.error?.code === 'ORG_NOT_FOUND') {
        console.log('useOrganization: ORG_NOT_FOUND, treating as platform admin');
        setIsPlatformAdmin(true);
        setOrganization(null);
        setError(null);
      } else {
        console.warn('Could not fetch organization:', err);
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