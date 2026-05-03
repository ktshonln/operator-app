import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { PopupMenu } from '../components/PopupMenu';
import { PrintTicketButton } from '../components/PrintTicketButton';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useMainMenu } from '../hooks/useMainMenu';
import { MOCK_TICKETS } from '../mock/transportData';

const TICKETS = [
  { id: '1', route: 'Kgl - Msz', time: '08:30 AM', price: '2,500', statusKey: 'ticketing.statusBooked', ticketId: 'ticket-1' },
  { id: '2', route: 'Kgl - Rbv', time: '10:00 AM', price: '3,500', statusKey: 'ticketing.statusTransit', ticketId: 'ticket-2' },
  { id: '3', route: 'Kgl - Hye', time: '11:15 AM', price: '3,000', statusKey: 'ticketing.statusDone', ticketId: 'ticket-3' },
];

export const TicketingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { getMenuItems } = useMainMenu();
  const [search, setSearch] = useState('');
  
  const filteredTickets = TICKETS.filter(ticket =>
    ticket.route.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: typeof TICKETS[0] }) => {
    const mockTicket = MOCK_TICKETS.find(t => t.id === item.ticketId);
    
    return (
      <View style={styles.ticketCard}>
        <View style={styles.row}>
          <Typography variant="body" style={styles.routeText}>{item.route}</Typography>
          <View style={styles.statusDot} />
          <Typography variant="caption">{t(item.statusKey as any)}</Typography>
        </View>
        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            <Typography variant="caption">{item.time}</Typography>
            <Typography variant="body" style={styles.priceText}>RWF {item.price}</Typography>
          </View>
          <View style={styles.rightFooter}>
            {mockTicket && (
              <PrintTicketButton 
                ticketId={item.ticketId} 
                variant="secondary" 
                size="small"
                style={styles.printButton}
              />
            )}
          </View>
        </View>
        {mockTicket && (
          <View style={styles.ticketDetails}>
            <Typography variant="caption" color={COLORS.textSecondary}>
              Passenger: {mockTicket.passenger_name} • {mockTicket.seats_count} seat{mockTicket.seats_count > 1 ? 's' : ''}
            </Typography>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title={t('ticketing.title')} 
        onSearch={setSearch}
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => {
                // TODO: Implement search functionality
                console.log('Search pressed');
              }}
            >
              <Icon name="search" size={20} color={COLORS.brand} />
            </TouchableOpacity>
            <PopupMenu items={getMenuItems()}>
              <View style={styles.menuButton}>
                <Icon name="more" size={20} color={COLORS.brand} />
              </View>
            </PopupMenu>
          </View>
        }
      />
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
  printButton: {
    // Additional styling if needed
  },
  ticketDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
