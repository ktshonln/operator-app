import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { COLORS } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';
import { apiClient } from '../api/client';

export const PermissionDebug: React.FC = () => {
  const {
    user,
    loading,
    canManageUsers,
    canManageRoles,
    canManageOrganizations,
    canViewOrganizations,
    isPlatformAdmin,
    isOrgAdmin,
  } = usePermissions();

  const [organizationName, setOrganizationName] = useState<string>('');
  const [loadingOrgName, setLoadingOrgName] = useState(false);

  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (user?.org_id && !isPlatformAdmin) {
        setLoadingOrgName(true);
        try {
          // Fetch all organizations and find the one with matching ID
          const organizations = await apiClient('/organizations', { method: 'GET' });
          let orgs = [];
          
          if (organizations && organizations.data && Array.isArray(organizations.data)) {
            orgs = organizations.data;
          } else if (Array.isArray(organizations)) {
            orgs = organizations;
          }
          
          const userOrg = orgs.find((org: any) => org.id === user.org_id);
          setOrganizationName(userOrg?.name || `Unknown Organization (${user.org_id})`);
        } catch (error) {
          console.error('Failed to fetch organization name:', error);
          setOrganizationName(`Organization ID: ${user.org_id}`);
        } finally {
          setLoadingOrgName(false);
        }
      }
    };

    fetchOrganizationName();
  }, [user?.org_id, isPlatformAdmin]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Typography variant="caption" color={COLORS.textSecondary}>
          Loading permissions...
        </Typography>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Typography variant="caption" color="#EF4444">
          No user data
        </Typography>
      </View>
    );
  }

  const getOrganizationDisplay = () => {
    if (isPlatformAdmin) {
      return 'Platform Admin (All Organizations)';
    }
    if (loadingOrgName) {
      return 'Loading organization...';
    }
    return organizationName || 'No Organization';
  };

  return (
    <View style={styles.container}>
      <Typography variant="caption" style={styles.title}>Permission Debug</Typography>
      <Typography variant="caption" color={COLORS.textSecondary}>
        User: {user.first_name} {user.last_name}
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary}>
        Roles: {user.roles?.join(', ') || 'None'}
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary}>
        Organization: {getOrganizationDisplay()}
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary}>
        Permissions: {user.permissions?.length || 0}
      </Typography>
      
      <View style={styles.permissionChecks}>
        <Typography variant="caption" color={isPlatformAdmin ? COLORS.success : COLORS.textSecondary}>
          Platform Admin: {isPlatformAdmin ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" color={isOrgAdmin ? COLORS.success : COLORS.textSecondary}>
          Org Admin: {isOrgAdmin ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" color={canManageUsers ? COLORS.success : COLORS.textSecondary}>
          Can Manage Users: {canManageUsers ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" color={canManageRoles ? COLORS.success : COLORS.textSecondary}>
          Can Manage Roles: {canManageRoles ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" color={canManageOrganizations ? COLORS.success : COLORS.textSecondary}>
          Can Manage Orgs: {canManageOrganizations ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" color={canViewOrganizations ? COLORS.success : COLORS.textSecondary}>
          Can View Orgs: {canViewOrganizations ? 'Yes' : 'No'}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.brand + '30',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.brand,
  },
  permissionChecks: {
    marginTop: 8,
    gap: 2,
  },
});