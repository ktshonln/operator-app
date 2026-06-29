import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import { Route } from '../mock/transportData';
import { getRoutes, deleteRoute } from '../api';

export const RoutesListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const fetchRoutes = useCallback(async (showFullLoader = true) => {
    try {
      if (showFullLoader) setLoading(true);
      const data = await getRoutes();
      setRoutes(data);
    } catch (error: any) {
      console.error('Failed to fetch routes:', error);

      const errorMessage = error.message || t('routes.unableToLoad');
      const errorDetails = error.data?.error?.code || '';

      Alert.alert(
        t('routes.errorLoading'),
        errorDetails ? t('common.errorDetails', { message: errorMessage, code: errorDetails }) : errorMessage,
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
      setRoutes([]);
    } finally {
      if (showFullLoader) setLoading(false);
    }
  }, [navigation, t]);

  useFocusEffect(
    useCallback(() => {
      fetchRoutes(isFirstLoad.current);
      isFirstLoad.current = false;
    }, [fetchRoutes])
  );

  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      (r.origin?.name?.toLowerCase().includes(q) ?? false) ||
      (r.destination?.name?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleDelete = async (r: Route) => {
    Alert.alert(t('routes.deleteTitle'), t('routes.deleteConfirm', { name: r.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { 
        text: t('common.delete'), 
        style: 'destructive', 
        onPress: async () => {
          try {
            await deleteRoute(r.id);
            setRoutes(prev => prev.filter(x => x.id !== r.id));
            Alert.alert(t('common.success'), t('routes.deleted'));
          } catch (error: any) {
            const errorMessage = error.message || t('routes.deleteFailed');
            const errorDetails = error.data?.error?.code || '';
            Alert.alert(
              t('common.error'), 
              errorDetails ? t('common.errorDetails', { message: errorMessage, code: errorDetails }) : errorMessage
            );
          }
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: Route }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RouteDetail', { route: item })}>
      <View style={styles.cardLeft}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.textMuted }]} />
        <View style={styles.cardBody}>
          <Typography variant="body" style={styles.name}>{item.name}</Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {item.stops_count} {t('common.stops')} · {item.origin?.name ?? '?'} → {item.destination?.name ?? '?'}
          </Typography>
          {item.prices_complete === false && (
            <View style={styles.warningBadge}>
              <Icon name="alert" size={12} color="#F57C00" />
              <Typography variant="caption" style={{ color: '#F57C00', marginLeft: 4, fontSize: 11 }}>{t('routes.pricesIncomplete')}</Typography>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#E6F7E6' : '#F5F5F5' }]}>
          <Typography variant="caption" style={{ color: item.status === 'active' ? '#2E7D32' : COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {item.status.toUpperCase()}
          </Typography>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Icon name="trash" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('routes.title')} showBack onBack={() => navigation.goBack()} rightIcon="add" onRightPress={() => navigation.navigate('CreateRoute')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>{t('routes.loading')}</Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('routes.title')} showBack onBack={() => navigation.goBack()} rightIcon="add" onRightPress={() => navigation.navigate('CreateRoute')} />
      <View style={styles.searchRow}>
        <Icon name="search" size={18} color={COLORS.textSecondary} />
        <TextInput style={styles.searchInput} placeholder={t('routes.searchPlaceholder')} placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Icon name="close" size={18} color={COLORS.textSecondary} /></TouchableOpacity>}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="map" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12 }}>{t('routes.empty')}</Typography>
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
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cardBody: { flex: 1 },
  name: { fontWeight: '700', marginBottom: 2 },
  warningBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
