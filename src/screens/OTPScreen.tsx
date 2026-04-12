import React, { useState, useRef, useEffect } from 'react';
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
import { apiClient } from '../api/client';
import { Alert } from 'react-native';


export const OTPScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const { t } = useTranslation();
  
  // Get identifier from navigation params
  const { identifier } = route.params as { identifier?: string };
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Determine verification type based on identifier format
  const verificationType = identifier && identifier.includes('@') ? 'email' : 'phone';

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;
    
    if (!identifier) {
      Alert.alert(t('common.error'), 'Missing identifier. Please start over.');
      navigation.navigate('ForgotPassword');
      return;
    }
    
    // Just validate OTP format and navigate to password reset screen
    // The actual API call will be made in ResetPasswordConfirm screen with new password
    navigation.navigate('ResetPasswordConfirm', { 
      identifier: identifier, 
      otp: otpCode 
    });
  };

  const handleResendOTP = async () => {
    if (!canResend || !identifier) return;
    
    try {
      // Use the reset-otp endpoint for resending OTP
      const requestBody: any = {
        user_id: identifier, // Use identifier as user_id
        purpose: "password_reset"
      };
      
      // Add the appropriate verification field based on type
      if (verificationType === 'phone') {
        requestBody.phone_verification = "resend";
      } else {
        requestBody.email_verification = "resend";
      }
      
      await apiClient('/auth/reset-otp', {
        method: 'POST',
        body: requestBody,
      });
      
      Alert.alert(t('common.success'), 'OTP has been resent successfully');
      
      // Clear current OTP input and restart timer
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendTimer(60);
      setCanResend(false);
      
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to resend OTP');
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Typography variant="body" color={COLORS.brand}>
                {t('otp.back')}
              </Typography>
            </TouchableOpacity>

            <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
              {t('otp.title')}
            </Typography>
            
            <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
              {t('otp.description')}
            </Typography>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                // @ts-ignore - TypeScript issue with React Native TextInput props
                <TextInput
                  key={index}
                  ref={(ref: any) => { inputRefs.current[index] = ref; }}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.button, (otp.join('').length < 6 || loading) && { opacity: 0.7 }]}
              onPress={handleVerify}
              disabled={otp.join('').length < 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                  {t('otp.verify')}
                </Typography>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.resendContainer, !canResend && { opacity: 0.5 }]} 
              onPress={handleResendOTP}
              disabled={!canResend}
            >
              <Typography variant="caption" color={COLORS.textSecondary}>
                {t('otp.noCode')}{' '}
                <Typography variant="caption" color={canResend ? COLORS.brand : COLORS.textSecondary} style={{ fontWeight: 'bold' }}>
                  {canResend ? t('otp.resend') : `${t('otp.resend')} (${resendTimer}s)`}
                </Typography>
              </Typography>
            </TouchableOpacity>
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
    paddingTop: 40,
  },
  content: {
    paddingHorizontal: 30,
  },
  backButton: {
    marginBottom: 30,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.brand,
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  resendContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
});
