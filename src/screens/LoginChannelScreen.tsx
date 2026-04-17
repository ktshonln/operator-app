import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { apiClient, initiateLoginChannelChange, confirmLoginChannelChange } from '../api/client';

export const LoginChannelScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentChannel, setCurrentChannel] = useState<'email' | 'phone'>('email');
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'phone'>('email');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pendingChange, setPendingChange] = useState(false);
  const [pendingChannelContext, setPendingChannelContext] = useState<{
    channel: 'email' | 'phone';
    identifier?: string;
  } | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await apiClient('/users/me', { method: 'GET' });
      setUser(userData);
      
      // Determine current login channel
      const loginChannel = userData.login_channel || 'email';
      setCurrentChannel(loginChannel);
      setSelectedChannel(loginChannel);
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = async () => {
    if (selectedChannel === currentChannel && !newIdentifier) {
      Alert.alert('Info', 'Please select a different channel or provide a new identifier');
      return;
    }

    setProcessing(true);
    try {
      // Initiate the channel change
      const response = await initiateLoginChannelChange(selectedChannel, newIdentifier);
      
      // Store the context for confirmation
      setPendingChannelContext({
        channel: selectedChannel,
        identifier: newIdentifier || undefined
      });
      
      setShowOTPInput(true);
      setPendingChange(true);
      Alert.alert(
        'Verification Required',
        `An OTP has been sent to verify the channel change. Please check your ${selectedChannel}.`
      );
    } catch (error: any) {
      console.error('Failed to initiate channel change:', error);
      
      let errorMessage = 'Failed to initiate channel change';
      
      // Extract detailed validation errors
      if (error.data && error.data.error && error.data.error.details) {
        console.log('Initiate validation error details:', error.data.error.details);
        
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
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmChange = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!pendingChannelContext) {
      Alert.alert('Error', 'No pending channel change found. Please start over.');
      return;
    }

    setProcessing(true);
    try {
      // Only pass OTP and channel (identifier is not allowed in confirm request)
      await confirmLoginChannelChange(
        otp, 
        pendingChannelContext.channel
      );
      
      Alert.alert(
        'Success',
        'Login channel updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowOTPInput(false);
              setPendingChange(false);
              setPendingChannelContext(null);
              setOtp('');
              setNewIdentifier('');
              fetchUserData(); // Refresh user data
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Failed to confirm channel change:', error);
      
      let errorMessage = 'Failed to confirm channel change';
      
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
    } finally {
      setProcessing(false);
    }
  };

  const renderChannelOption = (channel: 'email' | 'phone', label: string, icon: any) => (
    <TouchableOpacity
      style={[
        styles.channelOption,
        selectedChannel === channel && styles.channelOptionSelected,
        currentChannel === channel && styles.currentChannelOption
      ]}
      onPress={() => setSelectedChannel(channel)}
    >
      <View style={styles.channelOptionContent}>
        <Icon name={icon} size={24} color={selectedChannel === channel ? COLORS.brand : COLORS.textSecondary} />
        <View style={styles.channelInfo}>
          <Typography variant="body" style={styles.channelLabel}>
            {label}
          </Typography>
          {currentChannel === channel && (
            <Typography variant="caption" color={COLORS.success} style={styles.currentLabel}>
              Current
            </Typography>
          )}
        </View>
      </View>
      <View style={[
        styles.radioButton,
        selectedChannel === channel && styles.radioButtonSelected
      ]}>
        {selectedChannel === channel && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Login Channel" showBack={true} onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header title="Login Channel" showBack={true} onBack={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Icon name="info" size={20} color={COLORS.brand} />
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoText}>
            Choose how you want to log in to your account. You can switch between email and phone number.
          </Typography>
        </View>

        <View style={styles.currentChannelCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Current Login Method
          </Typography>
          <Typography variant="body" color={COLORS.textSecondary}>
            {currentChannel === 'email' ? user?.email : user?.phone_number}
          </Typography>
        </View>

        {!showOTPInput ? (
          <>
            <Typography variant="h3" style={styles.sectionTitle}>
              Select Login Channel
            </Typography>
            
            <View style={styles.channelOptions}>
              {renderChannelOption('email', 'Email Address', 'mail')}
              {renderChannelOption('phone', 'Phone Number', 'phone')}
            </View>

            {selectedChannel !== currentChannel && (
              <View style={styles.identifierInput}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.inputLabel}>
                  {selectedChannel === 'email' ? 'New Email Address' : 'New Phone Number'}
                </Typography>
                <TextInput
                  style={styles.input}
                  placeholder={selectedChannel === 'email' ? 'Enter new email' : 'Enter new phone number'}
                  value={newIdentifier}
                  onChangeText={setNewIdentifier}
                  keyboardType={selectedChannel === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.changeButton, processing && { opacity: 0.7 }]}
              onPress={handleChannelChange}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                    {selectedChannel === currentChannel ? 'Verify Current Channel' : 'Change Login Channel'}
                  </Typography>
                  <Icon name="arrow-right" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.otpSection}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Verify Channel Change
            </Typography>
            
            <Typography variant="body" color={COLORS.textSecondary} style={styles.otpDescription}>
              Enter the verification code sent to your {selectedChannel}
            </Typography>

            <TextInput
              style={styles.otpInput}
              placeholder="Enter verification code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.otpButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowOTPInput(false);
                  setPendingChange(false);
                  setPendingChannelContext(null);
                  setOtp('');
                }}
              >
                <Typography color={COLORS.textSecondary}>Cancel</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, processing && { opacity: 0.7 }]}
                onPress={handleConfirmChange}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Typography color={COLORS.white} style={styles.buttonText}>
                    Confirm
                  </Typography>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E6F0FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  currentChannelCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  channelOptions: {
    marginBottom: 24,
  },
  channelOption: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  channelOptionSelected: {
    borderColor: COLORS.brand,
    backgroundColor: '#F0F8FF',
  },
  currentChannelOption: {
    borderColor: COLORS.success,
  },
  channelOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  channelLabel: {
    fontWeight: '600',
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.brand,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  identifierInput: {
    marginBottom: 24,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.white,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changeButton: {
    backgroundColor: COLORS.brand,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  otpSection: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpDescription: {
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: '#F7FAFC',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  otpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
  },
});