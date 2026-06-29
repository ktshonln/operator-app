import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { PrintTicketButton } from '../components/PrintTicketButton';
import { COLORS } from '../theme/colors';
import { ApiTicket, getTicketById, cancelTicket, deleteTicket } from '../api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#EFF6FF', text: '#3B82F6' },
  pending: { bg: '#FFFBEB', text: '#F59E0B' },
  active: { bg: '#FFFBEB', text: '#F59E0B' },
  completed: { bg: '#ECFDF5', text: '#10B981' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
};

export const TicketDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticketId: string = route.params?.ticketId ?? route.params?.ticket?.id;

  const [ticket, setTicket] = useState<ApiTicket | null>(route.params?.ticket ?? null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const data = await getTicketById(ticketId);
        setTicket(data);
      } catch (error: any) {
        Alert.alert(t('common.error'), error.message || t('ticketing.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleCancel = () => {
    Alert.alert(t('ticketing.cancelTitle'), t('ticketing.cancelConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('ticketing.cancelAction'),
        style: 'destructive',
        onPress: async () => {
          try {
            setActing(true);
            const updated = await cancelTicket(ticketId);
            setTicket(prev => ({ ...prev, ...updated, id: updated.id || ticketId }));
            Alert.alert(t('ticketing.cancelled'), t('ticketing.cancelledMessage'));
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('ticketing.cancelFailed'));
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t('ticketing.deleteTitle'), t('ticketing.deleteConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setActing(true);
            await deleteTicket(ticketId);
            Alert.alert(t('ticketing.deleted'), t('ticketing.deletedMessage'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('ticketing.deleteFailed'));
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  if (loading || !ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('ticketing.ticket')} showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.brand} /></View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.pending;
  const departure = ticket.trip?.departure_at ? new Date(ticket.trip.departure_at) : null;
  const canCancel = ticket.status !== 'cancelled' && ticket.status !== 'completed';
  const displayId = ticket.ticket_number ?? (ticket.id ? ticket.id.slice(0, 8) : ticketId?.slice(0, 8) ?? '—');
  const boardingName = ticket.boarding_stop?.name ?? '—';
  const alightingName = ticket.alighting_stop?.name ?? '—';
  const routeLabel = ticket.trip?.route?.name ?? `${boardingName} → ${alightingName}`;
  const printId = ticket.id || ticketId;

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('ticketing.detailTitle')} showBack onBack={() => navigation.goBack()} rightIcon="trash" onRightPress={handleDelete} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Typography variant="caption" style={{ color: sc.text, fontWeight: '700' }}>
            {(ticket.status ?? 'pending').toUpperCase()}
          </Typography>
        </View>

        <View style={styles.card}>
          <Row label={t('ticketing.ticketNumber')} value={displayId} />
          <Row label={t('ticketing.passenger')} value={ticket.passenger_name || '—'} />
          <Row label={t('ticketing.phone')} value={ticket.phone || '—'} />
          <Row label={t('ticketing.route')} value={routeLabel} />
          {departure && <Row label={t('ticketing.departure')} value={departure.toLocaleString('en-GB')} />}
          <Row label={t('ticketing.from')} value={boardingName} />
          <Row label={t('ticketing.to')} value={alightingName} />
          <Row label={t('common.seats')} value={String(ticket.seats_count ?? 1)} />
          <Row label={t('ticketing.amount')} value={`${ticket.currency ?? 'RWF'} ${Number(ticket.amount ?? 0).toLocaleString()}`} />
          <Row label={t('ticketing.payment')} value={ticket.payment_method || '—'} />
          {ticket.trip?.bus?.plate && <Row label={t('ticketing.bus')} value={ticket.trip.bus.plate} />}
          {ticket.org?.name && <Row label={t('common.organization')} value={ticket.org.name} />}
          <Row label={t('ticketing.booked')} value={new Date(ticket.booked_at ?? Date.now()).toLocaleString('en-GB')} />
        </View>

        {printId ? (
          <View style={styles.printRow}>
            <PrintTicketButton ticketId={printId} variant="primary" size="medium" />
          </View>
        ) : null}

        {canCancel && (
          <TouchableOpacity style={[styles.cancelBtn, acting && { opacity: 0.7 }]} onPress={handleCancel} disabled={acting}>
            <Typography variant="body" style={{ color: '#EF4444', fontWeight: '700' }}>{t('ticketing.cancelTicket')}</Typography>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Typography variant="caption" color={COLORS.textSecondary}>{label}</Typography>
    <Typography variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Typography>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  printRow: { alignItems: 'center', marginBottom: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
});
