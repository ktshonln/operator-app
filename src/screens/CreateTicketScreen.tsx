import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import {
  createTicket, getTrips, getRouteById, getPrices, getAllOrganizations,
} from '../api';
import { RouteStop, Trip } from '../mock/transportData';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Card', value: 'card' },
] as const;

interface OrgOption { id: string; name: string; }

export const CreateTicketScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const presetTripId: string | undefined = route.params?.tripId;
  const routeOrgId: string | undefined = route.params?.orgId;

  const { isPlatformAdmin, getUserOrgScope, loading: permissionsLoading } = usePermissions();
  const { organization } = useOrganization();

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [boardingStop, setBoardingStop] = useState<RouteStop | null>(null);
  const [alightingStop, setAlightingStop] = useState<RouteStop | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [phone, setPhone] = useState('');
  const [seatsCount, setSeatsCount] = useState('1');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]['value']>('cash');
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [showAlightPicker, setShowAlightPicker] = useState(false);

  const effectiveOrgId = isPlatformAdmin
    ? (routeOrgId ?? selectedOrg?.id)
    : (getUserOrgScope ?? organization?.id ?? undefined);

  const fetchOrganizations = useCallback(async () => {
    const orgsData = await getAllOrganizations();
    const list = (Array.isArray(orgsData) ? orgsData : [])
      .filter((org: any) => org.id && org.name)
      .map((org: any) => ({ id: org.id, name: org.name }));
    setOrganizations(list);
    if (routeOrgId) {
      const match = list.find((o: OrgOption) => o.id === routeOrgId);
      if (match) setSelectedOrg(match);
    }
  }, [routeOrgId]);

  const fetchTrips = useCallback(async () => {
    if (isPlatformAdmin && !effectiveOrgId) {
      setTrips([]);
      setLoadingTrips(false);
      return;
    }
    try {
      setLoadingTrips(true);
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + 14);
      const data = await getTrips({
        from: from.toISOString(),
        to: to.toISOString(),
        ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      });
      const bookable = data.filter(t => t.status === 'scheduled' || t.status === 'active');
      setTrips(bookable);
      if (presetTripId) {
        const preset = bookable.find(t => t.id === presetTripId);
        if (preset) setSelectedTrip(preset);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load trips');
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [effectiveOrgId, isPlatformAdmin, presetTripId]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (isPlatformAdmin) fetchOrganizations();
  }, [permissionsLoading, isPlatformAdmin, fetchOrganizations]);

  useEffect(() => {
    if (permissionsLoading) return;
    fetchTrips();
  }, [permissionsLoading, effectiveOrgId, fetchTrips]);

  useEffect(() => {
    if (!selectedTrip?.route?.id) {
      setStops([]);
      setBoardingStop(null);
      setAlightingStop(null);
      return;
    }

    const loadStops = async () => {
      try {
        setLoadingStops(true);
        const routeData = await getRouteById(selectedTrip.route.id);
        const routeStops: RouteStop[] = (routeData.stops ?? []).map((s: any) => ({
          id: s.id,
          location_id: s.location_id ?? s.location?.id,
          name: s.name ?? s.location?.name,
          order: s.order,
        }));
        setStops(routeStops);
        if (routeStops.length >= 2) {
          setBoardingStop(routeStops[0]);
          setAlightingStop(routeStops[routeStops.length - 1]);
        }
      } catch {
        setStops([]);
      } finally {
        setLoadingStops(false);
      }
    };

    loadStops();
  }, [selectedTrip?.route?.id]);

  useEffect(() => {
    if (!boardingStop || !alightingStop) return;
    if (boardingStop.order >= alightingStop.order) return;

    const loadPrice = async () => {
      try {
        const prices = await getPrices({
          boarding_stop: boardingStop.location_id,
          alighting_stop: alightingStop.location_id,
        });
        const match = prices.find(
          p =>
            p.boarding_stop.id === boardingStop.location_id &&
            p.alighting_stop.id === alightingStop.location_id,
        ) ?? prices[0];
        if (match) {
          const seats = parseInt(seatsCount, 10) || 1;
          setAmount(String(match.amount * seats));
        }
      } catch {
        // keep manual amount
      }
    };

    loadPrice();
  }, [boardingStop, alightingStop, seatsCount]);

  const handleCreate = async () => {
    if (isPlatformAdmin && !effectiveOrgId) {
      Alert.alert('Validation', 'Select an organization.');
      return;
    }
    if (!selectedTrip) {
      Alert.alert('Validation', 'Select a trip.');
      return;
    }
    if (!boardingStop || !alightingStop) {
      Alert.alert('Validation', 'Select boarding and alighting stops.');
      return;
    }
    if (boardingStop.order >= alightingStop.order) {
      Alert.alert('Validation', 'Alighting stop must be after boarding stop.');
      return;
    }
    if (!passengerName.trim()) {
      Alert.alert('Validation', 'Passenger name is required.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation', 'Phone number is required.');
      return;
    }
    const seats = parseInt(seatsCount, 10);
    const price = parseFloat(amount);
    if (!seats || seats <= 0) {
      Alert.alert('Validation', 'Enter a valid seat count.');
      return;
    }
    if (!price || price <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      await createTicket({
        trip_id: selectedTrip.id,
        passenger_name: passengerName.trim(),
        phone: phone.trim(),
        boarding_stop_id: boardingStop.location_id,
        alighting_stop_id: alightingStop.location_id,
        seats_count: seats,
        amount: price,
        payment_method: paymentMethod,
        ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      });

      Alert.alert('Success', 'Ticket issued successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create ticket';
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        'Error',
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
      );
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Issue Ticket" showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.brand} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Issue Ticket" showBack onBack={() => navigation.goBack()} rightElement={<View />} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {isPlatformAdmin && (
          <>
            <Label text="Organization" required />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {organizations.map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={[styles.chip, selectedOrg?.id === org.id && styles.chipActive]}
                  onPress={() => setSelectedOrg(org)}
                >
                  <Typography variant="caption" style={{ fontWeight: '700', color: selectedOrg?.id === org.id ? COLORS.white : COLORS.textSecondary }}>
                    {org.name}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Label text="Trip" required />
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTripPicker(!showTripPicker)}>
          <Icon name="map" size={18} color={selectedTrip ? COLORS.brand : COLORS.textMuted} />
          <Typography variant="body" color={selectedTrip ? COLORS.text : COLORS.textMuted} style={{ marginLeft: 10, flex: 1 }}>
            {selectedTrip
              ? `${selectedTrip.route.name} · ${new Date(selectedTrip.departure_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
              : loadingTrips ? 'Loading trips...' : 'Select trip'}
          </Typography>
          <Icon name={showTripPicker ? 'chevron-left' : 'chevron-right'} size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {showTripPicker && (
          <View style={styles.dropdown}>
            {loadingTrips ? (
              <View style={styles.dropdownEmpty}><ActivityIndicator size="small" color={COLORS.brand} /></View>
            ) : trips.length === 0 ? (
              <View style={styles.dropdownEmpty}>
                <Typography variant="caption" color={COLORS.textMuted}>No upcoming trips</Typography>
              </View>
            ) : (
              trips.map(trip => (
                <TouchableOpacity key={trip.id} style={styles.dropdownItem} onPress={() => { setSelectedTrip(trip); setShowTripPicker(false); }}>
                  <Typography variant="body" style={{ fontWeight: '600' }}>{trip.route.name}</Typography>
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    {new Date(trip.departure_at).toLocaleString('en-GB')} · {trip.remaining_seats} seats left
                  </Typography>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {selectedTrip && (
          <>
            <Label text="Boarding stop" required />
            <StopPicker
              stops={stops.filter(s => !alightingStop || s.order < alightingStop.order)}
              selected={boardingStop}
              open={showBoardPicker}
              loading={loadingStops}
              onToggle={() => setShowBoardPicker(!showBoardPicker)}
              onSelect={stop => { setBoardingStop(stop); setShowBoardPicker(false); }}
            />

            <Label text="Alighting stop" required />
            <StopPicker
              stops={stops.filter(s => !boardingStop || s.order > boardingStop.order)}
              selected={alightingStop}
              open={showAlightPicker}
              loading={loadingStops}
              onToggle={() => setShowAlightPicker(!showAlightPicker)}
              onSelect={stop => { setAlightingStop(stop); setShowAlightPicker(false); }}
            />
          </>
        )}

        <Label text="Passenger name" required />
        <TextInput style={styles.input} value={passengerName} onChangeText={setPassengerName} placeholder="Full name" placeholderTextColor={COLORS.textMuted} />

        <Label text="Phone" required />
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+250..." keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />

        <View style={styles.row}>
          <View style={styles.half}>
            <Label text="Seats" required />
            <TextInput style={styles.input} value={seatsCount} onChangeText={setSeatsCount} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
          </View>
          <View style={[styles.half, { marginLeft: 12 }]}>
            <Label text="Amount (RWF)" required />
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
          </View>
        </View>

        <Label text="Payment method" required />
        <View style={styles.chipRow}>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method.value}
              style={[styles.chip, paymentMethod === method.value && styles.chipActive]}
              onPress={() => setPaymentMethod(method.value)}
            >
              <Typography variant="caption" style={{ fontWeight: '700', color: paymentMethod === method.value ? COLORS.white : COLORS.textSecondary }}>
                {method.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleCreate} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Icon name="ticket" size={18} color={COLORS.white} />
              <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700', marginLeft: 10 }}>Issue Ticket</Typography>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const StopPicker = ({
  stops, selected, open, loading, onToggle, onSelect,
}: {
  stops: RouteStop[]; selected: RouteStop | null; open: boolean; loading: boolean;
  onToggle: () => void; onSelect: (stop: RouteStop) => void;
}) => (
  <>
    <TouchableOpacity style={styles.pickerBtn} onPress={onToggle}>
      <Icon name="map-pin" size={18} color={selected ? COLORS.brand : COLORS.textMuted} />
      <Typography variant="body" color={selected ? COLORS.text : COLORS.textMuted} style={{ marginLeft: 10, flex: 1 }}>
        {selected?.name ?? (loading ? 'Loading stops...' : 'Select stop')}
      </Typography>
      <Icon name={open ? 'chevron-left' : 'chevron-right'} size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
    {open && (
      <View style={styles.dropdown}>
        {stops.map(stop => (
          <TouchableOpacity key={stop.id} style={styles.dropdownItem} onPress={() => onSelect(stop)}>
            <Typography variant="body">{stop.name}</Typography>
            {selected?.id === stop.id && <Icon name="check" size={16} color={COLORS.brand} />}
          </TouchableOpacity>
        ))}
      </View>
    )}
  </>
);

const Label = ({ text, required }: { text: string; required?: boolean }) => (
  <Typography variant="caption" style={styles.label}>{text}{required ? ' *' : ''}</Typography>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8 },
  input: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13 },
  dropdown: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, maxHeight: 220, overflow: 'hidden' },
  dropdownEmpty: { padding: 16, alignItems: 'center' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  row: { flexDirection: 'row' },
  half: { flex: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, marginTop: 32 },
});
