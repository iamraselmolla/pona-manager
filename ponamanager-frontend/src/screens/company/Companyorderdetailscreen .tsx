// src/screens/company/CompanyOrderDetailScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { companyOrderAPI } from '../../api/companyOrderAPI';
import { formatCurrency, formatDate } from '../../utils/helpers';

const { width } = Dimensions.get('window');

// ── Themes ───────────────────────────────────────────────────
const LIGHT = {
  bg: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F8FC',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.12)',
  textPrimary: '#0D1117',
  textSecondary: '#4A5568',
  textMuted: '#9CA3AF',
  accent: '#5C56E8',
  accentSoft: 'rgba(92,86,232,0.08)',
  success: '#059669',
  successSoft: 'rgba(5,150,105,0.09)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220,38,38,0.08)',
  warning: '#D97706',
  warningSoft: 'rgba(217,119,6,0.09)',
  inputBg: '#F7F8FC',
  white: '#FFFFFF',
};
const DARK = {
  bg: '#080B12',
  surface: '#111520',
  surfaceAlt: '#181D2E',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  textPrimary: '#EEF0FF',
  textSecondary: '#8892AD',
  textMuted: '#4A5172',
  accent: '#7C78F0',
  accentSoft: 'rgba(124,120,240,0.14)',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.12)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.12)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.12)',
  inputBg: '#080B12',
  white: '#FFFFFF',
};

const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

const PONA = {
  Golda: { color: '#E8920A', soft: 'rgba(232,146,10,0.12)', gradient: ['#F5A623', '#E8920A'] },
  Bagda: { color: '#2563EB', soft: 'rgba(37,99,235,0.12)', gradient: ['#3B82F6', '#2563EB'] },
  Vannamei: { color: '#059669', soft: 'rgba(5,150,105,0.12)', gradient: ['#10B981', '#059669'] },
};
const getPona = (t: string) =>
  (PONA as any)[t] ?? {
    color: '#6C63FF',
    soft: 'rgba(108,99,255,0.12)',
    gradient: ['#7C78F0', '#6C63FF'],
  };

// ── Helpers ───────────────────────────────────────────────────
const Pill = ({ icon, label, color, bg }: any) => (
  <View style={[pH.pill, { backgroundColor: bg }]}>
    {icon && <Ionicons name={icon} size={11} color={color} />}
    <Text style={[pH.text, { color }]}>{label}</Text>
  </View>
);
const pH = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: { fontSize: 11, fontWeight: '700' },
});

const Divider = ({ T }: any) => (
  <View style={{ height: 1, backgroundColor: T.border, marginVertical: 4 }} />
);

const Row = ({ label, value, valueColor, T, bold }: any) => (
  <View style={rS.row}>
    <Text style={[rS.label, { color: T.textSecondary }]}>{label}</Text>
    <Text style={[rS.value, { color: valueColor ?? T.textPrimary }, bold && rS.bold]}>{value}</Text>
  </View>
);
const rS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' },
  bold: { fontWeight: '800', fontSize: 15 },
});

const InputField = ({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  T,
  note,
  keyboardType,
}: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={[fS.label, { color: T.textSecondary }]}>{label}</Text>
    {note && <Text style={[fS.note, { color: T.textMuted }]}>{note}</Text>}
    <View style={[fS.inputWrap, { backgroundColor: T.inputBg, borderColor: T.border }]}>
      <TextInput
        style={[fS.input, { color: T.textPrimary }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'numeric'}
        placeholder={placeholder ?? '0'}
        placeholderTextColor={T.textMuted}
      />
      {suffix && <Text style={[fS.suffix, { color: T.textMuted }]}>{suffix}</Text>}
    </View>
  </View>
);
const fS = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  note: { fontSize: 11, marginBottom: 5, lineHeight: 16 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: { flex: 1, padding: 13, fontSize: 15 },
  suffix: { paddingRight: 14, fontSize: 13, fontWeight: '700' },
});

