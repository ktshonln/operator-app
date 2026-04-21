import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { apiClient } from '../api/client';
import { authStore } from '../api/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { User } from '../types/user';

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const UsersListScreen = () => {
  const navigation = useNavigation<any>();
  const { canManageUsers, isPlatformAdmin, getUserOrgScope, loading: permissionsLoading } = usePermissions();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const ITEMS_PER_PAGE = 20;

  // Check permissions on component mount
  useEffect(() => {
    if (permissionsLoading) return;
    
    if (!canManageUsers) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to manage users.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [canManageUsers, permissionsLoading, navigation]);

  // Optimized API call with pagination and search
  const fetchUsers = useCallback(async (page: number = 1, append: boolean = false, search?: string) => {
    if (!canManageUsers) return;

    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Get org_id efficiently
      let orgId: string | undefined;
      if (isPlatformAdmin) {
        orgId = undefined; // Platform admin sees all users
      } else {
        const orgScope = getUserOrgScope;
        if (orgScope) {
          orgId = orgScope;
        } else {
          // Fallback to cached user data
          const userData = await authStore.getUser();
          orgId = userData?.org_id || undefined;
        }
      }

      console.log('UsersListScreen: Fetching users with params:', {
        page,
        limit: ITEMS_PER_PAGE,
        search: search?.trim(),
        org_id: orgId
      });

      // Build query parameters manually for direct API call
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      
      if (orgId) {
        params.append('org_id', orgId);
      }
      
      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      // Make direct API call with parameters for better performance
      const endpoint = `/users?${params.toString()}`;
      const response = await apiClient(endpoint, { method: 'GET' });

      // Handle different response formats
      let usersData: User[] = [];
      let total = 0;
      let totalPagesCount = 1;

      if (response && response.data && Array.isArray(response.data)) {
        // Paginated response format
        usersData = response.data;
        total = response.total || response.data.length;
        totalPagesCount = response.totalPages || Math.ceil(total / ITEMS_PER_PAGE);
      } else if (Array.isArray(response)) {
        // Direct array response format
        usersData = response;
        total = response.length;
        totalPagesCount = 1;
      } else {
        console.warn('Unexpected API response format:', response);
        usersData = [];
      }
      
      if (append && page > 1) {
        setUsers(prevUsers => [...prevUsers, ...usersData]);
      } else {
        setUsers(usersData);
      }
      
      setCurrentPage(page);
      setTotalPages(totalPagesCount);
      setTotalUsers(total);
      setHasMoreData(page < totalPagesCount);

    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      Alert.alert('Error', error.message || 'Failed to fetch users');
      if (!append) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      setSearchLoading(false);
    }
  }, [canManageUsers, isPlatformAdmin, getUserOrgScope]);

  // Search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        setSearchLoading(true);
        setCurrentPage(1);
        fetchUsers(1, false, searchQuery);
      } else {
        setCurrentPage(1);
        fetchUsers(1, false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchUsers]);

  // Initial load
  useEffect(() => {
    fetchUsers(1, false);
  }, []);

  // Load more data for pagination
  const loadMoreUsers = useCallback(() => {
    if (!loadingMore && hasMoreData && currentPage < totalPages) {
      fetchUsers(currentPage + 1, true, searchQuery);
    }
  }, [loadingMore, hasMoreData, currentPage, totalPages, fetchUsers, searchQuery]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchUsers(1, false, searchQuery);
  }, [fetchUsers, searchQuery]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const renderUser = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('UserDetails', { user: item })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Typography variant="body" color={COLORS.white} style={{ fontWeight: 'bold' }}>
            {getInitials(item.first_name, item.last_name)}
          </Typography>
        </View>
        <View style={styles.userInfo}>
          <Typography variant="body" style={styles.userName}>
            {item.first_name} {item.last_name}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {item.email}
          </Typography>
          {item.phone_number && (
            <Typography variant="caption" color={COLORS.textSecondary}>
              {item.phone_number}
            </Typography>
          )}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#E6F7E6' : '#FFF3E0' }]}>
              <Typography variant="caption" color={item.status === 'active' ? '#2E7D32' : '#F57C00'} style={{ fontSize: 10 }}>
                {item.status?.toUpperCase() || 'UNKNOWN'}
              </Typography>
            </View>
            <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
              {item.user_type}
            </Typography>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.roleInfo}>
          <Typography variant="caption" color={COLORS.brand} style={styles.roleBadge}>
            {item.role?.name || item.roles?.[0] || 'No Role'}
          </Typography>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.brand} />
        <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
          Loading more users...
        </Typography>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="users" size={48} color={COLORS.textSecondary} />
      <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
        {searchQuery ? `No users found for "${searchQuery}"` : 'No users found. Tap + to invite one.'}
      </Typography>
      {searchQuery && (
        <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
          <Typography variant="caption" color={COLORS.brand}>
            Clear search
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="User Management"
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={() => navigation.navigate('UserForm', { mode: 'create' })}
      />
      
      {/* Quick access to invitations */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.invitationsButton}
          onPress={() => navigation.navigate('Invitations')}
        >
          <Icon name="mail" size={16} color={COLORS.brand} />
          <Typography variant="caption" color={COLORS.brand} style={{ marginLeft: 8 }}>
            View Pending Invitations
          </Typography>
          <Icon name="chevron-right" size={16} color={COLORS.brand} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
          {searchLoading && <ActivityIndicator size="small" color={COLORS.brand} />}
          {searchQuery.length > 0 && !searchLoading && (
            <TouchableOpacity onPress={clearSearch}>
              <Icon name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results summary */}
      {!loading && (
        <View style={styles.summaryContainer}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {totalUsers > 0 ? `${totalUsers} users found` : 'No users found'}
            {searchQuery && ` for "${searchQuery}"`}
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </Typography>
        </View>
      )}
      
      {loading && users.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            Loading users...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={loadMoreUsers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
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
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleInfo: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  clearSearchButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  invitationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6F0FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
});