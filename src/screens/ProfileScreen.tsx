import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';

import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { apiClient, getMyOrganization, updateOrganization, getAvatarPresignedUrl, updateUserAvatar, uploadImageToPresignedUrl } from '../api/client';
import { API_CONFIG } from '../api/config';
import { authStore } from '../api/authStore';
import { Organization } from '../types/organization';


export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchOrganization();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient('/users/me');
      if (response) {
        setFirstName(response.first_name || '');
        setLastName(response.last_name || '');
        setEmail(response.email || '');
        setPhoneNumber(response.phone_number || '');
        setAvatarPath(response.avatar_path || null);
        // If there's an avatar_path, construct the full URL
        if (response.avatar_path) {
          setAvatar(`${API_CONFIG.CDN_URL}/${response.avatar_path}`);
        }
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      
      // Handle token expiration
      if (error.status === 401) {
        Alert.alert(
          t('common.error'), 
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear auth data and navigate to login
                authStore.clearAll();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.message || t('profile.errorFetch'));
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchOrganization = async () => {
    try {
      const orgData = await getMyOrganization();
      setOrganization(orgData);
    } catch (error: any) {
      console.error('Fetch organization error:', error);
      // Don't show error for organization fetch as it might be optional
      if (error.status === 401) {
        // Handle token expiration same as profile
        Alert.alert(
          t('common.error'), 
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => {
                authStore.clearAll();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }
    }
  };

  const handleSelectImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      await uploadAvatar(selectedImage.uri, selectedImage.mimeType || 'image/jpeg');
    }
  };

  const uploadAvatar = async (imageUri: string, mimeType: string) => {
    setUploadingAvatar(true);
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await getAvatarPresignedUrl(mimeType);
      const { upload_url, path } = presignedResponse;

      // Step 2: Upload image to presigned URL
      await uploadImageToPresignedUrl(upload_url, imageUri, mimeType);

      // Step 3: Update user record with avatar path
      await updateUserAvatar(path);

      // Step 4: Update local state
      setAvatarPath(path);
      setAvatar(imageUri); // Show the local image immediately
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploadingAvatar(true);
            try {
              await updateUserAvatar(null);
              setAvatarPath(null);
              setAvatar(null);
              Alert.alert('Success', 'Profile picture removed successfully!');
            } catch (error: any) {
              console.error('Avatar removal error:', error);
              Alert.alert('Error', error.message || 'Failed to remove profile picture');
            } finally {
              setUploadingAvatar(false);
            }
          }
        }
      ]
    );
  };


  const handleSave = async () => {
    setLoading(true);
    try {
      // Only update fields that don't require login channel change
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
      };
      
      // Check if user is trying to change email or phone
      const originalEmail = organization ? '' : email; // Get original from user data
      const originalPhone = phoneNumber;
      
      // Don't include email and phone in profile update as they require login channel change
      console.log('Updating profile with safe fields only:', updateData);
      
      await apiClient('/users/me', {
        method: 'PATCH',
        body: updateData,
      });

      setLoading(false);
      Alert.alert(
        t('profile.title'),
        'Profile updated successfully! To change your email or phone number, please use the Login Channel option in Settings.',
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('Update profile error:', error);
      
      // Handle the specific login channel change required error
      if (error.data && error.data.error && error.data.error.code === 'LOGIN_CHANNEL_CHANGE_REQUIRED') {
        Alert.alert(
          'Login Channel Change Required',
          'To update your email or phone number, please use the Login Channel option in Settings for security verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Login Channel', 
              onPress: () => navigation.navigate('LoginChannel')
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.message || t('profile.errorUpdate'));
      }
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header 
        title={t('profile.title')} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      {initialLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="person" size={50} color="#CBD5E0" />
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editBadge}
                onPress={handleSelectImage}
                disabled={uploadingAvatar}
              >
                <Icon name="camera" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarActions}>
              <TouchableOpacity onPress={handleSelectImage} disabled={uploadingAvatar}>
                <Typography variant="caption" color={uploadingAvatar ? COLORS.textSecondary : COLORS.brand} style={styles.editLink}>
                  {uploadingAvatar ? 'Uploading...' : t('profile.editAvatar')}
                </Typography>
              </TouchableOpacity>
              {avatar && !uploadingAvatar && (
                <TouchableOpacity onPress={removeAvatar} style={styles.removeButton}>
                  <Typography variant="caption" color="#E53E3E" style={styles.editLink}>
                    Remove
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                {t('profile.firstName')}
              </Typography>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('profile.firstName')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                {t('profile.lastName')}
              </Typography>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('profile.lastName')}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                  {t('profile.phoneNumber')}
                </Typography>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('LoginChannel')}
                  style={styles.changeChannelButton}
                >
                  <Typography variant="caption" color={COLORS.brand} style={styles.changeChannelText}>
                    Change via Login Channel
                  </Typography>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={phoneNumber}
                placeholder={t('profile.phoneNumber')}
                keyboardType="phone-pad"
                editable={false}
              />
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.helperText}>
                To change your phone number, use Login Channel in Settings for security verification
              </Typography>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                  {t('profile.email')}
                </Typography>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('LoginChannel')}
                  style={styles.changeChannelButton}
                >
                  <Typography variant="caption" color={COLORS.brand} style={styles.changeChannelText}>
                    Change via Login Channel
                  </Typography>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={email}
                placeholder={t('profile.email')}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.helperText}>
                To change your email address, use Login Channel in Settings for security verification
              </Typography>
            </View>

            {organization && (
              <View style={styles.organizationSection}>
                <Typography variant="h3" color={COLORS.text} style={styles.sectionTitle}>
                  Organization
                </Typography>
                <View style={styles.orgCard}>
                  <Typography variant="body" color={COLORS.text} style={styles.orgName}>
                    {organization.name}
                  </Typography>
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    Status: {organization.status}
                  </Typography>
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    Type: {organization.org_type}
                  </Typography>
                  {organization.contact_email && (
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Email: {organization.contact_email}
                    </Typography>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Typography color={COLORS.white} variant="body" style={styles.saveText}>
                  {t('profile.save')}
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.brand,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  removeButton: {
    marginLeft: 8,
  },
  editLink: {
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeChannelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeChannelText: {
    fontWeight: '600',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#F7FAFC',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readOnlyInput: {
    backgroundColor: '#F0F0F0',
    color: COLORS.textSecondary,
  },
  helperText: {
    marginTop: 4,
    fontSize: 11,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: COLORS.brand,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  organizationSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  orgCard: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});
