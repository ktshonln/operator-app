import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { getRoles, getRoleById, updateRole, deleteRole, createRole, addGrantToRole, removeGrantFromRole, getMyOrganization } from '../api/client';
import { Role, CreateRoleRequest, UpdateRoleRequest, Grant } from '../types/role';

export const RoleManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Grant management state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [availableGrants, setAvailableGrants] = useState<string[]>([
    'audit_log:read:org',
    'users:create',
    'users:read', 
    'users:update',
    'users:delete',
    'roles:create',
    'roles:read',
    'roles:update', 
    'roles:delete',
    'organizations:read',
    'organizations:update',
    'reports:read',
    'settings:read',
    'settings:update'
  ]);

  // Available permissions
  const availablePermissions = [
    'users.create',
    'users.read', 
    'users.update',
    'users.delete',
    'roles.create',
    'roles.read',
    'roles.update', 
    'roles.delete',
    'organizations.read',
    'organizations.update',
    'reports.read',
    'settings.read',
    'settings.update'
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  // Defensive effect to ensure roles is always an array
  useEffect(() => {
    if (!Array.isArray(roles)) {
      console.warn('Roles is not an array, resetting to empty array:', roles);
      setRoles([]);
    }
  }, [roles]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      let rolesData;
      
      try {
        // Get organization-specific roles for non-platform admins
        const orgData = await getMyOrganization();
        rolesData = await getRoles(orgData.id);
      } catch (orgError) {
        console.warn('Could not fetch organization, falling back to all roles:', orgError);
        // Fallback to all roles if organization fetch fails
        rolesData = await getRoles();
      }
      
      // Ensure rolesData is an array and not null/undefined
      if (rolesData && Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else if (rolesData === null || rolesData === undefined) {
        console.warn('API returned null/undefined roles data');
        setRoles([]);
      } else {
        console.warn('API returned non-array roles data:', rolesData);
        setRoles([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      Alert.alert('Error', error.message || 'Failed to fetch roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      let rolesData;
      
      try {
        // Get organization-specific roles for non-platform admins
        const orgData = await getMyOrganization();
        rolesData = await getRoles(orgData.id);
      } catch (orgError) {
        console.warn('Could not fetch organization, falling back to all roles:', orgError);
        rolesData = await getRoles();
      }
      
      // Ensure rolesData is an array and not null/undefined
      if (rolesData && Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        console.warn('API returned non-array roles data:', rolesData);
        setRoles([]);
      }
    } catch (error: any) {
      console.error('Failed to refresh roles:', error);
      setRoles([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditName(role.name);
    setEditDescription(role.description || '');
    setEditPermissions([...role.permissions]);
    setShowEditModal(true);
  };

  const handleManageGrants = (role: Role) => {
    setSelectedRole(role);
    setShowGrantModal(true);
  };

  const handleAddGrant = async (grantPattern: string) => {
    if (!selectedRole) return;

    try {
      await addGrantToRole(selectedRole.id, grantPattern);
      
      // Refresh the role data
      const updatedRole = await getRoleById(selectedRole.id);
      setRoles(prev => prev.map(role => 
        role.id === selectedRole.id ? updatedRole : role
      ));
      setSelectedRole(updatedRole);
      
      Alert.alert('Success', 'Grant added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add grant');
    }
  };

  const handleRemoveGrant = async (grantId: string) => {
    if (!selectedRole) return;

    try {
      await removeGrantFromRole(selectedRole.id, grantId);
      
      // Refresh the role data
      const updatedRole = await getRoleById(selectedRole.id);
      setRoles(prev => prev.map(role => 
        role.id === selectedRole.id ? updatedRole : role
      ));
      setSelectedRole(updatedRole);
      
      Alert.alert('Success', 'Grant removed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove grant');
    }
  };

  const handleUpdateRole = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a role name');
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        // Update existing role
        const updateData: UpdateRoleRequest = {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          permissions: editPermissions
        };

        const updatedRole = await updateRole(editingRole.id, updateData);
        
        // Update the role in the list
        setRoles(prev => prev.map(role => 
          role.id === editingRole.id ? updatedRole : role
        ));
        
        Alert.alert('Success', 'Role updated successfully');
      } else {
        // Create new role
        const createData: CreateRoleRequest = {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          permissions: editPermissions
        };

        const newRole = await createRole(createData);
        
        // Add the new role to the list
        setRoles(prev => [...prev, newRole]);
        
        Alert.alert('Success', 'Role created successfully');
      }
      
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${editingRole ? 'update' : 'create'} role`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (role: Role) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRole(role.id);
              setRoles(prev => prev.filter(r => r.id !== role.id));
              Alert.alert('Success', 'Role deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete role');
            }
          }
        }
      ]
    );
  };

  const togglePermission = (permission: string) => {
    setEditPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const renderRoleItem = ({ item }: { item: Role }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleInfo}>
          <Typography variant="body" style={styles.roleName}>{item.name}</Typography>
          {item.description && (
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.roleDescription}>
              {item.description}
            </Typography>
          )}
        </View>
        <View style={styles.roleActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleManageGrants(item)}
          >
            <Icon name="shield" size={18} color={COLORS.brand} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditRole(item)}
          >
            <Icon name="edit" size={18} color={COLORS.brand} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteRole(item)}
          >
            <Icon name="trash" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.permissionsContainer}>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.permissionsLabel}>
          Permissions ({item.permissions.length})
        </Typography>
        <View style={styles.permissionsList}>
          {item.permissions.slice(0, 3).map(permission => (
            <View key={permission} style={styles.permissionTag}>
              <Typography variant="caption" color={COLORS.brand}>
                {permission.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
            </View>
          ))}
          {item.permissions.length > 3 && (
            <View style={styles.permissionTag}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                +{item.permissions.length - 3} more
              </Typography>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Role Management"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => item.id}
          renderItem={renderRoleItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="shield" size={48} color={COLORS.textSecondary} />
              <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
                No roles found. Create one to get started.
              </Typography>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          // Reset state and show create modal
          setEditingRole(null);
          setEditName('');
          setEditDescription('');
          setEditPermissions([]);
          setShowEditModal(true);
        }}
      >
        <Icon name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Edit Role Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Header 
            title={editingRole ? "Edit Role" : "Create Role"}
            showBack={true}
            onBack={() => setShowEditModal(false)}
          />
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.section}>
              <Typography variant="h2" style={styles.sectionTitle}>Role Information</Typography>
              
              <View style={styles.inputContainer}>
                <Typography variant="caption" style={styles.label}>Role Name *</Typography>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Supervisor, Coordinator"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Typography variant="caption" style={styles.label}>Description (Optional)</Typography>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Brief description of this role's responsibilities"
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Typography variant="h2" style={styles.sectionTitle}>Permissions</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 16 }}>
                Select the permissions this role should have
              </Typography>
              
              {availablePermissions.map(permission => (
                <TouchableOpacity
                  key={permission}
                  style={styles.permissionRow}
                  onPress={() => togglePermission(permission)}
                >
                  <View style={styles.permissionLeft}>
                    <View style={[
                      styles.checkbox,
                      editPermissions.includes(permission) && styles.checkboxActive
                    ]}>
                      {editPermissions.includes(permission) && (
                        <Icon name="check" size={14} color={COLORS.white} />
                      )}
                    </View>
                    <Typography variant="body" style={{ marginLeft: 12 }}>
                      {permission.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleUpdateRole}
              disabled={saving}
            >
              <Typography variant="body" color={COLORS.white} style={styles.saveButtonText}>
                {saving ? (editingRole ? 'Updating...' : 'Creating...') : (editingRole ? 'Update Role' : 'Create Role')}
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Grant Management Modal */}
      <Modal
        visible={showGrantModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGrantModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Header 
            title={`Manage Grants - ${selectedRole?.name}`}
            showBack={true}
            onBack={() => setShowGrantModal(false)}
          />
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Current Grants */}
            <View style={styles.section}>
              <Typography variant="h2" style={styles.sectionTitle}>
                Current Grants ({selectedRole?.grants?.length || 0})
              </Typography>
              
              {selectedRole?.grants && selectedRole.grants.length > 0 ? (
                selectedRole.grants.map(grant => (
                  <View key={grant.id} style={styles.grantItem}>
                    <View style={styles.grantInfo}>
                      <Typography variant="body" style={styles.grantPattern}>
                        {grant.pattern}
                      </Typography>
                      {grant.description && (
                        <Typography variant="caption" color={COLORS.textSecondary}>
                          {grant.description}
                        </Typography>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.removeGrantButton}
                      onPress={() => handleRemoveGrant(grant.id)}
                    >
                      <Icon name="close" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Typography variant="caption" color={COLORS.textSecondary} style={{ textAlign: 'center', padding: 20 }}>
                  No grants assigned to this role
                </Typography>
              )}
            </View>

            {/* Available Grants to Add */}
            <View style={styles.section}>
              <Typography variant="h2" style={styles.sectionTitle}>Add New Grant</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 16 }}>
                Select a grant pattern to add to this role
              </Typography>
              
              {availableGrants.map(grantPattern => {
                const isAlreadyAssigned = selectedRole?.grants?.some(g => g.pattern === grantPattern);
                return (
                  <TouchableOpacity
                    key={grantPattern}
                    style={[
                      styles.availableGrantItem,
                      isAlreadyAssigned && styles.disabledGrantItem
                    ]}
                    onPress={() => !isAlreadyAssigned && handleAddGrant(grantPattern)}
                    disabled={isAlreadyAssigned}
                  >
                    <Typography 
                      variant="body" 
                      color={isAlreadyAssigned ? COLORS.textSecondary : COLORS.text}
                      style={styles.grantPatternText}
                    >
                      {grantPattern}
                    </Typography>
                    {isAlreadyAssigned ? (
                      <Icon name="check" size={16} color={COLORS.textSecondary} />
                    ) : (
                      <Icon name="add" size={16} color={COLORS.brand} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  },
  listContent: {
    padding: 16,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  roleDescription: {
    lineHeight: 18,
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionTag: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  modalContent: {
    padding: 16,
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
    marginBottom: 16,
    color: COLORS.text,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4A5568',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  saveButton: {
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  grantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  grantInfo: {
    flex: 1,
  },
  grantPattern: {
    fontWeight: '600',
    marginBottom: 2,
  },
  removeGrantButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FED7D7',
  },
  availableGrantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledGrantItem: {
    backgroundColor: '#F7FAFC',
    opacity: 0.6,
  },
  grantPatternText: {
    flex: 1,
    fontFamily: 'monospace',
  },
});