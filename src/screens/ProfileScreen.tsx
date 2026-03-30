import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('operator@katisha.com');
  const [phoneNumber, setPhoneNumber] = useState('+250788000000');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri || null);
    }
  };

  const handleSave = () => {
    setLoading(true);
    // Simulate API Update matching the shared specification
    // { first_name, last_name, phone_number, email }
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        t('profile.title'),
        t('profile.updateSuccess'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header 
        title={t('profile.title')} 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={50} color="#CBD5E0" />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editBadge}
                onPress={handleSelectImage}
              >
                <Ionicons name="camera" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSelectImage}>
              <Typography variant="caption" color={COLORS.brand} style={styles.editLink}>
                {t('profile.editAvatar')}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                {t('profile.firstName')}
              </Typography>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('profile.firstName')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                {t('profile.lastName')}
              </Typography>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('profile.lastName')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                {t('profile.phoneNumber')}
              </Typography>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={t('profile.phoneNumber')}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                {t('profile.email')}
              </Typography>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Typography color={COLORS.white} variant="body" style={styles.saveText}>
                  {t('profile.save')}
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
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.brand,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  editLink: {
    fontWeight: '600',
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
  input: {
    backgroundColor: '#F7FAFC',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
