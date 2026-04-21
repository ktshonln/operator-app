import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { apiClient, approveCooperativeApplication, rejectCooperativeApplication } from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { Organization } from '../types/organization';

export const AllOrganizationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { isPlatformAdmin, canManageOrganizations, loading: permissionsLoading } = usePermissions();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check permissions on component mount
    // Don't check permissions if still loading
    if (permissionsLoading) return;
    
    if (!isPlatformAdmin && !canManageOrganizations) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to manage organizations.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    fetchOrganizations();
  }, [isPlatformAdmin, canManageOrganizations, permissionsLoading, navigation]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch all organizations (platform admin endpoint)
      const response = await apiClient('/organizations', { method: 'GET' });
      
      // Handle paginated response
      let orgsData = [];
      if (response && response.data && Array.isArray(response.data)) {
        orgsData = response.data;
      } else if (Array.isArray(response)) {
        orgsData = response;
      }
      
      setOrganizations(orgsData);
    } catch (error: any) {
      console.error('Failed to fetch organizations:', error);
      Alert.alert('Error', error.message || 'Failed to fetch organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrganizations();
    setRefreshing(false);
  };

  const handleApproveCooperative = async (org: Organization) => {
    Alert.alert(
      'Approve Cooperative',
      `Are you sure you want to approve the cooperative application for "${org.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await approveCooperativeApplication(org.id);
              Alert.alert('Success', 'Cooperative application approved successfully!');
              fetchOrganizations(); // Refresh the list
            } catch (error: any) {
              console.error('Failed to approve cooperative:', error);
              Alert.alert('Error', error.message || 'Failed to approve cooperative application');
            }
          },
        },
      ]
    );
  };

  const handleRejectCooperative = async (org: Organization) => {
    Alert.prompt(
      'Reject Cooperative',
      `Please provide a reason for rejecting "${org.name}"'s cooperative application:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await rejectCooperativeApplication(org.id, reason);
              Alert.alert('Success', 'Cooperative application rejected successfully!');
              fetchOrganizations(); // Refresh the list
            } catch (error: any) {
              console.error('Failed to reject cooperative:', error);
              Alert.alert('Error', error.message || 'Failed to reject cooperative application');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const renderCooperativeActions = (org: Organization) => {
    if (org.org_type !== 'cooperative' || org.status !== 'pending') {
      return null;
    }

    return (
      <View style={styles.cooperativeActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproveCooperative(org)}
        >
          <Icon name="check" size={16} color={COLORS.white} />
          <Typography variant="caption" color={COLORS.white} style={styles.actionText}>
            Approve
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectCooperative(org)}
        >
          <Icon name="close" size={16} color={COLORS.white} />
          <Typography variant="caption" color={COLORS.white} style={styles.actionText}>
            Reject
          </Typography>
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={styles.orgCard}
      onPress={() => {
        // Navigate to organization details or management
        navigation.navigate('OrganizationDetails', { organizationId: item.id });
      }}
    >
      <View style={styles.orgHeader}>
        <View style={styles.orgIcon}>
          <Icon name="business" size={24} color={COLORS.brand} />
        </View>
        <View style={styles.orgInfo}>
          <Typography variant="body" style={styles.orgName}>
            {item.name}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {item.org_type} • Created {new Date(item.created_at).toLocaleDateString()}
          </Typography>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Typography 
            variant="caption" 
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Typography>
        </View>
      </View>
      
      <View style={styles.orgDetails}>
        {item.contact_email && (
          <View style={styles.detailRow}>
            <Icon name="mail" size={14} color={COLORS.textSecondary} />
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.detailText}>
              {item.contact_email}
            </Typography>
          </View>
        )}
        {item.contact_phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={14} color={COLORS.textSecondary} />
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.detailText}>
              {item.contact_phone}
            </Typography>
          </View>
        )}
      </View>
      
      {/* Cooperative approval actions */}
      {renderCooperativeActions(item)}
    </TouchableOpacity>
  );

  if (!isPlatformAdmin && !canManageOrganizations) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('platformAdmin.allOrganizations')} showBack={true} onBack={() => navigation.goBack()} />
        {permissionsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
              {t('platformAdmin.checkingPermissions')}
            </Typography>
          </View>
        ) : (
          <View style={styles.centered}>
            <Icon name="shield" size={48} color="#EF4444" />
            <Typography variant="body" color="#EF4444" style={{ marginTop: 16, textAlign: 'center' }}>
              {t('platformAdmin.accessDenied')}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
              {t('platformAdmin.noPermissionOrganizations')}
            </Typography>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={t('platformAdmin.allOrganizations')} 
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              // Navigate to create organization screen
              navigation.navigate('CreateOrganization');
            }}
          >
            <Icon name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        }
      />
      
      {loading && organizations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            {t('platformAdmin.loadingOrganizations')}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={organizations}
          renderItem={renderOrganizationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.brand} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="business" size={48} color={COLORS.textSecondary} />
              <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
                {t('platformAdmin.noOrganizationsFound')}
              </Typography>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listContent: {
    padding: 16,
  },
  addButton: {
    backgroundColor: COLORS.brand,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brand + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orgDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  cooperativeActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    fontWeight: '600',
  },
});