import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';

const PROVINCES = ['Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'];

export const CreateLocationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showProvinces, setShowProvinces] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!name.trim() || !province || !lat || !lng) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert('Validation', 'Latitude and longitude must be valid numbers.');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Location "${name}" created.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Create Location" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Typography variant="caption" style={styles.label}>Location Name</Typography>
        <TextInput style={styles.input} placeholder="e.g. Musanze" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />

        <Typography variant="caption" style={styles.label}>Province</Typography>
        <TouchableOpacity style={styles.input} onPress={() => setShowProvinces(!showProvinces)}>
          <Typography variant="body" color={province ? COLORS.text : COLORS.textMuted}>{province || 'Select province'}</Typography>
        </TouchableOpacity>
        {showProvinces && (
          <View style={styles.dropdown}>
            {PROVINCES.map(p => (
              <TouchableOpacity key={p} style={styles.dropdownItem} onPress={() => { setProvince(p); setShowProvinces(false); }}>
                <Typography variant="body">{p}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Map placeholder */}
        <Typography variant="caption" style={styles.label}>GPS Coordinates</Typography>
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={32} color={COLORS.brand} />
          <Typography variant="caption" color={COLORS.textSecondary} style={{ marginTop: 8 }}>
            Map picker — tap to select coordinates
          </Typography>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Typography variant="caption" style={styles.label}>Latitude</Typography>
            <TextInput style={styles.input} placeholder="-1.4989" placeholderTextColor={COLORS.textMuted} value={lat} onChangeText={setLat} keyboardType="numeric" />
          </View>
          <View style={[styles.half, { marginLeft: 12 }]}>
            <Typography variant="caption" style={styles.label}>Longitude</Typography>
            <TextInput style={styles.input} placeholder="29.6340" placeholderTextColor={COLORS.textMuted} value={lng} onChangeText={setLng} keyboardType="numeric" />
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading}>
          <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
            {loading ? 'Creating...' : 'Create Location'}
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
  dropdown: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mapPlaceholder: { height: 160, backgroundColor: COLORS.brandLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  row: { flexDirection: 'row', marginTop: 0 },
  half: { flex: 1 },
  btn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
});
