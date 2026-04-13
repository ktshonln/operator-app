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
import { Header } from '../components/Header';
import { verify2FA } from '../api/client';
import { authStore } from '../api/authStore';

export const TwoFactorScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { t } = useTranslation();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await authStore.getUser();
    setUser(userData);
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
    const deviceToken = code.join('');
    if (deviceToken.length < 6) {
      Alert.alert(t('common.error'), 'Please enter the complete 6-digit code');
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), 'User information not found. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await verify2FA(user.id, deviceToken);
      setLoading(false);
      
      Alert.alert(
        t('common.success'), 
        'Device verified successfully! Your device is now trusted.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
      // Clear the code
      setCode(['', '', '', '', '', '']);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('common.error'), error.message || 'Invalid verification code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header 
        title="Device Verification" 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Icon name="shield" size={40} color={COLORS.brand} />
              </View>
              <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                Verify This Device
              </Typography>
              <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
                Enter the 6-digit verification code to add this device to your trusted devices list
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
                    Verify Device
                  </Typography>
                  <View style={styles.buttonIcon}>
                    <Icon name="check" size={18} color={COLORS.white} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Icon name="info" size={20} color={COLORS.brand} />
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoText}>
                This verification helps secure your account by confirming this device is trusted.
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
    paddingTop: 40,
  },
  content: {
    paddingHorizontal: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backText: {
    marginLeft: 8,
    fontWeight: '600',
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
  helpContainer: {
    marginTop: 30,
    alignItems: 'center',
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