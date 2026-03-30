import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

const TICKETS = [
  { id: '1', route: 'Kgl - Msz', time: '08:30 AM', price: '2,500', statusKey: 'ticketing.statusBooked' },
  { id: '2', route: 'Kgl - Rbv', time: '10:00 AM', price: '3,500', statusKey: 'ticketing.statusTransit' },
  { id: '3', route: 'Kgl - Hye', time: '11:15 AM', price: '3,000', statusKey: 'ticketing.statusDone' },
];

export const TicketingScreen: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  
  const filteredTickets = TICKETS.filter(ticket =>
    ticket.route.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: typeof TICKETS[0] }) => (
    <View style={styles.ticketCard}>
      <View style={styles.row}>
        <Typography variant="body" style={styles.routeText}>{item.route}</Typography>
        <View style={styles.statusDot} />
        <Typography variant="caption">{t(item.statusKey as any)}</Typography>
      </View>
      <View style={styles.footer}>
        <Typography variant="caption">{item.time}</Typography>
        <Typography variant="body" style={styles.priceText}>RWF {item.price}</Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={t('ticketing.title')} onSearch={setSearch} />
      <FlatList
        data={filteredTickets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  listContent: {
    padding: 12,
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
    backgroundColor: COLORS.brand,
    marginRight: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.brand,
  },
});
