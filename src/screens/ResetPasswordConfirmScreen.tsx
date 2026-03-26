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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';

export const ResetPasswordConfirmScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = () => {
    if (!password || password !== confirmPassword) return;
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      
      // Navigate back to Login after 2 seconds on success
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
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
            {!isSuccess ? (
              <>
                <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                  New Password
                </Typography>
                
                <Typography variant="body" color={COLORS.textSecondary} align="center" style={styles.description}>
                  Create a new password for your account.
                </Typography>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                      New Password
                    </Typography>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.inputFlex}
                        placeholder="••••••••"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(p => !p)}>
                        <Typography style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Typography>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                      Confirm New Password
                    </Typography>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.inputFlex}
                        placeholder="••••••••"
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm(p => !p)}>
                        <Typography style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Typography>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.button, (!password || password !== confirmPassword || loading) && { opacity: 0.7 }]}
                    onPress={handleResetPassword}
                    disabled={!password || password !== confirmPassword || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Typography color={COLORS.white} variant="body" style={styles.buttonText}>
                        Reset Password
                      </Typography>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Typography color={COLORS.white} variant="h1" style={{ fontSize: 40 }}>✓</Typography>
                </View>
                <Typography variant="h2" color={COLORS.text} align="center" style={styles.title}>
                  Password Reset!
                </Typography>
                <Typography variant="body" color={COLORS.textSecondary} align="center">
                  Your password has been successfully updated. Redirecting to login...
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
    paddingTop: 40,
  },
  content: {
    paddingHorizontal: 30,
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
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  input: {
    backgroundColor: '#F7FAFC',
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 55,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  button: {
    backgroundColor: COLORS.brand,
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  successContainer: {
    alignItems: 'center',
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
});
