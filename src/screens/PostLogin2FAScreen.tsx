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
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { verifyPostLogin2FA, requestPostLogin2FA } from '../api/client';
import { authStore } from '../api/authStore';

export const PostLogin2FAScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t } = useTranslation();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    loadUser();
    requestOTP();
  }, []);

  // Timer for resend functionality
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

  const loadUser = async () => {
    const userData = await authStore.getUser();
    console.log('PostLogin2FA - loaded user data:', userData);
    setUser(userData);
  };

  const requestOTP = async () => {
    try {
      const userIdOrIdentifier = user?.id || user?.identifier;
      if (userIdOrIdentifier) {
        await requestPostLogin2FA(userIdOrIdentifier);
        console.log('Post-login 2FA OTP requested for:', userIdOrIdentifier);
      } else {
        console.warn('No user ID or identifier available for OTP request');
      }
    } catch (error: any) {
      console.error('Failed to request post-login 2FA OTP:', error);
      Alert.alert(t('common.error'), 'Failed to send verification code. Please try again.');
    }
  };

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = code.join('');
    if (otpCode.length < 6) {
      Alert.alert(t('common.error'), t('postLogin2FA.enterComplete'));
      return;
    }

    const userIdOrIdentifier = user?.id || user?.identifier;
    if (!userIdOrIdentifier) {
      Alert.alert(t('common.error'), 'User information not found. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      // Complete the 2FA verification and get tokens
      const response = await verifyPostLogin2FA(userIdOrIdentifier, otpCode);
      
      // Save the tokens from the 2FA verification response
      if (response.access_token) {
        await authStore.saveToken(response.access_token);
      }
      if (response.refresh_token) {
        await authStore.saveRefreshToken(response.refresh_token);
      }
      if (response.user) {
        await authStore.saveUser(response.user);
      }
      
      // Mark 2FA as verified for this session
      await authStore.set2FAVerified(true);
      
      setLoading(false);
      
      // Navigate to main app after successful verification
      navigation.navigate('Main');
      
      // Clear the code
      setCode(['', '', '', '', '', '']);
    } catch (error: any) {
      setLoading(false);
      console.error('Post-login 2FA verification error:', error);
      Alert.alert(t('common.error'), error.message || t('postLogin2FA.verificationFailed'));
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    const userIdOrIdentifier = user?.id || user?.identifier;
    if (!userIdOrIdentifier) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    setResendLoading(true);
    try {
      await requestPostLogin2FA(userIdOrIdentifier);
      Alert.alert(t('common.success'), t('postLogin2FA.resendSuccess'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendTimer(60);
      setCanResend(false);
    } catch (error: any) {
      console.error('Failed to resend post-login 2FA code:', error);
      Alert.alert(t('common.error'), error.message || t('postLogin2FA.resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('postLogin2FA.logout'),
      t('postLogin2FA.logoutConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('postLogin2FA.logout'),
          style: 'destructive',
          onPress: async () => {
            await authStore.clearAll();
            navigation.navigate('Login');
          }
        }
      ]
    );
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
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Icon name="shield-check" size={40} color={COLORS.brand} />
              </View>
              <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                {t('postLogin2FA.title')}
              </Typography>
              <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
                {t('postLogin2FA.description')}
              </Typography>
            </View>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={styles.codeInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.verifyButton, (code.join('').length < 6 || loading) && { opacity: 0.7 }]}
              onPress={handleVerify}
              disabled={code.join('').length < 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                    {t('postLogin2FA.verify')}
                  </Typography>
                  <View style={styles.buttonIcon}>
                    <Icon name="arrow-right" size={18} color={COLORS.white} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.resendAction, (!canResend || resendLoading) && { opacity: 0.5 }]} 
              onPress={handleResendOTP}
              disabled={!canResend || resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <View style={styles.resendTextWrapper}>
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    {t('postLogin2FA.noCode')}{' '}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    weight="bold"
                    color={canResend ? COLORS.brand : COLORS.textSecondary} 
                  >
                    {canResend ? t('postLogin2FA.resend') : `${t('postLogin2FA.resend')} ${t('postLogin2FA.resendIn')} ${resendTimer}s`}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Icon name="logout" size={16} color={COLORS.textSecondary} />
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.logoutText}>
                {t('postLogin2FA.logout')}
              </Typography>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Icon name="info" size={20} color={COLORS.brand} />
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoText}>
                {t('postLogin2FA.infoText')}
              </Typography>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  content: {
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 10,
  },
  description: {
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  codeInput: {
    width: 45,
    height: 55,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  verifyButton: {
    backgroundColor: COLORS.brand,
    height: 55,
    borderRadius: 16,
    flexDirection: 'row',
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
  buttonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  resendAction: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 20,
  },
  resendTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  logoutText: {
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});