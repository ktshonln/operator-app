import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Location } from '../mock/transportData';
import { getLocations, createRoute } from '../api';

interface SelectedStop { location: Location; order: number }

export const CreateRouteScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [stops, setStops] = useState<SelectedStop[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const data = await getLocations();
      setLocations(data);
    } catch (error: any) {
      console.error('Failed to fetch locations:', error);
      
      // Show the actual backend error message
      const errorMessage = error.message || 'Unable to load locations';
      const errorDetails = error.data?.error?.code || '';
      
      Alert.alert(
        'Error Loading Locations', 
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
        [{ text: 'OK' }]
      );
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

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

  const formatRouteError = (error: any) => {
    const code = error.data?.error?.code ?? '';
    const base = error.message || 'Failed to create route';
    switch (code) {
      case 'STOP_NOT_FOUND':
        return `${base}\n\nOne or more stops no longer exist. Refresh locations and pick stops again.`;
      case 'ROUTE_ALREADY_EXISTS':
        return `${base}\n\nA route with this name already exists. Use a different name or leave the name blank.`;
      case 'INSUFFICIENT_STOPS':
        return `${base}\n\nAdd at least 2 stops.`;
      case 'FORBIDDEN':
        return `${base}\n\nYour account cannot create routes. Org admins should have route:create — contact Katisha support.`;
      case 'INTERNAL_SERVER_ERROR':
        return `${base}\n\nServer error (500). Your payload matches the API spec — this is likely a Katisha backend issue. Try leaving the route name blank, or contact support with the stop IDs you selected.`;
      default:
        return code ? `${base}\n\nError: ${code}` : base;
    }
  };

  const handleCreate = async () => {
    if (stops.length < 2) {
      Alert.alert('Validation', 'A route needs at least 2 stops.');
      return;
    }

    const routeName = name.trim() || undefined;

    setLoading(true);
    try {
      await createRoute({
        ...(routeName ? { name: routeName } : {}),
        stops: stops.map(s => ({
          location_id: s.location.id,
          order: s.order,
        })),
      });

      const displayName = routeName || autoName || 'Route';
      Alert.alert('Success', `Route "${displayName}" created (inactive until fares are set).`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', formatRouteError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Create Route" 
        showBack 
        onBack={() => navigation.goBack()} 
        rightElement={<View />}
      />
      {loadingLocations ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>Loading locations...</Typography>
        </View>
      ) : (
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
              {locations.filter(l => !stops.find(s => s.location.id === l.id)).length === 0 ? (
                <View style={styles.pickerEmpty}>
                  <Typography variant="caption" color={COLORS.textMuted}>No locations available to add.</Typography>
                </View>
              ) : (
                locations.filter(l => !stops.find(s => s.location.id === l.id)).map(loc => (
                  <TouchableOpacity key={loc.id} style={styles.pickerItem} onPress={() => addStop(loc)}>
                    <Icon name="map" size={16} color={COLORS.brand} />
                    <Typography variant="body" style={{ marginLeft: 10 }}>{loc.name}</Typography>
                    <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 'auto' }}>{loc.city || loc.province || ''}</Typography>
                  </TouchableOpacity>
                ))
              )}
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
                Route is created inactive. Set all stop-pair fares on the route detail screen, then activate.
              </Typography>
            </View>
          )}

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
            <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
              {loading ? 'Creating...' : 'Create Route'}
            </Typography>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  label: { fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8 },
  input: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  stopsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.brandLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  picker: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, overflow: 'hidden' },
  pickerEmpty: { paddingHorizontal: 14, paddingVertical: 16, alignItems: 'center' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  emptyStops: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  stopRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginTop: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  orderBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  orderBtn: { padding: 6 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.brandLight, borderRadius: 10, padding: 12, marginTop: 16 },
  btn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
});
