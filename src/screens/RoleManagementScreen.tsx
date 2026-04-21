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
import { getRoleById, updateRole, deleteRole, createRole, addGrantToRole, removeGrantFromRole, getMyOrganization, getRolesWithGrants, getPermissions, apiClient } from '../api/client';
import { authStore } from '../api/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { Role, CreateRoleRequest, UpdateRoleRequest, Grant, Permission } from '../types/role';

export const RoleManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isPlatformAdmin, canManageRoles, loading: permissionsLoading } = usePermissions();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoadingState, setPermissionsLoadingState] = useState(true);
  
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

  useEffect(() => {
    // Check permissions before loading data
    if (permissionsLoading) return;
    
    // Platform admins should always have access to role management
    if (!isPlatformAdmin && !canManageRoles) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to manage roles.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    fetchRoles();
    fetchPermissions();
  }, [canManageRoles, isPlatformAdmin, permissionsLoading, navigation]);

  const fetchPermissions = async () => {
    setPermissionsLoadingState(true);
    try {
      const permissionsData = await getPermissions();
      setPermissions(permissionsData);
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error);
      // Don't show error to user, just use empty array
      setPermissions([]);
    } finally {
      setPermissionsLoadingState(false);
    }
  };

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
      let orgId: string | null = null;
      
      if (isPlatformAdmin) {
        // Platform admin can see all roles
        console.log('RoleManagementScreen: Fetching all roles for platform admin');
        rolesData = await getRolesWithGrants();
      } else {
        // Organization admin - get organization-specific roles
        // Get org_id from user data instead of making API call
        const userData = await authStore.getUser();
        if (userData?.org_id) {
          console.log('RoleManagementScreen: Using org_id from user data:', userData.org_id);
          orgId = userData.org_id;
          rolesData = await getRolesWithGrants(userData.org_id);
        } else {
          // Fallback to API call only if needed
          try {
            const orgData = await getMyOrganization();
            orgId = orgData.id;
            rolesData = await getRolesWithGrants(orgData.id);
          } catch (orgError: any) {
            console.warn('Could not fetch organization:', orgError);
            
            // If it's ORG_NOT_FOUND, user might be platform admin
            if (orgError.data?.error?.code === 'ORG_NOT_FOUND') {
              // Try to get all roles (platform admin)
              rolesData = await getRolesWithGrants();
            } else {
              setRoles([]);
              return;
            }
          }
        }
      }
      
      // Ensure rolesData is an array and not null/undefined
      if (rolesData && Array.isArray(rolesData)) {
        if (isPlatformAdmin) {
          // Platform admin sees all roles
          setRoles(rolesData);
        } else {
          // Filter to only show roles that belong to this organization or are relevant to it
          const filteredRoles = rolesData.filter(role => {
            // Show roles that belong to this organization
            if (role.org_id === orgId) {
              return true;
            }
            // Show managed roles that are available to organizations (not platform-only)
            if (role.is_managed && role.org_id === null) {
              return true;
            }
            return false;
          });
          setRoles(filteredRoles);
        }
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
      let orgId: string | null = null;
      
      if (isPlatformAdmin) {
        // Platform admin can see all roles
        rolesData = await getRolesWithGrants();
      } else {
        // Organization admin - get organization-specific roles
        try {
          const orgData = await getMyOrganization();
          orgId = orgData.id;
          rolesData = await getRolesWithGrants(orgData.id);
        } catch (orgError: any) {
          console.warn('Could not fetch organization:', orgError);
          
          // If it's ORG_NOT_FOUND, user might be platform admin
          if (orgError.data?.error?.code === 'ORG_NOT_FOUND') {
            // Try to get all roles (platform admin)
            rolesData = await getRolesWithGrants();
          } else {
            setRoles([]);
            return;
          }
        }
      }
      
      // Ensure rolesData is an array and not null/undefined
      if (rolesData && Array.isArray(rolesData)) {
        if (isPlatformAdmin) {
          // Platform admin sees all roles
          setRoles(rolesData);
        } else {
          // Filter to only show roles that belong to this organization or are relevant to it
          const filteredRoles = rolesData.filter(role => {
            // Show roles that belong to this organization
            if (role.org_id === orgId) {
              return true;
            }
            // Show managed roles that are available to organizations (not platform-only)
            if (role.is_managed && role.org_id === null) {
              return true;
            }
            return false;
          });
          setRoles(filteredRoles);
        }
      } else {
        setRoles([]);
      }
    } catch (error: any) {
      console.error('Failed to refresh roles:', error);
      setRoles([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageGrants = (role: Role) => {
    // Platform admins can manage all roles, including system roles
    if (role.is_managed && !isPlatformAdmin) {
      Alert.alert(
        'Cannot Modify Managed Role',
        'This is a system-managed role and cannot be modified. Only custom roles can have their grants changed.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedRole(role);
    setShowGrantModal(true);
  };

  const handleEditRole = (role: Role) => {
    // Platform admins can edit all roles, including system roles
    if (role.is_managed && !isPlatformAdmin) {
      Alert.alert(
        'Cannot Edit Managed Role',
        'This is a system-managed role and cannot be edited. Only custom roles can be modified.',
        [{ text: 'OK' }]
      );
      return;
    }
    setEditingRole(role);
    setEditName(role.name);
    setEditDescription(role.description || '');
    // Extract patterns from grants array
    const patterns = (role.grants || []).map(grant => grant.pattern);
    setEditPermissions(patterns);
    setShowEditModal(true);
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
    setSaving(true);
    try {
      if (editingRole) {
        // Update existing role - only send name and description
        const updateData: UpdateRoleRequest = {
          name: editName.trim(),
          description: editDescription.trim() || undefined
        };

        const updatedRole = await updateRole(editingRole.id, updateData);
        
        // Update the role in the list
        setRoles(prev => prev.map(role => 
          role.id === editingRole.id ? updatedRole : role
        ));
        
        Alert.alert('Success', 'Role updated successfully');
      } else {
        // Create new role - get organization ID and generate slug
        let orgId: string | undefined;
        try {
          const orgData = await getMyOrganization();
          orgId = orgData.id;
          console.log('Got organization ID:', orgId);
        } catch (orgError) {
          console.warn('Could not fetch organization for role creation:', orgError);
          Alert.alert('Error', 'Could not fetch organization information. Please try again.');
          return;
        }

        if (!orgId) {
          Alert.alert('Error', 'Could not fetch organization information. Please try again.');
          return;
        }

        console.log('Selected permissions (editPermissions):', editPermissions);
        console.log('Organization ID:', orgId);

        const createData: CreateRoleRequest = {
          name: editName.trim(),
          org_id: orgId,
          patterns: editPermissions
        };

        // Only add description if it's not empty
        if (editDescription.trim()) {
          createData.description = editDescription.trim();
        }

        console.log('Creating role with data:', JSON.stringify(createData, null, 2));

        const newRole = await createRole(createData);
        
        // Add the new role to the list
        setRoles(prev => [...prev, newRole]);
        
        Alert.alert('Success', 'Role created successfully');
      }
      
      setShowEditModal(false);
    } catch (error: any) {
      console.error('Role creation/update error:', error);
      
      let errorMessage = error.message || `Failed to ${editingRole ? 'update' : 'create'} role`;
      
      // If it's a validation error, try to extract detailed information
      if (error.status === 422 && error.data?.error?.details) {
        console.log('Validation error details:', error.data.error.details);
        
        // Try to format validation errors for display
        if (Array.isArray(error.data.error.details)) {
          const validationMessages = error.data.error.details.map((detail: any) => {
            if (typeof detail === 'string') return detail;
            if (detail.message) return detail.message;
            if (detail.field && detail.error) return `${detail.field}: ${detail.error}`;
            return JSON.stringify(detail);
          }).join('\n');
          
          errorMessage = `Validation failed:\n${validationMessages}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (role: Role) => {
    // Platform admins can delete system roles, but show a warning
    if (role.is_managed && !isPlatformAdmin) {
      Alert.alert(
        'Cannot Delete Managed Role',
        'This is a system-managed role and cannot be deleted. Only custom roles can be removed.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Show extra warning for platform admins deleting system roles
    const warningMessage = role.is_managed 
      ? `Are you sure you want to delete the SYSTEM role "${role.name}"? This is a managed role and deleting it may affect platform functionality. This action cannot be undone.`
      : `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`;
    
    Alert.alert(
      'Delete Role',
      warningMessage,
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

  const togglePermission = (permissionCode: string) => {
    setEditPermissions(prev => 
      prev.includes(permissionCode) 
        ? prev.filter(p => p !== permissionCode)
        : [...prev, permissionCode]
    );
  };

  // Get available grant patterns from permissions
  const getAvailableGrantPatterns = () => {
    return permissions.map(permission => {
      // Create pattern with org scope by default
      return `${permission.code}:org`;
    });
  };

  // Get permission display info
  const getPermissionDisplayInfo = (code: string) => {
    const permission = permissions.find(p => p.code === code || code.startsWith(p.code));
    return permission || { display_name: code, description: '', group: 'Other' };
  };

  const renderRoleItem = ({ item }: { item: Role }) => (
    <View style={[
      styles.roleCard, 
      item.is_managed && !isPlatformAdmin && styles.managedRoleCard,
      item.is_managed && isPlatformAdmin && styles.platformAdminManagedRoleCard
    ]}>
      <View style={styles.roleHeader}>
        <View style={styles.roleInfo}>
          <View style={styles.roleNameContainer}>
            <Typography variant="body" style={styles.roleName}>{item.name}</Typography>
            {item.is_managed && (
              <View style={[
                styles.managedBadge,
                isPlatformAdmin && styles.platformAdminManagedBadge
              ]}>
                <Typography variant="caption" color={COLORS.white} style={styles.managedBadgeText}>
                  {isPlatformAdmin ? 'SYSTEM (EDITABLE)' : 'SYSTEM'}
                </Typography>
              </View>
            )}
          </View>
          {item.description && (
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.roleDescription}>
              {item.description}
            </Typography>
          )}
        </View>
        <View style={styles.roleActions}>
          <TouchableOpacity 
            style={[styles.actionButton, (item.is_managed && !isPlatformAdmin) && styles.disabledActionButton]}
            onPress={() => handleManageGrants(item)}
            disabled={item.is_managed && !isPlatformAdmin}
          >
            <Icon name="shield" size={18} color={(item.is_managed && !isPlatformAdmin) ? COLORS.textSecondary : COLORS.brand} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, (item.is_managed && !isPlatformAdmin) && styles.disabledActionButton]}
            onPress={() => handleEditRole(item)}
            disabled={item.is_managed && !isPlatformAdmin}
          >
            <Icon name="edit" size={18} color={(item.is_managed && !isPlatformAdmin) ? COLORS.textSecondary : COLORS.brand} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, (item.is_managed && !isPlatformAdmin) && styles.disabledActionButton]}
            onPress={() => handleDeleteRole(item)}
            disabled={item.is_managed && !isPlatformAdmin}
          >
            <Icon name="trash" size={18} color={(item.is_managed && !isPlatformAdmin) ? COLORS.textSecondary : COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.permissionsContainer}>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.permissionsLabel}>
          Patterns ({(item.grants || []).length})
        </Typography>
        <View style={styles.permissionsList}>
          {(item.grants || []).slice(0, 3).map(grant => (
            <View key={grant.id} style={styles.permissionTag}>
              <Typography variant="caption" color={COLORS.brand}>
                {grant.pattern.replace(/:/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
            </View>
          ))}
          {(item.grants || []).length > 3 && (
            <View style={styles.permissionTag}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                +{(item.grants || []).length - 3} more
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
        title={isPlatformAdmin ? t('platformAdmin.allRoles') : "Role Management"}
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
              <Typography variant="h2" style={styles.sectionTitle}>Permissions & Patterns</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 16 }}>
                Select the permission patterns this role should have
              </Typography>
              
              {permissionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand} />
                  <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
                    Loading permissions...
                  </Typography>
                </View>
              ) : permissions.length > 0 ? (
                // Group permissions by group
                Object.entries(
                  permissions.reduce((groups, permission) => {
                    const group = permission.group || 'Other';
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(permission);
                    return groups;
                  }, {} as Record<string, Permission[]>)
                ).map(([groupName, groupPermissions]) => (
                  <View key={groupName} style={styles.permissionGroup}>
                    <Typography variant="caption" style={styles.permissionGroupTitle}>
                      {groupName.toUpperCase()}
                    </Typography>
                    {groupPermissions.map(permission => {
                      const patternWithOrg = `${permission.code}:org`;
                      return (
                        <TouchableOpacity
                          key={permission.id}
                          style={styles.permissionRow}
                          onPress={() => togglePermission(patternWithOrg)}
                        >
                          <View style={styles.permissionLeft}>
                            <View style={[
                              styles.checkbox,
                              editPermissions.includes(patternWithOrg) && styles.checkboxActive
                            ]}>
                              {editPermissions.includes(patternWithOrg) && (
                                <Icon name="check" size={14} color={COLORS.white} />
                              )}
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                              <Typography variant="body" style={{ fontWeight: '600' }}>
                                {permission.display_name}
                              </Typography>
                              <Typography variant="caption" color={COLORS.textSecondary}>
                                {permission.description}
                              </Typography>
                              <Typography variant="caption" color={COLORS.brand} style={{ fontFamily: 'monospace' }}>
                                {patternWithOrg}
                              </Typography>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              ) : (
                <Typography variant="caption" color={COLORS.textSecondary} style={{ textAlign: 'center', padding: 20 }}>
                  No permissions available
                </Typography>
              )}
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
              
              {permissionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand} />
                  <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
                    Loading permissions...
                  </Typography>
                </View>
              ) : permissions.length > 0 ? (
                // Group permissions by group
                Object.entries(
                  permissions.reduce((groups, permission) => {
                    const group = permission.group || 'Other';
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(permission);
                    return groups;
                  }, {} as Record<string, Permission[]>)
                ).map(([groupName, groupPermissions]) => (
                  <View key={groupName} style={styles.permissionGroup}>
                    <Typography variant="caption" style={styles.permissionGroupTitle}>
                      {groupName.toUpperCase()}
                    </Typography>
                    {groupPermissions.map(permission => {
                      const patternWithOrg = `${permission.code}:org`;
                      const isAlreadyAssigned = selectedRole?.grants?.some(g => g.pattern === patternWithOrg);
                      return (
                        <TouchableOpacity
                          key={permission.id}
                          style={[
                            styles.availableGrantItem,
                            isAlreadyAssigned && styles.disabledGrantItem
                          ]}
                          onPress={() => !isAlreadyAssigned && handleAddGrant(patternWithOrg)}
                          disabled={isAlreadyAssigned}
                        >
                          <View style={{ flex: 1 }}>
                            <Typography 
                              variant="body" 
                              color={isAlreadyAssigned ? COLORS.textSecondary : COLORS.text}
                              style={{ fontWeight: '600' }}
                            >
                              {permission.display_name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={isAlreadyAssigned ? COLORS.textSecondary : COLORS.textSecondary}
                            >
                              {permission.description}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color={isAlreadyAssigned ? COLORS.textSecondary : COLORS.brand}
                              style={{ fontFamily: 'monospace' }}
                            >
                              {patternWithOrg}
                            </Typography>
                          </View>
                          {isAlreadyAssigned ? (
                            <Icon name="check" size={16} color={COLORS.textSecondary} />
                          ) : (
                            <Icon name="add" size={16} color={COLORS.brand} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              ) : (
                <Typography variant="caption" color={COLORS.textSecondary} style={{ textAlign: 'center', padding: 20 }}>
                  No permissions available
                </Typography>
              )}
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
  managedRoleCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  platformAdminManagedRoleCard: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFB74D',
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
  roleNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  managedBadge: {
    backgroundColor: COLORS.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  platformAdminManagedBadge: {
    backgroundColor: '#FF9800',
  },
  managedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
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
  disabledActionButton: {
    backgroundColor: '#F1F3F4',
    opacity: 0.6,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  permissionGroup: {
    marginBottom: 16,
  },
  permissionGroupTitle: {
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});