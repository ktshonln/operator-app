// v3 - Redesigned for cleaner and friendlier interface
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
  Animated,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { apiClient, resendOTP, resendOTPEnhanced } from '../api/client';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export const OTPScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const { t } = useTranslation();
  
  const { identifier, userId, purpose, channel } = route.params as { 
    identifier?: string;
    userId?: string;
    purpose?: string;
    channel?: string;
  };
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Animation values for entry
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    
    navigation.navigate('ResetPasswordConfirm', { 
      identifier: identifier, 
      otp: otpCode 
    });
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    console.log('Resending OTP with params:', { userId, purpose, channel, identifier });
    
    setResendLoading(true);
    try {
      // Use enhanced resend OTP if we have userId, purpose, and channel
      if (userId && purpose && channel) {
        console.log('Using enhanced resend OTP');
        await resendOTPEnhanced(userId, purpose, channel);
      } else if (identifier) {
        console.log('Using legacy resend OTP');
        // Fallback to original resend OTP for backward compatibility
        await resendOTP(identifier);
      } else {
        throw new Error('Missing required parameters for OTP resend');
      }
      
      Alert.alert(t('common.success'), 'OTP has been resent successfully');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendTimer(60);
      setCanResend(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Dynamic Background */}
      <View style={styles.bgContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Animated.View style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-left" size={24} color={COLORS.brand} />
                <Typography variant="body" weight="bold" color={COLORS.brand} style={styles.backText}>
                  {t('otp.back')}
                </Typography>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[
              styles.mainContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
              <View style={styles.headerTextContainer}>
                <Typography variant="h1" weight="extraBold" style={styles.title}>
                  {t('otp.title')}
                </Typography>
                <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
                  {t('otp.description')} <Typography weight="bold" color={COLORS.brand}>{identifier}</Typography>
                </Typography>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.otpWrapper,
                        focusedIndex === index && styles.otpWrapperFocused,
                        digit !== '' && styles.otpWrapperFilled
                      ]}
                    >
                      <TextInput
                        ref={(ref: any) => { inputRefs.current[index] = ref; }}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        selectTextOnFocus
                      />
                    </View>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.verifyBtn, (otp.join('').length < 6 || loading) && styles.btnDisabled]}
                  onPress={handleVerify}
                  disabled={otp.join('').length < 6 || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Typography weight="extraBold" color={COLORS.white} variant="h4">
                        {t('otp.verify')}
                      </Typography>
                      <View style={styles.btnIconContainer}>
                         <Icon name="check-circle" size={20} color={COLORS.white} />
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
                        {t('otp.noCode')}{' '}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        weight="bold"
                        color={canResend ? COLORS.brand : COLORS.textSecondary} 
                      >
                        {canResend ? t('otp.resend') : `${t('otp.resend')} in ${resendTimer}s`}
                      </Typography>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
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
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  circle1: {
    position: 'absolute',
    top: -width * 0.1,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: COLORS.brandLight,
    opacity: 0.4,
  },
  circle2: {
    position: 'absolute',
    bottom: width * 0.2,
    left: -width * 0.3,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: COLORS.brandLight,
    opacity: 0.3,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: {
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
  },
  headerTextContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 22,
  },
  formContainer: {
    paddingTop: 12,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpWrapper: {
    width: (width - 48 - 48 - 30) / 6,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpWrapperFocused: {
    borderColor: COLORS.brand,
    backgroundColor: '#F7FAFC',
  },
  otpWrapperFilled: {
    backgroundColor: '#F7FAFC',
    borderColor: COLORS.brandLight,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  verifyBtn: {
    backgroundColor: COLORS.brand,
    height: 64,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  },
  resendTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
