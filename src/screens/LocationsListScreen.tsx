import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_LOCATIONS, Location } from '../mock/transportData';

export const LocationsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [search, setSearch] = useState('');

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.province.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    Alert.alert('Delete Location', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setLocations(prev => prev.filter(l => l.id !== id)) },
    ]);
  };

  const renderItem = ({ item }: { item: Location }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LocationDetail', { location: item })}>
      <View style={styles.cardIcon}>
        <Icon name="map" size={20} color={COLORS.brand} />
      </View>
      <View style={styles.cardBody}>
        <Typography variant="body" style={styles.name}>{item.name}</Typography>
        <Typography variant="caption" color={COLORS.textSecondary}>{item.province}</Typography>
        <Typography variant="caption" color={COLORS.textMuted}>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Typography>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Icon name="trash" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Locations" showBack onBack={() => navigation.goBack()} rightIcon="add" onRightPress={() => navigation.navigate('CreateLocation')} />
      <View style={styles.searchRow}>
        <Icon name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations..."
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
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="map" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>No locations found</Typography>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  name: { fontWeight: '700', marginBottom: 2 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
