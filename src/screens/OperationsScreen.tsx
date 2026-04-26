import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon, IconName } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { MOCK_LOCATIONS, MOCK_ROUTES, MOCK_BUSES, MOCK_PRICES } from '../mock/transportData';

interface TileProps {
  icon: IconName;
  label: string;
  count: number;
  subtitle: string;
  color: string;
  onPress: () => void;
}

const Tile: React.FC<TileProps> = ({ icon, label, count, subtitle, color, onPress }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress}>
    <View style={[styles.tileIcon, { backgroundColor: color + '18' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Typography variant="body" style={[styles.tileCount, { color }]}>{count}</Typography>
    <Typography variant="body" style={styles.tileLabel}>{label}</Typography>
    <Typography variant="caption" color={COLORS.textMuted} style={styles.tileSub}>{subtitle}</Typography>
  </TouchableOpacity>
);

interface NavRowProps {
  icon: IconName;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

const NavRow: React.FC<NavRowProps> = ({ icon, label, description, color, onPress }) => (
  <TouchableOpacity style={styles.navRow} onPress={onPress}>
    <View style={[styles.navIcon, { backgroundColor: color + '18' }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <View style={styles.navBody}>
      <Typography variant="body" style={styles.navLabel}>{label}</Typography>
      <Typography variant="caption" color={COLORS.textSecondary}>{description}</Typography>
    </View>
    <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
  </TouchableOpacity>
);

export const OperationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const activeRoutes = MOCK_ROUTES.filter(r => r.status === 'active').length;
  const activeBuses = MOCK_BUSES.filter(b => b.status === 'active').length;
  const incompletePrices = MOCK_ROUTES.filter(r => !r.prices_complete).length;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Operations" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Summary tiles */}
        <Typography variant="caption" style={styles.sectionLabel}>OVERVIEW</Typography>
        <View style={styles.tilesRow}>
          <Tile
            icon="map"
            label="Locations"
            count={MOCK_LOCATIONS.length}
            subtitle="Stop points"
            color="#8B5CF6"
            onPress={() => navigation.navigate('LocationsList')}
          />
          <Tile
            icon="arrow-right"
            label="Routes"
            count={activeRoutes}
            subtitle={`${MOCK_ROUTES.length} total`}
            color={COLORS.brand}
            onPress={() => navigation.navigate('RoutesList')}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon="bus"
            label="Buses"
            count={activeBuses}
            subtitle={`${MOCK_BUSES.length} total`}
            color="#10B981"
            onPress={() => navigation.navigate('Main', { screen: 'Fleets' })}
          />
          <Tile
            icon="dollar-sign"
            label="Prices"
            count={MOCK_PRICES.length}
            subtitle={incompletePrices > 0 ? `${incompletePrices} routes incomplete` : 'All complete'}
            color={incompletePrices > 0 ? '#F59E0B' : '#10B981'}
            onPress={() => navigation.navigate('PriceMatrix')}
          />
        </View>

        {/* Quick navigation */}
        <Typography variant="caption" style={[styles.sectionLabel, { marginTop: 24 }]}>MANAGE</Typography>
        <View style={styles.navCard}>
          <NavRow
            icon="map"
            label="Locations"
            description="Manage stop points and GPS coordinates"
            color="#8B5CF6"
            onPress={() => navigation.navigate('LocationsList')}
          />
          <NavRow
            icon="arrow-right"
            label="Routes"
            description="Create and manage bus routes"
            color={COLORS.brand}
            onPress={() => navigation.navigate('RoutesList')}
          />
          <NavRow
            icon="dollar-sign"
            label="Price Matrix"
            description="Set stop-pair prices across all routes"
            color="#F59E0B"
            onPress={() => navigation.navigate('PriceMatrix')}
          />
          <NavRow
            icon="bus"
            label="Fleet"
            description="Manage buses and driver assignments"
            color="#10B981"
            onPress={() => navigation.navigate('Main', { screen: 'Fleets' })}
          />
          <NavRow
            icon="map"
            label="Trip Calendar"
            description="View and create scheduled trips"
            color="#EF4444"
            onPress={() => navigation.navigate('Main', { screen: 'Trips' })}
          />
        </View>

        {/* Warnings */}
        {incompletePrices > 0 && (
          <TouchableOpacity style={styles.warningBox} onPress={() => navigation.navigate('PriceMatrix')}>
            <Icon name="alert" size={18} color="#F59E0B" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Typography variant="body" style={{ fontWeight: '700', color: '#F57C00' }}>
                {incompletePrices} route{incompletePrices > 1 ? 's' : ''} with incomplete prices
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Routes cannot be activated until all stop-pair prices are set.
              </Typography>
            </View>
            <Icon name="chevron-right" size={16} color="#F59E0B" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },
  sectionLabel: {
    fontWeight: '700', color: COLORS.textSecondary, fontSize: 11,
    letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase',
  },
  tilesRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tile: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12,
    alignItems: 'flex-start',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileCount: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  tileLabel: { fontWeight: '700', marginTop: 2 },
  tileSub: { fontSize: 11, marginTop: 2 },
  navCard: {
    backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
  },
  navIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  navBody: { flex: 1 },
  navLabel: { fontWeight: '700', marginBottom: 2 },
  warningBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1',
    borderRadius: 14, padding: 14, marginTop: 16,
    borderWidth: 1, borderColor: '#FFE082',
  },
});
