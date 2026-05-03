import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_LOCATIONS, Location } from '../mock/transportData';

interface SelectedStop { location: Location; order: number }

export const CreateRouteScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [stops, setStops] = useState<SelectedStop[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const addStop = (loc: Location) => {
    if (stops.find(s => s.location.id === loc.id)) {
      Alert.alert('Already added', 'This location is already in the route.');
      return;
    }
    setStops(prev => [...prev, { location: loc, order: prev.length + 1 }]);
    setShowPicker(false);
  };

  const removeStop = (id: string) => setStops(prev => prev.filter(s => s.location.id !== id).map((s, i) => ({ ...s, order: i + 1 })));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...stops];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setStops(next.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx === stops.length - 1) return;
    const next = [...stops];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setStops(next.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const autoName = stops.length >= 2 ? `${stops[0].location.name} — ${stops[stops.length - 1].location.name}` : '';

  const handleCreate = () => {
    if (stops.length < 2) { Alert.alert('Validation', 'A route needs at least 2 stops.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Route "${name || autoName}" created.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Create Route" 
        showBack 
        onBack={() => navigation.goBack()} 
        rightElement={<View />}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Typography variant="caption" style={styles.label}>Route Name (optional)</Typography>
        <TextInput style={styles.input} placeholder={autoName || 'Auto-generated from stops'} placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />

        <View style={styles.stopsHeader}>
          <Typography variant="caption" style={styles.label}>Stops</Typography>
          <TouchableOpacity style={styles.addStopBtn} onPress={() => setShowPicker(!showPicker)}>
            <Icon name="add" size={16} color={COLORS.brand} />
            <Typography variant="caption" color={COLORS.brand} style={{ marginLeft: 4 }}>Add Stop</Typography>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <View style={styles.picker}>
            {MOCK_LOCATIONS.filter(l => !stops.find(s => s.location.id === l.id)).map(loc => (
              <TouchableOpacity key={loc.id} style={styles.pickerItem} onPress={() => addStop(loc)}>
                <Icon name="map" size={16} color={COLORS.brand} />
                <Typography variant="body" style={{ marginLeft: 10 }}>{loc.name}</Typography>
                <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 'auto' }}>{loc.province}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {stops.length === 0 ? (
          <View style={styles.emptyStops}>
            <Typography variant="caption" color={COLORS.textMuted}>No stops added yet. Add at least 2.</Typography>
          </View>
        ) : (
          stops.map((s, idx) => (
            <View key={s.location.id} style={styles.stopRow}>
              <View style={styles.orderBadge}><Typography variant="caption" color={COLORS.white} style={{ fontWeight: '700' }}>{s.order}</Typography></View>
              <Typography variant="body" style={{ flex: 1, marginLeft: 10 }}>{s.location.name}</Typography>
              <TouchableOpacity onPress={() => moveUp(idx)} style={styles.orderBtn}><Icon name="chevron-left" size={16} color={COLORS.textSecondary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => moveDown(idx)} style={styles.orderBtn}><Icon name="chevron-right" size={16} color={COLORS.textSecondary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => removeStop(s.location.id)} style={styles.orderBtn}><Icon name="close" size={16} color={COLORS.error} /></TouchableOpacity>
            </View>
          ))
        )}

        {stops.length >= 2 && (
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color={COLORS.brand} />
            <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 8, flex: 1 }}>
              Route cannot be activated until all stop-pair prices are defined.
            </Typography>
          </View>
        )}

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
          <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
            {loading ? 'Creating...' : 'Create Route'}
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  label: { fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8 },
  input: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  stopsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.brandLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  picker: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  emptyStops: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  stopRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginTop: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  orderBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  orderBtn: { padding: 6 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.brandLight, borderRadius: 10, padding: 12, marginTop: 16 },
  btn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
});
