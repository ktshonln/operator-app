import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import {
  getOrgBankAccounts,
  deleteOrgBankAccount,
  maskAccountNumber,
  OrgBankAccount,
  getAllOrganizations,
} from '../api';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';

interface OrgOption {
  id: string;
  name: string;
}

export const BankAccountsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeOrgId: string | undefined = route.params?.orgId;

  const { isPlatformAdmin, getUserOrgScope, loading: permissionsLoading } = usePermissions();
  const { organization } = useOrganization();

  const [accounts, setAccounts] = useState<OrgBankAccount[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  const effectiveOrgId = isPlatformAdmin
    ? (routeOrgId ?? selectedOrg?.id)
    : (getUserOrgScope ?? organization?.id ?? undefined);

  const fetchOrganizations = useCallback(async () => {
    try {
      const orgsData = await getAllOrganizations();
      const list = (Array.isArray(orgsData) ? orgsData : [])
        .filter((org: any) => org.id && org.name)
        .map((org: any) => ({ id: org.id, name: org.name }));
      setOrganizations(list);
      if (routeOrgId) {
        const match = list.find((o: OrgOption) => o.id === routeOrgId);
        if (match) setSelectedOrg(match);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, [routeOrgId]);

  const fetchAccounts = useCallback(async (showFullLoader = true) => {
    if (isPlatformAdmin && !effectiveOrgId) {
      setAccounts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showFullLoader) setLoading(true);
      const data = await getOrgBankAccounts(effectiveOrgId);
      setAccounts(data);
    } catch (error: any) {
      console.error('Failed to fetch bank accounts:', error);
      const errorMessage = error.message || t('banks.unableToLoad');
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        t('common.error'),
        errorDetails ? t('common.errorDetails', { message: errorMessage, code: errorDetails }) : errorMessage,
      );
      setAccounts([]);
    } finally {
      if (showFullLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveOrgId, isPlatformAdmin, t]);

  useFocusEffect(
    useCallback(() => {
      if (permissionsLoading) return;
      if (isPlatformAdmin && organizations.length === 0) {
        fetchOrganizations();
      }
      fetchAccounts(isFirstLoad.current);
      isFirstLoad.current = false;
    }, [permissionsLoading, isPlatformAdmin, organizations.length, fetchOrganizations, fetchAccounts]),
  );

  React.useEffect(() => {
    if (permissionsLoading || isFirstLoad.current) return;
    fetchAccounts(false);
  }, [effectiveOrgId, permissionsLoading, fetchAccounts]);

  const handleDelete = (account: OrgBankAccount) => {
    Alert.alert(
      t('banks.deleteTitle'),
      t('banks.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrgBankAccount(account.id, effectiveOrgId);
              setAccounts(prev => prev.filter(a => a.id !== account.id));
              Alert.alert(t('ticketing.deleted'), t('banks.deleted'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('banks.deleteFailed'));
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: OrgBankAccount }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Icon name="business" size={20} color={COLORS.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Typography variant="body" style={{ fontWeight: '700', flex: 1 }}>
              {item.bank?.name ?? 'Bank account'}
            </Typography>
            {item.is_default && (
              <View style={styles.primaryBadge}>
                <Typography variant="caption" style={{ color: COLORS.brand, fontWeight: '700' }}>{t('banks.default')}</Typography>
              </View>
            )}
          </View>
          <Typography variant="caption" color={COLORS.textSecondary}>{item.account_name}</Typography>
          <Typography variant="caption" color={COLORS.textMuted}>{maskAccountNumber(item.account_number)}</Typography>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddBankAccount', { account: item, orgId: effectiveOrgId })}
        >
          <Icon name="edit" size={16} color={COLORS.brand} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Icon name="trash" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (permissionsLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('banks.title')} showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('banks.title')}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={() => {
          if (isPlatformAdmin && !effectiveOrgId) {
            Alert.alert(t('banks.selectOrgAlert'), t('banks.selectOrgFirst'));
            return;
          }
          navigation.navigate('AddBankAccount', { orgId: effectiveOrgId });
        }}
      />

      {isPlatformAdmin && !routeOrgId && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {organizations.map(org => (
              <TouchableOpacity
                key={org.id}
                style={[styles.filterChip, selectedOrg?.id === org.id && styles.filterChipActive]}
                onPress={() => setSelectedOrg(org)}
              >
                <Typography
                  variant="caption"
                  style={{ fontWeight: '700', color: selectedOrg?.id === org.id ? COLORS.white : COLORS.textSecondary }}
                >
                  {org.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={accounts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAccounts(false); }} colors={[COLORS.brand]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="business" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12, textAlign: 'center' }}>
              {isPlatformAdmin && !effectiveOrgId
                ? t('banks.selectOrgHint')
                : t('banks.emptyAddHint')}
            </Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection: { paddingHorizontal: 16, paddingTop: 8 },
  filterRow: { gap: 8, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBadge: {
    backgroundColor: COLORS.brandLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
});
