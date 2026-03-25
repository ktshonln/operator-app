import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import { Typography } from './Typography';
import { COLORS } from '../theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, rightElement, onSearch }) => {
  const navigation = useNavigation<any>();
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
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {isSearching ? (
            <View style={styles.searchContainer}>
              <TouchableOpacity onPress={toggleSearch} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color={COLORS.brand} />
              </TouchableOpacity>
              <TextInput
                autoFocus
                placeholder="Search..."
                style={styles.searchInput}
                value={query}
                onChangeText={handleSearch}
                placeholderTextColor={COLORS.textSecondary}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <View style={styles.left}>
                {showBack && (
                  <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.brand} />
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
                {rightElement || (
                  <View style={styles.actionIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
                      <Ionicons name="search-outline" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton} 
                      onPress={() => navigation.navigate('Notifications')}
                    >
                      <View>
                        <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
                        <View style={styles.badge} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Main', { screen: 'Settings' })}>
                      <View style={styles.avatarCircle}>
                        <Typography variant="caption" color={COLORS.white} style={{ fontSize: 10, fontWeight: 'bold' }}>AD</Typography>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
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
  },
  safeArea: {},
  container: {
    height: 64,
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
