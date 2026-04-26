import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { MOCK_TRIPS, MOCK_BUSES, MOCK_ROUTES } from '../mock/transportData';

const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Typography style={{ fontSize: 26, fontWeight: '800', color }}>{value}</Typography>
    <Typography variant="body" style={{ fontWeight: '700', marginTop: 2 }}>{label}</Typography>
    <Typography variant="caption" color={COLORS.textMuted}>{sub}</Typography>
  </View>
);

const BarRow = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <View style={styles.barRow}>
    <Typography variant="caption" style={styles.barLabel}>{label}</Typography>
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round((value / max) * 100)}%`, backgroundColor: color }]} />
    </View>
    <Typography variant="caption" style={[styles.barValue, { color }]}>{value}</Typography>
  </View>
);

export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const totalTrips = MOCK_TRIPS.length;
  const completedTrips = MOCK_TRIPS.filter(t => t.status === 'completed').length;
  const scheduledTrips = MOCK_TRIPS.filter(t => t.status === 'scheduled').length;
  const totalBookedSeats = MOCK_TRIPS.reduce((s, t) => s + t.booked_seats, 0);
  const totalSeats = MOCK_TRIPS.reduce((s, t) => s + t.total_seats, 0);
  const occupancyRate = totalSeats > 0 ? Math.round((totalBookedSeats / totalSeats) * 100) : 0;
  const activeBuses = MOCK_BUSES.filter(b => b.status === 'active').length;
  const activeRoutes = MOCK_ROUTES.filter(r => r.status === 'active').length;

  // Revenue mock
  const revenue = totalBookedSeats * 3200;

  // Trips per route
  const tripsPerRoute = MOCK_ROUTES.map(r => ({
    name: r.name,
    count: MOCK_TRIPS.filter(t => t.route.id === r.id).length,
  })).sort((a, b) => b.count - a.count);
  const maxRouteTrips = Math.max(...tripsPerRoute.map(r => r.count), 1);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Analytics" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Typography variant="caption" style={styles.sectionLabel}>OVERVIEW</Typography>
        <View style={styles.statsGrid}>
          <StatCard label="Total Trips" value={String(totalTrips)} sub="All time" color={COLORS.brand} />
          <StatCard label="Completed" value={String(completedTrips)} sub="Finished trips" color="#10B981" />
          <StatCard label="Scheduled" value={String(scheduledTrips)} sub="Upcoming" color="#F59E0B" />
          <StatCard label="Occupancy" value={`${occupancyRate}%`} sub={`${totalBookedSeats}/${totalSeats} seats`} color="#8B5CF6" />
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Active Buses" value={String(activeBuses)} sub={`${MOCK_BUSES.length} total`} color="#10B981" />
          <StatCard label="Active Routes" value={String(activeRoutes)} sub={`${MOCK_ROUTES.length} total`} color={COLORS.brand} />
        </View>

        {/* Revenue */}
        <View style={styles.revenueCard}>
          <Typography variant="caption" style={styles.sectionLabel}>ESTIMATED REVENUE</Typography>
          <Typography style={{ fontSize: 32, fontWeight: '800', color: COLORS.brand }}>
            {revenue.toLocaleString()} RWF
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>Based on {totalBookedSeats} booked seats × avg 3,200 RWF</Typography>
        </View>

        {/* Trips per route */}
        <View style={styles.card}>
          <Typography variant="body" style={styles.cardTitle}>Trips by Route</Typography>
          {tripsPerRoute.map((r, i) => (
            <BarRow key={i} label={r.name} value={r.count} max={maxRouteTrips} color={COLORS.brand} />
          ))}
        </View>

        {/* Bus status breakdown */}
        <View style={styles.card}>
          <Typography variant="body" style={styles.cardTitle}>Fleet Status</Typography>
          {(['active', 'maintenance', 'inactive'] as const).map(s => {
            const count = MOCK_BUSES.filter(b => b.status === s).length;
            const color = s === 'active' ? '#10B981' : s === 'maintenance' ? '#F59E0B' : '#9E9E9E';
            return <BarRow key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} value={count} max={MOCK_BUSES.length} color={color} />;
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontWeight: '700', color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderTopWidth: 3, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  revenueCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  cardTitle: { fontWeight: '700', marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 110, color: COLORS.textSecondary, fontSize: 12 },
  barTrack: { flex: 1, height: 8, backgroundColor: COLORS.background, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  barValue: { width: 28, textAlign: 'right', fontWeight: '700', fontSize: 12 },
});
