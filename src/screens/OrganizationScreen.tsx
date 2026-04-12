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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useOrganization } from '../hooks/useOrganization';

export const OrganizationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { organization, loading, updating, error, refetch, updateOrganization } = useOrganization();
  
  const [isEditing, setIsEditing] = useState(false);
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
      // Only send fields that are likely to be updatable based on API docs
      const updateData = {
        name: editData.name,
        // Add other fields one by one to test which ones are accepted
        // contact_email: editData.contact_email,
        // contact_phone: editData.contact_phone,
        // address: editData.address,
        // tin: editData.tin,
        // license_number: editData.license_number,
      };
      
      await updateOrganization(updateData);
      setIsEditing(false);
      Alert.alert('Success', 'Organization updated successfully');
    } catch (error: any) {
      console.error('Update organization error details:', error);
      
      let errorMessage = 'Failed to update organization';
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <Header 
          title="Organization" 
          showBack={true} 
          onBack={() => navigation.goBack()} 
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <Header 
          title="Organization" 
          showBack={true} 
          onBack={() => navigation.goBack()} 
        />
        <View style={styles.centered}>
          <Typography variant="body" color={COLORS.textSecondary}>
            {error}
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header 
        title="Organization" 
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightElement={
          !isEditing ? (
            <TouchableOpacity onPress={handleEdit}>
              <Typography variant="body" color={COLORS.brand} style={styles.editButton}>
                Edit
              </Typography>
            </TouchableOpacity>
          ) : null
        }
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {organization ? (
          <View style={styles.content}>
            <View style={styles.card}>
              {!isEditing ? (
                <>
                  <Typography variant="h2" color={COLORS.text} style={styles.orgName}>
                    {organization.name}
                  </Typography>
                  
                  <View style={styles.statusContainer}>
                    <Typography 
                      variant="caption" 
                      color={organization.status === 'approved' ? '#38A169' : '#ED8936'}
                      style={styles.status}
                    >
                      {organization.status.toUpperCase()}
                    </Typography>
                  </View>

                  <View style={styles.infoSection}>
                    <InfoRow label="Type" value={organization.org_type} />
                    <InfoRow label="Email" value={organization.contact_email} />
                    <InfoRow label="Phone" value={organization.contact_phone} />
                    <InfoRow label="Address" value={organization.address} />
                    <InfoRow label="TIN" value={organization.tin} />
                    <InfoRow label="License" value={organization.license_number} />
                  </View>

                  {organization.approved_at && (
                    <Typography variant="caption" color={COLORS.textSecondary} style={styles.approvedDate}>
                      Approved: {new Date(organization.approved_at).toLocaleDateString()}
                    </Typography>
                  )}
                </>
              ) : (
                <View style={styles.editForm}>
                  <Typography variant="h2" color={COLORS.text} style={styles.editTitle}>
                    Edit Organization
                  </Typography>

                  <EditField
                    label="Organization Name"
                    value={editData.name}
                    onChangeText={(text) => setEditData({ ...editData, name: text })}
                  />

                  <EditField
                    label="Contact Email"
                    value={editData.contact_email}
                    onChangeText={(text) => setEditData({ ...editData, contact_email: text })}
                    keyboardType="email-address"
                  />

                  <EditField
                    label="Contact Phone"
                    value={editData.contact_phone}
                    onChangeText={(text) => setEditData({ ...editData, contact_phone: text })}
                    keyboardType="phone-pad"
                  />

                  <EditField
                    label="Address"
                    value={editData.address}
                    onChangeText={(text) => setEditData({ ...editData, address: text })}
                    multiline
                  />

                  <EditField
                    label="TIN"
                    value={editData.tin}
                    onChangeText={(text) => setEditData({ ...editData, tin: text })}
                  />

                  <EditField
                    label="License Number"
                    value={editData.license_number}
                    onChangeText={(text) => setEditData({ ...editData, license_number: text })}
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.button, styles.cancelButton]} 
                      onPress={handleCancel}
                    >
                      <Typography variant="body" color={COLORS.textSecondary}>
                        Cancel
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.button, styles.saveButton, updating && { opacity: 0.7 }]} 
                      onPress={handleSave}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Typography variant="body" color={COLORS.white}>
                          Save
                        </Typography>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.centered}>
            <Typography variant="body" color={COLORS.textSecondary}>
              No organization found
            </Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoLabel}>
      {label}
    </Typography>
    <Typography variant="body" color={COLORS.text}>
      {value}
    </Typography>
  </View>
);

const EditField: React.FC<{ 
  label: string; 
  value: string; 
  onChangeText: (text: string) => void;
  keyboardType?: any;
  multiline?: boolean;
}> = ({ label, value, onChangeText, keyboardType, multiline }) => (
  <View style={styles.editField}>
    <Typography variant="caption" color={COLORS.textSecondary} style={styles.fieldLabel}>
      {label}
    </Typography>
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
  </View>
);

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
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  approvedDate: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  editButton: {
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  editField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7FAFC',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  multilineInput: {
    height: 80,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: COLORS.brand,
  },
});