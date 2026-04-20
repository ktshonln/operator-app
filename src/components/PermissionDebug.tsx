import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { COLORS } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';

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
        Org ID: {user.org_id || 'null (Platform Admin)'}
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