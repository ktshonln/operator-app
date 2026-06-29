import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Price } from '../mock/transportData';
import { getPrices, updatePrice } from '../api';

export const PriceMatrixScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const routeParams = useRoute<any>().params;
  const routeId = routeParams?.routeId as string | undefined;
  const routeName = routeParams?.routeName as string | undefined;
  const [prices, setPrices] = useState<Price[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDest, setFilterDest] = useState('');
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!routeName) return;
    const parts = routeName.split(/\s*[—–-]\s*/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      setFilterOrigin(parts[0]);
      setFilterDest(parts[parts.length - 1]);
    }
  }, [routeName]);

  const fetchPrices = useCallback(async (showFullLoader = true) => {
    try {
      if (showFullLoader) setLoading(true);
      const data = await getPrices();
      setPrices(data);
    } catch (error: any) {
      console.error('Failed to fetch prices:', error);
      const errorMessage = error.message || 'Unable to load prices from server';
      const errorDetails = error.data?.error?.code || '';

      Alert.alert(
        'Error Loading Prices',
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      setPrices([]);
    } finally {
      if (showFullLoader) setLoading(false);
    }
  }, [navigation, routeId]);

  useFocusEffect(
    useCallback(() => {
      fetchPrices(isFirstLoad.current);
      isFirstLoad.current = false;
    }, [fetchPrices])
  );

  const filtered = prices.filter(p =>
    p.boarding_stop.name.toLowerCase().includes(filterOrigin.toLowerCase()) &&
    p.alighting_stop.name.toLowerCase().includes(filterDest.toLowerCase())
  );

  const startEdit = (p: Price) => {
    setEditingId(p.id);
    setEditValue(String(p.amount));
  };

  const saveEdit = async (id: string) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid', 'Enter a valid price.');
      return;
    }

    try {
      await updatePrice(id, val);
      setPrices(prev => prev.map(p => (p.id === id ? { ...p, amount: val } : p)));
      setEditingId(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update price';
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        'Error',
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
      );
    }
  };

  const renderItem = ({ item }: { item: Price }) => {
    const isEditing = editingId === item.id;
    const currency = item.currency ?? 'RWF';

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
              <Typography variant="body" style={styles.priceText}>
                {item.amount.toLocaleString()} {currency}
              </Typography>
              <Icon name="edit" size={14} color={COLORS.brand} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={routeName ? `Prices — ${routeName}` : 'Price Matrix'}
          showBack
          onBack={() => navigation.goBack()}
          rightElement={<View />}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>
            Loading prices...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={routeName ? `Prices — ${routeName}` : 'Price Matrix'}
        showBack
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />

      <View style={styles.summary}>
        <Typography variant="caption" color={COLORS.textSecondary}>
          {filtered.length} of {prices.length} stop-pair prices
          {routeName ? ` · ${routeName}` : ''}
        </Typography>
        <Typography variant="caption" color={COLORS.textMuted} style={{ marginTop: 4 }}>
          Origin = boarding (first stop). Destination = alighting (later stop).
        </Typography>
      </View>

      <View style={styles.filters}>
        <View style={styles.filterInput}>
          <Icon name="search" size={14} color={COLORS.textSecondary} />
          <TextInput
            style={styles.filterText}
            placeholder="Origin"
            placeholderTextColor={COLORS.textMuted}
            value={filterOrigin}
            onChangeText={setFilterOrigin}
          />
        </View>
        <Icon name="arrow-right" size={16} color={COLORS.textMuted} />
        <View style={styles.filterInput}>
          <Icon name="search" size={14} color={COLORS.textSecondary} />
          <TextInput
            style={styles.filterText}
            placeholder="Destination"
            placeholderTextColor={COLORS.textMuted}
            value={filterDest}
            onChangeText={setFilterDest}
          />
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
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12, textAlign: 'center' }}>
              {prices.length === 0
                ? 'No fares yet for this route. Open the route and use "Set route fares" to add them.'
                : 'No prices match your filters. Try Braserie as Origin and Akanyaru as Destination (route direction).'}
            </Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { paddingHorizontal: 16, paddingTop: 8 },
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
