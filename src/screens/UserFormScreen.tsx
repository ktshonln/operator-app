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
  const { isPlatformAdmin, loading: permissionsLoading } = usePermissions();
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
    // Wait for permissions to load before fetching roles
    if (permissionsLoading) return;

    fetchRoles();
    if (isPlatformAdmin) {
      fetchOrganizations();
    }
  }, [permissionsLoading, isPlatformAdmin]);

  useEffect(() => {
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
        // For platform admins, get all roles but only show org-specific ones for invitations
        // (system roles with org_id=null can't be assigned via invitation to an org)
        console.log('UserFormScreen: Fetching all roles for platform admin');
        rolesData = await getRolesWithGrants();
      }
      
      // Ensure rolesData is an array and not null/undefined
      if (rolesData && Array.isArray(rolesData)) {
        if (isPlatformAdmin) {
          // Platform admins see ALL roles including system roles
          console.log('UserFormScreen: Platform admin roles available:', rolesData.length);
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

  const DEFAULT_COUNTRY_CODE = '+250'; // Rwanda

  const normalizePhone = (phoneNumber: string): string => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) return '';
    // Already has country code
    if (trimmed.startsWith('+')) return trimmed;
    // Has leading 0 (local format like 0780000000) — strip it and add country code
    if (trimmed.startsWith('0')) return `${DEFAULT_COUNTRY_CODE}${trimmed.slice(1)}`;
    // Just digits — prepend country code
    return `${DEFAULT_COUNTRY_CODE}${trimmed}`;
  };

  const validatePhone = (phoneNumber: string): boolean => {
    if (!phoneNumber.trim()) return true; // optional field
    const normalized = normalizePhone(phoneNumber);
    // +[country code][number], 7-15 digits after +
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(normalized);
  };

  const validateEmail = (emailAddress: string): boolean => {
    if (!emailAddress.trim()) return true; // optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress.trim());
  };

  const handleSave = async () => {
    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
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

    // Validate email format if provided
    if (email.trim() && !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address (e.g. user@example.com)');
      return;
    }

    // Validate phone format if provided
    if (phone.trim() && !validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number (e.g. 0780000000 or +250780000000)');
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
          // For platform admins, extract org_id from the selected role
          const selectedRoleObj = roles.find(r => r.id === selectedRole);
          if (selectedRoleObj && selectedRoleObj.org_id) {
            // Org-specific role — use its org_id
            orgId = selectedRoleObj.org_id;
          } else if (selectedOrgId) {
            // System role — use the manually selected org
            orgId = selectedOrgId;
          } else {
            Alert.alert('Error', 'This is a system role. Please select an organization to invite the user into.');
            setLoading(false);
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
          role_slugs: [selectedRoleObj.slug],  // API requires array
          ...(email.trim() && { email: email.trim() }),
          ...(phone.trim() && { phone_number: normalizePhone(phone) })
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
      // error.message already contains the backend message from apiClient
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
          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>Phone Number</Typography>
            <TextInput
              style={[styles.input, phone.trim() && !validatePhone(phone) && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+250780000000"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />
            {phone.trim() && !validatePhone(phone) && (
              <Typography variant="caption" color="#EF4444" style={{ marginTop: 4 }}>
                Enter a valid phone number (e.g. 0780000000 or +250780000000)
              </Typography>
            )}
          </View>
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
              {rolesLoading || permissionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand} />
                  <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8 }}>
                    Loading roles...
                  </Typography>
                </View>
              ) : (roles && Array.isArray(roles) && roles.length > 0) ? roles.map(r => {
                const isSystemRole = r.is_managed && r.org_id === null;
                const isDisabled = isSystemRole && !isPlatformAdmin;
                return (
                  <TouchableOpacity 
                    key={r.id}
                    style={[
                      styles.roleButton,
                      selectedRole === r.id && styles.roleButtonActive,
                      isDisabled && styles.roleButtonDisabled,
                    ]}
                    onPress={() => !isDisabled && setSelectedRole(r.id)}
                    disabled={isDisabled}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Typography variant="body" color={
                          isDisabled ? COLORS.textSecondary :
                          selectedRole === r.id ? COLORS.white : COLORS.text
                        }>
                          {r.name}
                        </Typography>
                        {isSystemRole && (
                          <View style={[
                            styles.systemBadge,
                            selectedRole === r.id && !isDisabled && styles.systemBadgeActive
                          ]}>
                            <Typography variant="caption" style={[
                              styles.systemBadgeText,
                              selectedRole === r.id && !isDisabled && { color: COLORS.brand }
                            ]}>
                              SYSTEM
                            </Typography>
                          </View>
                        )}
                      </View>
                      {isPlatformAdmin && r.org_id && (
                        <Typography variant="caption" color={selectedRole === r.id ? COLORS.white : COLORS.textSecondary}>
                          {organizations[r.org_id] || r.org_id}
                        </Typography>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }) : (
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
                ? "Select a role to assign to this user. For org-specific roles the organization is auto-detected. For system roles, select an organization below."
                : "Permissions are managed through roles. Select a role to assign the appropriate permissions to this user."
              }
            </Typography>
          </View>

          {/* Organization picker for platform admins when a system role is selected */}
          {isPlatformAdmin && selectedRole && (() => {
            const selectedRoleObj = roles.find(r => r.id === selectedRole);
            const isSystemRole = selectedRoleObj?.is_managed && !selectedRoleObj?.org_id;
            if (!isSystemRole) return null;
            return (
              <View style={styles.inputContainer}>
                <Typography variant="caption" style={[styles.label, { marginTop: 12 }]}>
                  Select Organization *
                </Typography>
                <View style={styles.roleContainer}>
                  {Object.entries(organizations).map(([orgId, orgName]) => (
                    <TouchableOpacity
                      key={orgId}
                      style={[styles.roleButton, selectedOrgId === orgId && styles.roleButtonActive]}
                      onPress={() => setSelectedOrgId(orgId)}
                    >
                      <Typography variant="body" color={selectedOrgId === orgId ? COLORS.white : COLORS.text}>
                        {orgName}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })()}
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
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
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
  roleButtonDisabled: {
    backgroundColor: '#F1F3F4',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  systemBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  systemBadgeActive: {
    backgroundColor: COLORS.white,
  },
  systemBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#718096',
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
