// v3 - Redesigned for cleaner and friendlier interface
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { apiClient } from '../api/client';
import { Alert } from 'react-native';

const LOGO = require('../assets/images/new.png');
const { width } = Dimensions.get('window');

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleResetPassword = async () => {
    if (!identifier) {
      Alert.alert(t('common.error'), t('login.pleaseEnterIdentifier'));
      return;
    }
    setLoading(true);
    
    try {
      const response = await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: { identifier },
      });
      
      console.log('Forgot password response:', response);
      
      // Extract user_id from response if available
      if (response && response.user_id) {
        setUserId(response.user_id);
        console.log('Found user_id in response:', response.user_id);
      } else {
        console.warn('No user_id found in forgot password response - will use legacy OTP resend');
        // Note: Backend should include user_id in response for enhanced OTP resend
        // For now, we'll rely on the fallback mechanism in OTP screen
      }
      
      setLoading(false);
      setIsSuccess(true);
    } catch (error: any) {
      setLoading(false);
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (error.message) errorMessage = error.message;
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigation.navigate('OTP', { 
          identifier: identifier,
          userId: userId,
          purpose: 'password_reset',
          channel: 'phone'
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigation, identifier, userId]);

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
                  {t('forgotPassword.backToLogin')}
                </Typography>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[
              styles.mainContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}>
              {!isSuccess ? (
                <>
                  <View style={styles.headerTextContainer}>
                    <View style={styles.logoCircle}>
                      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                    </View>
                    <Typography variant="h1" weight="extraBold" style={styles.title}>
                      {t('forgotPassword.title')}
                    </Typography>
                    <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
                      {t('forgotPassword.description')}
                    </Typography>
                  </View>
                  
                  <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                      <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.label}>
                        {t('forgotPassword.identifier')}
                      </Typography>
                      <View style={[
                        styles.inputContainer,
                        focusedField === 'identifier' && styles.inputFocused
                      ]}>
                        <Icon name="mail" size={20} color={focusedField === 'identifier' ? COLORS.brand : COLORS.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder={t('forgotPassword.identifierPlaceholder')}
                          placeholderTextColor={COLORS.textMuted}
                          value={identifier}
                          onChangeText={setIdentifier}
                          onFocus={() => setFocusedField('identifier')}
                          onBlur={() => setFocusedField(null)}
                          keyboardType="default"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[styles.resetBtn, loading && styles.btnDisabled]}
                      onPress={handleResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <Typography weight="extraBold" color={COLORS.white} variant="h4">
                            {t('forgotPassword.sendLink')}
                          </Typography>
                          <Icon name="send" size={20} color={COLORS.white} style={{ marginLeft: 12 }} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.successContainer}>
                  <View style={styles.successIconOuter}>
                     <View style={styles.successIconInner}>
                        <Icon name="check" size={56} color={COLORS.success} />
                     </View>
                  </View>
                  <Typography variant="h2" weight="extraBold" style={styles.successTitle}>
                    Check Your Inbox
                  </Typography>
                  <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.successSubtitle}>
                    {t('forgotPassword.successMessage')}
                  </Typography>
                  <View style={styles.redirectBadge}>
                    <ActivityIndicator color={COLORS.brand} size="small" />
                    <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={{ marginLeft: 10 }}>
                      {t('forgotPassword.redirecting')}
                    </Typography>
                  </View>
                </View>
              )}
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
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: COLORS.brandLight,
    opacity: 0.4,
  },
  circle2: {
    position: 'absolute',
    bottom: width * 0.1,
    right: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
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
  logoCircle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: '85%',
  },
  formContainer: {
    paddingTop: 12,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginLeft: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputFocused: {
    borderColor: COLORS.brand,
    backgroundColor: '#F7FAFC',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
  resetBtn: {
    backgroundColor: COLORS.brand,
    height: 64,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  successContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
    marginTop: 20,
  },
  successIconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successTitle: {
    marginBottom: 12,
  },
  successSubtitle: {
    marginBottom: 32,
    lineHeight: 22,
  },
  redirectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
});
