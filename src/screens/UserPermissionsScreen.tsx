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
import { getUserPermissions } from '../api/client';
import { Permission } from '../types/role';

export const UserPermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    setLoading(true);
    try {
      const userPermissions = await getUserPermissions();
      setPermissions(userPermissions);
    } catch (error: any) {
      console.error('Failed to fetch user permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionItem = (permission: Permission) => (
    <View key={permission.id} style={styles.permissionCard}>
      <View style={styles.permissionHeader}>
        <View style={styles.permissionIcon}>
          <Icon name="check" size={16} color={COLORS.success} />
        </View>
        <View style={styles.permissionInfo}>
          <Typography variant="body" style={styles.permissionTitle}>
            {permission.display_name}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.permissionDescription}>
            {permission.description}
          </Typography>
          <Typography variant="caption" color={COLORS.brand} style={styles.permissionCode}>
            {permission.code}
          </Typography>
        </View>
      </View>
      <View style={styles.permissionScopes}>
        {permission.scopes.map(scope => (
          <View key={scope} style={styles.scopeTag}>
            <Typography variant="caption" color={COLORS.brand} style={styles.scopeText}>
              {scope.toUpperCase()}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );

  const groupedPermissions = permissions.reduce((groups, permission) => {
    const group = permission.group || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

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
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {permissions.length > 0 ? (
            <>
              <View style={styles.summaryCard}>
                <Typography variant="h2" style={styles.summaryTitle}>
                  Permission Summary
                </Typography>
                <Typography variant="body" color={COLORS.textSecondary}>
                  You have {permissions.length} permissions across {Object.keys(groupedPermissions).length} categories
                </Typography>
              </View>

              {Object.entries(groupedPermissions).map(([groupName, groupPermissions]) => (
                <View key={groupName} style={styles.permissionGroup}>
                  <Typography variant="h2" style={styles.groupTitle}>
                    {groupName}
                  </Typography>
                  <Typography variant="caption" color={COLORS.textSecondary} style={styles.groupSubtitle}>
                    {groupPermissions.length} permission{groupPermissions.length !== 1 ? 's' : ''}
                  </Typography>
                  {groupPermissions.map(renderPermissionItem)}
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
  summaryTitle: {
    marginBottom: 8,
    color: COLORS.text,
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
    marginBottom: 4,
  },
  permissionCode: {
    fontFamily: 'monospace',
    fontSize: 12,
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