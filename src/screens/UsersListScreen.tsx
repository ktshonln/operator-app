import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { getUsers, getMyOrganization } from '../api/client';
import { User } from '../types/user';

export const UsersListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let usersData;
      
      try {
        // Get organization-specific users for non-platform admins
        const orgData = await getMyOrganization();
        usersData = await getUsers(orgData.id);
      } catch (orgError) {
        console.warn('Could not fetch organization, falling back to all users:', orgError);
        // Fallback to all users if organization fetch fails
        usersData = await getUsers();
      }
      
      // Ensure usersData is an array
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
    try {
      let usersData;
      
      try {
        const orgData = await getMyOrganization();
        usersData = await getUsers(orgData.id);
      } catch (orgError) {
        console.warn('Could not fetch organization, falling back to all users:', orgError);
        usersData = await getUsers();
      }
      
      if (usersData && Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Failed to refresh users:', error);
      setUsers([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh users when screen comes into focus (after creating/editing users)
  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderItem = ({ item }: { item: User }) => (
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
        </View>
      </View>
      <View style={styles.cardRight}>
        <Typography variant="caption" color={COLORS.brand} style={styles.roleBadge}>
          {item.role?.name || 'No Role'}
        </Typography>
        <Icon name="chevron-right" size={20} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
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
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="users" size={48} color={COLORS.textSecondary} />
              <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
                No users found. Tap '+' to create one.
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
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
