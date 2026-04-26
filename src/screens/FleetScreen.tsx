import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_BUSES, Bus } from '../mock/transportData';

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  active:      { bg: '#ECFDF5', text: '#10B981', label: 'ACTIVE' },
  maintenance: { bg: '#FFFBEB', text: '#F59E0B', label: 'MAINTENANCE' },
  inactive:    { bg: '#F5F5F5', text: '#9E9E9E', label: 'INACTIVE' },
};

const TYPE_ICON: Record<string, string> = {
  Coach: '🚌', Mini: '🚐', Sprinter: '🚎',
};

const FILTERS = ['All', 'active', 'maintenance', 'inactive'];

export const FleetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [buses, setBuses] = useState<Bus[]>(MOCK_BUSES);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = buses.filter(b => {
    const matchSearch =
      b.plate.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase()) ||
      (b.driver ? `${b.driver.first_name} ${b.driver.last_name}`.toLowerCase().includes(search.toLowerCase()) : false);
    const matchFilter = activeFilter === 'All' || b.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const handleDelete = (bus: Bus) => {
    // Simulate BUS_IN_USE guard
    const inUse = ['bus-1', 'bus-2'].includes(bus.id);
    if (inUse) {
      Alert.alert('Cannot Delete', 'This bus is currently assigned to active trips.');
      return;
    }
    Alert.alert('Delete Bus', `Delete "${bus.plate}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setBuses(prev => prev.filter(b => b.id !== bus.id)) },
    ]);
  };

  const renderItem = ({ item }: { item: Bus }) => {
    const sm = STATUS_META[item.status];
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BusDetail', { bus: item })}>
        <View style={styles.busIcon}>
          <Typography style={{ fontSize: 22 }}>{TYPE_ICON[item.type] || '🚌'}</Typography>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Typography variant="body" style={styles.plate}>{item.plate}</Typography>
            <View style={[styles.statusBadge, { backgroundColor: sm.bg }]}>
              <Typography variant="caption" style={{ color: sm.text, fontSize: 10, fontWeight: '700' }}>{sm.label}</Typography>
            </View>
          </View>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {item.type} · {item.capacity} seats
          </Typography>
          <View style={styles.driverRow}>
            {item.driver ? (
              <>
                <View style={styles.driverAvatar}>
                  <Typography style={{ fontSize: 10, color: COLORS.white, fontWeight: '700' }}>
                    {item.driver.first_name[0]}{item.driver.last_name[0]}
                  </Typography>
                </View>
                <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 6 }}>
                  {item.driver.first_name} {item.driver.last_name}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color={COLORS.textMuted}>No driver assigned</Typography>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Icon name="trash" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const counts = MOCK_BUSES.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('fleet.title')}
        rightIcon="add"
        onRightPress={() => navigation.navigate('CreateBus')}
      />

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {(['active', 'maintenance', 'inactive'] as const).map(s => {
          const sm = STATUS_META[s];
          return (
            <View key={s} style={[styles.summaryCard, { borderTopColor: sm.text }]}>
              <Typography variant="body" style={{ fontWeight: '800', color: sm.text, fontSize: 20 }}>{counts[s] || 0}</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={{ fontSize: 10 }}>{sm.label}</Typography>
            </View>
          );
        })}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Icon name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search plate, type, driver..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Typography
              variant="caption"
              style={{ fontWeight: '600', color: activeFilter === f ? COLORS.white : COLORS.textSecondary, fontSize: 12 }}
            >
              {f === 'All' ? `All (${buses.length})` : `${STATUS_META[f].label} (${counts[f] || 0})`}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bus" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>No buses found</Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  busIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  plate: { fontWeight: '800', fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  driverRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  driverAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
