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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LOGO = require('../assets/images/new.png');

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = () => {
    if (!email) return;
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigation.navigate('OTP');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigation]);

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
              <View style={styles.form}>
                <View style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    >
                    <Typography variant="body" color={COLORS.brand}>
                      {t('forgotPassword.backToLogin')}
                    </Typography>
                  </TouchableOpacity>
                </View>
                <View style={styles.logoBottomContainer}>
                  <Image 
                    source={LOGO} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                </View>
                <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                  {t('forgotPassword.title')}
                </Typography>
                
                <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
                  {t('forgotPassword.description')}
                </Typography>
                <View style={styles.inputContainer}>
                  <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                    {t('forgotPassword.email')}
                  </Typography>
                  <TextInput
                    style={styles.input}
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                      {t('forgotPassword.sendLink')}
                    </Typography>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={40} color={COLORS.white} />
                </View>
                <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.successText}>
                  {t('forgotPassword.successMessage')}
                </Typography>
                <View style={{ height: 40, justifyContent: 'center' }}>
                  <ActivityIndicator color={COLORS.brand} size="small" />
                </View>
                <Typography variant="caption" color={COLORS.textSecondary} align="center" style={{ marginTop: 10 }}>
                  {t('forgotPassword.redirecting')}
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
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
  },
  description: {
    lineHeight: 22,
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
  logoBottomContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 110,
  },
  footer: {
    paddingVertical: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
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
  successText: {
    marginBottom: 30,
    lineHeight: 22,
  },
});
