import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { Alert } from 'react-native';


export const ResetPasswordConfirmScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const { t } = useTranslation();
  
  // Get identifier and OTP from navigation params
  const { identifier, otp } = route.params as { identifier?: string; otp?: string };
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async () => {
    if (!password || password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }
    
    if (!identifier || !otp) {
      Alert.alert(t('common.error'), 'Missing verification data. Please start over.');
      navigation.navigate('ForgotPassword');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use the correct API format from documentation
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: { 
          identifier: identifier,
          otp: otp,
          new_password: password,
        },
      });
      
      setLoading(false);
      setIsSuccess(true);
      
      // Navigate back to Login after 2 seconds on success
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 2000);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('common.error'), error.message || t('resetPassword.failed'));
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {!isSuccess ? (
              <>
                <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                  {t('resetPassword.title')}
                </Typography>
                
                <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
                  {t('resetPassword.description')}
                </Typography>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                      {t('resetPassword.newPassword')}
                    </Typography>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.inputFlex}
                        placeholder="••••••••"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(p => !p)}>
                        <Ionicons 
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color={COLORS.textSecondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                      {t('resetPassword.confirmPassword')}
                    </Typography>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.inputFlex}
                        placeholder="••••••••"
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm(p => !p)}>
                        <Ionicons 
                          name={showConfirm ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color={COLORS.textSecondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.button, (!password || password !== confirmPassword || loading) && { opacity: 0.7 }]}
                    onPress={handleResetPassword}
                    disabled={!password || password !== confirmPassword || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                        {t('resetPassword.reset')}
                      </Typography>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color={COLORS.white} />
                </View>
                <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                  {t('resetPassword.successTitle')}
                </Typography>
                <Typography variant="body" color={COLORS.textSecondary} align="center">
                  {t('resetPassword.successMessage')}
                </Typography>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  content: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    marginBottom: 40,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  input: {
    backgroundColor: '#F7FAFC',
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 55,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  button: {
    backgroundColor: COLORS.brand,
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38A169',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
