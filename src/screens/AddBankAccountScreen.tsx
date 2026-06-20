import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { COLORS } from '../theme/colors';
import {
  getBankCatalog,
  createOrgBankAccount,
  updateOrgBankAccount,
  BankCatalogItem,
  OrgBankAccount,
} from '../api';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';

export const AddBankAccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const existingAccount: OrgBankAccount | undefined = route.params?.account;
  const routeOrgId: string | undefined = route.params?.orgId;
  const isEdit = !!existingAccount;

  const { isPlatformAdmin, getUserOrgScope } = usePermissions();
  const { organization } = useOrganization();

  const effectiveOrgId = isPlatformAdmin
    ? routeOrgId
    : (getUserOrgScope ?? organization?.id ?? undefined);

  const [banks, setBanks] = useState<BankCatalogItem[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankCatalogItem | null>(
    existingAccount?.bank ? { id: existingAccount.bank_id, name: existingAccount.bank.name, is_active: true } : null,
  );
  const [accountName, setAccountName] = useState(existingAccount?.account_name ?? '');
  const [accountNumber, setAccountNumber] = useState(existingAccount?.account_number ?? '');
  const [isDefault, setIsDefault] = useState(existingAccount?.is_default ?? false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true);
      const catalog = await getBankCatalog();
      setBanks(catalog.filter(b => b.is_active));
    } catch (error) {
      console.error('Failed to fetch bank catalog:', error);
      Alert.alert('Error', 'Could not load bank list.');
      setBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBank) {
      Alert.alert('Validation', 'Select a bank.');
      return;
    }
    if (!accountName.trim()) {
      Alert.alert('Validation', 'Account holder name is required.');
      return;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Validation', 'Account number is required.');
      return;
    }
    if (isPlatformAdmin && !effectiveOrgId) {
      Alert.alert('Validation', 'Organization is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        bank_id: selectedBank.id,
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        is_default: isDefault,
      };

      if (isEdit && existingAccount) {
        await updateOrgBankAccount(existingAccount.id, payload, effectiveOrgId);
        Alert.alert('Saved', 'Bank account updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await createOrgBankAccount(payload, effectiveOrgId);
        Alert.alert('Success', 'Bank account added.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save bank account';
      const errorDetails = error.data?.error?.code || '';
      Alert.alert(
        'Error',
        errorDetails ? `${errorMessage}\n\nError: ${errorDetails}` : errorMessage,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
        showBack
        onBack={() => navigation.goBack()}
        rightElement={<View />}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label text="Bank" required />
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowBankPicker(!showBankPicker)}>
          <Icon name="business" size={18} color={selectedBank ? COLORS.brand : COLORS.textMuted} />
          <Typography
            variant="body"
            color={selectedBank ? COLORS.text : COLORS.textMuted}
            style={{ marginLeft: 10, flex: 1 }}
          >
            {selectedBank?.name ?? 'Select bank'}
          </Typography>
          <Icon name={showBankPicker ? 'chevron-left' : 'chevron-right'} size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {showBankPicker && (
          <View style={styles.dropdown}>
            {loadingBanks ? (
              <View style={styles.dropdownEmpty}>
                <ActivityIndicator size="small" color={COLORS.brand} />
              </View>
            ) : (
              banks.map(bank => (
                <TouchableOpacity
                  key={bank.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedBank(bank);
                    setShowBankPicker(false);
                  }}
                >
                  <Typography variant="body">{bank.name}</Typography>
                  {selectedBank?.id === bank.id && <Icon name="check" size={16} color={COLORS.brand} />}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <Label text="Account holder name" required />
        <TextInput
          style={styles.input}
          placeholder="e.g. KATISHA TRANSPORT LTD"
          placeholderTextColor={COLORS.textMuted}
          value={accountName}
          onChangeText={setAccountName}
          autoCapitalize="characters"
        />

        <Label text="Account number" required />
        <TextInput
          style={styles.input}
          placeholder="Enter account number"
          placeholderTextColor={COLORS.textMuted}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={styles.toggleRow} onPress={() => setIsDefault(!isDefault)}>
          <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
            {isDefault && <Icon name="check" size={14} color={COLORS.white} />}
          </View>
          <Typography variant="body" style={{ marginLeft: 10 }}>Set as primary payout account</Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
              {isEdit ? 'Save Changes' : 'Add Bank Account'}
            </Typography>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Label = ({ text, required }: { text: string; required?: boolean }) => (
  <Typography
    variant="caption"
    style={{
      fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, marginTop: 20,
      textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8,
    }}
  >
    {text}{required ? ' *' : ''}
  </Typography>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13,
  },
  dropdown: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    marginTop: 4, maxHeight: 220, overflow: 'hidden',
  },
  dropdownEmpty: { padding: 16, alignItems: 'center' },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  saveBtn: {
    backgroundColor: COLORS.brand, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 32,
  },
});
