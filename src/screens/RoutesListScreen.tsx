import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_ROUTES, Route } from '../mock/transportData';

export const RoutesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES);
  const [search, setSearch] = useState('');

  const filtered = routes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (r: Route) => {
    // Simulate ROUTE_IN_USE guard
    const inUse = r.id === 'route-1';
    if (inUse) {
      Alert.alert('Cannot Delete', 'This route is currently in use by active trips.');
      return;
    }
    Alert.alert('Delete Route', `Delete "${r.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setRoutes(prev => prev.filter(x => x.id !== r.id)) },
    ]);
  };

  const renderItem = ({ item }: { item: Route }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RouteDetail', { route: item })}>
      <View style={styles.cardLeft}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.textMuted }]} />
        <View style={styles.cardBody}>
          <Typography variant="body" style={styles.name}>{item.name}</Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>{item.stops_count} stops · {item.org.name}</Typography>
          {!item.prices_complete && (
            <View style={styles.warningBadge}>
              <Icon name="alert" size={12} color="#F57C00" />
              <Typography variant="caption" style={{ color: '#F57C00', marginLeft: 4, fontSize: 11 }}>Prices incomplete</Typography>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#E6F7E6' : '#F5F5F5' }]}>
          <Typography variant="caption" style={{ color: item.status === 'active' ? '#2E7D32' : COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {item.status.toUpperCase()}
          </Typography>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Icon name="trash" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Routes" showBack onBack={() => navigation.goBack()} rightIcon="add" onRightPress={() => navigation.navigate('CreateRoute')} />
      <View style={styles.searchRow}>
        <Icon name="search" size={18} color={COLORS.textSecondary} />
        <TextInput style={styles.searchInput} placeholder="Search routes..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Icon name="close" size={18} color={COLORS.textSecondary} /></TouchableOpacity>}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="map" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>No routes found</Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.text },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cardBody: { flex: 1 },
  name: { fontWeight: '700', marginBottom: 2 },
  warningBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
