import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Trip, MOCK_BOOKINGS, Booking } from '../mock/transportData';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: '#EFF6FF', text: '#3B82F6' },
  in_progress: { bg: '#FFFBEB', text: '#F59E0B' },
  completed: { bg: '#ECFDF5', text: '#10B981' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
};

export const TripDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const routeParam = useRoute<any>();
  const trip: Trip = routeParam.params?.trip;
  const [status, setStatus] = useState(trip.status);
  const bookings = MOCK_BOOKINGS;

  const handleDelete = () => {
    Alert.alert('Delete Trip', 'Delete this trip? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const handleStatusChange = (next: Trip['status']) => {
    Alert.alert('Update Status', `Set trip to "${next}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => setStatus(next) },
    ]);
  };

  const sc = STATUS_COLORS[status];
  const dep = new Date(trip.departure_at);

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingRow}>
      <View style={styles.seatBadge}><Typography variant="caption" color={COLORS.white} style={{ fontWeight: '700' }}>{item.seat_number}</Typography></View>
      <View style={styles.bookingInfo}>
        <Typography variant="body" style={{ fontWeight: '600' }}>{item.passenger_name}</Typography>
        <Typography variant="caption" color={COLORS.textSecondary}>{item.phone}</Typography>
        <Typography variant="caption" color={COLORS.textMuted}>{item.boarding_stop} → {item.alighting_stop}</Typography>
      </View>
      <View style={[styles.bookingStatus, { backgroundColor: item.status === 'confirmed' ? '#ECFDF5' : '#FEF2F2' }]}>
        <Typography variant="caption" style={{ color: item.status === 'confirmed' ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: '600' }}>
          {item.status.toUpperCase()}
        </Typography>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Trip Detail"
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="trash"
        onRightPress={handleDelete}
      />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Status + express */}
        <View style={styles.topRow}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Typography variant="caption" style={{ color: sc.text, fontWeight: '700' }}>{status.replace('_', ' ').toUpperCase()}</Typography>
          </View>
          {trip.is_express && (
            <View style={styles.expressBadge}>
              <Icon name="clock" size={12} color="#F59E0B" />
              <Typography variant="caption" style={{ color: '#F59E0B', marginLeft: 4, fontWeight: '600' }}>EXPRESS</Typography>
            </View>
          )}
        </View>

        {/* Main info card */}
        <View style={styles.card}>
          <Row label="Route" value={trip.route.name} />
          <Row label="Departure" value={dep.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
          <Row label="Bus" value={`${trip.bus.plate} (${trip.bus.type})`} />
          <Row label="Seats" value={`${trip.booked_seats} / ${trip.total_seats} booked (${trip.remaining_seats} remaining)`} />
        </View>

        {/* Series context */}
        {trip.series && (
          <View style={styles.seriesCard}>
            <Icon name="refresh-cw" size={16} color={COLORS.brand} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '600' }}>Part of a series</Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Every {trip.series.frequency_minutes} min · {trip.series.starts_on} → {trip.series.ends_on}
              </Typography>
              {trip.series.repeat_daily && <Typography variant="caption" color={COLORS.textSecondary}>Repeats daily</Typography>}
            </View>
          </View>
        )}

        {/* Status actions */}
        {status === 'scheduled' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFFBEB' }]} onPress={() => handleStatusChange('in_progress')}>
              <Typography variant="caption" style={{ color: '#F59E0B', fontWeight: '600' }}>Start Trip</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => handleStatusChange('cancelled')}>
              <Typography variant="caption" style={{ color: '#EF4444', fontWeight: '600' }}>Cancel Trip</Typography>
            </TouchableOpacity>
          </View>
        )}
        {status === 'in_progress' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5', alignSelf: 'stretch' }]} onPress={() => handleStatusChange('completed')}>
            <Typography variant="caption" style={{ color: '#10B981', fontWeight: '600', textAlign: 'center' }}>Mark Completed</Typography>
          </TouchableOpacity>
        )}

        {/* Passenger list */}
        <Typography variant="body" style={styles.sectionTitle}>Passengers ({bookings.length})</Typography>
        {bookings.map(b => renderBooking({ item: b }))}
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
    <Typography variant="caption" color={COLORS.textSecondary}>{label}</Typography>
    <Typography variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Typography>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  expressBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  seriesCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.brandLight, borderRadius: 14, padding: 14, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  sectionTitle: { fontWeight: '700', marginBottom: 10, marginTop: 4 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  seatBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bookingInfo: { flex: 1 },
  bookingStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
