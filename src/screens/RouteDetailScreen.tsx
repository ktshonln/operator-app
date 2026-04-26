import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Route } from '../mock/transportData';

export const RouteDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const routeParam = useRoute<any>();
  const routeData: Route = routeParam.params?.route;
  const [status, setStatus] = useState(routeData.status);

  const toggleStatus = () => {
    if (!routeData.prices_complete && status === 'inactive') {
      Alert.alert('Cannot Activate', 'All stop-pair prices must be defined before activating this route.');
      return;
    }
    const next = status === 'active' ? 'inactive' : 'active';
    Alert.alert('Confirm', `Set route to ${next}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => setStatus(next) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={routeData.name} showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: status === 'active' ? '#E6F7E6' : '#F5F5F5' }]}>
            <View style={[styles.dot, { backgroundColor: status === 'active' ? COLORS.success : COLORS.textMuted }]} />
            <Typography variant="caption" style={{ color: status === 'active' ? '#2E7D32' : COLORS.textSecondary, fontWeight: '700' }}>
              {status.toUpperCase()}
            </Typography>
          </View>
          <TouchableOpacity style={styles.toggleBtn} onPress={toggleStatus}>
            <Typography variant="caption" color={COLORS.brand} style={{ fontWeight: '600' }}>
              {status === 'active' ? 'Deactivate' : 'Activate'}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Map placeholder with stops */}
        <View style={styles.mapPlaceholder}>
          <Icon name="map" size={32} color={COLORS.brand} />
          <Typography variant="caption" color={COLORS.textSecondary} style={{ marginTop: 8 }}>
            Route map — {routeData.stops_count} stops
          </Typography>
        </View>

        {/* Stops list */}
        <View style={styles.card}>
          <Typography variant="body" style={styles.sectionTitle}>Ordered Stops</Typography>
          {routeData.stops.map((stop, idx) => (
            <View key={stop.id} style={styles.stopRow}>
              <View style={styles.stopLine}>
                <View style={styles.stopDot} />
                {idx < routeData.stops.length - 1 && <View style={styles.stopConnector} />}
              </View>
              <Typography variant="body" style={{ marginLeft: 12, flex: 1 }}>{stop.name}</Typography>
              <Typography variant="caption" color={COLORS.textMuted}>#{stop.order}</Typography>
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Row label="Organisation" value={routeData.org.name} />
          <Row label="Origin" value={routeData.origin.name} />
          <Row label="Destination" value={routeData.destination.name} />
          <Row label="Created" value={new Date(routeData.created_at).toLocaleDateString()} />
        </View>

        {/* Price matrix link */}
        {!routeData.prices_complete && (
          <View style={styles.warningBox}>
            <Icon name="alert" size={18} color="#F57C00" />
            <Typography variant="caption" style={{ color: '#F57C00', marginLeft: 8, flex: 1 }}>
              Prices are incomplete. Define all stop-pair prices to activate this route.
            </Typography>
          </View>
        )}

        <TouchableOpacity style={styles.priceBtn} onPress={() => navigation.navigate('PriceMatrix')}>
          <Icon name="dollar-sign" size={18} color={COLORS.brand} />
          <Typography variant="body" color={COLORS.brand} style={{ marginLeft: 8, fontWeight: '600' }}>View Price Matrix</Typography>
          <Icon name="chevron-right" size={18} color={COLORS.brand} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
    <Typography variant="caption" color={COLORS.textSecondary}>{label}</Typography>
    <Typography variant="body" style={{ fontWeight: '600' }}>{value}</Typography>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  toggleBtn: { backgroundColor: COLORS.brandLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  mapPlaceholder: { height: 160, backgroundColor: COLORS.brandLight, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  stopLine: { alignItems: 'center', width: 16 },
  stopDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.brand, marginTop: 4 },
  stopConnector: { width: 2, height: 28, backgroundColor: COLORS.brandLight, marginTop: 2 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 12 },
  priceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
});
