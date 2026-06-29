import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import {
  getOrgWallet,
  getWalletTransactions,
  requestWalletWithdrawal,
  WalletTransaction,
  OrgWallet,
  getAllOrganizations,
  getOrgBankAccounts,
  OrgBankAccount,
} from '../api';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';

interface OrgOption {
  id: string;
  name: string;
}

const formatMoney = (amount: number, currency = 'RWF') =>
  `${currency} ${Number(amount).toLocaleString()}`;

const STATUS_COLORS: Record<string, string> = {
  success: '#10B981',
  completed: '#10B981',
  pending: '#F59E0B',
  failed: '#EF4444',
  cancelled: '#EF4444',
};

export const WalletScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { isPlatformAdmin, getUserOrgScope, loading: permissionsLoading } = usePermissions();
  const { organization } = useOrganization();

  const [wallet, setWallet] = useState<OrgWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<OrgBankAccount[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const isFirstLoad = useRef(true);

  const effectiveOrgId = isPlatformAdmin
    ? selectedOrg?.id
    : (getUserOrgScope ?? organization?.id ?? undefined);

  const fetchOrganizations = useCallback(async () => {
    try {
      const orgsData = await getAllOrganizations();
      setOrganizations(
        (Array.isArray(orgsData) ? orgsData : [])
          .filter((org: any) => org.id && org.name)
          .map((org: any) => ({ id: org.id, name: org.name })),
      );
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, []);

  const fetchWalletData = useCallback(async (showFullLoader = true) => {
    if (isPlatformAdmin && !effectiveOrgId) {
      setWallet(null);
      setTransactions([]);
      setBankAccounts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showFullLoader) setLoading(true);
      const [walletData, txData, accounts] = await Promise.all([
        getOrgWallet(effectiveOrgId),
        getWalletTransactions(effectiveOrgId),
        getOrgBankAccounts(effectiveOrgId),
      ]);
      setWallet(walletData);
      setTransactions(txData);
      setBankAccounts(accounts);
      if (!selectedBankId && accounts.length > 0) {
        setSelectedBankId(accounts.find(a => a.is_default)?.id ?? accounts[0].id);
      }
    } catch (error: any) {
      console.error('Failed to fetch wallet:', error);
      const errorMessage = error.message || t('wallet.unableToLoad');
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        t('common.error'),
        errorDetails ? t('common.errorDetails', { message: errorMessage, code: errorDetails }) : errorMessage,
      );
      setWallet(null);
      setTransactions([]);
    } finally {
      if (showFullLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveOrgId, isPlatformAdmin, selectedBankId, t]);

  useFocusEffect(
    useCallback(() => {
      if (permissionsLoading) return;
      if (isPlatformAdmin && organizations.length === 0) {
        fetchOrganizations();
      }
      fetchWalletData(isFirstLoad.current);
      isFirstLoad.current = false;
    }, [permissionsLoading, isPlatformAdmin, organizations.length, fetchOrganizations, fetchWalletData]),
  );

  React.useEffect(() => {
    if (permissionsLoading || isFirstLoad.current) return;
    fetchWalletData(false);
  }, [effectiveOrgId, permissionsLoading, fetchWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert(t('common.validation'), t('wallet.validAmount'));
      return;
    }
    if (!selectedBankId) {
      Alert.alert(t('common.validation'), t('wallet.selectBank'));
      return;
    }
    if (wallet && amount > wallet.balance) {
      Alert.alert(t('common.validation'), t('wallet.exceedsBalance'));
      return;
    }

    setWithdrawing(true);
    try {
      await requestWalletWithdrawal(
        { amount, bank_account_id: selectedBankId },
        effectiveOrgId,
      );
      setShowWithdraw(false);
      setWithdrawAmount('');
      Alert.alert(t('common.success'), t('wallet.withdrawalSubmitted'));
      fetchWalletData(false);
    } catch (error: any) {
      const errorMessage = error.message || t('wallet.withdrawFailed');
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        t('common.error'),
        errorDetails ? t('common.errorDetails', { message: errorMessage, code: errorDetails }) : errorMessage,
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (permissionsLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={t('wallet.title')} showBack onBack={() => navigation.goBack()} rightElement={<View />} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('wallet.title')}
        showBack
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.headerLink}
            onPress={() => navigation.navigate('BankAccounts', { orgId: effectiveOrgId })}
          >
            <Icon name="business" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.brand]} />}
      >
        {isPlatformAdmin && (
          <>
            <Typography variant="caption" style={styles.sectionLabel}>{t('common.organization').toUpperCase()}</Typography>
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
          </>
        )}

        {isPlatformAdmin && !selectedOrg ? (
          <View style={styles.emptyBox}>
            <Icon name="card" size={40} color={COLORS.textMuted} />
            <Typography variant="body" color={COLORS.textSecondary} style={{ marginTop: 12, textAlign: 'center' }}>
              {t('wallet.selectOrgHint')}
            </Typography>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.balanceCard]}>
                <Typography variant="caption" color={COLORS.textSecondary}>{t('wallet.totalBalance')}</Typography>
                <Typography variant="body" style={styles.balanceText}>
                  {formatMoney(wallet?.balance ?? 0, wallet?.currency)}
                </Typography>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Typography variant="caption" color={COLORS.textSecondary}>{t('wallet.pendingPayouts')}</Typography>
                <Typography variant="body" style={styles.summaryValue}>
                  {formatMoney(wallet?.pending_balance ?? 0, wallet?.currency)}
                </Typography>
              </View>
              <View style={styles.summaryCard}>
                <Typography variant="caption" color={COLORS.textSecondary}>{t('wallet.totalWithdrawals')}</Typography>
                <Typography variant="body" style={styles.summaryValue}>
                  {formatMoney(wallet?.total_withdrawals ?? 0, wallet?.currency)}
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => {
                if (bankAccounts.length === 0) {
                  Alert.alert(
                    t('wallet.bankRequired'),
                    t('wallet.bankRequiredHint'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('common.addAccount'), onPress: () => navigation.navigate('BankAccounts', { orgId: effectiveOrgId }) },
                    ],
                  );
                  return;
                }
                setShowWithdraw(true);
              }}
            >
              <Icon name="send" size={18} color={COLORS.white} />
              <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700', marginLeft: 8 }}>
                {t('wallet.requestWithdrawal')}
              </Typography>
            </TouchableOpacity>

            <Typography variant="caption" style={styles.sectionLabel}>{t('wallet.transactionHistory')}</Typography>
            {transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Typography variant="body" color={COLORS.textSecondary}>{t('wallet.noTransactions')}</Typography>
              </View>
            ) : (
              transactions.map(item => {
                const isCredit = item.type === 'credit';
                const statusColor = STATUS_COLORS[item.status] ?? COLORS.textSecondary;
                return (
                  <View key={item.id} style={styles.txCard}>
                    <View style={styles.txTop}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" style={{ fontWeight: '700' }}>{item.description}</Typography>
                        <Typography variant="caption" color={COLORS.textMuted}>
                          {new Date(item.created_at).toLocaleString('en-GB')}
                          {item.reference ? ` • ${item.reference}` : ''}
                        </Typography>
                      </View>
                      <Typography
                        variant="body"
                        style={{ fontWeight: '700', color: isCredit ? '#10B981' : '#EF4444' }}
                      >
                        {isCredit ? '+' : '-'}{formatMoney(item.amount, item.currency)}
                      </Typography>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Typography variant="caption" style={{ color: statusColor, fontWeight: '700' }}>
                        {item.status.toUpperCase()}
                      </Typography>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showWithdraw} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Typography variant="body" style={{ fontWeight: '700', marginBottom: 16 }}>{t('wallet.requestWithdrawal')}</Typography>

            <Typography variant="caption" style={styles.inputLabel}>{t('wallet.amount')} ({wallet?.currency ?? 'RWF'})</Typography>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <Typography variant="caption" style={styles.inputLabel}>{t('wallet.payoutAccount')}</Typography>
            {bankAccounts.map(account => (
              <TouchableOpacity
                key={account.id}
                style={[styles.bankOption, selectedBankId === account.id && styles.bankOptionActive]}
                onPress={() => setSelectedBankId(account.id)}
              >
                <Typography variant="body" style={{ fontWeight: '600' }}>
                  {account.bank?.name ?? t('wallet.bank')} • **** {account.account_number.slice(-4)}
                </Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>{account.account_name}</Typography>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWithdraw(false)}>
                <Typography variant="body">{t('common.cancel')}</Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, withdrawing && { opacity: 0.7 }]}
                onPress={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>{t('common.submit')}</Typography>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontWeight: '700', color: COLORS.textSecondary, fontSize: 11,
    letterSpacing: 0.8, marginBottom: 10, marginTop: 8, textTransform: 'uppercase',
  },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  balanceCard: { flex: 1 },
  balanceText: { fontSize: 24, fontWeight: '800', color: COLORS.brand, marginTop: 6 },
  summaryValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 14, marginVertical: 16,
  },
  txCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  emptyBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
  },
  inputLabel: { fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  bankOption: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginTop: 8,
  },
  bankOptionActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brandLight },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  modalSubmit: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 12, backgroundColor: COLORS.brand,
  },
  headerLink: {
    backgroundColor: COLORS.brand + '15',
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
