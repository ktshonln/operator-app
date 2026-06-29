import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
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
  canManageBuses,
  canManageLocations,
  getUserOrgScope,
  canAccessOrganization,
  getAvailableMenuItems,
  User,
} from '../utils/permissions';

export const usePermissions = () => {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (authUser?.permissions?.length) {
      setUser(authUser as User);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await apiClient('/users/me', { method: 'GET' });
      setUser(userData);
    } catch (err: any) {
      if (err?.isAborted) return;
      console.error('Failed to fetch user permissions:', err);
      setError(err.message || 'Failed to load permissions');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    if (authLoading) return;
    void fetchUserPermissions();
  }, [authLoading, fetchUserPermissions]);

  const refetch = () => {
    void fetchUserPermissions();
  };

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
        canManageBuses: false,
        canManageLocations: false,
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
      canManageBuses: canManageBuses(user),
      canManageLocations: canManageLocations(user),
      getUserOrgScope: getUserOrgScope(user),
    };
  }, [user]);

  const checkPermission = (action: string, subject: string, resourceId?: string) => {
    return hasPermission(user, action, subject, resourceId);
  };

  return {
    user,
    loading: authLoading || loading,
    error,
    refetch,
    checkPermission,
    ...permissionChecks,
    canAccessOrganization: (orgId: string) => canAccessOrganization(user, orgId),
    getAvailableMenuItems: getAvailableMenuItems(user),
  };
};
