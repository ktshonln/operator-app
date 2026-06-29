import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { deleteUser, getRoleById, getUserById, getRolesWithGrants } from '../api/client';
import { User } from '../types/user';
import { Role } from '../types/role';
import { resolveRoleNames, isDriverRoleSlug } from '../utils/roles';

export const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { user: initialUser } = route.params as { user: User };
  
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [deleting, setDeleting] = useState(false);
  const [roleDetails, setRoleDetails] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [orgRoles, setOrgRoles] = useState<Role[]>([]);

  const refreshUser = useCallback(async () => {
    if (!initialUser?.id) return;
    setLoadingUser(true);
    try {
      const freshUser = await getUserById(initialUser.id);
      setUser(freshUser);
    } catch (error) {
      console.warn('Failed to refresh user details:', error);
    } finally {
      setLoadingUser(false);
    }
  }, [initialUser?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  useEffect(() => {
    const loadRoles = async () => {
      if (!user?.org_id) return;
      try {
        const roles = await getRolesWithGrants(user.org_id);
        if (Array.isArray(roles)) setOrgRoles(roles);
      } catch (error) {
        console.warn('Failed to load roles for display:', error);
      }
    };
    loadRoles();
  }, [user?.org_id]);

  const roleDisplayName = resolveRoleNames(user?.roles, orgRoles);

  useEffect(() => {
    if (user && user.role_id) {
      fetchRoleDetails();
    }
  }, [user?.role_id]);

  const fetchRoleDetails = async () => {
    if (!user?.role_id) return;
    
    setLoadingRole(true);
    try {
      const role = await getRoleById(user.role_id);
      setRoleDetails(role);
    } catch (error) {
      console.warn('Failed to fetch role details:', error);
      // Don't show error to user, just use basic role info
    } finally {
      setLoadingRole(false);
    }
  };

  const handleEdit = () => {
    if (!user) return;
    navigation.navigate('UserForm', { userId: user.id });
  };

  const handleDelete = () => {
    if (!user) return;
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user.id);
      Alert.alert('Success', 'User deleted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = () => {
    if (!user || !user.first_name || !user.last_name) return 'U';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const InfoRow = ({ label, value, icon }: { label: string, value: string, icon: any }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Icon name={icon} size={20} color={COLORS.brand} />
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoLabel}>
          {label}
        </Typography>
      </View>
      <Typography variant="body" style={styles.infoValue}>
        {value}
      </Typography>
    </View>
  );

  // Handle case where user is undefined
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="User Details"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <Icon name="alert" size={48} color={COLORS.textSecondary} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
            User information not found
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="User Details"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightIcon="edit"
        onRightPress={handleEdit}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* User Avatar and Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Typography variant="h2" color={COLORS.white}>
              {getInitials()}
            </Typography>
          </View>
          <Typography variant="h1" style={styles.userName}>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="body" color={COLORS.brand} style={styles.userRole}>
            {loadingUser ? 'Refreshing...' : roleDisplayName}
          </Typography>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Contact Information</Typography>
          
          <InfoRow 
            label="Email Address"
            value={user.email}
            icon="mail"
          />
          
          {user.phone_number && (
            <InfoRow 
              label="Phone Number"
              value={user.phone_number}
              icon="phone"
            />
          )}

          {user.user_type && (
            <InfoRow 
              label="User Type (server)"
              value={user.user_type}
              icon="person"
            />
          )}

          {user.roles?.length ? (
            <InfoRow
              label="Role slugs"
              value={user.roles.join(', ')}
              icon="shield"
            />
          ) : null}

          {user.roles?.some(isDriverRoleSlug) && user.user_type !== 'staff' && (
            <View style={styles.warningBox}>
              <Icon name="info" size={16} color="#F59E0B" />
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8, flex: 1 }}>
                This user has role slug driver but user_type is "{user.user_type}". Bus drivers must be user_type staff (invited via Team → Invite User, not passenger signup).
              </Typography>
            </View>
          )}

          {user.roles?.some(isDriverRoleSlug) && user.user_type === 'staff' && (
            <View style={[styles.warningBox, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="check" size={16} color={COLORS.success} />
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8, flex: 1 }}>
                Driver profile: staff + role slug driver. If bus assignment still fails with DRIVER_NOT_FOUND, contact Katisha support — the trip service may need to register this user on their side.
              </Typography>
            </View>
          )}

          {user.status && (
            <InfoRow 
              label="Status"
              value={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              icon="info"
            />
          )}
        </View>

        {/* Role Information */}
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Role & Permissions</Typography>
          
          <InfoRow 
            label="Current Role"
            value={roleDisplayName}
            icon="shield"
          />
          
          {(roleDetails?.description || user.role?.description) && (
            <InfoRow 
              label="Role Description"
              value={roleDetails?.description || user.role?.description || ''}
              icon="info"
            />
          )}

          {loadingRole ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.brand} />
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
                Loading role permissions...
              </Typography>
            </View>
          ) : roleDetails?.grants && roleDetails.grants.length > 0 ? (
            <View style={styles.permissionsContainer}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.permissionsTitle}>
                PERMISSIONS
              </Typography>
              {roleDetails.grants.map((grant, index) => (
                <View key={grant.id} style={styles.permissionItem}>
                  <Icon name="check" size={16} color={COLORS.success} />
                  <Typography variant="caption" style={styles.permissionText}>
                    {grant.pattern.replace(/:/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noPermissionsContainer}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                No specific permissions assigned to this role
              </Typography>
            </View>
          )}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Account Information</Typography>
          
          <InfoRow 
            label="User ID"
            value={user.id}
            icon="card"
          />
          
          <InfoRow 
            label="Created"
            value={new Date(user.created_at).toLocaleDateString()}
            icon="info"
          />
          
          <InfoRow 
            label="Last Updated"
            value={new Date(user.updated_at).toLocaleDateString()}
            icon="info"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Icon name="edit" size={20} color={COLORS.white} />
            <Typography variant="body" color={COLORS.white} style={styles.buttonText}>
              Edit User
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteButton, deleting && { opacity: 0.7 }]} 
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Icon name="trash" size={20} color={COLORS.white} />
                <Typography variant="body" color={COLORS.white} style={styles.buttonText}>
                  Delete User
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    marginLeft: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  actionsSection: {
    marginTop: 8,
  },
  editButton: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButton: {
    backgroundColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  permissionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  permissionsTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    color: COLORS.textSecondary,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  permissionText: {
    marginLeft: 8,
    color: COLORS.text,
    fontWeight: '500',
  },
  noPermissionsContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});