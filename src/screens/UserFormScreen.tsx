import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { getMyOrganization, getAllOrganizations, inviteUser, updateUser, getUserById, getRolesWithGrants } from '../api/client';
import { authStore } from '../api/authStore';
import { Role } from '../types/role';
import { UpdateUserRequest } from '../types/user';
import { usePermissions } from '../hooks/usePermissions';

export const UserFormScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { isPlatformAdmin } = usePermissions();
  const { userId } = route.params || {};
  const isEdit = !!userId;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(''); // For platform admins
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<{[key: string]: string}>({}); // Map org_id to org_name
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(isEdit);

  useEffect(() => {
    fetchRoles();
    if (isPlatformAdmin) {
      fetchOrganizations();
    }
    if (isEdit && userId) {
      fetchUser();
    }
  }, []);

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

  const fetchOrganizations = async () => {
    try {
      const orgsData = await getAllOrganizations();
      const orgMap: {[key: string]: string} = {};
      
      if (Array.isArray(orgsData)) {
        orgsData.forEach((org: any) => {
          if (org.id && org.name) {
            orgMap[org.id] = org.name;
          }
        });
      }
      
      setOrganizations(orgMap);
    } catch (error: any) {
      console.error('Failed to fetch organizations:', error);
      // Don't show error to user, just continue without org names
    }
  };

  // Defensive effect to ensure roles is always an array
  useEffect(() => {
    if (!Array.isArray(roles) && roles !== null && roles !== undefined) {
      console.warn('Roles is not an array, resetting to empty array:', roles);
      setRoles([]);
    }
  }, [roles]);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      let rolesData;
      let orgId: string | null = null;
      
      if (!isPlatformAdmin) {
        // For organization admins, get organization-specific roles
        // Get org_id from user data instead of making API call
        const userData = await authStore.getUser();
        if (userData?.org_id) {
          console.log('UserFormScreen: Using org_id from user data for roles');
          orgId = userData.org_id;
          rolesData = await getRolesWithGrants(userData.org_id);
        } else {
          // Fallback to API call only if needed
          try {
            const orgData = await getMyOrganization();
            orgId = orgData.id;
            rolesData = await getRolesWithGrants(orgData.id);
          } catch (orgError) {
            console.warn('Could not fetch organization:', orgError);
            setRoles([]);
            return;
          }
        }
      } else {
        // For platform admins, get all roles (no org filter)
        console.log('UserFormScreen: Fetching all roles for platform admin');
        rolesData = await getRolesWithGrants();
      }
      
      // Ensure rolesData is an array and not null/undefined
      if (rolesData && Array.isArray(rolesData)) {
        if (isPlatformAdmin) {
          // Platform admins can see all roles
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
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please fill out first name and last name');
      return;
    }

    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    // For invitations, require at least email or phone
    if (!isEdit && !email.trim() && !phone.trim()) {
      Alert.alert('Error', 'Please provide at least an email address or phone number for the invitation');
      return;
    }

    if (!email && !phone) {
      Alert.alert('Error', 'Please provide either email or phone number');
      return;
    }

    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || undefined,
          phone_number: phone.trim() || undefined,
          role_id: selectedRole
        };

        await updateUser(userId, updateData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        // Get organization ID for invitation
        let orgId: string;
        
        if (isPlatformAdmin) {
          // For platform admins, we need to determine which organization to invite to
          // For now, let's extract org_id from the selected role
          const selectedRoleObj = roles.find(r => r.id === selectedRole);
          if (selectedRoleObj && selectedRoleObj.org_id) {
            orgId = selectedRoleObj.org_id;
          } else {
            Alert.alert('Error', 'Please select an organization-specific role to determine which organization to invite the user to.');
            return;
          }
        } else {
          // For organization admins, get their organization
          try {
            const orgData = await getMyOrganization();
            orgId = orgData.id;
          } catch (orgError) {
            console.warn('Could not fetch organization for user invitation:', orgError);
            Alert.alert('Error', 'Could not fetch organization information. Please try again.');
            return;
          }
        }

        // Find the selected role to get its slug
        const selectedRoleObj = roles.find(role => role.id === selectedRole);
        if (!selectedRoleObj) {
          Alert.alert('Error', 'Please select a valid role.');
          return;
        }

        // Invite new user instead of creating directly
        const inviteData = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          org_id: orgId,
          role_slug: selectedRoleObj.slug,
          ...(email.trim() && { email: email.trim() }),
          ...(phone.trim() && { phone_number: phone.trim() })
        };

        console.log('Sending invitation with data:', inviteData);
        await inviteUser(inviteData);
        Alert.alert(
          'Success', 
          'User invitation sent successfully! They will receive an invite link via SMS and/or email.',
          [
            {
              text: 'View Invitations',
              onPress: () => {
                navigation.navigate('Invitations');
              }
            },
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
        return; // Don't call navigation.goBack() here since Alert handles navigation
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${isEdit ? 'update' : 'invite'} user`);
    } finally {
      setLoading(false);
    }
  };

  const InputField = useCallback(({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default' }: any) => (
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
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={isEdit ? 'Edit User' : 'Invite User'} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {userLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
              Loading user details...
            </Typography>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        
        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Basic Information</Typography>
          <InputField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="e.g. John" />
          <InputField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="e.g. Doe" />
          <InputField label="Email Address" value={email} onChangeText={setEmail} placeholder="john.doe@example.com" keyboardType="email-address" />
          <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+250 123 456 789" keyboardType="phone-pad" />
          {!isEdit && (
            <View style={styles.inviteNote}>
              <Icon name="info" size={16} color={COLORS.brand} />
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8, flex: 1 }}>
                An invitation will be sent to the provided email and/or phone number. At least one contact method is required.
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Role Assignment</Typography>
          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>Role *</Typography>
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
                  <View>
                    <Typography variant="body" color={selectedRole === r.id ? COLORS.white : COLORS.text}>
                      {r.name}
                    </Typography>
                    {isPlatformAdmin && r.org_id && (
                      <Typography variant="caption" color={selectedRole === r.id ? COLORS.white : COLORS.textSecondary}>
                        {organizations[r.org_id] || r.org_id}
                      </Typography>
                    )}
                  </View>
                </TouchableOpacity>
              )) : (
                <Typography variant="caption" color={COLORS.textSecondary} style={{ padding: 16, textAlign: 'center' }}>
                  No roles available. Please create roles in Role Management first.
                </Typography>
              )}
            </View>
          </View>
          <View style={styles.roleNote}>
            <Icon name="info" size={16} color={COLORS.brand} />
            <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8, flex: 1 }}>
              {isPlatformAdmin 
                ? "Select a role to assign to this user. The organization will be determined by the role selected."
                : "Permissions are managed through roles. Select a role to assign the appropriate permissions to this user."
              }
            </Typography>
          </View>
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
              {isEdit ? 'Save Changes' : 'Send Invitation'}
            </Typography>
          )}
        </TouchableOpacity>
        
        </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inviteNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: 8,
  },
  roleNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginTop: 8,
  },
});
