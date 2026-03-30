import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

const TRIPS = [
  { id: '1', date: '23 Mar', route: 'Kgl - Msz', driver: 'John', statusKey: 'trips.statusDone' },
  { id: '2', date: '23 Mar', route: 'Kgl - Rbv', driver: 'Jane', statusKey: 'trips.statusWaiting' },
];

export const TripScreen: React.FC = () => {
  const { t } = useTranslation();

  const renderItem = ({ item }: { item: typeof TRIPS[0] }) => (
    <View style={styles.card}>
      <View style={styles.left}>
        <Typography variant="caption">{item.date}</Typography>
        <Typography variant="body" style={styles.route}>{item.route}</Typography>
      </View>
      <View style={styles.right}>
        <Typography variant="caption" color={COLORS.brand}>{item.driver}</Typography>
        <Typography variant="caption" style={{ color: item.statusKey === 'trips.statusDone' ? '#38A169' : '#D69E2E' }}>
          {t(item.statusKey as any)}
        </Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={t('trips.title')} />
      <FlatList
        data={TRIPS}
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
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  left: {
    flex: 2,
  },
  route: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
