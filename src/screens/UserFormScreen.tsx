import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Switch, Alert, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { createRole, getMyOrganization, createUser, updateUser, getUserById, getRolesWithGrants, getPermissions } from '../api/client';
import { Role, Permission } from '../types/role';
import { CreateUserRequest, UpdateUserRequest } from '../types/user';

export const UserFormScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { userId } = route.params || {};
  const isEdit = !!userId;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(isEdit);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  
  // Role creation modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string>(''); // Single pattern instead of array

  const [permissions, setPermissions] = useState({
    fleet: true,
    tickets: true,
    reports: false,
    settings: false,
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    if (isEdit && userId) {
      fetchUser();
    }
  }, []);

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const permissionsData = await getPermissions();
      setAvailablePermissions(permissionsData);
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error);
      setAvailablePermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchUser = async () => {
    setUserLoading(true);
    try {
      const userData = await getUserById(userId);
      setFirstName(userData.first_name || '');
      setLastName(userData.last_name || '');
      setEmail(userData.email || '');
      setPhone(userData.phone_number || '');
      setSelectedRole(userData.role_id || '');
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      Alert.alert('Error', error.message || 'Failed to fetch user details');
      navigation.goBack();
    } finally {
      setUserLoading(false);
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
    setRolesLoading(true);
    try {
      // Get organization-specific roles for non-platform admins
      let rolesData;
      try {
        const orgData = await getMyOrganization();
        // Use organization ID to filter roles and get grants
        rolesData = await getRolesWithGrants(orgData.id);
      } catch (orgError) {
        console.warn('Could not fetch organization, falling back to all roles:', orgError);
        // Fallback to all roles if organization fetch fails
        rolesData = await getRolesWithGrants();
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
      // Don't set fallback mock data, just show empty state
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleCreateRole = async () => {
    setLoading(true);
    try {
      // Get organization ID
      let orgId: string;
      try {
        const orgData = await getMyOrganization();
        orgId = orgData.id;
      } catch (orgError) {
        console.warn('Could not fetch organization for role creation:', orgError);
        Alert.alert('Error', 'Could not fetch organization information. Please try again.');
        return;
      }

      const newRole = await createRole({
        name: newRoleName.trim(),
        org_id: orgId,
        patterns: [newRolePermissions], // Wrap single pattern in array
        description: newRoleDescription.trim() || undefined
      });

      // Add the new role to the list
      setRoles(prev => [...prev, newRole]);
      setSelectedRole(newRole.id);
      
      // Reset modal state
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRolePermissions(''); // Reset to empty string
      setShowRoleModal(false);
      
      Alert.alert('Success', 'Role created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const selectPermission = (permissionCode: string) => {
    setNewRolePermissions(permissionCode); // Set single pattern
  };

  const handleSave = async () => {
    // Basic validation
    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }

    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    if (!isEdit && !password) {
      Alert.alert('Error', 'Please enter a password for the new user');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone_number: phone.trim() || undefined,
          role_id: selectedRole
        };

        await updateUser(userId, updateData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone_number: phone.trim() || undefined,
          password: password,
          role_id: selectedRole
        };

        await createUser(createData);
        Alert.alert('Success', 'User created successfully');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default' }: any) => (
    <View style={styles.inputContainer}>
      <Typography variant="caption" style={styles.label}>{label} *</Typography>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );

  const PermissionToggle = ({ label, field }: { label: string, field: keyof typeof permissions }) => (
    <View style={styles.permissionRow}>
      <Typography variant="body">{label}</Typography>
      <Switch
        value={permissions[field]}
        onValueChange={(val) => setPermissions(prev => ({ ...prev, [field]: val }))}
        trackColor={{ false: '#CBD5E0', true: COLORS.brand }}
        thumbColor={COLORS.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={isEdit ? 'Edit User' : 'Create User'} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      {userLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
            Loading user details...
          </Typography>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Basic Information</Typography>
          <InputField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="e.g. John" />
          <InputField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="e.g. Doe" />
          <InputField label="Email Address" value={email} onChangeText={setEmail} placeholder="john.doe@example.com" keyboardType="email-address" />
          <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" keyboardType="phone-pad" />
        </View>

        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Authentication & Role</Typography>
          <View style={styles.inputContainer}>
            <View style={styles.roleHeader}>
              <Typography variant="caption" style={styles.label}>Role *</Typography>
              <TouchableOpacity 
                style={styles.createRoleButton}
                onPress={() => setShowRoleModal(true)}
              >
                <Icon name="add" size={16} color={COLORS.brand} />
                <Typography variant="caption" color={COLORS.brand} style={{ marginLeft: 4 }}>
                  Create Role
                </Typography>
              </TouchableOpacity>
            </View>
            <View style={styles.roleContainer}>
              {rolesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand} />
                  <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
                    Loading roles...
                  </Typography>
                </View>
              ) : (roles && Array.isArray(roles) && roles.length > 0) ? roles.map(r => (
                <TouchableOpacity 
                  key={r.id}
                  style={[styles.roleButton, selectedRole === r.id && styles.roleButtonActive]}
                  onPress={() => setSelectedRole(r.id)}
                >
                  <Typography variant="body" color={selectedRole === r.id ? COLORS.white : COLORS.text}>
                    {r.name}
                  </Typography>
                </TouchableOpacity>
              )) : (
                <Typography variant="caption" color={COLORS.textSecondary} style={{ padding: 16, textAlign: 'center' }}>
                  No roles available. Create one using the button above.
                </Typography>
              )}
            </View>
          </View>
          <InputField 
            label={isEdit ? "Set New Password (optional)" : "Initial Password"} 
            value={password} 
            onChangeText={setPassword} 
            placeholder="********" 
            secureTextEntry 
          />
        </View>

        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Permissions</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 12 }}>
            Define what this user can see and do in the app.
          </Typography>
          <PermissionToggle label="Manage Fleet & Vehicles" field="fleet" />
          <PermissionToggle label="Issue & Validate Tickets" field="tickets" />
          <PermissionToggle label="View Financial Reports" field="reports" />
          <PermissionToggle label="Admin Settings Access" field="settings" />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Typography variant="body" color={COLORS.white} style={styles.saveButtonText}>
              {isEdit ? 'Save Changes' : 'Create User'}
            </Typography>
          )}
        </TouchableOpacity>
        
        </ScrollView>
      )}

      {/* Role Creation Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Header 
            title="Create New Role"
            showBack={true}
            onBack={() => setShowRoleModal(false)}
          />
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.section}>
              <Typography variant="h2" style={styles.sectionTitle}>Role Information</Typography>
              
              <View style={styles.inputContainer}>
                <Typography variant="caption" style={styles.label}>Role Name *</Typography>
                <TextInput
                  style={styles.input}
                  value={newRoleName}
                  onChangeText={setNewRoleName}
                  placeholder="e.g. Supervisor, Coordinator"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Typography variant="caption" style={styles.label}>Description (Optional)</Typography>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newRoleDescription}
                  onChangeText={setNewRoleDescription}
                  placeholder="Brief description of this role's responsibilities"
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Typography variant="h2" style={styles.sectionTitle}>Permission Pattern</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginBottom: 16 }}>
                Select one permission pattern for this role
              </Typography>
              
              {permissionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand} />
                  <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
                    Loading permissions...
                  </Typography>
                </View>
              ) : availablePermissions.length > 0 ? (
                // Group permissions by group
                Object.entries(
                  availablePermissions.reduce((groups, permission) => {
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
                          style={[
                            styles.permissionRow,
                            newRolePermissions === patternWithOrg && styles.selectedPermissionRow
                          ]}
                          onPress={() => selectPermission(patternWithOrg)}
                        >
                          <View style={styles.permissionLeft}>
                            <View style={[
                              styles.radioButton,
                              newRolePermissions === patternWithOrg && styles.radioButtonActive
                            ]}>
                              {newRolePermissions === patternWithOrg && (
                                <View style={styles.radioButtonInner} />
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
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleCreateRole}
              disabled={loading}
            >
              <Typography variant="body" color={COLORS.white} style={styles.saveButtonText}>
                {loading ? 'Creating...' : 'Create Role'}
              </Typography>
            </TouchableOpacity>
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
  content: {
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
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleButtonActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
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
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  createRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.brand,
    backgroundColor: '#F0F8FF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  modalContent: {
    padding: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: COLORS.brand,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.brand,
  },
  selectedPermissionRow: {
    backgroundColor: '#F0F8FF',
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
