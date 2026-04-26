import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Header } from '../components/Header';
import { COLORS } from '../theme/colors';
import { createOrganization } from '../api/client';

export const CreateOrganizationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    org_type: 'company',
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    tin: '',
    license_number: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['name', 'org_type', 'contact_first_name', 'contact_last_name', 'contact_email', 'tin'];
    
    for (const field of required) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        Alert.alert('Validation Error', `${field.replace(/_/g, ' ')} is required`);
        return false;
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const orgData = {
        ...formData,
        contact_phone: formData.contact_phone || undefined,
        address: formData.address || undefined,
        license_number: formData.license_number || undefined,
        // city is not allowed by the API — excluded
      };
      
      await createOrganization(orgData);
      
      Alert.alert(
        'Success',
        'Organization created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      Alert.alert('Error', error.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Organization"
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            {/* Organization Details */}
            <View style={styles.section}>
              <Typography variant="body" style={styles.sectionTitle}>
                Organization Details
              </Typography>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  Organization Name *
                </Typography>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter organization name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  Organization Type *
                </Typography>
                <View style={styles.typeSelector}>
                  {['company', 'cooperative', 'ngo', 'government'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        formData.org_type === type && styles.typeOptionSelected,
                      ]}
                      onPress={() => handleInputChange('org_type', type)}
                    >
                      <Typography
                        variant="caption"
                        color={formData.org_type === type ? COLORS.white : COLORS.text}
                        style={styles.typeText}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  License Number
                </Typography>
                <TextInput
                  style={styles.input}
                  value={formData.license_number}
                  onChangeText={(value) => handleInputChange('license_number', value)}
                  placeholder="Enter license number (optional)"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Typography variant="body" style={styles.sectionTitle}>
                Contact Information
              </Typography>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Typography variant="caption" style={styles.label}>
                    First Name *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={formData.contact_first_name}
                    onChangeText={(value) => handleInputChange('contact_first_name', value)}
                    placeholder="First name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Typography variant="caption" style={styles.label}>
                    Last Name *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={formData.contact_last_name}
                    onChangeText={(value) => handleInputChange('contact_last_name', value)}
                    placeholder="Last name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  Email Address *
                </Typography>
                <TextInput
                  style={styles.input}
                  value={formData.contact_email}
                  onChangeText={(value) => handleInputChange('contact_email', value)}
                  placeholder="contact@organization.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  Phone Number
                </Typography>
                <TextInput
                  style={styles.input}
                  value={formData.contact_phone}
                  onChangeText={(value) => handleInputChange('contact_phone', value)}
                  placeholder="+250 XXX XXX XXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Address & Tax Information */}
            <View style={styles.section}>
              <Typography variant="body" style={styles.sectionTitle}>
                Address & Tax Information
              </Typography>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  TIN (Tax Identification Number) *
                </Typography>
                <TextInput
                  style={styles.input}
                  value={formData.tin}
                  onChangeText={(value) => handleInputChange('tin', value)}
                  placeholder="Enter TIN number"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Typography variant="caption" style={styles.label}>
                  Address
                </Typography>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Street address"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Typography variant="body" color={COLORS.white} style={styles.submitText}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Typography>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  typeOptionSelected: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  typeText: {
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontWeight: '600',
  },
});