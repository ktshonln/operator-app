import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';

import { Header } from '../components/Header';

export const SettingsScreen: React.FC = () => {
  const SettingItem = ({ title, value, icon }: { title: string, value?: string, icon: string }) => (
    <TouchableOpacity style={styles.item}>
      <View style={styles.itemLeft}>
        <Typography variant="body" style={styles.icon}>{icon}</Typography>
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
      <Header title="Operator Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Typography variant="h2" color={COLORS.white}>AD</Typography>
          </View>
          <Typography variant="body" style={{ marginTop: 8, fontWeight: 'bold' }}>Admin Operator</Typography>
          <Typography variant="caption">admin@katisha.com</Typography>
        </View>

        <Typography variant="caption" style={styles.sectionHeader}>ACCOUNT</Typography>
        <SettingItem title="Profile" icon="👤" />
        <SettingItem title="Security" icon="🔒" />
        <SettingItem title="Alerts" value="On" icon="🔔" />

        <TouchableOpacity style={styles.logoutButton}>
          <Typography variant="caption" color="#E53E3E" style={{ fontWeight: 'bold' }}>Logout</Typography>
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
  header: {
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.brand,
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
