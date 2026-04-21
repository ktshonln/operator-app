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
import { authStore } from '../api/authStore';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');
const LOGO = require('../assets/images/new.png');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t, i18n } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTranslateY = React.useRef(new Animated.Value(20)).current;

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

  const LanguageButton = ({ lang }: { lang: { code: string, label: string } }) => {
    const isActive = i18n.language === lang.code;
    return (
      <TouchableOpacity 
        style={[
          styles.langBtn,
          isActive && styles.langBtnActive
        ]}
        onPress={() => i18n.changeLanguage(lang.code)}
      >
        <Typography 
          variant="caption" 
          weight="bold"
          style={[
            styles.langBtnText, 
            isActive && styles.langBtnTextActive
          ]}
        >
          {lang.label}
        </Typography>
      </TouchableOpacity>
    );
  };

  const handleSignIn = async () => {
    if (!identifier || !password) {
      Alert.alert(t('common.error'), t('login.pleaseFillAllFields'));
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        headers: {
          'X-Client-Type': 'mobile',
        },
        body: {
          identifier: identifier,
          password: password,
          device_name: `${Platform.OS}_${Platform.Version || 'device'}`,
        },
      });

      console.log('Login response:', { 
        hasAccessToken: !!response.access_token, 
        hasRefreshToken: !!response.refresh_token, 
        hasUser: !!response.user, 
        requires2fa: response.requires_2fa,
        userTwoFactorEnabled: response.user?.two_factor_enabled 
      });

      // Check if 2FA is required (user has 2FA enabled but no tokens provided)
      if (response.user?.two_factor_enabled && !response.access_token) {
        console.log('2FA required - user has 2FA enabled but no tokens provided');
        // Store user temporarily for 2FA verification
        await authStore.saveUser(response.user);
        setLoading(false);
        
        // Navigate to 2FA verification screen
        navigation.navigate('PostLogin2FA');
        return;
      }

      // Check the requires_2fa flag (API indicates 2FA is needed)
      if (response.requires_2fa) {
        console.log('2FA required - requires_2fa flag is true');
        
        // Store identifier for 2FA verification since user object might not be provided
        const tempUser = response.user || { 
          id: response.user_id || 'temp', 
          identifier: identifier,
          two_factor_enabled: true 
        };
        
        await authStore.saveUser(tempUser);
        setLoading(false);
        
        // Navigate to 2FA verification screen
        navigation.navigate('PostLogin2FA');
        return;
      }

      // Normal login flow (no 2FA required)
      if (response.access_token) {
        await authStore.saveToken(response.access_token);
      }
      if (response.refresh_token) {
        await authStore.saveRefreshToken(response.refresh_token);
      }
      if (response.user) {
        await authStore.saveUser(response.user);
      }

      // Clear any previous 2FA verification status
      await authStore.set2FAVerified(false);

      setLoading(false);
      
      setShowToast(true);
      
      toastOpacity.setValue(0);
      toastTranslateY.setValue(20);
      
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(toastTranslateY, {
          toValue: 0,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowToast(false);
            navigation.navigate('Main');
          });
        }, 1200);
      });
    } catch (error: any) {
      setLoading(false);
      let errorMessage = t('login.loginFailed');
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.error?.message) {
        errorMessage = error.data.error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Dynamic Background */}
      <View style={styles.bgContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
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
              <View style={styles.branding}>
                <View style={styles.logoCircle}>
                  <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.languageContainer}>
                  <LanguageButton lang={{ code: 'rw', label: 'RW' }} />
                  <LanguageButton lang={{ code: 'en', label: 'EN' }} />
                  <LanguageButton lang={{ code: 'fr', label: 'FR' }} />
                </View>
              </View>
              
              <View style={styles.titleContainer}>
                <Typography variant="h1" weight="extraBold" style={styles.title}>
                  {t('login.welcome')}
                </Typography>
                <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
                  {t('login.subtitle')}
                </Typography>
              </View>
            </Animated.View>
            
            <Animated.View style={[
              styles.formContainer,
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              }
            ]}>
              <View style={styles.inputGroup}>
                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.label}>
                  {t('login.identifier')}
                </Typography>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'identifier' && styles.inputFocused
                ]}>
                  <Icon name="person" size={20} color={focusedField === 'identifier' ? COLORS.brand : COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.identifierPlaceholder')}
                    placeholderTextColor={COLORS.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.label}>
                  {t('login.password')}
                </Typography>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputFocused
                ]}>
                  <Icon name="lock" size={20} color={focusedField === 'password' ? COLORS.brand : COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={COLORS.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.forgotPass}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Typography variant="caption" weight="bold" color={COLORS.brand}>
                  {t('login.forgotPassword')}
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginBtn, loading && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Typography weight="extraBold" color={COLORS.white} variant="h4">
                      {t('login.signIn')}
                    </Typography>
                    <Icon name="arrow-right" size={20} color={COLORS.white} style={{ marginLeft: 12 }} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.footer}>
              <Typography variant="caption" color={COLORS.textMuted} align="center">
                © {new Date().getFullYear()} Katisha System. All rights reserved.
              </Typography>
            </View>
          </View>
        </ScrollView>

        {showToast && (
          <Animated.View style={[
            styles.toast, 
            { 
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }]
            }
          ]}>
            <View style={styles.toastContent}>
               <Icon name="check-circle" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
              <Typography color={COLORS.white} weight="semibold">
                {t('login.loginSuccess')}
              </Typography>
            </View>
          </Animated.View>
        )}
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
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: COLORS.brandLight,
    opacity: 0.5,
  },
  circle2: {
    position: 'absolute',
    bottom: -width * 0.1,
    left: -width * 0.3,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: COLORS.brandLight,
    opacity: 0.3,
  },
  circle3: {
    position: 'absolute',
    top: width * 0.4,
    left: width * 0.05,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.brandLight,
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  branding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBtnActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  langBtnText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  langBtnTextActive: {
    color: COLORS.white,
  },
  titleContainer: {
    marginTop: 8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    maxWidth: '90%',
  },
  formContainer: {
    paddingTop: 12,
  },
  inputGroup: {
    marginBottom: 20,
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
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  loginBtn: {
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
  footer: {
    marginTop: 'auto',
    paddingVertical: 24,
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastContent: {
    backgroundColor: COLORS.text,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
});
