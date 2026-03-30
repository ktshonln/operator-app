import React, { useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';

export const OTPScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

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

  const handleVerify = () => {
    if (otp.join('').length < 6) return;
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('ResetPasswordConfirm');
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
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
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

            <TouchableOpacity style={styles.resendContainer}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                {t('otp.noCode')}{' '}
                <Typography variant="caption" color={COLORS.brand} style={{ fontWeight: 'bold' }}>
                  {t('otp.resend')}
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
