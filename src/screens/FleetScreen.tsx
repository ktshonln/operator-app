import { View, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';

const FLEETS = [
  { id: '1', plate: 'RAE 123 A', type: 'Bus', status: 'On Route' },
  { id: '2', plate: 'RAC 456 B', type: 'Minibus', status: 'Wait' },
];

import { Header } from '../components/Header';

export const FleetScreen: React.FC = () => {
  const renderItem = ({ item }: { item: typeof FLEETS[0] }) => (
    <View style={styles.card}>
      <View>
        <Typography variant="body" style={styles.plate}>{item.plate}</Typography>
        <Typography variant="caption">{item.type}</Typography>
      </View>
      <View style={[styles.badge, { backgroundColor: item.status === 'On Route' ? '#C6F6D5' : '#E2E8F0' }]}>
        <Typography variant="caption" style={{ fontSize: 10 }}>{item.status}</Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Fleet Management" />
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
