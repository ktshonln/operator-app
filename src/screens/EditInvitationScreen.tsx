import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { updateInvitation, getRolesWithGrants } from '../api/client';
import { useOrganization } from '../hooks/useOrganization';
import { Role } from '../types/role';

const LANGUAGES = [
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const EditInvitationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const { organization } = useOrganization();
  const { invitation } = route.params || {};

  const [firstName, setFirstName] = useState(invitation?.first_name || '');
  const [lastName, setLastName] = useState(invitation?.last_name || '');
  const [email, setEmail] = useState(invitation?.email || '');
  const [phone, setPhone] = useState(invitation?.phone_number || '');
  const [selectedRole, setSelectedRole] = useState(invitation?.role_slug || '');
  const [selectedLocale, setSelectedLocale] = useState(invitation?.locale || 'en');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const orgId = organization?.id;
      const rolesData = await getRolesWithGrants(orgId);
      
      if (rolesData && Array.isArray(rolesData)) {
        const filteredRoles = rolesData.filter(role => {
          if (role.org_id === orgId) return true;
          if (role.is_managed && role.org_id === null) return true;
          return false;
        });
        setRoles(filteredRoles);
      } else {
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
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ...(email.trim() && { email: email.trim() }),
        ...(phone.trim() && { phone_number: phone.trim() }),
        role_id: selectedRole,
        locale: selectedLocale
      };

      await updateInvitation(invitation.id, updateData);
      Alert.alert('Success', 'Invitation updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to update invitation:', error);
      Alert.alert('Error', error.message || 'Failed to update invitation');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View style={styles.inputContainer}>
      <Typography variant="caption" style={styles.label}>{label} *</Typography>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Edit Invitation" 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningCard}>
          <Icon name="alert" size={20} color="#F59E0B" />
          <Typography variant="caption" color="#92400E" style={{ marginLeft: 8, flex: 1 }}>
            Changes will only apply if the invitation hasn't been accepted yet. The invitee will receive a new invitation link if contact details are changed.
          </Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Basic Information</Typography>
          <InputField 
            label="First Name" 
            value={firstName} 
            onChangeText={setFirstName} 
            placeholder="e.g. John" 
          />
          <InputField 
            label="Last Name" 
            value={lastName} 
            onChangeText={setLastName} 
            placeholder="e.g. Doe" 
          />
          <InputField 
            label="Email Address" 
            value={email} 
            onChangeText={setEmail} 
            placeholder="john.doe@example.com" 
            keyboardType="email-address" 
          />
          <InputField 
            label="Phone Number" 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="+250 123 456 789" 
            keyboardType="phone-pad" 
          />
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
              ) : roles.length > 0 ? roles.map(role => (
                <TouchableOpacity 
                  key={role.id}
                  style={[styles.roleButton, selectedRole === role.id && styles.roleButtonActive]}
                  onPress={() => setSelectedRole(role.id)}
                >
                  <Typography variant="body" color={selectedRole === role.id ? COLORS.white : COLORS.text}>
                    {role.name}
                  </Typography>
                </TouchableOpacity>
              )) : (
                <Typography variant="caption" color={COLORS.textSecondary} style={{ padding: 16, textAlign: 'center' }}>
                  No roles available
                </Typography>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>Language Preference</Typography>
          <View style={styles.inputContainer}>
            <Typography variant="caption" style={styles.label}>Default Language</Typography>
            <View style={styles.languageContainer}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity 
                  key={lang.code}
                  style={[styles.languageButton, selectedLocale === lang.code && styles.languageButtonActive]}
                  onPress={() => setSelectedLocale(lang.code)}
                >
                  <Typography variant="body" style={{ marginRight: 8 }}>
                    {lang.flag}
                  </Typography>
                  <Typography variant="body" color={selectedLocale === lang.code ? COLORS.white : COLORS.text}>
                    {lang.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
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
              Update Invitation
            </Typography>
          )}
        </TouchableOpacity>
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 16,
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
  languageContainer: {
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  languageButtonActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
});