import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Location } from '../mock/transportData';

export const LocationDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const loc: Location = route.params?.location;

  const [name, setName] = useState(loc.name);
  const [province, setProvince] = useState(loc.province);
  const [lat, setLat] = useState(String(loc.lat));
  const [lng, setLng] = useState(String(loc.lng));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Validation', 'Name is required.'); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
      Alert.alert('Saved', 'Location updated successfully.');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={loc.name}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon={editing ? 'check' : 'edit'}
        onRightPress={() => editing ? handleSave() : setEditing(true)}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Map placeholder showing pin */}
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={36} color={COLORS.brand} />
          <View style={styles.pin}>
            <Icon name="map" size={14} color={COLORS.white} />
          </View>
          <Typography variant="caption" color={COLORS.textSecondary} style={{ marginTop: 8 }}>
            {lat}, {lng}
          </Typography>
        </View>

        <View style={styles.card}>
          <Field label="Name" value={name} onChangeText={setName} editable={editing} />
          <Field label="Province" value={province} onChangeText={setProvince} editable={editing} />
          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="Latitude" value={lat} onChangeText={setLat} editable={editing} keyboardType="numeric" />
            </View>
            <View style={[styles.half, { marginLeft: 12 }]}>
              <Field label="Longitude" value={lng} onChangeText={setLng} editable={editing} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.metaRow}>
            <Typography variant="caption" color={COLORS.textMuted}>Created: {new Date(loc.created_at).toLocaleDateString()}</Typography>
            <Typography variant="caption" color={COLORS.textMuted}>Updated: {new Date(loc.updated_at).toLocaleDateString()}</Typography>
          </View>
        </View>

        {editing && (
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Typography>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({ label, value, onChangeText, editable, keyboardType }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Typography variant="caption" style={{ fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontSize: 11 }}>{label}</Typography>
    {editable ? (
      <TextInput style={fieldStyles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType || 'default'} />
    ) : (
      <Typography variant="body" style={fieldStyles.value}>{value}</Typography>
    )}
  </View>
);

const fieldStyles = StyleSheet.create({
  input: { backgroundColor: COLORS.background, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.text },
  value: { fontSize: 15, color: COLORS.text, paddingVertical: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  mapPlaceholder: { height: 180, backgroundColor: COLORS.brandLight, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },
  pin: { position: 'absolute', top: '40%', backgroundColor: COLORS.brand, borderRadius: 12, padding: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  row: { flexDirection: 'row' },
  half: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveBtn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
});
