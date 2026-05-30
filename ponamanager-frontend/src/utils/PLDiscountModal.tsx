import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { companyOrderAPI } from '../api/companyOrderAPI';
import { formatCurrency } from '../utils/helpers';
import Toast from 'react-native-toast-message';

// ─── Theme ──────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F4F5F9',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.10)',
  success: '#18B565',
  successSoft: 'rgba(24,181,101,0.10)',
  danger: '#F03F5F',
  dangerSoft: 'rgba(240,63,95,0.09)',
  warning: '#E09400',
  warningSoft: 'rgba(224,148,0,0.10)',
  info: '#0EA5E9',
  infoSoft: 'rgba(14,165,233,0.10)',
  inputBg: '#F4F5F9',
  overlay: 'rgba(0,0,0,0.55)',
};
const DARK = {
  bg: '#0F1117',
  surface: '#1A1D27',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F0F2FF',
  textSecondary: '#8A8FA8',
  textMuted: '#545872',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.15)',
  success: '#2ECC71',
  successSoft: 'rgba(46,204,113,0.12)',
  danger: '#FF5E7E',
  dangerSoft: 'rgba(255,94,126,0.12)',
  warning: '#F0A500',
  warningSoft: 'rgba(240,165,0,0.12)',
  info: '#3B9EFF',
  infoSoft: 'rgba(59,158,255,0.12)',
  inputBg: '#0F1117',
  overlay: 'rgba(0,0,0,0.70)',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── Row ─────────────────────────────────────────────────────────────────────────
const Row = ({ label, value, color, T, bold }: any) => (
  <View style={s.row}>
    <Text style={[s.rowLabel, { color: T.textMuted }]}>{label}</Text>
    <Text style={[s.rowVal, { color: color ?? T.textPrimary, fontWeight: bold ? '800' : '600' }]}>
      {value}
    </Text>
  </View>
);

// ─── Component ───────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  companyOrder: any;
  onClose: () => void;
  onSaved: () => void;
}

