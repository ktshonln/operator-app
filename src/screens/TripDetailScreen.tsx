import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Trip } from '../mock/transportData';
import {
  getTripById,
  getTripTickets,
  activateTrip,
  completeTrip,
  deleteTrip,
  TripTicket,
} from '../api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: '#EFF6FF', text: '#3B82F6' },
  active: { bg: '#FFFBEB', text: '#F59E0B' },
  in_progress: { bg: '#FFFBEB', text: '#F59E0B' },
  completed: { bg: '#ECFDF5', text: '#10B981' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
};

export const TripDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const routeParam = useRoute<any>();
  const tripId: string = routeParam.params?.trip?.id;

  const [tripData, setTripData] = useState<Trip | null>(routeParam.params?.trip ?? null);
  const [tickets, setTickets] = useState<TripTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [trip, tripTickets] = await Promise.all([
          getTripById(tripId),
          getTripTickets(tripId),
        ]);
        setTripData(trip);
        setTickets(tripTickets);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const handleDelete = () => {
    Alert.alert('Delete Trip', 'Delete this trip? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrip(tripId);
            Alert.alert('Deleted', 'Trip deleted.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete trip');
          }
        },
      },
    ]);
  };

  const handleActivate = () => {
    Alert.alert('Start Trip', 'Activate this trip now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          try {
            const updated = await activateTrip(tripId);
            setTripData(updated);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to start trip');
          }
        },
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Complete Trip', 'Mark this trip as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            const updated = await completeTrip(tripId);
            setTripData(updated);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to complete trip');
          }
        },
      },
    ]);
  };

  if (loading || !tripData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Trip Detail" showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[tripData.status] ?? STATUS_COLORS.scheduled;
  const dep = new Date(tripData.departure_at);
  const statusLabel = tripData.status.replace('_', ' ').toUpperCase();

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

        <View style={styles.topRow}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Typography variant="caption" style={{ color: sc.text, fontWeight: '700' }}>{statusLabel}</Typography>
          </View>
          {tripData.is_express && (
            <View style={styles.expressBadge}>
              <Icon name="clock" size={12} color="#F59E0B" />
              <Typography variant="caption" style={{ color: '#F59E0B', marginLeft: 4, fontWeight: '600' }}>EXPRESS</Typography>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Row label="Route" value={tripData.route.name} />
          <Row label="Departure" value={dep.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
          <Row label="Bus" value={tripData.bus?.plate ? `${tripData.bus.plate} (${tripData.bus.type})` : 'Unassigned'} />
          {tripData.driver && (
            <Row label="Driver" value={`${tripData.driver.first_name} ${tripData.driver.last_name}`} />
          )}
          <Row label="Seats" value={`${tripData.booked_seats} / ${tripData.total_seats} booked (${tripData.remaining_seats} remaining)`} />
        </View>

        {tripData.series && (
          <View style={styles.seriesCard}>
            <Icon name="refresh-cw" size={16} color={COLORS.brand} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '600' }}>Part of a series</Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Every {tripData.series.frequency_minutes} min · {tripData.series.starts_on} → {tripData.series.ends_on}
              </Typography>
              {tripData.series.repeat_daily && <Typography variant="caption" color={COLORS.textSecondary}>Repeats daily</Typography>}
            </View>
          </View>
        )}

        {tripData.status === 'scheduled' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFFBEB' }]} onPress={handleActivate}>
              <Typography variant="caption" style={{ color: '#F59E0B', fontWeight: '600' }}>Start Trip</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={handleDelete}>
              <Typography variant="caption" style={{ color: '#EF4444', fontWeight: '600' }}>Delete Trip</Typography>
            </TouchableOpacity>
          </View>
        )}
        {tripData.status === 'active' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5', alignSelf: 'stretch' }]} onPress={handleComplete}>
            <Typography variant="caption" style={{ color: '#10B981', fontWeight: '600', textAlign: 'center' }}>Mark Completed</Typography>
          </TouchableOpacity>
        )}

        <Typography variant="body" style={styles.sectionTitle}>Passengers ({tickets.length})</Typography>
        {tickets.length === 0 ? (
          <Typography variant="caption" color={COLORS.textMuted}>No tickets booked yet.</Typography>
        ) : (
          tickets.map(item => (
            <View key={item.id} style={styles.bookingRow}>
              <View style={styles.seatBadge}>
                <Typography variant="caption" color={COLORS.white} style={{ fontWeight: '700' }}>{item.seats_count}</Typography>
              </View>
              <View style={styles.bookingInfo}>
                <Typography variant="body" style={{ fontWeight: '600' }}>{item.passenger_name}</Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>{item.phone}</Typography>
                <Typography variant="caption" color={COLORS.textMuted}>
                  {item.boarding_stop.name} → {item.alighting_stop.name}
                </Typography>
              </View>
              <View style={[styles.bookingStatus, { backgroundColor: item.status === 'confirmed' ? '#ECFDF5' : '#FEF2F2' }]}>
                <Typography variant="caption" style={{ color: item.status === 'confirmed' ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: '600' }}>
                  {item.status.toUpperCase()}
                </Typography>
              </View>
            </View>
          ))
        )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