// ── Mir × Poly display ────────────────────────────────────────
const MirPolyDisplay = ({ mir, poly, totalPL, amount, color }: any) => (
  <View style={[mS.wrap, { backgroundColor: color + '10', borderColor: color + '25' }]}>
    <View style={mS.item}>
      <Text style={[mS.num, { color }]}>{(mir ?? 0).toLocaleString()}</Text>
      <Text style={[mS.lbl]}>কোম্পানি মীর</Text>
    </View>
    <View style={[mS.opCircle, { backgroundColor: color + '18' }]}>
      <Text style={[mS.op, { color }]}>×</Text>
    </View>
    <View style={mS.item}>
      <Text style={[mS.num, { color }]}>{(poly ?? 0).toLocaleString()}</Text>
      <Text style={mS.lbl}>পলি</Text>
    </View>
    <View style={[mS.opCircle, { backgroundColor: color + '18' }]}>
      <Text style={[mS.op, { color }]}>=</Text>
    </View>
    <View style={mS.item}>
      <Text style={[mS.numBig, { color }]}>{(totalPL ?? 0).toLocaleString()}</Text>
      <Text style={mS.lbl}>মোট PL</Text>
    </View>
    {amount > 0 && (
      <View style={[mS.amountChip, { backgroundColor: color + '18' }]}>
        <Text style={[mS.amountText, { color }]}>{formatCurrency(amount)}</Text>
      </View>
    )}
  </View>
);
const mS = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: { alignItems: 'center', minWidth: 52 },
  num: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  numBig: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  lbl: { fontSize: 10, color: '#888', marginTop: 3, fontWeight: '500' },
  opCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  op: { fontSize: 16, fontWeight: '700' },
  amountChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginLeft: 'auto' },
  amountText: { fontSize: 13, fontWeight: '800' },
});

// ── Net position box ──────────────────────────────────────────
const NetBox = ({ due, advance, T }: any) => {
  const isOwed = due > 0;
  const color = isOwed ? T.danger : T.success;
  const soft = isOwed ? T.dangerSoft : T.successSoft;
  return (
    <View style={[nS.wrap, { backgroundColor: soft, borderColor: color + '30' }]}>
      <View style={[nS.iconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={isOwed ? 'arrow-up-circle' : 'arrow-down-circle'} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[nS.label, { color }]}>
          {isOwed ? 'কোম্পানিকে আরও দিতে হবে' : 'কোম্পানি আমাদের ফেরত দেবে'}
        </Text>
        <Text style={[nS.amount, { color }]}>{formatCurrency(isOwed ? due : advance)}</Text>
      </View>
    </View>
  );
};
const nS = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 22, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
});

// ── Card wrapper ──────────────────────────────────────────────
const Card = ({ children, T, style }: any) => (
  <View style={[cS.card, { backgroundColor: T.surface, borderColor: T.border }, style]}>
    {children}
  </View>
);
const cS = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
});

const SectionLabel = ({ label, T }: any) => (
  <Text style={[slS.text, { color: T.textMuted }]}>{label.toUpperCase()}</Text>
);
const slS = StyleSheet.create({
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12 },
});

