import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_TRIPS, MOCK_ROUTES, Trip, Route } from '../mock/transportData';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 05:00 – 22:00
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(base: Date): Date[] {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3B82F6',
  in_progress: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export const TripCalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSlot, setCreateSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);

  // Create form state
  const [newHour, setNewHour] = useState('06');
  const [newMin, setNewMin] = useState('00');
  const [newBus, setNewBus] = useState('RAA 001 A');
  const [newSeats, setNewSeats] = useState('30');
  const [newExpress, setNewExpress] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);

  const visibleTrips = useMemo(() => {
    return trips.filter(t => {
      const d = new Date(t.departure_at);
      const inWeek = weekDates.some(wd => sameDay(wd, d));
      const matchRoute = !selectedRoute || t.route.id === selectedRoute.id;
      return inWeek && matchRoute;
    });
  }, [trips, weekDates, selectedRoute]);

  const tripsAt = (date: Date, hour: number) =>
    visibleTrips.filter(t => {
      const d = new Date(t.departure_at);
      return sameDay(d, date) && d.getHours() === hour;
    });

  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };

  const openCreate = (date: Date, hour: number) => {
    if (!selectedRoute) { Alert.alert('Select a route', 'Please select a route before creating a trip.'); return; }
    setCreateSlot({ date, hour });
    setNewHour(String(hour).padStart(2, '0'));
    setNewMin('00');
    setShowCreateModal(true);
  };

  const handleCreate = () => {
    if (!createSlot || !selectedRoute) return;
    const dep = new Date(createSlot.date);
    dep.setHours(parseInt(newHour, 10), parseInt(newMin, 10), 0, 0);
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      departure_at: dep.toISOString(),
      status: 'scheduled',
      is_express: newExpress,
      total_seats: parseInt(newSeats, 10) || 30,
      booked_seats: 0,
      remaining_seats: parseInt(newSeats, 10) || 30,
      route: { id: selectedRoute.id, name: selectedRoute.name },
      bus: { id: 'bus-new', plate: newBus, type: 'Coach' },
      series: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTrips(prev => [...prev, newTrip]);
    setShowCreateModal(false);
    Alert.alert('Created', `Trip on ${dep.toLocaleString()} created.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Trip Calendar" 
        rightElement={<View />}
      />

      {/* Route selector */}
      <TouchableOpacity style={styles.routeSelector} onPress={() => setShowRoutePicker(!showRoutePicker)}>
        <Icon name="map" size={16} color={COLORS.brand} />
        <Typography variant="body" color={selectedRoute ? COLORS.text : COLORS.textMuted} style={{ marginLeft: 8, flex: 1 }}>
          {selectedRoute ? selectedRoute.name : 'Select a route to view trips...'}
        </Typography>
        <Icon name={showRoutePicker ? 'chevron-left' : 'chevron-right'} size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {showRoutePicker && (
        <View style={styles.routeDropdown}>
          <TouchableOpacity style={styles.routeOption} onPress={() => { setSelectedRoute(null); setShowRoutePicker(false); }}>
            <Typography variant="body" color={COLORS.textSecondary}>All routes</Typography>
          </TouchableOpacity>
          {MOCK_ROUTES.map(r => (
            <TouchableOpacity key={r.id} style={styles.routeOption} onPress={() => { setSelectedRoute(r); setShowRoutePicker(false); }}>
              <View style={[styles.routeDot, { backgroundColor: STATUS_COLORS.scheduled }]} />
              <Typography variant="body">{r.name}</Typography>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={prevWeek} style={styles.navBtn}><Icon name="chevron-left" size={20} color={COLORS.brand} /></TouchableOpacity>
        <Typography variant="body" style={styles.weekLabel}>
          {weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Typography>
        <TouchableOpacity onPress={nextWeek} style={styles.navBtn}><Icon name="chevron-right" size={20} color={COLORS.brand} /></TouchableOpacity>
      </View>

      {/* Calendar grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            <View style={styles.timeGutter} />
            {weekDates.map((d, i) => {
              const isToday = sameDay(d, new Date());
              return (
                <View key={i} style={[styles.dayHeader, isToday && styles.todayHeader]}>
                  <Typography variant="caption" style={[styles.dayName, isToday && { color: COLORS.brand }]}>{DAYS[d.getDay()]}</Typography>
                  <Typography variant="body" style={[styles.dayNum, isToday && { color: COLORS.brand, fontWeight: '800' }]}>{d.getDate()}</Typography>
                </View>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
            {HOURS.map((hour, hourIdx) => (
              <View key={hour} style={[styles.hourRow, hourIdx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.timeGutter}>
                  <Typography variant="caption" style={styles.timeLabel}>{String(hour).padStart(2, '0')}:00</Typography>
                </View>
                {weekDates.map((d, di) => {
                  const cellTrips = tripsAt(d, hour);
                  return (
                    <TouchableOpacity key={di} style={[styles.cell, hourIdx % 2 === 1 && { backgroundColor: '#F8FAFC' }]} onPress={() => openCreate(d, hour)}>
                      {cellTrips.map(t => (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.tripTile, { backgroundColor: STATUS_COLORS[t.status] }]}
                          onPress={() => navigation.navigate('TripDetail', { trip: t })}
                        >
                          <Typography variant="caption" color={COLORS.white} style={styles.tileText} numberOfLines={1}>
                            {new Date(t.departure_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          <Typography variant="caption" color={COLORS.white} style={styles.tileText} numberOfLines={1}>
                            {t.route.name.split('—')[1]?.trim() || t.route.name}
                          </Typography>
                          {t.is_express && <View style={styles.expressBadge}><Typography variant="caption" color={COLORS.white} style={{ fontSize: 9 }}>EXP</Typography></View>}
                        </TouchableOpacity>
                      ))}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Create Trip Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h2" style={{ fontWeight: '700' }}>New Trip</Typography>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}><Icon name="close" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
            </View>

            <Typography variant="caption" style={styles.mLabel}>Route</Typography>
            <View style={styles.mValue}><Typography variant="body">{selectedRoute?.name}</Typography></View>

            <Typography variant="caption" style={styles.mLabel}>Date</Typography>
            <View style={styles.mValue}><Typography variant="body">{createSlot?.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</Typography></View>

            <View style={styles.mRow}>
              <View style={styles.mHalf}>
                <Typography variant="caption" style={styles.mLabel}>Hour</Typography>
                <TextInput style={styles.mInput} value={newHour} onChangeText={setNewHour} keyboardType="numeric" maxLength={2} />
              </View>
              <View style={[styles.mHalf, { marginLeft: 12 }]}>
                <Typography variant="caption" style={styles.mLabel}>Minute</Typography>
                <TextInput style={styles.mInput} value={newMin} onChangeText={setNewMin} keyboardType="numeric" maxLength={2} />
              </View>
            </View>

            <Typography variant="caption" style={styles.mLabel}>Bus Plate</Typography>
            <TextInput style={styles.mInput} value={newBus} onChangeText={setNewBus} />

            <Typography variant="caption" style={styles.mLabel}>Total Seats</Typography>
            <TextInput style={styles.mInput} value={newSeats} onChangeText={setNewSeats} keyboardType="numeric" />

            <TouchableOpacity style={styles.expressToggle} onPress={() => setNewExpress(!newExpress)}>
              <View style={[styles.checkbox, newExpress && { backgroundColor: COLORS.brand, borderColor: COLORS.brand }]}>
                {newExpress && <Icon name="check" size={12} color={COLORS.white} />}
              </View>
              <Typography variant="body" style={{ marginLeft: 10 }}>Express trip</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
              <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>Create Trip</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  routeSelector: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border },
  routeDropdown: { marginHorizontal: 12, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 4 },
  routeOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  routeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  navBtn: { padding: 8 },
  weekLabel: { fontWeight: '700', fontSize: 13 },
  dayHeaderRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#C8D3DC', backgroundColor: COLORS.white },
  timeGutter: { width: 48, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#D1D9E0' },
  dayHeader: { width: 80, alignItems: 'center', paddingVertical: 6 },
  todayHeader: { backgroundColor: COLORS.brandLight, borderRadius: 8 },
  dayName: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  dayNum: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  hourRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D1D9E0', minHeight: 56 },
  timeLabel: { fontSize: 10, color: COLORS.textMuted },
  cell: { width: 80, borderLeftWidth: 1, borderLeftColor: '#D1D9E0', padding: 2, minHeight: 56, backgroundColor: COLORS.white },
  tripTile: { borderRadius: 6, padding: 4, marginBottom: 2, position: 'relative' },
  tileText: { fontSize: 10, lineHeight: 14 },
  expressBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, paddingHorizontal: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mLabel: { fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4, marginTop: 12, textTransform: 'uppercase', fontSize: 11 },
  mValue: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  mInput: { backgroundColor: COLORS.background, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.text },
  mRow: { flexDirection: 'row' },
  mHalf: { flex: 1 },
  expressToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  createBtn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
});
