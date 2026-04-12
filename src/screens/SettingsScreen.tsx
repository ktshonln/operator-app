import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { useOrganization } from '../hooks/useOrganization';
import { authStore } from '../api/authStore';

const LANGUAGES = [
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { organization } = useOrganization();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationCount();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient('/users/me');
      setUser(response);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Try to get cached user data
      const cachedUser = await authStore.getUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      // Replace with your actual notifications API endpoint
      // const response = await apiClient('/notifications/count');
      // setNotificationCount(response.count || 0);
      
      // For now, set a mock count or leave as 0
      setNotificationCount(0);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
      setNotificationCount(0);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return t('settings.loading');
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || user.phone_number || 'User';
  };

  const getUserEmail = () => {
    if (!user) return '';
    return user.email || user.phone_number || '';
  };

  const handleLogout = async () => {
    await authStore.clearAll();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const SettingItem = ({ title, value, icon, onPress }: { 
    title: string, 
    value?: string, 
    icon: any, 
    onPress?: () => void 
  }) => (
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

  const LanguageItem = ({ lang }: { lang: any }) => {
    const isActive = i18n.language === lang.code;
    return (
      <TouchableOpacity
        style={[styles.item, isActive && styles.itemActive]}
        onPress={() => {
          i18n.changeLanguage(lang.code);
        }}
      >
        <View style={styles.itemLeft}>
          <Ionicons name="globe-outline" size={20} color={COLORS.brand} style={styles.icon} />
          <Typography variant="body" style={styles.titleText}>{lang.label}</Typography>
        </View>
        {isActive && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title={t('settings.title')} 
        showBack={true} 
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.brand} />
          ) : (
            <>
              <View style={styles.avatar}>
                <Typography variant="h2" color={COLORS.white}>
                  {getInitials(user?.first_name, user?.last_name)}
                </Typography>
              </View>
              <Typography variant="body" style={{ marginTop: 8, fontWeight: 'bold' }}>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                {getUserEmail()}
              </Typography>
              {organization && (
                <Typography variant="caption" color={COLORS.brand} style={{ marginTop: 4 }}>
                  {organization.name}
                </Typography>
              )}
            </>
          )}
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>{t('settings.sectionAccount')}</Typography>
        <SettingItem 
          title={t('settings.profile')} 
          icon="person-outline" 
          onPress={() => navigation.navigate('Profile')}
        />
        <SettingItem 
          title="Organization" 
          icon="business-outline" 
          onPress={() => navigation.navigate('Organization')}
        />
        <SettingItem 
          title="User Management" 
          icon="people-outline" 
          onPress={() => navigation.navigate('UsersList')}
        />
        <SettingItem 
          title={t('settings.security')} 
          icon="lock-closed-outline" 
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <SettingItem 
          title={t('settings.alerts')} 
          value={notificationCount > 0 ? notificationCount.toString() : undefined} 
          icon="notifications-outline" 
          onPress={() => navigation.navigate('Notifications')}
        />

        {/* Language Switcher */}
        <Typography variant="caption" style={styles.sectionHeader}>{t('settings.sectionLanguage')}</Typography>
        <LanguageItem lang={LANGUAGES[0]} />
        <LanguageItem lang={LANGUAGES[1]} />
        <LanguageItem lang={LANGUAGES[2]} />

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
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
