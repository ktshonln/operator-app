import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

const FLEETS = [
  { id: '1', plate: 'RAE 123 A', type: 'Bus', statusKey: 'fleet.statusOnRoute' },
  { id: '2', plate: 'RAC 456 B', type: 'Minibus', statusKey: 'fleet.statusWaiting' },
];

export const FleetScreen: React.FC = () => {
  const { t } = useTranslation();

  const renderItem = ({ item }: { item: typeof FLEETS[0] }) => (
    <View style={styles.card}>
      <View>
        <Typography variant="body" style={styles.plate}>{item.plate}</Typography>
        <Typography variant="caption">{item.type}</Typography>
      </View>
      <View style={[styles.badge, { backgroundColor: item.statusKey === 'fleet.statusOnRoute' ? '#C6F6D5' : '#E2E8F0' }]}>
        <Typography variant="caption" style={{ fontSize: 10 }}>{t(item.statusKey as any)}</Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={t('fleet.title')} />
      <FlatList
        data={FLEETS}
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
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  plate: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
