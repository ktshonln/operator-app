import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { createBus, getDrivers, getPendingDrivers, getAllOrganizations } from '../api';
import type { DriverOption } from '../api/client';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';

const BUS_TYPES = ['Coach', 'Mini', 'Sprinter'] as const;

interface OrgOption {
  id: string;
  name: string;
}

export const CreateBusScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isPlatformAdmin, isOrgAdmin, getUserOrgScope, loading: permissionsLoading } = usePermissions();
  const { organization } = useOrganization();

  const [plate, setPlate] = useState('');
  const [type, setType] = useState<typeof BUS_TYPES[number]>('Coach');
  const [capacity, setCapacity] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<DriverOption[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverOption | null>(null);
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveOrgId = isPlatformAdmin ? selectedOrg?.id : (getUserOrgScope ?? organization?.id ?? null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      const orgsData = await getAllOrganizations();
      const list = (Array.isArray(orgsData) ? orgsData : [])
        .filter((org: any) => org.id && org.name)
        .map((org: any) => ({ id: org.id, name: org.name }));
      setOrganizations(list);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  const fetchDrivers = useCallback(async (orgId: string) => {
    try {
      setLoadingDrivers(true);
      setSelectedDriver(null);
      const [list, pending] = await Promise.all([
        getDrivers(orgId),
        getPendingDrivers(orgId),
      ]);
      setDrivers(list);
      setPendingDrivers(pending);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      setDrivers([]);
      setPendingDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  useEffect(() => {
    if (permissionsLoading) return;

    if (isPlatformAdmin) {
      fetchOrganizations();
      return;
    }

    if (organization) {
      setSelectedOrg({ id: organization.id, name: organization.name });
    } else if (getUserOrgScope) {
      setSelectedOrg({ id: getUserOrgScope, name: 'Your organization' });
    }
  }, [permissionsLoading, isPlatformAdmin, organization, getUserOrgScope, fetchOrganizations]);

  useEffect(() => {
    if (effectiveOrgId) {
      fetchDrivers(effectiveOrgId);
    } else {
      setDrivers([]);
      setPendingDrivers([]);
      setSelectedDriver(null);
    }
  }, [effectiveOrgId, fetchDrivers]);

  useFocusEffect(
    useCallback(() => {
      if (effectiveOrgId) fetchDrivers(effectiveOrgId);
    }, [effectiveOrgId, fetchDrivers]),
  );

  const submitBus = async (includeDriver: boolean) => {
    if (isPlatformAdmin && !selectedOrg) {
      Alert.alert('Validation', 'Please select an organization.');
      return;
    }
    if (!effectiveOrgId) {
      Alert.alert('Validation', 'Organization is required to create a bus.');
      return;
    }
    if (!plate.trim()) {
      Alert.alert('Validation', 'Plate number is required.');
      return;
    }
    if (!capacity || isNaN(parseInt(capacity, 10)) || parseInt(capacity, 10) <= 0) {
      Alert.alert('Validation', 'Enter a valid seat capacity.');
      return;
    }

    setLoading(true);
    try {
      await createBus(
        {
          plate: plate.trim().toUpperCase(),
          type,
          capacity: parseInt(capacity, 10),
          ...(deviceId.trim() ? { device_id: deviceId.trim() } : {}),
          ...(includeDriver && selectedDriver ? { driver_id: selectedDriver.id } : {}),
        },
        {
          orgId: effectiveOrgId ?? undefined,
          includeOrgIdInBody: isPlatformAdmin,
        },
      );

      Alert.alert('Success', `Bus "${plate.toUpperCase()}" created successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const errorCode = error.data?.error?.code ?? '';
      if (errorCode === 'DRIVER_NOT_FOUND' && includeDriver) {
        Alert.alert(
          'Driver not accepted',
          'The server rejected this driver (DRIVER_NOT_FOUND). The user should be staff with role slug driver. If they already are, create the bus without a driver and contact Katisha support.',
          [
            {
              text: 'Create without driver',
              onPress: () => {
                setSelectedDriver(null);
                void submitBus(false);
              },
            },
            { text: 'Invite driver', onPress: () => navigation.navigate('UserForm', { roleSlug: 'driver' }) },
            { text: 'OK', style: 'cancel' },
          ],
        );
        return;
      }

      if (errorCode === 'PLATE_ALREADY_EXISTS') {
        Alert.alert('Plate already exists', 'This plate number is already registered. Use a different plate.');
        return;
      }
      if (errorCode === 'DEVICE_ALREADY_EXISTS') {
        Alert.alert('Device already in use', 'This tracker/device id is already assigned to another bus.');
        return;
      }
      if (errorCode === 'INTERNAL_SERVER_ERROR') {
        Alert.alert(
          'Server error',
          isOrgAdmin
            ? 'Katisha returned a server error (500). As org admin you already have full org access — this is a backend issue, not missing permissions. Try plate format like RAA 001 A without a driver, or contact Katisha support with the createBus payload from logs.'
            : 'Katisha returned a server error (500). Required: plate, type (Coach/Mini/Sprinter), capacity. Try plate format like RAA 001 A, or contact Katisha support.',
        );
        return;
      }
      if (errorCode === 'FORBIDDEN' || error.status === 403) {
        Alert.alert(
          'Permission denied',
          isOrgAdmin
            ? 'Unexpected — org admins have *:*:org (full org access including bus:create). Contact Katisha support if this persists.'
            : 'Your role needs bus:create:org permission. Ask an org admin to add Bus Create in Role Management.',
        );
        return;
      }

      const errorMessage = error.message || 'Failed to create bus';
      Alert.alert(
        'Error',
        errorCode ? `${errorMessage}\n\nError: ${errorCode}` : errorMessage,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => submitBus(!!selectedDriver);

  const handleCreateWithoutDriver = () => {
    setSelectedDriver(null);
    void submitBus(false);
  };

  if (permissionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Add Bus" showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Add Bus"
        showBack
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Label text="Organization" required={isPlatformAdmin} />
        {isPlatformAdmin ? (
          <>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowOrgPicker(!showOrgPicker)}
            >
              <Icon name="business" size={18} color={selectedOrg ? COLORS.brand : COLORS.textMuted} />
              <Typography
                variant="body"
                color={selectedOrg ? COLORS.text : COLORS.textMuted}
                style={{ marginLeft: 10, flex: 1 }}
              >
                {selectedOrg ? selectedOrg.name : 'Select organization'}
              </Typography>
              <Icon name={showOrgPicker ? 'chevron-left' : 'chevron-right'} size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showOrgPicker && (
              <View style={styles.dropdown}>
                {loadingOrgs ? (
                  <View style={styles.dropdownEmpty}>
                    <ActivityIndicator size="small" color={COLORS.brand} />
                  </View>
                ) : organizations.length === 0 ? (
                  <View style={styles.dropdownEmpty}>
                    <Typography variant="caption" color={COLORS.textMuted}>No organizations found</Typography>
                  </View>
                ) : (
                  organizations.map(org => (
                    <TouchableOpacity
                      key={org.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedOrg(org);
                        setShowOrgPicker(false);
                      }}
                    >
                      <Icon name="business" size={16} color={COLORS.brand} />
                      <Typography variant="body" style={{ marginLeft: 10, flex: 1 }}>{org.name}</Typography>
                      {selectedOrg?.id === org.id && (
                        <Icon name="check" size={16} color={COLORS.brand} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.orgReadOnly}>
            <Icon name="business" size={18} color={COLORS.brand} />
            <Typography variant="body" style={{ marginLeft: 10, fontWeight: '600', flex: 1 }}>
              {selectedOrg?.name ?? organization?.name ?? 'Your organization'}
            </Typography>
            {isOrgAdmin && (
              <View style={styles.orgAdminBadge}>
                <Typography variant="caption" style={{ color: COLORS.brand, fontWeight: '700', fontSize: 10 }}>
                  ORG ADMIN
                </Typography>
              </View>
            )}
          </View>
        )}

        <Label text="Plate Number" required />
        <Typography variant="caption" color={COLORS.textMuted} style={{ marginBottom: 6 }}>
          Required. Example: RAA 001 A
        </Typography>
        <TextInput
          style={styles.input}
          placeholder="e.g. RAA 001 A"
          placeholderTextColor={COLORS.textMuted}
          value={plate}
          onChangeText={t => setPlate(t.toUpperCase())}
          autoCapitalize="characters"
        />

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

        <Label text="Seat Capacity" required />
        <TextInput
          style={styles.input}
          placeholder={type === 'Mini' ? '14' : type === 'Sprinter' ? '20' : '30'}
          placeholderTextColor={COLORS.textMuted}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />

        <Label text="GPS Device ID" />
        <TextInput
          style={styles.input}
          placeholder="Optional tracker ID"
          placeholderTextColor={COLORS.textMuted}
          value={deviceId}
          onChangeText={setDeviceId}
          autoCapitalize="none"
        />

        <Label text="Assign Driver" />
        <Typography variant="caption" color={COLORS.textMuted} style={{ marginBottom: 8 }}>
          Staff users with role slug driver appear here. user_type is only passenger or staff — drivers are staff, not a separate user_type.
        </Typography>
        <TouchableOpacity
          style={[styles.pickerBtn, !effectiveOrgId && styles.pickerDisabled]}
          onPress={() => effectiveOrgId && setShowDriverPicker(!showDriverPicker)}
          disabled={!effectiveOrgId}
        >
          <Icon name="person" size={18} color={selectedDriver ? COLORS.brand : COLORS.textMuted} />
          <Typography
            variant="body"
            color={selectedDriver ? COLORS.text : COLORS.textMuted}
            style={{ marginLeft: 10, flex: 1 }}
          >
            {!effectiveOrgId
              ? 'Select an organization first'
              : selectedDriver
                ? selectedDriver.name
                : 'Select a driver (optional)'}
          </Typography>
          {selectedDriver && (
            <TouchableOpacity onPress={() => setSelectedDriver(null)}>
              <Icon name="close" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          <Icon name={showDriverPicker ? 'chevron-left' : 'chevron-right'} size={18} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {showDriverPicker && effectiveOrgId && (
          <View style={styles.dropdown}>
            {loadingDrivers ? (
              <View style={styles.dropdownEmpty}>
                <ActivityIndicator size="small" color={COLORS.brand} />
              </View>
            ) : drivers.length === 0 && pendingDrivers.length === 0 ? (
              <View style={styles.dropdownEmpty}>
                <Typography variant="caption" color={COLORS.textMuted} style={{ textAlign: 'center' }}>
                  No bus-assignable drivers in this organization yet.
                </Typography>
                <TouchableOpacity
                  style={styles.inviteLink}
                  onPress={() => navigation.navigate('UserForm', { roleSlug: 'driver' })}
                >
                  <Typography variant="caption" style={{ color: COLORS.brand, fontWeight: '700' }}>
                    Invite with role slug: driver
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              <>
              {drivers.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedDriver(d); setShowDriverPicker(false); }}
                >
                  <View style={styles.driverAvatar}>
                    <Typography style={{ color: COLORS.white, fontWeight: '700', fontSize: 11 }}>
                      {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Typography>
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Typography variant="body">{d.name}</Typography>
                    <Typography variant="caption" color={COLORS.success}>staff · role: driver</Typography>
                  </View>
                  {d.licenseNumber ? (
                    <Typography variant="caption" color={COLORS.textMuted}>{d.licenseNumber}</Typography>
                  ) : null}
                  {selectedDriver?.id === d.id && (
                    <Icon name="check" size={16} color={COLORS.brand} />
                  )}
                </TouchableOpacity>
              ))}
              {pendingDrivers.length > 0 && (
                <View style={styles.pendingSection}>
                  <Typography variant="caption" color={COLORS.textMuted} style={{ padding: 8 }}>
                    Has role slug driver but user_type is not staff:
                  </Typography>
                  {pendingDrivers.map(d => (
                    <View key={d.id} style={[styles.dropdownItem, styles.dropdownItemDisabled]}>
                      <View style={[styles.driverAvatar, { opacity: 0.5 }]}>
                        <Typography style={{ color: COLORS.white, fontWeight: '700', fontSize: 11 }}>
                          {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </Typography>
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Typography variant="body" color={COLORS.textMuted}>{d.name}</Typography>
                        <Typography variant="caption" color={COLORS.error}>
                          user_type: {d.userType ?? 'unknown'} · not staff
                        </Typography>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              </>
            )}
          </View>
        )}

        {plate.trim() && capacity ? (
          <View style={styles.preview}>
            <Icon name="bus" size={20} color={COLORS.brand} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '700' }}>{plate.toUpperCase()}</Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                {selectedOrg?.name ? `${selectedOrg.name} · ` : ''}{type} · {capacity} seats
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
            {loading ? 'Creating...' : selectedDriver ? 'Create Bus with Driver' : 'Create Bus'}
          </Typography>
        </TouchableOpacity>

        {selectedDriver && (
          <TouchableOpacity
            style={[styles.submitBtnSecondary, loading && { opacity: 0.7 }]}
            onPress={handleCreateWithoutDriver}
            disabled={loading}
          >
            <Typography variant="body" color={COLORS.brand} style={{ fontWeight: '700' }}>
              Create without driver
            </Typography>
          </TouchableOpacity>
        )}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text,
  },
  orgReadOnly: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  orgAdminBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: COLORS.brandLight, marginLeft: 8,
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
  pickerDisabled: { opacity: 0.6 },
  dropdown: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, marginTop: 4, overflow: 'hidden', maxHeight: 260,
  },
  dropdownEmpty: { padding: 16, alignItems: 'center', gap: 8 },
  inviteLink: { marginTop: 4, paddingVertical: 4 },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dropdownItemDisabled: { opacity: 0.85, backgroundColor: '#FAFAFA' },
  pendingSection: { borderTopWidth: 1, borderTopColor: COLORS.border },
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
  submitBtnSecondary: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14, marginTop: 10,
    borderWidth: 1.5, borderColor: COLORS.brand, backgroundColor: COLORS.white,
  },
});
