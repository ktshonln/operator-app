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
  Animated,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { apiClient } from '../api/client';

const { width } = Dimensions.get('window');

export const ResetPasswordConfirmScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const { t } = useTranslation();
  
  const { identifier, otp } = route.params as { identifier?: string; otp?: string };
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values for entry
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
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
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 3000);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('common.error'), error.message || t('resetPassword.failed'));
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
                  Back
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
                    <Typography variant="h1" weight="extraBold" style={styles.title}>
                      {t('resetPassword.title')}
                    </Typography>
                    <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
                      {t('resetPassword.description')}
                    </Typography>
                  </View>

                  <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                      <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.label}>
                        {t('resetPassword.newPassword')}
                      </Typography>
                      <View style={[
                        styles.inputContainer,
                        focusedField === 'password' && styles.inputFocused
                      ]}>
                        <Icon 
                          name="lock" 
                          size={20} 
                          color={focusedField === 'password' ? COLORS.brand : COLORS.textMuted} 
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor={COLORS.textMuted}
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
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

                    <View style={styles.inputGroup}>
                      <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.label}>
                        {t('resetPassword.confirmPassword')}
                      </Typography>
                      <View style={[
                        styles.inputContainer,
                        focusedField === 'confirm' && styles.inputFocused
                      ]}>
                        <Icon 
                          name="lock" 
                          size={20} 
                          color={focusedField === 'confirm' ? COLORS.brand : COLORS.textMuted} 
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor={COLORS.textMuted}
                          secureTextEntry={!showConfirm}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onFocus={() => setFocusedField('confirm')}
                          onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                          <Icon 
                            name={showConfirm ? 'eye-off' : 'eye'} 
                            size={20} 
                            color={COLORS.textMuted} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[styles.resetBtn, (!password || password !== confirmPassword || loading) && styles.btnDisabled]}
                      onPress={handleResetPassword}
                      disabled={!password || password !== confirmPassword || loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <Typography weight="extraBold" color={COLORS.white} variant="h4">
                            {t('resetPassword.reset')}
                          </Typography>
                          <Icon name="check-circle" size={20} color={COLORS.white} style={{ marginLeft: 12 }} />
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
                    {t('resetPassword.successTitle')}
                  </Typography>
                  <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.successSubtitle}>
                    {t('resetPassword.successMessage')}
                  </Typography>
                  <View style={styles.redirectBadge}>
                    <ActivityIndicator color={COLORS.brand} size="small" />
                    <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={{ marginLeft: 10 }}>
                      Redirecting to login...
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
    left: -width * 0.3,
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
    borderColor: '#E2E8F0',
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
  resetBtn: {
    backgroundColor: COLORS.brand,
    height: 64,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