// ── Main Screen ───────────────────────────────────────────────
export const CompanyOrderDetailScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showReceiveForm, setShowReceiveForm] = useState(false);

  // Form
  const [mirValue, setMirValue] = useState('');
  const [totalPoly, setTotalPoly] = useState('');
  const [paidToCompany, setPaidToCompany] = useState('');
  const [batchId, setBatchId] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  // Animate form expand
  const formAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(formAnim, {
      toValue: showReceiveForm ? 1 : 0,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [showReceiveForm]);

  useEffect(() => {
    companyOrderAPI
      .getById(orderId)
      .then((res) => {
        setOrder(res.data.data);
        setLoading(false);
      })
      .catch(() => navigation.goBack());
  }, [orderId]);

  if (loading || !order) {
    return (
      <View style={[s.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={{ color: T.textMuted, marginTop: 10, fontSize: 13 }}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  const pona = getPona(order.ponaType);
  const isDelivered = order.status === 'delivered';
  const prevDue = order.prevDue ?? 0;
  const prevAdvance = order.prevAdvance ?? 0;

  // Live calc
  const mir = parseFloat(mirValue) || 0;
  const poly = parseFloat(totalPoly) || 0;
  const extraPay = parseFloat(paidToCompany) || 0;
  const totalPL = mir * poly;
  const actualAmt = totalPL * (order.ratePerPL ?? 0);
  const totalPaid = (order.paymentAmount ?? 0) + extraPay;
  const totalOwed = prevDue + actualAmt;
  const totalPaidAll = prevAdvance + totalPaid;
  const net = totalOwed - totalPaidAll;
  const netDue = net > 0 ? net : 0;
  const netAdvance = net < 0 ? Math.abs(net) : 0;

  const handleReceive = async () => {
    if (!mir || !poly) {
      setError('মীর এবং পলি আবশ্যিক');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await companyOrderAPI.receive(orderId, {
        mirValue: mir,
        totalPoly: poly,
        paidToCompany: extraPay || undefined,
        batchId: batchId || undefined,
        notes: receiveNotes || undefined,
      });
      setOrder(res.data.data);
      setShowReceiveForm(false);
      Toast.show({
        type: 'success',
        text1: 'পোনা প্রাপ্তি রেকর্ড হয়েছে',
        text2: `${totalPL.toLocaleString()} PL`,
      });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'ত্রুটি', text2: e?.response?.data?.message || 'ব্যর্থ' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO HEADER ── */}
        <View style={[s.hero, { backgroundColor: T.accent }]}>
          {/* Decorative circles */}
          <View
            style={[s.blob, { width: 180, height: 180, top: -60, right: -40, opacity: 0.12 }]}
          />
          <View
            style={[s.blob, { width: 100, height: 100, bottom: -30, left: 20, opacity: 0.08 }]}
          />

          {/* Status row */}
          <View style={s.heroTop}>
            <Pill
              icon={isDelivered ? 'checkmark-circle-outline' : 'time-outline'}
              label={isDelivered ? 'পোনা পাওয়া গেছে' : 'অপেক্ষায়'}
              color="#fff"
              bg="rgba(255,255,255,0.22)"
            />
            <Pill
              icon="calendar-outline"
              label={formatDate(order.expectedDate)}
              color="#fff"
              bg="rgba(255,255,255,0.15)"
            />
          </View>

          {/* Pona type */}
          <Text style={s.heroPonaType}>{order.ponaType} পোনা</Text>

          {/* Big amount */}
          <Text style={s.heroAmount}>{formatCurrency(order.paymentAmount ?? 0)}</Text>
          <Text style={s.heroSub}>
            প্রাথমিক পেমেন্ট · {(order.expectedPL ?? 0).toLocaleString()} PL আনুমানিক
          </Text>

          {/* Carry forward badge */}
          {(prevDue > 0 || prevAdvance > 0) && (
            <View style={s.carryBadge}>
              <Ionicons name="swap-horizontal" size={12} color="#fff" />
              <Text style={s.carryText}>
                {prevDue > 0
                  ? `আগের বাকি: ${formatCurrency(prevDue)}`
                  : `আগের অগ্রীম: ${formatCurrency(prevAdvance)}`}
              </Text>
            </View>
          )}

          {/* Rate chip */}
          <View style={s.rateChip}>
            <Ionicons name="pricetag-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={s.rateChipText}>৳{order.ratePerPL} / PL</Text>
          </View>
        </View>

        {/* ── ORDER INFO ── */}
        <Card T={T}>
          <SectionLabel label="অর্ডার তথ্য" T={T} />
          <Row label="পোনার ধরন" value={order.ponaType} valueColor={pona.color} T={T} />
          <Divider T={T} />
          <Row label="রেট (প্রতি PL)" value={`৳${order.ratePerPL}`} T={T} />
          <Divider T={T} />
          <Row
            label="আনুমানিক PL"
            value={`${(order.expectedPL ?? 0).toLocaleString()} PL`}
            valueColor={T.accent}
            T={T}
          />
          <Divider T={T} />
          <Row
            label="প্রাথমিক পেমেন্ট"
            value={formatCurrency(order.paymentAmount)}
            valueColor={T.success}
            T={T}
            bold
          />
        </Card>

        {/* ── RECEIVED DATA (if delivered) ── */}
        {isDelivered && (
          <Card T={T}>
            <SectionLabel label="প্রাপ্ত পোনার হিসাব" T={T} />

            {/* Mir × Poly visual */}
            <MirPolyDisplay
              mir={order.mirValue}
              poly={order.totalPoly}
              totalPL={order.totalPL}
              amount={order.actualAmount}
              color={pona.color}
            />

            <Row label="প্রকৃত দাম" value={formatCurrency(order.actualAmount)} T={T} />
            <Divider T={T} />
            <Row
              label="প্রাথমিক পেমেন্ট"
              value={formatCurrency(order.paymentAmount)}
              valueColor={T.success}
              T={T}
            />

            {(order.paidToCompany ?? 0) > 0 && (
              <>
                <Divider T={T} />
                <Row
                  label="অতিরিক্ত পেমেন্ট"
                  value={formatCurrency(order.paidToCompany)}
                  valueColor={T.success}
                  T={T}
                />
              </>
            )}

            {prevDue > 0 && (
              <>
                <Divider T={T} />
                <Row
                  label="আগের বাকি"
                  value={formatCurrency(prevDue)}
                  valueColor={T.danger}
                  T={T}
                />
              </>
            )}
            {prevAdvance > 0 && (
              <>
                <Divider T={T} />
                <Row
                  label="আগের অগ্রীম"
                  value={formatCurrency(prevAdvance)}
                  valueColor={T.warning}
                  T={T}
                />
              </>
            )}

            {/* Net position */}
            <NetBox due={order.netDue ?? 0} advance={order.netAdvance ?? 0} T={T} />

            {/* Batch link */}
            {order.batch && (
              <TouchableOpacity
                style={[
                  s.batchLink,
                  { backgroundColor: T.accentSoft, borderColor: T.accent + '30' },
                ]}
                onPress={() => navigation.navigate('BatchDetails', { batchId: order.batchId })}
              >
                <View style={[s.batchLinkIcon, { backgroundColor: T.accent + '18' }]}>
                  <Ionicons name="boat-outline" size={16} color={T.accent} />
                </View>
                <Text style={[s.batchLinkText, { color: T.accent }]}>
                  {order.batch.batchNumber}
                </Text>
                <Text style={[s.batchLinkSub, { color: T.textMuted }]}>ব্যাচ দেখুন</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={T.accent}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* ── RECEIVE FORM (pending only) ── */}
        {!isDelivered && (
          <Card T={T}>
            {/* Toggle header */}
            <TouchableOpacity
              style={s.formToggle}
              onPress={() => setShowReceiveForm(!showReceiveForm)}
              activeOpacity={0.8}
            >
              <View style={[s.formToggleIcon, { backgroundColor: T.successSoft }]}>
                <Ionicons name="fish-outline" size={18} color={T.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.formToggleTitle, { color: T.textPrimary }]}>পোনা পাওয়া গেছে?</Text>
                <Text style={[s.formToggleSub, { color: T.textMuted }]}>মীর ও পলি এন্ট্রি দিন</Text>
              </View>
              <View
                style={[
                  s.toggleChevron,
                  { backgroundColor: T.surfaceAlt },
                  showReceiveForm && { backgroundColor: T.successSoft },
                ]}
              >
                <Ionicons
                  name={showReceiveForm ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={showReceiveForm ? T.success : T.textMuted}
                />
              </View>
            </TouchableOpacity>

            {showReceiveForm && (
              <View style={{ marginTop: 20 }}>
                {/* Section label */}
                <View
                  style={[s.formSection, { backgroundColor: T.surfaceAlt, borderColor: T.border }]}
                >
                  <Ionicons name="business-outline" size={13} color={T.textMuted} />
                  <Text style={[s.formSectionText, { color: T.textMuted }]}>কোম্পানির হিসাব</Text>
                </View>

                <InputField
                  label="কোম্পানি মীর"
                  value={mirValue}
                  onChange={(v: string) => {
                    setMirValue(v);
                    setError('');
                  }}
                  placeholder="যেমন: ১১৫০"
                  T={T}
                  note="কোম্পানি প্রতি পলিতে কত পোনা দিয়েছে"
                />

                <InputField
                  label="মোট পলি সংখ্যা"
                  value={totalPoly}
                  onChange={(v: string) => {
                    setTotalPoly(v);
                    setError('');
                  }}
                  suffix="পলি"
                  placeholder="যেমন: ৪০"
                  T={T}
                />

                {/* Live calculation display */}
                {mir > 0 && poly > 0 && (
                  <MirPolyDisplay
                    mir={mir}
                    poly={poly}
                    totalPL={totalPL}
                    amount={actualAmt}
                    color={pona.color}
                  />
                )}

                <InputField
                  label="অতিরিক্ত পেমেন্ট"
                  value={paidToCompany}
                  onChange={setPaidToCompany}
                  suffix="৳"
                  placeholder="০"
                  T={T}
                  note="আগের পেমেন্টের বাইরে আরও দিলে লিখুন"
                />

                {/* Batch ID */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[fS.label, { color: T.textSecondary }]}>ব্যাচ ID (ঐচ্ছিক)</Text>
                  <Text style={[fS.note, { color: T.textMuted }]}>কোন ব্যাচে এই পোনা যাবে</Text>
                  <View
                    style={[fS.inputWrap, { backgroundColor: T.inputBg, borderColor: T.border }]}
                  >
                    <TextInput
                      style={[fS.input, { color: T.textPrimary }]}
                      value={batchId}
                      onChangeText={setBatchId}
                      placeholder="Batch ID"
                      placeholderTextColor={T.textMuted}
                      keyboardType="default"
                    />
                  </View>
                </View>

                {/* Net preview */}
                {mir > 0 && poly > 0 && <NetBox due={netDue} advance={netAdvance} T={T} />}

                {/* Error */}
                {!!error && (
                  <View style={[s.errorBox, { backgroundColor: T.dangerSoft }]}>
                    <Ionicons name="alert-circle-outline" size={14} color={T.danger} />
                    <Text style={[s.errorText, { color: T.danger }]}>{error}</Text>
                  </View>
                )}

                {/* Notes */}
                <View style={{ marginBottom: 20, marginTop: 4 }}>
                  <Text style={[fS.label, { color: T.textSecondary }]}>নোট</Text>
                  <TextInput
                    style={[
                      s.notesInput,
                      { color: T.textPrimary, backgroundColor: T.inputBg, borderColor: T.border },
                    ]}
                    value={receiveNotes}
                    onChangeText={setReceiveNotes}
                    placeholder="অতিরিক্ত তথ্য..."
                    placeholderTextColor={T.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[s.submitBtn, { backgroundColor: T.success }, saving && { opacity: 0.7 }]}
                  onPress={handleReceive}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <View style={s.submitBtnIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={T.success} />
                      </View>
                      <Text style={s.submitBtnText}>পোনা প্রাপ্তি নিশ্চিত করুন</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {/* ── NOTES ── */}
        {order.notes && (
          <Card T={T}>
            <SectionLabel label="নোট" T={T} />
            <Text style={[s.noteText, { color: T.textSecondary }]}>{order.notes}</Text>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { borderRadius: 20, padding: 20, marginBottom: 14, overflow: 'hidden', gap: 6 },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroPonaType: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  heroAmount: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  carryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  carryText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  rateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  rateChipText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },

  batchLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  batchLinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchLinkText: { fontSize: 13, fontWeight: '700' },
  batchLinkSub: { fontSize: 11 },

  formToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formToggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formToggleTitle: { fontSize: 15, fontWeight: '700' },
  formToggleSub: { fontSize: 12, marginTop: 2 },
  toggleChevron: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  formSectionText: { fontSize: 11, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },

  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  submitBtnIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },

  noteText: { fontSize: 13, lineHeight: 22 },
});
