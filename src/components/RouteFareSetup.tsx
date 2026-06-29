import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { COLORS } from '../theme/colors';
import { Route, RouteStop } from '../mock/transportData';
import { bulkUpsertPrices } from '../api';

interface StopPair {
  boarding: RouteStop;
  alighting: RouteStop;
}

const buildStopPairs = (stops: RouteStop[]): StopPair[] => {
  const ordered = [...stops].sort((a, b) => a.order - b.order);
  const pairs: StopPair[] = [];
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      pairs.push({ boarding: ordered[i], alighting: ordered[j] });
    }
  }
  return pairs;
};

interface RouteFareSetupProps {
  route: Route;
  onSaved: () => void;
}

export const RouteFareSetup: React.FC<RouteFareSetupProps> = ({ route, onSaved }) => {
  const stops = route.stops ?? [];
  const pairs = buildStopPairs(stops);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (pairs.length === 0) return null;

  const pairKey = (boardingId: string, alightingId: string) => `${boardingId}:${alightingId}`;

  const handleSaveAll = async () => {
    const prices = pairs.map(pair => {
      const key = pairKey(pair.boarding.location_id, pair.alighting.location_id);
      const amount = parseInt(amounts[key] ?? '', 10);
      return {
        boarding_stop_id: pair.boarding.location_id,
        alighting_stop_id: pair.alighting.location_id,
        amount,
        key,
      };
    });

    const missing = prices.filter(p => !p.amount || p.amount <= 0);
    if (missing.length > 0) {
      Alert.alert('Validation', 'Enter a valid price (RWF) for every stop pair.');
      return;
    }

    setSaving(true);
    try {
      await bulkUpsertPrices(
        prices.map(({ boarding_stop_id, alighting_stop_id, amount }) => ({
          boarding_stop_id,
          alighting_stop_id,
          amount,
        })),
      );
      Alert.alert('Success', 'Route fares saved.');
      onSaved();
    } catch (error: any) {
      const code = error.data?.error?.code ?? '';
      Alert.alert(
        'Error',
        code ? `${error.message}\n\nError: ${code}` : error.message || 'Failed to save fares',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Typography variant="body" style={styles.title}>Set route fares</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.hint}>
        Boarding = earlier stop on the route. Alighting = later stop. For Braserie → Akanyaru use Braserie as boarding and Akanyaru as alighting — not the reverse.
      </Typography>

      {pairs.map(pair => {
        const key = pairKey(pair.boarding.location_id, pair.alighting.location_id);
        return (
          <View key={key} style={styles.pairRow}>
            <View style={styles.pairLabel}>
              <Typography variant="caption" style={styles.stopName}>{pair.boarding.name}</Typography>
              <Icon name="arrow-right" size={12} color={COLORS.textMuted} />
              <Typography variant="caption" style={styles.stopName}>{pair.alighting.name}</Typography>
            </View>
            <TextInput
              style={styles.input}
              placeholder="RWF"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={amounts[key] ?? ''}
              onChangeText={text => setAmounts(prev => ({ ...prev, [key]: text }))}
            />
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSaveAll}
        disabled={saving}
      >
        <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
          {saving ? 'Saving...' : 'Save fares'}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  title: { fontWeight: '700', marginBottom: 8 },
  hint: { marginBottom: 12, lineHeight: 18 },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  pairLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  stopName: { fontWeight: '600', color: COLORS.text },
  input: {
    width: 90,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
});
