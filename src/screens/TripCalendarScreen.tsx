import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Trip, Route, Bus } from '../mock/transportData';
import { getTrips, createTripSeries, getRoutes, getBuses, getAllOrganizations, getRouteById } from '../api';
import { getMyOrganization } from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';

interface OrgOption { id: string; name: string; }

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
  active: '#F59E0B',
  in_progress: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
};

function formatDateParam(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TripCalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isPlatformAdmin, getUserOrgScope, loading: permissionsLoading, user: permissionUser } = usePermissions();
  const { organization } = useOrganization();

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSlot, setCreateSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newHour, setNewHour] = useState('06');
  const [newMin, setNewMin] = useState('00');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showBusPicker, setShowBusPicker] = useState(false);
  const [newSeats, setNewSeats] = useState('30');
  const [newExpress, setNewExpress] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);

  const effectiveOrgId = isPlatformAdmin
    ? selectedOrg?.id
    : (getUserOrgScope ?? organization?.id ?? undefined);

  const fetchOrganizations = useCallback(async () => {
    try {
      const orgsData = await getAllOrganizations();
      const list = (Array.isArray(orgsData) ? orgsData : [])
        .filter((org: any) => org.id && org.name)
        .map((org: any) => ({ id: org.id, name: org.name }));
      setOrganizations(list);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, []);

  const fetchRoutesAndBuses = useCallback(async () => {
    try {
      const busParams = isPlatformAdmin && effectiveOrgId ? { org_id: effectiveOrgId } : undefined;
      const [routesData, busesData] = await Promise.all([getRoutes(), getBuses(busParams)]);
      const scopedRoutes = isPlatformAdmin && effectiveOrgId
        ? routesData.filter((r: Route) => !r.org?.id || r.org.id === effectiveOrgId)
        : routesData;
      setRoutes(scopedRoutes);
      setBuses(busesData);
    } catch (error) {
      console.error('Failed to fetch routes/buses:', error);
    }
  }, [effectiveOrgId, isPlatformAdmin]);

  useEffect(() => {
    if (!effectiveOrgId || !selectedRoute?.org?.id) return;
    if (selectedRoute.org.id !== effectiveOrgId) {
      setSelectedRoute(null);
    }
  }, [effectiveOrgId, selectedRoute]);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const fromDate = new Date(weekDates[0]);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(weekDates[6]);
      toDate.setHours(23, 59, 59, 999);

      const data = await getTrips({
        route_id: selectedRoute?.id,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        ...(isPlatformAdmin && effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      });
      setTrips(data);
    } catch (error: any) {
      console.error('Failed to fetch trips:', error);
      Alert.alert('Error', error.message || 'Failed to load trips');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [weekDates, selectedRoute?.id, effectiveOrgId, isPlatformAdmin]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (isPlatformAdmin) fetchOrganizations();
  }, [permissionsLoading, isPlatformAdmin, fetchOrganizations]);

  useEffect(() => {
    if (permissionsLoading) return;
    fetchRoutesAndBuses();
  }, [permissionsLoading, fetchRoutesAndBuses]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

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

  const handleCreate = async () => {
    if (!createSlot || !selectedRoute) return;

    const tripOrgId = isPlatformAdmin
      ? (effectiveOrgId ?? selectedRoute.org?.id)
      : undefined;

    if (isPlatformAdmin && !tripOrgId) {
      Alert.alert(
        'Select organization',
        'Platform admins must select an organization (or a route that belongs to one) before creating trips.',
      );
      return;
    }

    if (!selectedBus) {
      const seats = parseInt(newSeats, 10);
      if (!seats || seats <= 0) {
        Alert.alert('Validation', 'Select a bus or enter total seats for this trip.');
        return;
      }
    }

    const userOrgId = getUserOrgScope ?? permissionUser?.org_id ?? organization?.id;

    setCreating(true);
    try {
      if (!isPlatformAdmin && userOrgId) {
        try {
          const orgProfile = await getMyOrganization();
          if (orgProfile.id !== userOrgId) {
            console.warn('Trip create: org_id mismatch', { jwt: userOrgId, profile: orgProfile.id });
          }
          if (orgProfile.status && !['active', 'approved'].includes(orgProfile.status)) {
            Alert.alert(
              'Organization not active',
              `Your organization status is "${orgProfile.status}". Trips cannot be created until it is active.`,
            );
            return;
          }
        } catch (orgErr: any) {
          if (orgErr?.data?.error?.code === 'ORG_NOT_FOUND') {
            Alert.alert(
              'Organization not found',
              'Your account references an organization that could not be loaded. Contact Katisha support.',
            );
            return;
          }
          throw orgErr;
        }
      }

      const routeDetail = await getRouteById(selectedRoute.id);
      if (__DEV__) {
        console.log('Trip create route preflight:', {
          route_id: routeDetail.id,
          route_name: routeDetail.name,
          route_status: routeDetail.status,
          route_org_id: routeDetail.org?.id ?? null,
          user_org_id: userOrgId ?? null,
        });
      }
      if (!isPlatformAdmin && userOrgId && !routeDetail.org?.id) {
        Alert.alert(
          'Route not linked to organization',
          'This route has no organization assigned in trip-service. Recreate the route as your org admin, or ask Katisha support to link it to your org.',
        );
        return;
      }
      if (userOrgId && routeDetail.org?.id && routeDetail.org.id !== userOrgId) {
        Alert.alert(
          'Route mismatch',
          'This route belongs to a different organization. Select a route from your own org.',
        );
        return;
      }
      if (routeDetail.status !== 'active') {
        Alert.alert(
          'Route not active',
          'Activate this route and set all fares before creating trips.',
        );
        return;
      }

      const result = await createTripSeries(
        {
          route_id: selectedRoute.id,
          bus_id: selectedBus?.id,
          total_seats: selectedBus ? undefined : parseInt(newSeats, 10) || undefined,
          is_express: newExpress,
          departure_time: `${newHour.padStart(2, '0')}:${newMin.padStart(2, '0')}`,
          starts_on: formatDateParam(createSlot.date),
          repeat_daily: false,
        },
        {
          orgId: tripOrgId,
        },
      );

      if (result.trips.length > 0) {
        setTrips(prev => [...prev, ...result.trips]);
      } else {
        await fetchTrips();
      }

      setShowCreateModal(false);
      Alert.alert('Created', `${result.trips_created} trip(s) created.`);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create trip';
      const errorDetails = error.data?.error?.code || '';
      const orgHint = errorDetails === 'ORG_NOT_FOUND'
        ? `\n\nTrip-service could not resolve your organization${userOrgId ? ` (${userOrgId})` : ''}. Your org may exist in user-service but not yet be synced to trip-service — contact Katisha support.`
        : errorDetails === 'ROUTE_NOT_FOUND'
          ? '\n\nThe selected route was not found in your organization.'
          : errorDetails === 'TOTAL_SEATS_REQUIRED'
            ? '\n\nEnter total seats or assign a bus.'
            : '';
      const platformHint = isPlatformAdmin && errorDetails === 'ORG_REQUIRED'
        ? '\n\nTip: Select an organization chip above, then try again.'
        : '';
      Alert.alert(
        'Error',
        errorDetails
          ? `${errorMessage}\n\nError: ${errorDetails}${orgHint}${platformHint}`
          : `${errorMessage}${orgHint}${platformHint}`,
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Trip Calendar" 
        rightElement={<View />}
      />

      {isPlatformAdmin && (
        <View style={styles.orgSection}>
          <Typography variant="caption" style={styles.orgLabel}>ORGANIZATION</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orgRow}>
            {organizations.map(org => (
              <TouchableOpacity
                key={org.id}
                style={[styles.orgChip, selectedOrg?.id === org.id && styles.orgChipActive]}
                onPress={() => setSelectedOrg(org)}
              >
                <Typography
                  variant="caption"
                  style={{ fontWeight: '700', color: selectedOrg?.id === org.id ? COLORS.white : COLORS.textSecondary }}
                >
                  {org.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!selectedOrg && (
            <Typography variant="caption" color={COLORS.textMuted} style={{ marginTop: 6 }}>
              Select an organization to create trips.
            </Typography>
          )}
        </View>
      )}

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
          {routes.map(r => (
            <TouchableOpacity key={r.id} style={styles.routeOption} onPress={() => {
              setSelectedRoute(r);
              if (isPlatformAdmin && r.org?.id) {
                const match = organizations.find(o => o.id === r.org!.id);
                setSelectedOrg(match ?? { id: r.org.id, name: r.org.name });
              }
              setShowRoutePicker(false);
            }}>
              <View style={[styles.routeDot, { backgroundColor: STATUS_COLORS.scheduled }]} />
              <Typography variant="body">{r.name}</Typography>
            </TouchableOpacity>
          ))}
          {routes.length === 0 && (
            <View style={styles.routeOption}>
              <Typography variant="caption" color={COLORS.textMuted}>No routes available</Typography>
            </View>
          )}
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>Loading trips...</Typography>
        </View>
      ) : (
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
      )}

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

            <Typography variant="caption" style={styles.mLabel}>Bus</Typography>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowBusPicker(!showBusPicker)}>
              <Icon name="bus" size={18} color={selectedBus ? COLORS.brand : COLORS.textMuted} />
              <Typography variant="body" color={selectedBus ? COLORS.text : COLORS.textMuted} style={{ marginLeft: 10, flex: 1 }}>
                {selectedBus ? `${selectedBus.plate} (${selectedBus.type})` : 'Select a bus (optional)'}
              </Typography>
              {selectedBus && (
                <TouchableOpacity onPress={() => setSelectedBus(null)}>
                  <Icon name="close" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showBusPicker && (
              <View style={styles.busDropdown}>
                {buses.map(b => (
                  <TouchableOpacity key={b.id} style={styles.busOption} onPress={() => { setSelectedBus(b); setShowBusPicker(false); setNewSeats(String(b.capacity)); }}>
                    <Typography variant="body">{b.plate}</Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>{b.type} · {b.capacity} seats</Typography>
                  </TouchableOpacity>
                ))}
                {buses.length === 0 && (
                  <View style={styles.busOption}>
                    <Typography variant="caption" color={COLORS.textMuted}>No buses available</Typography>
                  </View>
                )}
              </View>
            )}

            {!selectedBus && (
              <>
                <Typography variant="caption" style={styles.mLabel}>Total Seats</Typography>
                <TextInput style={styles.mInput} value={newSeats} onChangeText={setNewSeats} keyboardType="numeric" />
              </>
            )}

            <TouchableOpacity style={styles.expressToggle} onPress={() => setNewExpress(!newExpress)}>
              <View style={[styles.checkbox, newExpress && { backgroundColor: COLORS.brand, borderColor: COLORS.brand }]}>
                {newExpress && <Icon name="check" size={12} color={COLORS.white} />}
              </View>
              <Typography variant="body" style={{ marginLeft: 10 }}>Express trip</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.createBtn, creating && { opacity: 0.7 }]} onPress={handleCreate} disabled={creating}>
              <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
                {creating ? 'Creating...' : 'Create Trip'}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orgSection: { marginHorizontal: 12, marginTop: 8, marginBottom: 4 },
  orgLabel: { fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, fontSize: 11 },
  orgRow: { gap: 8 },
  orgChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  orgChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  busDropdown: {
    backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, marginTop: 4, maxHeight: 160, overflow: 'hidden',
  },
  busOption: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
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
