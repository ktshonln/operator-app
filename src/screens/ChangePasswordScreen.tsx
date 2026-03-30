import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('security.title'), t('security.errorRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('security.title'), t('security.errorMismatch'));
      return;
    }

    setLoading(true);
    // Simulate API Update
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        t('security.title'),
        t('security.success'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  const PasswordInput = ({ 
    label, 
    value, 
    onChange, 
    show, 
    onToggle 
  }: { 
    label: string, 
    value: string, 
    onChange: (t: string) => void, 
    show: boolean, 
    onToggle: () => void 
  }) => (
    <View style={styles.inputGroup}>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
        {label}
      </Typography>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputFlex}
          value={value}
          onChangeText={onChange}
          placeholder="••••••••"
          secureTextEntry={!show}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={onToggle}>
          <Ionicons 
            name={show ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header 
        title={t('security.title')} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <PasswordInput 
              label={t('security.currentPassword')}
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
            />

            <PasswordInput 
              label={t('security.newPassword')}
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />

            <PasswordInput 
              label={t('security.confirmPassword')}
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />

            <TouchableOpacity 
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Typography color={COLORS.white} variant="body" style={styles.saveText}>
                  {t('security.save')}
                </Typography>
              )}
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
    padding: 24,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: COLORS.brand,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
});
