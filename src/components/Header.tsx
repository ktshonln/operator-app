import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from './Typography';
import { COLORS } from '../theme/colors';
import { Icon, IconName } from './Icon';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  rightIcon?: IconName;
  onRightPress?: () => void;
  onSearch?: (query: string) => void;
  withBanner?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack, 
  onBack, 
  rightElement, 
  rightIcon, 
  onRightPress, 
  onSearch,
  withBanner = true
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    if (onSearch) onSearch(text);
  };

  const toggleSearch = () => {
    if (isSearching) {
      setQuery('');
      if (onSearch) onSearch('');
    }
    setIsSearching(!isSearching);
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: Platform.OS === 'android' ? 12 : Math.max((insets.top || 0) * 0.7, 10) }]}>
      {withBanner && (
        <View style={styles.bannerDecoration}>
          <View style={styles.bannerCircle} />
        </View>
      )}
      <View style={styles.container}>
          {isSearching ? (
            <View style={styles.searchContainer}>
              <TouchableOpacity onPress={toggleSearch} style={styles.backButton}>
                <Icon name="arrow-left" size={22} color={COLORS.brand} />
              </TouchableOpacity>
              <TextInput
                autoFocus
                placeholder={t('header.searchPlaceholder')}
                style={styles.searchInput}
                value={query}
                onChangeText={handleSearch}
                placeholderTextColor={COLORS.textSecondary}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Icon name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <View style={styles.left}>
                {showBack && (
                  <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Icon name="chevron-left" size={24} color={COLORS.brand} />
                  </TouchableOpacity>
                )}
                <View>
                  <Typography variant="h2" style={styles.title}>{title}</Typography>
                  <Typography variant="caption" color={COLORS.textSecondary} style={styles.dateText}>
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • Katisha
                  </Typography>
                </View>
              </View>
              
              <View style={styles.right}>
                {rightIcon ? (
                  <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
                    <Icon name={rightIcon} size={24} color={COLORS.brand} />
                  </TouchableOpacity>
                ) : rightElement || (
                  <View style={styles.actionIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
                      <Icon name="search" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Analytics')}>
                      <Icon name="chart" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton} 
                      onPress={() => navigation.navigate('Notifications')}
                    >
                      <View>
                        <Icon name="notifications" size={22} color={COLORS.textSecondary} />
                        <View style={styles.badge} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.profileButton} 
                      onPress={() => navigation.navigate('Settings')}
                    >
                      <View style={styles.avatarCircle}>
                        <Icon name="settings" size={18} color={COLORS.white} />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'relative',
  },
  bannerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: COLORS.brand + '05',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: -1,
    overflow: 'hidden',
  },
  bannerCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.brand + '08',
  },
  container: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.brand,
    paddingVertical: 8,
    marginRight: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    padding: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brand,
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 10,
    marginTop: -2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53E3E',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  profileButton: {
    marginLeft: 12,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E6F0FF',
  },
});
