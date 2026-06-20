import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { PopupMenu } from '../components/PopupMenu';
import { PrintTicketButton } from '../components/PrintTicketButton';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useMainMenu } from '../hooks/useMainMenu';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';
import { ApiTicket, getTickets, getAllOrganizations } from '../api';

interface OrgOption {
  id: string;
  name: string;
}

const STATUS_META: Record<string, { color: string; labelKey?: string; fallback: string }> = {
  confirmed: { color: COLORS.brand, labelKey: 'ticketing.statusBooked', fallback: 'Booked' },
  pending: { color: '#F59E0B', fallback: 'Pending' },
  active: { color: '#F59E0B', labelKey: 'ticketing.statusTransit', fallback: 'In transit' },
  completed: { color: '#10B981', labelKey: 'ticketing.statusDone', fallback: 'Done' },
  cancelled: { color: '#EF4444', fallback: 'Cancelled' },
};

const getRouteLabel = (ticket: ApiTicket) => {
  if (ticket.trip?.route?.name) return ticket.trip.route.name;
  return `${ticket.boarding_stop.name} → ${ticket.alighting_stop.name}`;
};

const getDepartureTime = (ticket: ApiTicket) => {
  const dateStr = ticket.trip?.departure_at ?? ticket.booked_at;
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TicketingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { getMenuItems } = useMainMenu();
  const { isPlatformAdmin, getUserOrgScope, loading: permissionsLoading } = usePermissions();
  const { organization } = useOrganization();

  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const isFirstLoad = useRef(true);
  const prevOrgIdRef = useRef<string | undefined>();

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

  const fetchTickets = useCallback(async (showFullLoader = true) => {
    try {
      if (showFullLoader) setLoading(true);
      const data = await getTickets({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      });
      setTickets(data);
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      const errorMessage = error.message || 'Unable to load tickets';
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        'Error Loading Tickets',
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
      );
      setTickets([]);
    } finally {
      if (showFullLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveOrgId, search]);

  React.useEffect(() => {
    if (permissionsLoading || isFirstLoad.current) return;
    const timer = setTimeout(() => fetchTickets(false), 300);
    return () => clearTimeout(timer);
  }, [search, permissionsLoading, fetchTickets]);

  useFocusEffect(
    useCallback(() => {
      if (permissionsLoading) return;
      if (isPlatformAdmin && organizations.length === 0) {
        fetchOrganizations();
      }
      fetchTickets(isFirstLoad.current);
      isFirstLoad.current = false;
    }, [permissionsLoading, isPlatformAdmin, organizations.length, fetchOrganizations, fetchTickets]),
  );

  React.useEffect(() => {
    if (permissionsLoading || isFirstLoad.current) return;
    if (prevOrgIdRef.current === effectiveOrgId) return;
    prevOrgIdRef.current = effectiveOrgId;
    fetchTickets(false);
  }, [effectiveOrgId, permissionsLoading, fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets(false);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ticket.passenger_name.toLowerCase().includes(q) ||
      ticket.phone.toLowerCase().includes(q) ||
      getRouteLabel(ticket).toLowerCase().includes(q) ||
      (ticket.ticket_number ?? '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }: { item: ApiTicket }) => {
    const statusMeta = STATUS_META[item.status] ?? { color: COLORS.textSecondary, fallback: item.status };
    const statusLabel = statusMeta.labelKey ? t(statusMeta.labelKey as any) : statusMeta.fallback;

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticket: item })}
        activeOpacity={0.85}
      >
        <View style={styles.row}>
          <Typography variant="body" style={styles.routeText}>{getRouteLabel(item)}</Typography>
          <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
          <Typography variant="caption">{statusLabel}</Typography>
        </View>
        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            <Typography variant="caption">{getDepartureTime(item)}</Typography>
            <Typography variant="body" style={styles.priceText}>
              RWF {Number(item.amount).toLocaleString()}
            </Typography>
          </View>
          <View style={styles.rightFooter}>
            <PrintTicketButton
              ticketId={item.id}
              variant="secondary"
              size="small"
              style={styles.printButton}
            />
          </View>
        </View>
        <View style={styles.ticketDetails}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {item.passenger_name} • {item.phone}
          </Typography>
          <Typography variant="caption" color={COLORS.textMuted} style={{ marginTop: 2 }}>
            {item.boarding_stop.name} → {item.alighting_stop.name}
            {' • '}{item.seats_count} seat{item.seats_count > 1 ? 's' : ''}
            {item.org?.name ? ` • ${item.org.name}` : ''}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  if (permissionsLoading || loading) {
    return (
      <View style={styles.container}>
        <Header
          title={t('ticketing.title')}
          onSearch={setSearch}
          rightElement={
            <View style={styles.headerActions}>
              <PopupMenu items={getMenuItems()}>
                <View style={styles.menuButton}>
                  <Icon name="more" size={20} color={COLORS.brand} />
                </View>
              </PopupMenu>
            </View>
          }
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>
            Loading tickets...
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={t('ticketing.title')}
        onSearch={setSearch}
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('CreateTicket', { orgId: effectiveOrgId })}
            >
              <Icon name="add" size={20} color={COLORS.brand} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => fetchTickets(false)}>
              <Icon name="refresh-cw" size={18} color={COLORS.brand} />
            </TouchableOpacity>
            <PopupMenu items={getMenuItems()}>
              <View style={styles.menuButton}>
                <Icon name="more" size={20} color={COLORS.brand} />
              </View>
            </PopupMenu>
          </View>
        }
      />

      {isPlatformAdmin && (
        <View style={styles.filterSection}>
          <Typography variant="caption" style={styles.filterLabel}>ORGANIZATION</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedOrg && styles.filterChipActive]}
              onPress={() => setSelectedOrg(null)}
            >
              <Typography
                variant="caption"
                style={{ fontWeight: '700', color: !selectedOrg ? COLORS.white : COLORS.textSecondary }}
              >
                All
              </Typography>
            </TouchableOpacity>
            {organizations.map(org => (
              <TouchableOpacity
                key={org.id}
                style={[styles.filterChip, selectedOrg?.id === org.id && styles.filterChipActive]}
                onPress={() => setSelectedOrg(org)}
              >
                <Typography
                  variant="caption"
                  style={{
                    fontWeight: '700',
                    color: selectedOrg?.id === org.id ? COLORS.white : COLORS.textSecondary,
                  }}
                >
                  {org.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredTickets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="ticket" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>
              No tickets found
            </Typography>
            {isPlatformAdmin && !selectedOrg && (
              <Typography variant="caption" color={COLORS.textMuted} style={{ marginTop: 6, textAlign: 'center' }}>
                Try filtering by organization or check back after bookings are made.
              </Typography>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  filterLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  filterRow: {
    gap: 8,
    paddingRight: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  listContent: {
    padding: 12,
    paddingBottom: 120,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeText: {
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftFooter: {
    flex: 1,
  },
  rightFooter: {
    marginLeft: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.brand,
  },
  printButton: {},
  ticketDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  menuButton: {
    backgroundColor: COLORS.brand + '15',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    backgroundColor: COLORS.brand + '15',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
