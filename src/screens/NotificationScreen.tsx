import React from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { Typography } from '../components/Typography';
import { COLORS } from '../theme/colors';
import { Header } from '../components/Header';

const NOTIFICATIONS = [
  { 
    id: '1', 
    titleKey: 'notifications.newBooking', 
    messageKey: 'notifications.newBookingMsg', 
    time: '2m', 
    icon: 'ticket',
    type: 'booking',
    isUnread: true
  },
  { 
    id: '2', 
    titleKey: 'notifications.vehicleAlert', 
    messageKey: 'notifications.vehicleAlertMsg', 
    time: '15m', 
    icon: 'bus',
    type: 'alert',
    isUnread: true
  },
  { 
    id: '3', 
    titleKey: 'notifications.paymentConfirmed', 
    messageKey: 'notifications.paymentConfirmedMsg', 
    time: '1h', 
    icon: 'dollar-sign',
    type: 'payment',
    isUnread: false
  },
  { 
    id: '4', 
    titleKey: 'notifications.systemUpdate', 
    messageKey: 'notifications.systemUpdateMsg', 
    time: '3h', 
    icon: 'refresh-cw',
    type: 'system',
    isUnread: false
  },
];

export const NotificationScreen = ({ navigation }: any) => {
  const { t } = useTranslation();

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking': return '#3182CE';
      case 'alert': return '#E53E3E';
      case 'payment': return '#38A169';
      case 'system': return '#805AD5';
      default: return COLORS.brand;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'booking': return '#EBF8FF';
      case 'alert': return '#FFF5F5';
      case 'payment': return '#F0FFF4';
      case 'system': return '#FAF5FF';
      default: return '#F0F7FF';
    }
  };

  const renderItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => (
    <TouchableOpacity style={[styles.item, item.isUnread && styles.unreadItem]}>
      <View style={[styles.iconCircle, { backgroundColor: getBgColor(item.type) }]}>
        <Icon name={item.icon as any} size={20} color={getIconColor(item.type)} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Typography variant="body" style={[styles.title, item.isUnread && styles.unreadTitle]}>
            {t(item.titleKey as any)}
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>{item.time}</Typography>
        </View>
        <Typography variant="caption" color={COLORS.textSecondary} numberOfLines={2}>
          {t(item.messageKey as any)}
        </Typography>
      </View>
      {item.isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header 
        title={t('notifications.title')} 
        showBack 
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={NOTIFICATIONS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell-off" size={60} color="#CBD5E0" />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 16 }}>
              {t('notifications.empty')}
            </Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  unreadItem: {
    borderColor: '#EBF8FF',
    backgroundColor: '#FBFEFF',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    color: COLORS.text,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  }
});
