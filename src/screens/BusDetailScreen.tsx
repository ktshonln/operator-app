import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Bus } from '../mock/transportData';
import { getBusById, updateBus, getBusTrips, BusTrip } from '../api';

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  active:      { bg: '#ECFDF5', text: '#10B981', label: 'ACTIVE' },
  maintenance: { bg: '#FFFBEB', text: '#F59E0B', label: 'MAINTENANCE' },
  inactive:    { bg: '#F5F5F5', text: '#9E9E9E', label: 'INACTIVE' },
};

const TYPE_ICON: Record<string, string> = { Coach: '🚌', Mini: '🚐', Sprinter: '🚎' };

export const BusDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const routeParam = useRoute<any>();
  const busId: string = routeParam.params?.bus?.id;

  const [busData, setBusData] = useState<Bus | null>(routeParam.params?.bus ?? null);
  const [status, setStatus] = useState<Bus['status']>(routeParam.params?.bus?.status ?? 'active');
  const [editing, setEditing] = useState(false);
  const [plate, setPlate] = useState(routeParam.params?.bus?.plate ?? '');
  const [capacity, setCapacity] = useState(String(routeParam.params?.bus?.capacity ?? ''));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignedTrips, setAssignedTrips] = useState<BusTrip[]>([]);

  useEffect(() => {
    if (!busId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [bus, trips] = await Promise.all([
          getBusById(busId),
          getBusTrips(busId, 5),
        ]);
        setBusData(bus);
        setStatus(bus.status);
        setPlate(bus.plate);
        setCapacity(String(bus.capacity));
        setAssignedTrips(trips);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load bus details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [busId]);

  const handleSave = async () => {
    if (!plate.trim()) {
      Alert.alert('Validation', 'Plate is required.');
      return;
    }
    const capacityNum = parseInt(capacity, 10);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Validation', 'Enter a valid capacity.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateBus(busId, {
        plate: plate.trim().toUpperCase(),
        capacity: capacityNum,
      });
      setBusData(updated);
      setPlate(updated.plate);
      setCapacity(String(updated.capacity));
      setEditing(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update bus';
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        'Error',
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (next: 'active' | 'inactive') => {
    Alert.alert('Update Status', `Set bus to "${next}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            const updated = await updateBus(busId, { status: next });
            setBusData(updated);
            setStatus(updated.status);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update status');
          }
        },
      },
    ]);
  };

  if (loading || !busData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Bus" showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const sm = STATUS_META[status] ?? STATUS_META.inactive;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={busData.plate}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon={editing ? 'check' : 'edit'}
        onRightPress={() => (editing ? handleSave() : setEditing(true))}
      />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.hero}>
          <Typography style={{ fontSize: 48 }}>{TYPE_ICON[busData.type] || '🚌'}</Typography>
          <View style={[styles.statusBadge, { backgroundColor: sm.bg }]}>
            <View style={[styles.dot, { backgroundColor: sm.text }]} />
            <Typography variant="caption" style={{ color: sm.text, fontWeight: '700' }}>{sm.label}</Typography>
          </View>
        </View>

        <View style={styles.statusActions}>
          {(['active', 'inactive'] as const).filter(s => s !== status).map(s => (
            <TouchableOpacity key={s} style={[styles.statusBtn, { backgroundColor: STATUS_META[s].bg }]} onPress={() => handleStatusChange(s)}>
              <Typography variant="caption" style={{ color: STATUS_META[s].text, fontWeight: '600' }}>
                Set {STATUS_META[s].label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Typography variant="body" style={styles.sectionTitle}>Bus Details</Typography>

          <FieldRow label="Plate" editing={editing} value={plate} onChangeText={setPlate} />
          <FieldRow label="Type" value={busData.type} />
          <FieldRow label="Capacity" editing={editing} value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
          {busData.device_id ? <FieldRow label="Device ID" value={busData.device_id} /> : null}
          <FieldRow label="Organisation" value={busData.org?.name ?? 'N/A'} />
          <FieldRow label="Created" value={new Date(busData.created_at).toLocaleDateString()} />
        </View>

        {busData.routes && busData.routes.length > 0 && (
          <View style={styles.card}>
            <Typography variant="body" style={styles.sectionTitle}>Assigned Routes</Typography>
            {busData.routes.map(route => (
              <Typography key={route.id} variant="body" style={{ paddingVertical: 6 }}>
                {route.name}
              </Typography>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Typography variant="body" style={styles.sectionTitle}>Assigned Driver</Typography>
          {busData.driver ? (
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Typography style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>
                  {busData.driver.first_name[0]}{busData.driver.last_name[0]}
                </Typography>
              </View>
              <View style={{ marginLeft: 14 }}>
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  {busData.driver.first_name} {busData.driver.last_name}
                </Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>Driver</Typography>
              </View>
            </View>
          ) : (
            <View style={styles.noDriver}>
              <Icon name="person" size={24} color={COLORS.textMuted} />
              <Typography variant="caption" color={COLORS.textMuted} style={{ marginTop: 6 }}>No driver assigned</Typography>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Typography variant="body" style={styles.sectionTitle}>Upcoming Trips ({assignedTrips.length})</Typography>
          {assignedTrips.length === 0 ? (
            <Typography variant="caption" color={COLORS.textMuted}>No upcoming trips assigned.</Typography>
          ) : (
            assignedTrips.map(t => {
              const dep = new Date(t.departure_at);
              const tripSm = { scheduled: '#3B82F6', in_progress: '#F59E0B', completed: '#10B981', cancelled: '#EF4444' }[t.status] ?? COLORS.textSecondary;
              return (
                <TouchableOpacity key={t.id} style={styles.tripRow} onPress={() => navigation.navigate('TripDetail', { trip: t })}>
                  <View style={[styles.tripDot, { backgroundColor: tripSm }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Typography variant="body" style={{ fontWeight: '600', fontSize: 13 }}>{t.route.name}</Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      {dep.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {dep.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{t.booked_seats}/{t.total_seats} seats
                    </Typography>
                  </View>
                  <Typography variant="caption" style={{ color: tripSm, fontWeight: '600' }}>
                    {t.status.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Icon name="chevron-right" size={16} color={COLORS.textMuted} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              );
            })
          )}
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

const FieldRow = ({ label, value, editing, onChangeText, keyboardType }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
    <Typography variant="caption" color={COLORS.textSecondary} style={{ width: 100 }}>{label}</Typography>
    {editing && onChangeText ? (
      <TextInput
        style={{ flex: 1, textAlign: 'right', fontSize: 14, color: COLORS.text, borderBottomWidth: 1, borderBottomColor: COLORS.brand, paddingVertical: 2 }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
      />
    ) : (
      <Typography variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Typography>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 24, backgroundColor: COLORS.white, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  sectionTitle: { fontWeight: '700', marginBottom: 10 },
  driverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  noDriver: { alignItems: 'center', paddingVertical: 16 },
  tripRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tripDot: { width: 10, height: 10, borderRadius: 5 },
  saveBtn: { backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
});
