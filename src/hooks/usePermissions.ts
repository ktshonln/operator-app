import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/client';
import { 
  hasPermission, 
  canManageUsers, 
  canManageRoles, 
  canManageOrganizations,
  canViewOrganizations,
  canManageInvitations,
  canManageOrgDocuments,
  canViewAuditLogs,
  canManageNotifications,
  isPlatformAdmin,
  isOrgAdmin,
  getUserOrgScope,
  canAccessOrganization,
  getAvailableMenuItems,
  User
} from '../utils/permissions';

export const usePermissions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await apiClient('/users/me', { method: 'GET' });
      setUser(userData);
    } catch (err: any) {
      console.error('Failed to fetch user permissions:', err);
      setError(err.message || 'Failed to load permissions');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchUserPermissions();
  };

  // Memoize permission checks to prevent excessive re-calculations
  const permissionChecks = useMemo(() => {
    if (!user) {
      return {
        canManageUsers: false,
        canManageRoles: false,
        canManageOrganizations: false,
        canViewOrganizations: false,
        canManageInvitations: false,
        canManageOrgDocuments: false,
        canViewAuditLogs: false,
        canManageNotifications: false,
        isPlatformAdmin: false,
        isOrgAdmin: false,
        getUserOrgScope: null,
      };
    }

    return {
      canManageUsers: canManageUsers(user),
      canManageRoles: canManageRoles(user),
      canManageOrganizations: canManageOrganizations(user),
      canViewOrganizations: canViewOrganizations(user),
      canManageInvitations: canManageInvitations(user),
      canManageOrgDocuments: canManageOrgDocuments(user),
      canViewAuditLogs: canViewAuditLogs(user),
      canManageNotifications: canManageNotifications(user),
      isPlatformAdmin: isPlatformAdmin(user),
      isOrgAdmin: isOrgAdmin(user),
      getUserOrgScope: getUserOrgScope(user),
    };
  }, [user]);

  // Permission check functions
  const checkPermission = (action: string, subject: string, resourceId?: string) => {
    return hasPermission(user, action, subject, resourceId);
  };

  return {
    // User data
    user,
    loading,
    error,
    refetch,

    // Permission check functions
    checkPermission,
    ...permissionChecks,

    // Utility functions
    canAccessOrganization: (orgId: string) => canAccessOrganization(user, orgId),
    getAvailableMenuItems: getAvailableMenuItems(user),
  };
};