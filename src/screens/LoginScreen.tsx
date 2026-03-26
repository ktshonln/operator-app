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
import { COLORS } from '../theme/colors';
import { Typography } from '../components/Typography';

const LOGO = require('../assets/images/new.png');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
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
          <View style={styles.content}>
            <View style={styles.logoTopContainer}>
              <Image 
                source={LOGO} 
                style={styles.logoTop} 
                resizeMode="contain"
              />
            </View>
            
            <Typography variant="h2" color={COLORS.text} align="center" style={styles.welcomeTitle}>
               Welcome to Katisha
            </Typography>
            
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                  Email
                </Typography>
                <TextInput
                  style={styles.input}
                  placeholder="admin@routiq.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                  Password
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
                    <Typography style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Typography>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Typography variant="caption" color={COLORS.brand} align="right">
                  Forgot Password?
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
                      Sign in
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
                 <Typography color={COLORS.white} style={{ fontSize: 14, fontWeight: 'bold' }}>✓</Typography>
              </View>
              <Typography color={COLORS.white} variant="body" style={{ fontWeight: '600', fontSize: 15 }}>
                Login Successful
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
    height: 110, // Restoring more of the original logo height
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: 20, // Restored title bottom margin
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
    backgroundColor: '#10B981', // More vibrant emerald green
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
});


