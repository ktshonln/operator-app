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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { getUsers } from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { API_CONFIG } from '../api/config';
import { User } from '../types/user';

export const AllUsersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { isPlatformAdmin, canManageUsers, loading: permissionsLoading } = usePermissions();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check permissions on component mount
    // Don't check permissions if still loading
    if (permissionsLoading) return;
    
    if (!isPlatformAdmin && !canManageUsers) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to manage users.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    fetchUsers();
  }, [isPlatformAdmin, canManageUsers, permissionsLoading, navigation]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users (no org filter for platform admin)
      const usersData = await getUsers();
      
      if (usersData && Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.warn('API returned non-array users data:', usersData);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      Alert.alert('Error', error.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType?.toLowerCase()) {
      case 'admin': return '#8B5CF6';
      case 'staff': return '#3B82F6';
      case 'driver': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        navigation.navigate('UserDetails', { user: item });
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar_path ? (
            <Image 
              source={{ uri: `${API_CONFIG.CDN_URL}/${item.avatar_path}` }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Typography variant="body" color={COLORS.white} style={styles.avatarText}>
                {((item.first_name || '').charAt(0) + (item.last_name || '').charAt(0)).toUpperCase() || 'U'}
              </Typography>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Typography variant="body" style={styles.userName}>
            {`${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unnamed User'}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {item.email || item.phone_number}
          </Typography>
          <View style={styles.userMeta}>
            <View style={[styles.typeBadge, { backgroundColor: getUserTypeColor(item.user_type) + '15' }]}>
              <Typography 
                variant="caption" 
                style={[styles.typeText, { color: getUserTypeColor(item.user_type) }]}
              >
                {item.user_type?.toUpperCase() || 'USER'}
              </Typography>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Typography 
                variant="caption" 
                style={[styles.statusText, { color: getStatusColor(item.status) }]}
              >
                {item.status?.toUpperCase() || 'UNKNOWN'}
              </Typography>
            </View>
          </View>
        </View>
        
        <Icon name="chevron-right" size={16} color={COLORS.textSecondary} />
      </View>
      
      {item.org_id && (
        <View style={styles.orgInfo}>
          <Icon name="business" size={12} color={COLORS.textSecondary} />
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.orgText}>
            Organization ID: {item.org_id}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!isPlatformAdmin && !canManageUsers) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('platformAdmin.allUsers')} showBack={true} onBack={() => navigation.goBack()} />
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
              {t('platformAdmin.noPermissionUsers')}
            </Typography>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={t('platformAdmin.allUsers')} 
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              navigation.navigate('UserForm');
            }}
          >
            <Icon name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        }
      />
      
      {loading && users.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            {t('platformAdmin.loadingUsers')}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.brand} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="users" size={48} color={COLORS.textSecondary} />
              <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
                {t('platformAdmin.noUsersFound')}
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  orgText: {
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
});