export const PLDiscountModal: React.FC<Props> = ({ visible, companyOrder, onClose, onSaved }) => {
  const T = useTheme();
  const [percent, setPercent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setPercent('');
  }, [visible]);

  if (!companyOrder) return null;

  // Current values
  const totalPL = companyOrder.totalPL ?? companyOrder.expectedPL ?? 0;
  const ratePerPL = companyOrder.ratePerPL ?? 0;
  const actualAmount = companyOrder.actualAmount ?? companyOrder.paymentAmount ?? 0;
  const paid = companyOrder.paymentAmount ?? 0;
  const prevNetDue = companyOrder.netDue ?? 0;
  const prevAdvance = companyOrder.netAdvance ?? 0;
  const alreadyDisc = companyOrder.plDiscountPercent ?? 0;

  // Live preview
  const pct = parseFloat(percent) || 0;
  const discPL = totalPL * (pct / 100);
  const discAmount = discPL * ratePerPL;
  const finalNet = Math.max(0, actualAmount - discAmount);
  const newNetDue = Math.max(0, finalNet - paid);
  const newNetAdv = Math.max(0, paid - finalNet);
  const saving_diff = discAmount; // how much company "returns"

  const valid = pct > 0 && pct <= 100;

  const handleApply = async () => {
    if (!valid) {
      Toast.show({ type: 'error', text1: 'সতর্কতা', text2: '১ থেকে ১০০ এর মধ্যে % দিন' });
      return;
    }
    setSaving(true);
    try {
      await companyOrderAPI.applyDiscount(companyOrder.id, pct);
      Toast.show({ type: 'success', text1: 'PL ছাড় সমন্বয় হয়েছে!' });
      onSaved();
      onClose();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'ত্রুটি', text2: e?.response?.data?.message || 'ব্যর্থ' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[s.overlay, { backgroundColor: T.overlay }]}>
        <View style={[s.sheet, { backgroundColor: T.surface, borderColor: T.border }]}>
          {/* Header */}
          <View style={s.header}>
            <View style={[s.iconWrap, { backgroundColor: T.warningSoft }]}>
              <Ionicons name="pricetag-outline" size={20} color={T.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: T.textPrimary }]}>PL ছাড় সমন্বয়</Text>
              <Text style={[s.sub, { color: T.textMuted }]}>
                {companyOrder.ponaType} · {totalPL.toLocaleString()} PL
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => !saving && onClose()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={T.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Already applied warning */}
          {alreadyDisc > 0 && (
            <View
              style={[s.warnBox, { backgroundColor: T.warningSoft, borderColor: T.warning + '44' }]}
            >
              <Ionicons name="warning-outline" size={13} color={T.warning} />
              <Text style={[s.warnText, { color: T.warning }]}>
                আগে {alreadyDisc}% ছাড় দেওয়া হয়েছে। নতুন % দিলে replace হবে।
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Current state */}
            <View style={[s.card, { backgroundColor: T.inputBg, borderColor: T.border }]}>
              <Text style={[s.cardTitle, { color: T.textMuted }]}>বর্তমান অবস্থা</Text>
              <Row label="মোট PL" value={`${totalPL.toLocaleString()} PL`} T={T} />
              <Row label="দর/PL" value={`৳${ratePerPL}`} T={T} />
              <Row label="মোট দাম" value={formatCurrency(actualAmount)} T={T} />
              <Row label="জমা দিয়েছি" value={formatCurrency(paid)} color={T.success} T={T} />
              {prevNetDue > 0 && (
                <Row
                  label="বর্তমান বাকি"
                  value={formatCurrency(prevNetDue)}
                  color={T.danger}
                  T={T}
                />
              )}
              {prevAdvance > 0 && (
                <Row
                  label="বর্তমান অগ্রীম"
                  value={formatCurrency(prevAdvance)}
                  color={T.success}
                  T={T}
                />
              )}
            </View>

            {/* Discount input */}
            <View style={s.inputSection}>
              <Text style={[s.inputLabel, { color: T.textSecondary }]}>ছাড়ের পরিমাণ (%)</Text>
              <View
                style={[
                  s.inputWrap,
                  { borderColor: valid ? T.warning : T.border, backgroundColor: T.inputBg },
                ]}
              >
                <TextInput
                  style={[s.input, { color: T.textPrimary }]}
                  value={percent}
                  onChangeText={setPercent}
                  keyboardType="numeric"
                  placeholder="যেমন: ৫"
                  placeholderTextColor={T.textMuted}
                />
                <Text style={[s.inputSuffix, { color: T.warning }]}>%</Text>
              </View>

              {/* Quick % buttons */}
              <View style={s.quickRow}>
                {['1', '2', '3', '5', '10'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      s.quickBtn,
                      {
                        borderColor: percent === v ? T.warning : T.border,
                        backgroundColor: percent === v ? T.warningSoft : T.inputBg,
                      },
                    ]}
                    onPress={() => setPercent(v)}
                  >
                    <Text
                      style={[s.quickBtnText, { color: percent === v ? T.warning : T.textMuted }]}
                    >
                      {v}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live preview */}
            {pct > 0 && (
              <View style={[s.card, { backgroundColor: T.infoSoft, borderColor: T.info + '44' }]}>
                <Text style={[s.cardTitle, { color: T.info }]}>ছাড়ের পরে হিসাব</Text>
                <Row
                  label={`ছাড়কৃত PL (${pct}%)`}
                  value={`${discPL.toFixed(1)} PL`}
                  color={T.warning}
                  T={T}
                />
                <Row
                  label="ছাড়ের টাকা"
                  value={`- ${formatCurrency(discAmount)}`}
                  color={T.warning}
                  T={T}
                />
                <View style={[s.divider, { backgroundColor: T.info + '33' }]} />
                <Row
                  label="ছাড়ের পর মোট দাম"
                  value={formatCurrency(finalNet)}
                  color={T.info}
                  T={T}
                  bold
                />
                <Row label="জমা" value={formatCurrency(paid)} color={T.success} T={T} />
                <View style={[s.divider, { backgroundColor: T.info + '33' }]} />
                {newNetDue > 0 ? (
                  <Row
                    label="নতুন বাকি"
                    value={formatCurrency(newNetDue)}
                    color={T.danger}
                    T={T}
                    bold
                  />
                ) : (
                  <Row
                    label="নতুন অগ্রীম"
                    value={formatCurrency(newNetAdv)}
                    color={T.success}
                    T={T}
                    bold
                  />
                )}

                {/* Savings highlight */}
                <View
                  style={[
                    s.savingsBox,
                    { backgroundColor: T.successSoft, borderColor: T.success + '33' },
                  ]}
                >
                  <Ionicons name="trending-down" size={14} color={T.success} />
                  <Text style={[s.savingsText, { color: T.success }]}>
                    কোম্পানি {formatCurrency(discAmount)} ছাড় দিচ্ছে
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: T.border, backgroundColor: T.inputBg }]}
              onPress={() => !saving && onClose()}
            >
              <Text style={[s.cancelBtnText, { color: T.textSecondary }]}>বাতিল</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.applyBtn,
                { backgroundColor: !valid || saving ? T.warning + '60' : T.warning },
              ]}
              onPress={handleApply}
              disabled={!valid || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={s.applyBtnText}>ছাড় সমন্বয় করুন</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 18,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 11, marginTop: 2 },

  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  warnText: { flex: 1, fontSize: 12, fontWeight: '500' },

  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  rowLabel: { fontSize: 12 },
  rowVal: { fontSize: 13 },

  divider: { height: 1, marginVertical: 6 },

  inputSection: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 22, fontWeight: '800' },
  inputSuffix: { fontSize: 18, fontWeight: '700', paddingLeft: 4 },

  quickRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  quickBtn: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 12, fontWeight: '700' },

  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  savingsText: { fontSize: 12, fontWeight: '600', flex: 1 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 13,
    paddingVertical: 14,
  },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
