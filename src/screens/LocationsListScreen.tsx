import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Location } from '../mock/transportData';
import { getLocations, deleteLocation } from '../api';
import { usePermissions } from '../hooks/usePermissions';

export const LocationsListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { canManageLocations, loading: permissionsLoading } = usePermissions();
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, []),
  );

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data);
    } catch (error: any) {
      console.error('Failed to fetch locations:', error);
      
      // Show the actual backend error message
      const errorMessage = error.message || t('locations.unableToLoad');
      const errorDetails = error.data?.error?.code || '';
      
      Alert.alert(
        t('locations.errorLoading'), 
        errorDetails ? t('common.errorDetails', { message: errorMessage, code: errorDetails }) : errorMessage,
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.province && l.province.toLowerCase().includes(search.toLowerCase())) ||
    (l.city && l.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    if (!canManageLocations) {
      Alert.alert(t('locations.platformOnlyTitle'), t('locations.platformOnlyMessage'));
      return;
    }
    navigation.navigate('CreateLocation');
  };

  const handleDelete = async (id: string) => {
    Alert.alert(t('locations.deleteTitle'), t('locations.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { 
        text: t('common.delete'), 
        style: 'destructive', 
        onPress: async () => {
          try {
            await deleteLocation(id);
            setLocations(prev => prev.filter(l => l.id !== id));
            Alert.alert(t('common.success'), t('locations.deleted'));
          } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('locations.deleteFailed'));
          }
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: Location }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LocationDetail', { location: item })}>
      <View style={styles.cardIcon}>
        <Icon name="map" size={20} color={COLORS.brand} />
      </View>
      <View style={styles.cardBody}>
        <Typography variant="body" style={styles.name}>{item.name}</Typography>
        <Typography variant="caption" color={COLORS.textSecondary}>{item.city || item.province || t('common.notAvailable')}</Typography>
        <Typography variant="caption" color={COLORS.textMuted}>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Typography>
      </View>
      {canManageLocations && (
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Icon name="trash" size={18} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const headerRight = canManageLocations ? (
    <Header
      title={t('locations.title')}
      showBack
      onBack={() => navigation.goBack()}
      rightIcon="add"
      onRightPress={handleAdd}
    />
  ) : (
    <Header title={t('locations.title')} showBack onBack={() => navigation.goBack()} rightElement={<View />} />
  );

  if (loading || permissionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {headerRight}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>{t('locations.loading')}</Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {headerRight}
      {!canManageLocations && (
        <Typography variant="caption" color={COLORS.textMuted} style={styles.readOnlyHint}>
          {t('locations.readOnlyHint')}
        </Typography>
      )}
      <View style={styles.searchRow}>
        <Icon name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('locations.searchPlaceholder')}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="map" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>{t('locations.empty')}</Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.text },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  readOnlyHint: { marginHorizontal: 16, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  name: { fontWeight: '700', marginBottom: 2 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
