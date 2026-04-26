import React, { useState } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';

const BUS_TYPES = ['Coach', 'Mini', 'Sprinter'] as const;
const BUS_STATUSES = ['active', 'maintenance', 'inactive'] as const;

// Mock drivers for the picker
const MOCK_DRIVERS = [
  { id: 'drv-1', name: 'Jean Uwimana' },
  { id: 'drv-2', name: 'Alice Mukamana' },
  { id: 'drv-3', name: 'Eric Habimana' },
  { id: 'drv-4', name: 'Marie Ingabire' },
  { id: 'drv-5', name: 'Paul Nkurunziza' },
];

export const CreateBusScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [plate, setPlate] = useState('');
  const [type, setType] = useState<typeof BUS_TYPES[number]>('Coach');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState<typeof BUS_STATUSES[number]>('active');
  const [selectedDriver, setSelectedDriver] = useState<typeof MOCK_DRIVERS[0] | null>(null);
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!plate.trim()) { Alert.alert('Validation', 'Plate number is required.'); return; }
    if (!capacity || isNaN(parseInt(capacity, 10)) || parseInt(capacity, 10) <= 0) {
      Alert.alert('Validation', 'Enter a valid seat capacity.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Bus "${plate.toUpperCase()}" created successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Add Bus" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Plate */}
        <Label text="Plate Number" required />
        <TextInput
          style={styles.input}
          placeholder="e.g. RAA 001 A"
          placeholderTextColor={COLORS.textMuted}
          value={plate}
          onChangeText={t => setPlate(t.toUpperCase())}
          autoCapitalize="characters"
        />

        {/* Type */}
        <Label text="Bus Type" required />
        <View style={styles.chipRow}>
          {BUS_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => setType(t)}
            >
              <Typography
                variant="caption"
                style={{ fontWeight: '700', color: type === t ? COLORS.white : COLORS.textSecondary }}
              >
                {t}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Capacity */}
        <Label text="Seat Capacity" required />
        <TextInput
          style={styles.input}
          placeholder={type === 'Mini' ? '14' : type === 'Sprinter' ? '20' : '30'}
          placeholderTextColor={COLORS.textMuted}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />

        {/* Status */}
        <Label text="Initial Status" required />
        <View style={styles.chipRow}>
          {BUS_STATUSES.map(s => {
            const color = s === 'active' ? '#10B981' : s === 'maintenance' ? '#F59E0B' : '#9E9E9E';
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, status === s && { backgroundColor: color, borderColor: color }]}
                onPress={() => setStatus(s)}
              >
                <Typography
                  variant="caption"
                  style={{ fontWeight: '700', color: status === s ? COLORS.white : COLORS.textSecondary }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Driver */}
        <Label text="Assign Driver" />
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowDriverPicker(!showDriverPicker)}
        >
          <Icon name="person" size={18} color={selectedDriver ? COLORS.brand : COLORS.textMuted} />
          <Typography
            variant="body"
            color={selectedDriver ? COLORS.text : COLORS.textMuted}
            style={{ marginLeft: 10, flex: 1 }}
          >
            {selectedDriver ? selectedDriver.name : 'Select a driver (optional)'}
          </Typography>
          {selectedDriver && (
            <TouchableOpacity onPress={() => setSelectedDriver(null)}>
              <Icon name="close" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          <Icon name={showDriverPicker ? 'chevron-left' : 'chevron-right'} size={18} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {showDriverPicker && (
          <View style={styles.dropdown}>
            {MOCK_DRIVERS.map(d => (
              <TouchableOpacity
                key={d.id}
                style={styles.dropdownItem}
                onPress={() => { setSelectedDriver(d); setShowDriverPicker(false); }}
              >
                <View style={styles.driverAvatar}>
                  <Typography style={{ color: COLORS.white, fontWeight: '700', fontSize: 11 }}>
                    {d.name.split(' ').map(n => n[0]).join('')}
                  </Typography>
                </View>
                <Typography variant="body" style={{ marginLeft: 10 }}>{d.name}</Typography>
                {selectedDriver?.id === d.id && (
                  <Icon name="check" size={16} color={COLORS.brand} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Summary preview */}
        {plate.trim() && capacity ? (
          <View style={styles.preview}>
            <Icon name="bus" size={20} color={COLORS.brand} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '700' }}>{plate.toUpperCase()}</Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                {type} · {capacity} seats · {status}
                {selectedDriver ? ` · ${selectedDriver.name}` : ''}
              </Typography>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Icon name="bus" size={18} color={COLORS.white} />
          <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700', marginLeft: 10 }}>
            {loading ? 'Creating...' : 'Create Bus'}
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Label = ({ text, required }: { text: string; required?: boolean }) => (
  <Typography
    variant="caption"
    style={{ fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, marginTop: 20, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8 }}
  >
    {text}{required ? ' *' : ''}
  </Typography>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text,
  },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  dropdown: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  driverAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.brandLight,
    borderRadius: 12, padding: 14, marginTop: 24,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, marginTop: 16,
  },
});
