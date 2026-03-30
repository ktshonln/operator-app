// v2 - Corrected JSX tags
import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LOGO = require('../assets/images/new.png');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTranslateY = React.useRef(new Animated.Value(20)).current;

  const handleSignIn = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowToast(true);
      
      // Reset animation values
      toastOpacity.setValue(0);
      toastTranslateY.setValue(20);
      
      // Animate Toast In
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
        // Wait and then Fade Out
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
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.languageSwitcherTop}>
            {[
              { code: 'rw', label: 'RW' },
              { code: 'en', label: 'EN' },
              { code: 'fr', label: 'FR' },
            ].map((lang) => (
              <TouchableOpacity 
                key={lang.code}
                style={[
                  styles.langBtn,
                  i18n.language === lang.code && styles.langBtnActive
                ]}
                onPress={() => i18n.changeLanguage(lang.code)}
              >
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.brand} style={{ marginRight: 4 }} />
                )}
                <Typography variant="caption" style={{ fontWeight: 'bold', color: i18n.language === lang.code ? COLORS.brand : COLORS.textSecondary }}>
                  {lang.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.content}>
            <View style={styles.logoTopContainer}>
              <Image 
                source={LOGO} 
                style={styles.logoTop} 
                resizeMode="contain"
              />
            </View>
            
            <Typography variant="h2" color={COLORS.text} align="center" style={styles.welcomeTitle}>
              {t('login.welcome')}
            </Typography>
            
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                  {t('login.email')}
                </Typography>
                <TextInput
                  style={styles.input}
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                  {t('login.password')}
                </Typography>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputFlex}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Typography variant="caption" color={COLORS.brand} align="right">
                  {t('login.forgotPassword')}
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                    {t('login.signIn')}
                  </Typography>
                )}
              </TouchableOpacity>
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
              <View style={styles.toastIcon}>
                 <Ionicons name="checkmark" size={14} color={COLORS.white} />
              </View>
              <Typography color={COLORS.white} variant="body" style={{ fontWeight: '600', fontSize: 15 }}>
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
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoTopContainer: {
    alignItems: 'center',
    marginBottom: 20, 
  },
  logoTop: {
    width: 120,
    height: 110,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  input: {
    backgroundColor: '#F7FAFC',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.brand,
    height: 50,
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
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: 20,
  },
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastContent: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  toastIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  languageSwitcherTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtnActive: {
    backgroundColor: '#E6F0FF',
    borderColor: COLORS.brand,
  },
});
