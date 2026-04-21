import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';
import { formatPermissionForDisplay, UserPermission } from '../utils/permissions';
import { apiClient } from '../api/client';

export const UserPermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { 
    user, 
    loading, 
    error, 
    isPlatformAdmin, 
    isOrgAdmin,
    getUserOrgScope 
  } = usePermissions();

  const [organizationNames, setOrganizationNames] = useState<Record<string, string>>({});
  const [loadingOrgNames, setLoadingOrgNames] = useState(false);

  useEffect(() => {
    const fetchOrganizationNames = async () => {
      if (!user?.permissions) return;

      // Extract unique org_ids from permissions conditions
      const orgIds = new Set<string>();
      user.permissions.forEach(permission => {
        if (permission.conditions?.org_id && permission.conditions.org_id !== null) {
          orgIds.add(permission.conditions.org_id);
        }
      });

      if (orgIds.size === 0) return;

      setLoadingOrgNames(true);
      try {
        // Fetch all organizations
        const organizations = await apiClient('/organizations', { method: 'GET' });
        let orgs = [];
        
        if (organizations && organizations.data && Array.isArray(organizations.data)) {
          orgs = organizations.data;
        } else if (Array.isArray(organizations)) {
          orgs = organizations;
        }

        // Create mapping of org_id to org_name
        const nameMapping: Record<string, string> = {};
        orgIds.forEach(orgId => {
          const org = orgs.find((o: any) => o.id === orgId);
          nameMapping[orgId] = org?.name || `Unknown Organization (${orgId})`;
        });

        setOrganizationNames(nameMapping);
      } catch (error) {
        console.error('Failed to fetch organization names:', error);
        // Create fallback mapping with IDs
        const fallbackMapping: Record<string, string> = {};
        orgIds.forEach(orgId => {
          fallbackMapping[orgId] = `Organization ID: ${orgId}`;
        });
        setOrganizationNames(fallbackMapping);
      } finally {
        setLoadingOrgNames(false);
      }
    };

    fetchOrganizationNames();
  }, [user?.permissions]);

  const formatConditionValue = (key: string, value: any): string => {
    if (value === null) {
      return 'platform-wide';
    }
    
    if (key === 'org_id' && typeof value === 'string') {
      return organizationNames[value] || (loadingOrgNames ? 'Loading...' : `Organization ID: ${value}`);
    }
    
    return value;
  };

  const renderPermissionItem = (permission: UserPermission, index: number) => {
    const isManageAll = permission.action.includes('manage') && permission.subject.includes('all');
    
    return (
      <View key={index} style={styles.permissionCard}>
        <View style={styles.permissionHeader}>
          <View style={[
            styles.permissionIcon, 
            { backgroundColor: isManageAll ? '#FEF3C7' : '#E6F7ED' }
          ]}>
            <Icon 
              name={isManageAll ? "shield-check" : "check"} 
              size={16} 
              color={isManageAll ? "#F59E0B" : COLORS.success} 
            />
          </View>
          <View style={styles.permissionInfo}>
            <Typography variant="body" style={styles.permissionTitle}>
              {permission.action.join(', ').toUpperCase()} {permission.subject.join(', ').toUpperCase()}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.permissionDescription}>
              {formatPermissionForDisplay(permission)}
            </Typography>
            
            {/* Show conditions if they exist */}
            {permission.conditions && (
              <View style={styles.conditionsContainer}>
                {Object.entries(permission.conditions).map(([key, value]) => (
                  <View key={key} style={styles.conditionTag}>
                    <Typography variant="caption" style={styles.conditionText}>
                      {key === 'org_id' ? 'Organization' : key}: {formatConditionValue(key, value)}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        
        {/* Show scope indicators */}
        <View style={styles.permissionScopes}>
          {permission.action.map(action => (
            <View key={action} style={styles.scopeTag}>
              <Typography variant="caption" color={COLORS.brand} style={styles.scopeText}>
                {action.toUpperCase()}
              </Typography>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Group permissions by subject
  const groupedPermissions = user?.permissions?.reduce((groups, permission) => {
    const subjects = permission.subject.join(', ');
    if (!groups[subjects]) groups[subjects] = [];
    groups[subjects].push(permission);
    return groups;
  }, {} as Record<string, UserPermission[]>) || {};

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="My Permissions"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            Loading your permissions...
          </Typography>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert" size={48} color="#EF4444" />
          <Typography variant="body" color="#EF4444" style={{ marginTop: 16, textAlign: 'center' }}>
            {error}
          </Typography>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {user && user.permissions && user.permissions.length > 0 ? (
            <>
              {/* User Role Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.roleHeader}>
                  <Icon 
                    name={isPlatformAdmin ? "shield-check" : isOrgAdmin ? "shield" : "person"} 
                    size={24} 
                    color={isPlatformAdmin ? "#F59E0B" : isOrgAdmin ? COLORS.brand : COLORS.textSecondary} 
                  />
                  <View style={styles.roleInfo}>
                    <Typography variant="h2" style={styles.roleTitle}>
                      {isPlatformAdmin ? "Platform Administrator" : 
                       isOrgAdmin ? "Organization Administrator" : 
                       "Staff Member"}
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      {user.roles.join(', ')} • {user.permissions.length} permissions
                    </Typography>
                  </View>
                </View>
                
                {/* Organization scope */}
                {getUserOrgScope && (
                  <View style={styles.scopeInfo}>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Organization Scope: {organizationNames[getUserOrgScope] || (loadingOrgNames ? 'Loading...' : getUserOrgScope)}
                    </Typography>
                  </View>
                )}
                {isPlatformAdmin && (
                  <View style={styles.scopeInfo}>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Organization Scope: Platform-wide (All Organizations)
                    </Typography>
                  </View>
                )}
              </View>

              {/* Permissions by subject */}
              {Object.entries(groupedPermissions).map(([subject, permissions]) => (
                <View key={subject} style={styles.permissionGroup}>
                  <Typography variant="h2" style={styles.groupTitle}>
                    {subject} Permissions
                  </Typography>
                  <Typography variant="caption" color={COLORS.textSecondary} style={styles.groupSubtitle}>
                    {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                  </Typography>
                  {permissions.map((permission, index) => renderPermissionItem(permission, index))}
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="shield" size={48} color={COLORS.textSecondary} />
              <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
                No permissions found for your account
              </Typography>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  roleTitle: {
    marginBottom: 4,
    color: COLORS.text,
  },
  scopeInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  permissionGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.text,
  },
  groupSubtitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  permissionCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  permissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionDescription: {
    lineHeight: 18,
    marginBottom: 8,
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  conditionTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  permissionScopes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeTag: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scopeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
});