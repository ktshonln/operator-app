import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { PrintTicketButton } from '../components/PrintTicketButton';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { ApiTicket, getTickets } from '../api';

export const PrintTicketDemoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const data = await getTickets({ limit: 10 });
        setTickets(data);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const TicketCard = ({ ticket }: { ticket: ApiTicket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Typography variant="h3" style={styles.ticketTitle}>
            {ticket.boarding_stop.name} → {ticket.alighting_stop.name}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {ticket.trip?.departure_at
              ? new Date(ticket.trip.departure_at).toLocaleString('en-GB')
              : new Date(ticket.booked_at).toLocaleString('en-GB')}
          </Typography>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
          <Typography variant="caption" color={getStatusColor(ticket.status)} style={styles.statusText}>
            {ticket.status.toUpperCase()}
          </Typography>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.ticketDetails}>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>{ticket.passenger_name}</Typography>
        </View>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>{ticket.phone}</Typography>
        </View>
        <View style={styles.detailRow}>
          <Icon name="users" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>
            {ticket.seats_count} seat{ticket.seats_count > 1 ? 's' : ''}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Icon name="card" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>
            RWF {Number(ticket.amount).toLocaleString()} • {ticket.payment_method}
          </Typography>
        </View>
        {ticket.trip?.bus?.plate && (
          <View style={styles.detailRow}>
            <Icon name="bus" size={16} color={COLORS.textSecondary} />
            <Typography variant="body" style={styles.detailText}>{ticket.trip.bus.plate}</Typography>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.ticketActions}>
        <PrintTicketButton ticketId={ticket.id} variant="primary" size="medium" />
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'completed': return '#6B7280';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Print Ticket Demo"
        showBack
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Typography variant="h2" style={styles.headerTitle}>Print Ticket</Typography>
          <Typography variant="body" color={COLORS.textSecondary} style={styles.headerDescription}>
            Tap Print Ticket on any real ticket below. Uses GET /tickets and GET /tickets/{'{id}'}/print from the API.
          </Typography>
        </View>

        <Typography variant="h3" style={styles.sectionTitle}>Recent Tickets</Typography>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.brand} />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.loadingBox}>
            <Typography variant="body" color={COLORS.textSecondary}>No tickets available to print.</Typography>
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('CreateTicket')}>
              <Typography variant="body" color={COLORS.brand} style={{ fontWeight: '600' }}>Issue a ticket</Typography>
            </TouchableOpacity>
          </View>
        ) : (
          tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  headerSection: {
    marginBottom: 24, padding: 20, backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontWeight: 'bold', marginBottom: 8 },
  headerDescription: { lineHeight: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 16 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  linkBtn: { marginTop: 8 },
  ticketCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontWeight: 'bold', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  ticketDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { flex: 1 },
  ticketActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
