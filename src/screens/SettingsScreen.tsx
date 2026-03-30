import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LANGUAGES = [
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();

  const SettingItem = ({ title, value, icon, onPress }: { title: string, value?: string, icon: string, onPress?: () => void }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={20} color={COLORS.brand} style={styles.icon} />
        <Typography variant="body" style={styles.titleText}>{title}</Typography>
      </View>
      <View style={styles.right}>
        {value && <Typography variant="caption" color={COLORS.textSecondary}>{value}</Typography>}
        <Typography variant="body" color={COLORS.textSecondary}> ›</Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title={t('settings.title')} 
        showBack={true} 
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Typography variant="h2" color={COLORS.white}>AD</Typography>
          </View>
          <Typography variant="body" style={{ marginTop: 8, fontWeight: 'bold' }}>{t('settings.adminName')}</Typography>
          <Typography variant="caption">admin@katisha.com</Typography>
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>{t('settings.sectionAccount')}</Typography>
        <SettingItem 
          title={t('settings.profile')} 
          icon="person-outline" 
          onPress={() => navigation.navigate('Profile')}
        />
        <SettingItem 
          title={t('settings.security')} 
          icon="lock-closed-outline" 
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <SettingItem 
          title={t('settings.alerts')} 
          value="3" 
          icon="notifications-outline" 
          onPress={() => navigation.navigate('Notifications')}
        />

        {/* Language Switcher */}
        <Typography variant="caption" style={styles.sectionHeader}>{t('settings.sectionLanguage')}</Typography>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.item, i18n.language === lang.code && styles.itemActive]}
            onPress={() => i18n.changeLanguage(lang.code)}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="globe-outline" size={20} color={COLORS.brand} style={styles.icon} />
              <Typography variant="body" style={styles.titleText}>{lang.label}</Typography>
            </View>
            {i18n.language === lang.code && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Typography variant="caption" color="#E53E3E" style={{ fontWeight: 'bold' }}>{t('settings.logout')}</Typography>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 12,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  itemActive: {
    borderColor: COLORS.brand,
    backgroundColor: '#EFF6FF',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
    fontSize: 16,
  },
  titleText: {
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#FED7D7',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
