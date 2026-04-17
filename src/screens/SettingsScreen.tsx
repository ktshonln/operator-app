import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { apiClient, logout, logoutAll, resendOTPEnhanced } from '../api/client';
import { API_CONFIG } from '../api/config';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sending2FA, setSending2FA] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationCount();
  }, []);

  // Update organization logo when organization changes
  useEffect(() => {
    if (organization?.logo_path) {
      setOrganizationLogoUrl(`${API_CONFIG.CDN_URL}/${organization.logo_path}`);
    } else {
      setOrganizationLogoUrl(null);
    }
  }, [organization]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient('/users/me');
      setUser(response);
      
      // Set avatar URL if avatar_path exists
      if (response.avatar_path) {
        setAvatarUrl(`${API_CONFIG.CDN_URL}/${response.avatar_path}`);
      } else {
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Try to get cached user data
      const cachedUser = await authStore.getUser();
      if (cachedUser) {
        setUser(cachedUser);
        // Check for cached avatar path
        if (cachedUser.avatar_path) {
          setAvatarUrl(`${API_CONFIG.CDN_URL}/${cachedUser.avatar_path}`);
        }
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
    setLoggingOut(true);
    try {
      // Call logout API to invalidate current session
      await logout();
    } catch (error: any) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage and navigate to login
      await authStore.clearAll();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      setLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOut(true);
    try {
      // Call logout all API to invalidate all sessions
      await logoutAll();
    } catch (error: any) {
      console.error('Logout all API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage and navigate to login
      await authStore.clearAll();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      setLoggingOut(false);
    }
  };

  const showLogoutOptions = () => {
    Alert.alert(
      'Logout Options',
      'Choose how you want to logout',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout This Device',
          onPress: handleLogout
        },
        {
          text: 'Logout All Devices',
          style: 'destructive',
          onPress: handleLogoutAll
        }
      ]
    );
  };

  const handleStart2FA = async () => {
    if (!user?.id) {
      Alert.alert(t('common.error'), 'User information not found. Please try again.');
      return;
    }
    
    setSending2FA(true);
    try {
      // Step 1: Request 2FA OTP
      // We use 'phone' as default channel, or email if available
      const channel = user.phone_number ? 'phone' : 'email';
      await resendOTPEnhanced(user.id, '2fa', channel);
      
      // Step 2: Navigate to TwoFactor screen
      navigation.navigate('TwoFactor', { 
        userId: user.id,
        identifier: user.phone_number || user.email,
        channel: channel
      });
    } catch (error: any) {
      console.error('Failed to start 2FA:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to send verification code');
    } finally {
      setSending2FA(false);
    }
  };

  const SettingItem = ({ title, value, icon, onPress, loading }: { 
    title: string, 
    value?: string, 
    icon: any, 
    onPress?: () => void,
    loading?: boolean
  }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} disabled={loading}>
      <View style={styles.itemLeft}>
        <Icon name={icon} size={20} color={COLORS.brand} style={styles.icon} />
        <Typography variant="body" style={styles.titleText}>{title}</Typography>
      </View>
      <View style={styles.right}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.brand} style={{ marginRight: 8 }} />
        ) : (
          <>
            {value && <Typography variant="caption" color={COLORS.textSecondary}>{value}</Typography>}
            <Typography variant="body" color={COLORS.textSecondary}> ›</Typography>
          </>
        )}
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
          <Icon name="globe" size={20} color={COLORS.brand} style={styles.icon} />
          <Typography variant="body" style={styles.titleText}>{lang.label}</Typography>
        </View>
        {isActive && (
          <Icon name="check-circle" size={20} color={COLORS.brand} />
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
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Typography variant="h2" color={COLORS.white}>
                    {getInitials(user?.first_name, user?.last_name)}
                  </Typography>
                </View>
              )}
              <Typography variant="body" style={{ marginTop: 8, fontWeight: 'bold' }}>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                {getUserEmail()}
              </Typography>
              {organization && (
                <View style={styles.organizationSection}>
                  <View style={styles.organizationInfo}>
                    {organizationLogoUrl ? (
                      <Image source={{ uri: organizationLogoUrl }} style={styles.organizationLogo} />
                    ) : (
                      <View style={[styles.organizationLogo, styles.organizationLogoPlaceholder]}>
                        <Icon name="business" size={16} color={COLORS.brand} />
                      </View>
                    )}
                    <Typography variant="caption" color={COLORS.brand} style={styles.organizationName}>
                      {organization.name}
                    </Typography>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>{t('settings.sectionAccount')}</Typography>
        <SettingItem 
          title={t('settings.profile')} 
          icon="person" 
          onPress={() => navigation.navigate('Profile')}
        />
        <SettingItem 
          title="Organization" 
          icon="business" 
          onPress={() => navigation.navigate('Organization')}
        />
        <SettingItem 
          title="User Management" 
          icon="users" 
          onPress={() => navigation.navigate('UsersList')}
        />
        <SettingItem 
          title="Role Management" 
          icon="shield" 
          onPress={() => navigation.navigate('RoleManagement')}
        />
        <SettingItem 
          title="My Permissions" 
          icon="shield-check" 
          onPress={() => navigation.navigate('UserPermissions')}
        />
        <SettingItem 
          title={t('settings.security')} 
          icon="lock" 
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <SettingItem 
          title="Device Verification" 
          icon="shield" 
          onPress={handleStart2FA}
          loading={sending2FA}
        />
        <SettingItem 
          title={t('settings.alerts')} 
          value={notificationCount > 0 ? notificationCount.toString() : undefined} 
          icon="notifications" 
          onPress={() => navigation.navigate('Notifications')}
        />

        {/* Language Switcher */}
        <Typography variant="caption" style={styles.sectionHeader}>{t('settings.sectionLanguage')}</Typography>
        <LanguageItem lang={LANGUAGES[0]} />
        <LanguageItem lang={LANGUAGES[1]} />
        <LanguageItem lang={LANGUAGES[2]} />

        <TouchableOpacity 
          style={[styles.logoutButton, loggingOut && { opacity: 0.7 }]} 
          onPress={showLogoutOptions}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#E53E3E" size="small" />
          ) : (
            <Typography variant="caption" color="#E53E3E" style={{ fontWeight: 'bold' }}>{t('settings.logout')}</Typography>
          )}
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
  avatarPlaceholder: {
    backgroundColor: COLORS.brand,
  },
  organizationSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  organizationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  organizationLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  organizationLogoPlaceholder: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.brand,
  },
  organizationName: {
    fontWeight: '600',
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
