import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_PRICES, MOCK_LOCATIONS, Price } from '../mock/transportData';

export const PriceMatrixScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [prices, setPrices] = useState<Price[]>(MOCK_PRICES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDest, setFilterDest] = useState('');

  const filtered = prices.filter(p =>
    p.boarding_stop.name.toLowerCase().includes(filterOrigin.toLowerCase()) &&
    p.alighting_stop.name.toLowerCase().includes(filterDest.toLowerCase())
  );

  const startEdit = (p: Price) => {
    setEditingId(p.id);
    setEditValue(String(p.amount));
  };

  const saveEdit = (id: string) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val <= 0) { Alert.alert('Invalid', 'Enter a valid price.'); return; }
    setPrices(prev => prev.map(p => p.id === id ? { ...p, amount: val } : p));
    setEditingId(null);
  };

  const renderItem = ({ item }: { item: Price }) => {
    const isEditing = editingId === item.id;
    return (
      <View style={styles.row}>
        <View style={styles.stopCell}>
          <Typography variant="caption" style={styles.stopName}>{item.boarding_stop.name}</Typography>
          <Icon name="arrow-right" size={12} color={COLORS.textMuted} />
          <Typography variant="caption" style={styles.stopName}>{item.alighting_stop.name}</Typography>
        </View>
        <View style={styles.priceCell}>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.priceInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity onPress={() => saveEdit(item.id)} style={styles.saveBtn}>
                <Icon name="check" size={16} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingId(null)} style={styles.cancelBtn}>
                <Icon name="close" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.priceDisplay} onPress={() => startEdit(item)}>
              <Typography variant="body" style={styles.priceText}>{item.amount.toLocaleString()} RWF</Typography>
              <Icon name="edit" size={14} color={COLORS.brand} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Price Matrix" 
        showBack 
        onBack={() => navigation.goBack()} 
        rightElement={<View />}
      />

      <View style={styles.filters}>
        <View style={styles.filterInput}>
          <Icon name="search" size={14} color={COLORS.textSecondary} />
          <TextInput style={styles.filterText} placeholder="Origin" placeholderTextColor={COLORS.textMuted} value={filterOrigin} onChangeText={setFilterOrigin} />
        </View>
        <Icon name="arrow-right" size={16} color={COLORS.textMuted} />
        <View style={styles.filterInput}>
          <Icon name="search" size={14} color={COLORS.textSecondary} />
          <TextInput style={styles.filterText} placeholder="Destination" placeholderTextColor={COLORS.textMuted} value={filterDest} onChangeText={setFilterDest} />
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Typography variant="caption" style={[styles.headerCell, { flex: 2 }]}>STOP PAIR</Typography>
        <Typography variant="caption" style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>PRICE</Typography>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="dollar-sign" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>No prices found</Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filters: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  filterText: { flex: 1, marginLeft: 6, fontSize: 13, color: COLORS.text },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.brandLight },
  headerCell: { fontWeight: '700', color: COLORS.textSecondary, fontSize: 11, letterSpacing: 0.8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginTop: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  stopCell: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stopName: { fontWeight: '600', color: COLORS.text },
  priceCell: { flex: 1, alignItems: 'flex-end' },
  priceDisplay: { flexDirection: 'row', alignItems: 'center' },
  priceText: { fontWeight: '700', color: COLORS.brand },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceInput: { width: 80, borderWidth: 1, borderColor: COLORS.brand, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, color: COLORS.text, textAlign: 'right' },
  saveBtn: { backgroundColor: COLORS.brand, borderRadius: 8, padding: 6 },
  cancelBtn: { backgroundColor: COLORS.background, borderRadius: 8, padding: 6, borderWidth: 1, borderColor: COLORS.border },
  empty: { alignItems: 'center', paddingTop: 60 },
});
