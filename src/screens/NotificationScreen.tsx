import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const NOTIFICATIONS = [
  { id: '1', title: 'New Booking', message: 'Ticket #4582 booked for Kgl - Msz', time: '2m ago', icon: 'ticket' },
  { id: '2', title: 'Vehicle Alert', message: 'RAC 456 B has reached Musanze', time: '15m ago', icon: 'bus' },
  { id: '3', title: 'Payment Confirmed', message: 'RWF 15,000 received for Agent #12', time: '1h ago', icon: 'cash' },
];

export const NotificationScreen = ({ navigation }: any) => {
  const renderItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => (
    <TouchableOpacity style={styles.item}>
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={18} color={COLORS.brand} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Typography variant="body" style={styles.title}>{item.title}</Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>{item.time}</Typography>
        </View>
        <Typography variant="caption" color={COLORS.textSecondary}>{item.message}</Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Notifications" 
        showBack 
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />
      <FlatList
        data={NOTIFICATIONS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
