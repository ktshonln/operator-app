import { useState, useEffect } from 'react';
import { getMyOrganization, updateOrganization } from '../api/client';
import { Organization } from '../types/organization';

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgData = await getMyOrganization();
      setOrganization(orgData);
    } catch (err: any) {
      console.error('Fetch organization error:', err);
      setError(err.message || 'Failed to fetch organization');
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
    refetch: fetchOrganization,
    updateOrganization: updateOrg,
  };
};