import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { COLORS } from '../theme/colors';

export const IconTest: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icon Test - Lucide Icons</Text>
      
      {/* Test different icon names */}
      <View style={styles.iconRow}>
        <Icon name="home" size={24} color={COLORS.brand} />
        <Text>home</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="person" size={24} color={COLORS.brand} />
        <Text>person</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="settings" size={24} color={COLORS.brand} />
        <Text>settings</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="notifications" size={24} color={COLORS.brand} />
        <Text>notifications</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="search" size={24} color={COLORS.brand} />
        <Text>search</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="eye" size={24} color={COLORS.brand} />
        <Text>eye</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="eye-off" size={24} color={COLORS.brand} />
        <Text>eye-off</Text>
      </View>
      
      <View style={styles.iconRow}>
        <Icon name="lock" size={24} color={COLORS.brand} />
        <Text>lock</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
});