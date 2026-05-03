import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { PrintTicketButton } from '../components/PrintTicketButton';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { MOCK_TICKETS } from '../mock/transportData';

export const PrintTicketDemoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Typography variant="h3" style={styles.ticketTitle}>
            {ticket.from_location} → {ticket.to_location}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {ticket.departure_date} • {ticket.departure_time}
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
          <Icon name="user" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>
            {ticket.passenger_name}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>
            {ticket.passenger_phone}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Icon name="users" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>
            {ticket.seats_count} seat{ticket.seats_count > 1 ? 's' : ''}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Icon name="credit-card" size={16} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.detailText}>
            RWF {ticket.total_amount.toLocaleString()} • {ticket.payment_method}
          </Typography>
        </View>
        {ticket.bus_plate && (
          <View style={styles.detailRow}>
            <Icon name="truck" size={16} color={COLORS.textSecondary} />
            <Typography variant="body" style={styles.detailText}>
              {ticket.bus_plate}
            </Typography>
          </View>
        )}
        {ticket.driver_name && (
          <View style={styles.detailRow}>
            <Icon name="user-check" size={16} color={COLORS.textSecondary} />
            <Typography variant="body" style={styles.detailText}>
              Driver: {ticket.driver_name}
            </Typography>
          </View>
        )}
        {ticket.issued_by && (
          <View style={styles.detailRow}>
            <Icon name="shield-check" size={16} color={COLORS.textSecondary} />
            <Typography variant="body" style={styles.detailText}>
              Issued by: {ticket.issued_by}
            </Typography>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.ticketActions}>
        <PrintTicketButton 
          ticketId={ticket.id} 
          variant="primary" 
          size="medium"
        />
        <TouchableOpacity style={styles.secondaryButton}>
          <Icon name="share" size={16} color={COLORS.brand} />
          <Typography variant="body" color={COLORS.brand} style={styles.secondaryButtonText}>
            Share
          </Typography>
        </TouchableOpacity>
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
        showBack={true} 
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Typography variant="h2" style={styles.headerTitle}>
            Print Ticket Feature
          </Typography>
          <Typography variant="body" color={COLORS.textSecondary} style={styles.headerDescription}>
            Tap "Print Ticket" on any ticket below to see the print size selector and mock printing functionality.
          </Typography>
        </View>

        <View style={styles.featuresSection}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Features Included:
          </Typography>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Typography variant="body" style={styles.featureText}>
                Print size selector (58mm, 80mm, A4)
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Typography variant="body" style={styles.featureText}>
                Remember size preference
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Typography variant="body" style={styles.featureText}>
                Mock HTML generation with proper styling
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Typography variant="body" style={styles.featureText}>
                QR code and company logo placeholders
              </Typography>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Typography variant="body" style={styles.featureText}>
                Responsive design for all paper sizes
              </Typography>
            </View>
          </View>
        </View>

        <Typography variant="h3" style={styles.sectionTitle}>
          Sample Tickets:
        </Typography>

        {MOCK_TICKETS.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerDescription: {
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  ticketDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.brand,
    gap: 8,
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
});