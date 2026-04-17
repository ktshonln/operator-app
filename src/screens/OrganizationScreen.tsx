import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Icon, IconName } from '../components/Icon';
import { useOrganization } from '../hooks/useOrganization';
import { getOrganizationLogoPresignedUrl, updateOrganizationLogo, uploadImageToPresignedUrl } from '../api/client';
import { API_CONFIG } from '../api/config';

const { width } = Dimensions.get('window');

export const OrganizationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { organization, loading, updating, error, refetch, updateOrganization } = useOrganization();
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    tin: '',
    license_number: '',
  });

  React.useEffect(() => {
    if (organization) {
      setEditData({
        name: organization.name || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        address: organization.address || '',
        tin: organization.tin || '',
        license_number: organization.license_number || '',
      });
      
      // Set logo URL if available
      if (organization.logo_path) {
        setLogo(`${API_CONFIG.CDN_URL}/${organization.logo_path}`);
      } else {
        setLogo(null);
      }
    }
  }, [organization]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (organization) {
      setEditData({
        name: organization.name || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        address: organization.address || '',
        tin: organization.tin || '',
        license_number: organization.license_number || '',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Try with just the name first (most basic update)
      const basicUpdateData = {
        name: editData.name,
      };
      
      console.log('Attempting basic organization update with:', basicUpdateData);
      
      try {
        await updateOrganization(basicUpdateData);
        setIsEditing(false);
        Alert.alert('Success', 'Organization name updated successfully');
        return;
      } catch (basicError) {
        console.log('Basic update failed, trying with more fields...');
      }
      
      // If basic update fails, try with more fields but filter out invalid values
      const updateData: any = {
        name: editData.name,
      };
      
      // Only include valid, non-placeholder values
      if (editData.contact_email && 
          editData.contact_email !== 'string' && 
          editData.contact_email.includes('@')) {
        updateData.contact_email = editData.contact_email;
      }
      
      if (editData.contact_phone && 
          editData.contact_phone !== 'string' && 
          editData.contact_phone.length > 5) {
        updateData.contact_phone = editData.contact_phone;
      }
      
      if (editData.address && 
          editData.address !== 'string' && 
          editData.address.length > 2) {
        updateData.address = editData.address;
      }
      
      // Skip TIN and license if they look like placeholders
      if (editData.tin && 
          editData.tin !== 'string' && 
          editData.tin !== organization?.tin &&
          editData.tin.length > 2) {
        updateData.tin = editData.tin;
      }
      
      if (editData.license_number && 
          editData.license_number !== 'string' && 
          editData.license_number !== organization?.license_number &&
          editData.license_number.length > 2) {
        updateData.license_number = editData.license_number;
      }
      
      console.log('Updating organization with filtered data:', updateData);
      await updateOrganization(updateData);
      setIsEditing(false);
      Alert.alert('Success', 'Organization updated successfully');
    } catch (error: any) {
      console.error('Update organization error details:', error);
      
      let errorMessage = 'Failed to update organization';
      
      // Extract detailed validation errors
      if (error.data && error.data.error && error.data.error.details) {
        console.log('Validation error details:', error.data.error.details);
        
        if (Array.isArray(error.data.error.details)) {
          const validationErrors = error.data.error.details.map((detail: any) => {
            if (typeof detail === 'string') return detail;
            if (detail.message) return detail.message;
            if (detail.field && detail.error) return `${detail.field}: ${detail.error}`;
            return JSON.stringify(detail);
          }).join('\n');
          
          errorMessage = `Validation errors:\n${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSelectLogo = async () => {
    if (!organization) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      await uploadLogo(selectedImage.uri, selectedImage.mimeType || 'image/jpeg');
    }
  };

  const uploadLogo = async (imageUri: string, mimeType: string) => {
    if (!organization) return;
    
    setUploadingLogo(true);
    try {
      const presignedResponse = await getOrganizationLogoPresignedUrl(organization.id, mimeType);
      const { upload_url, path } = presignedResponse;

      await uploadImageToPresignedUrl(upload_url, imageUri, mimeType);
      await updateOrganizationLogo(organization.id, path);

      setLogo(imageUri);
      await refetch();
      
      Alert.alert('Success', 'Organization logo updated successfully!');
    } catch (error: any) {
      console.error('Logo upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload organization logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!organization) return;
    
    Alert.alert(
      'Remove Logo',
      'Are you sure you want to remove the organization logo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploadingLogo(true);
            try {
              await updateOrganizationLogo(organization.id, null);
              setLogo(null);
              await refetch();
              Alert.alert('Success', 'Organization logo removed successfully!');
            } catch (error: any) {
              console.error('Logo removal error:', error);
              Alert.alert('Error', error.message || 'Failed to remove organization logo');
            } finally {
              setUploadingLogo(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !organization) {
    return (
      <View style={styles.container}>
        <Header title="Organization" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header 
        title="Organization" 
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightElement={
          !isEditing ? (
            <TouchableOpacity onPress={handleEdit} style={styles.headerEditBtn}>
              <Icon name="edit" size={20} color={COLORS.brand} />
            </TouchableOpacity>
          ) : null
        }
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.brand} />
          }
          showsVerticalScrollIndicator={false}
        >
          {organization ? (
            <View style={styles.content}>
              <View style={styles.profileInfoArea}>
                <View style={styles.logoWrapper}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.logo} />
                  ) : (
                    <View style={[styles.logo, styles.logoPlaceholder]}>
                      <Icon name="business" size={48} color={COLORS.brand + '40'} />
                    </View>
                  )}
                  {uploadingLogo && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.logoEditBadge}
                    onPress={handleSelectLogo}
                    disabled={uploadingLogo}
                  >
                    <Icon name="camera" size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>

                {!isEditing && (
                  <View style={styles.basicInfo}>
                    <Typography variant="h1" style={styles.orgNameHeadline}>
                      {organization.name}
                    </Typography>
                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(organization.status) + '15' }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(organization.status) }]} />
                      <Typography 
                        variant="caption" 
                        style={[styles.statusText, { color: getStatusColor(organization.status) }]}
                      >
                        {organization.status.toUpperCase()}
                      </Typography>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.mainContentArea}>
                {!isEditing ? (
                  <>
                    <View style={styles.infoCard}>
                      <Typography variant="h3" style={styles.cardTitle}>Contact Information</Typography>
                      <InfoItem icon="mail" label="Official Email" value={organization.contact_email} />
                      <InfoItem icon="phone" label="Phone Number" value={organization.contact_phone} />
                      <InfoItem icon="map" label="Physical Address" value={organization.address} />
                    </View>

                    <View style={styles.infoCard}>
                      <Typography variant="h3" style={styles.cardTitle}>Business Details</Typography>
                      <InfoItem icon="info" label="Organization Type" value={organization.org_type} />
                      <InfoItem icon="card" label="Tax ID (TIN)" value={organization.tin} />
                      <InfoItem icon="shield" label="License Number" value={organization.license_number} />
                    </View>

                    {organization.approved_at && (
                      <View style={styles.footerInfo}>
                        <Icon name="check-circle" size={14} color={COLORS.textSecondary} />
                        <Typography variant="caption" style={styles.approvedText}>
                          Verified on {new Date(organization.approved_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.editFormCard}>
                    <Typography variant="h2" style={styles.editCardTitle}>Update Organization</Typography>
                    
                    <View style={styles.formGroup}>
                      <CustomInput
                        label="Organization Name"
                        icon="business"
                        value={editData.name}
                        onChangeText={(text) => setEditData({ ...editData, name: text })}
                        placeholder="Enter organization name"
                      />

                      <CustomInput
                        label="Contact Email"
                        icon="mail"
                        value={editData.contact_email}
                        onChangeText={(text) => setEditData({ ...editData, contact_email: text })}
                        keyboardType="email-address"
                        placeholder="Email address"
                      />

                      <CustomInput
                        label="Contact Phone"
                        icon="phone"
                        value={editData.contact_phone}
                        onChangeText={(text) => setEditData({ ...editData, contact_phone: text })}
                        keyboardType="phone-pad"
                        placeholder="Phone number"
                      />

                      <CustomInput
                        label="Address"
                        icon="map"
                        value={editData.address}
                        onChangeText={(text) => setEditData({ ...editData, address: text })}
                        multiline
                        placeholder="Office address"
                      />

                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <CustomInput
                            label="TIN"
                            icon="card"
                            value={editData.tin}
                            onChangeText={(text) => setEditData({ ...editData, tin: text })}
                            placeholder="TIN"
                          />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                          <CustomInput
                            label="License No."
                            icon="shield"
                            value={editData.license_number}
                            onChangeText={(text) => setEditData({ ...editData, license_number: text })}
                            placeholder="License"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.btn, styles.btnOutline]} 
                        onPress={handleCancel}
                      >
                        <Typography variant="body" color={COLORS.textSecondary}>Cancel</Typography>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.btn, styles.btnPrimary, updating && styles.btnDisabled]} 
                        onPress={handleSave}
                        disabled={updating}
                      >
                        {updating ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Typography variant="body" color="#FFFFFF" style={{ fontWeight: 'bold' }}>Update Profile</Typography>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.centered}>
              <Icon name="alert" size={48} color={COLORS.textSecondary + '40'} />
              <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>
                Organization details not found
              </Typography>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const InfoItem: React.FC<{ icon: IconName; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.infoItemRow}>
    <View style={styles.infoIconBox}>
      <Icon name={icon} size={18} color={COLORS.brand} />
    </View>
    <View style={styles.infoTexts}>
      <Typography variant="caption" style={styles.infoLabelText}>{label}</Typography>
      <Typography variant="body" style={styles.infoValueText}>{value || 'Not provided'}</Typography>
    </View>
  </View>
);

const CustomInput: React.FC<{ 
  label: string; 
  icon: IconName;
  value: string; 
  onChangeText: (text: string) => void;
  keyboardType?: any;
  multiline?: boolean;
  placeholder?: string;
}> = ({ label, icon, value, onChangeText, keyboardType, multiline, placeholder }) => (
  <View style={styles.inputContainer}>
    <Typography variant="caption" style={styles.inputLabel}>{label}</Typography>
    <View style={[styles.inputWrapper, multiline && styles.multilineInputWrapper]}>
      <Icon name={icon} size={18} color={COLORS.brand + '80'} style={styles.inputIcon} />
      <TextInput
        style={[styles.textInput, multiline && styles.multilineTextInput]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary + '80'}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingBottom: 40,
  },

  profileInfoArea: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 0,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
  },
  logoPlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.brand,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  basicInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  orgNameHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContentArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.brand + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabelText: {
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValueText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  approvedText: {
    color: '#94A3B8',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  editFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  editCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  multilineInputWrapper: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: Platform.OS === 'ios' ? 0 : 2,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  multilineTextInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  row: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnOutline: {
    backgroundColor: '#F1F5F9',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  headerEditBtn: {
    backgroundColor: COLORS.brand + '15',
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
