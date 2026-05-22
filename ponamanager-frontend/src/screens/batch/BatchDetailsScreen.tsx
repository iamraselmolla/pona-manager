// src/screens/batch/BatchDetailsScreen.tsx
// FULL FILE — DeliveryModal updated with mir fields
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { batchAPI } from '../../api/batchServices';
import { Batch, BatchOrder } from '../../types';
import { formatCurrency, formatDate, getPonaTypeColor } from '../../utils/helpers';
import { showConfirm } from '../../utils/AppModal';

// ─── Theme ─────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F4F5F9',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.12)',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.10)',
  danger: '#F03F5F',
  dangerSoft: 'rgba(240,63,95,0.09)',
  success: '#18B565',
  successSoft: 'rgba(24,181,101,0.10)',
  warning: '#E09400',
  warningSoft: 'rgba(224,148,0,0.10)',
  info: '#0EA5E9',
  infoSoft: 'rgba(14,165,233,0.10)',
  white: '#FFFFFF',
  inputBg: '#F4F5F9',
  shadow: '#000',
};
const DARK = {
  bg: '#0F1117',
  surface: '#1A1D27',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  textPrimary: '#F0F2FF',
  textSecondary: '#8A8FA8',
  textMuted: '#545872',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.15)',
  danger: '#FF5E7E',
  dangerSoft: 'rgba(255,94,126,0.12)',
  success: '#2ECC71',
  successSoft: 'rgba(46,204,113,0.12)',
  warning: '#F0A500',
  warningSoft: 'rgba(240,165,0,0.12)',
  info: '#3B9EFF',
  infoSoft: 'rgba(59,158,255,0.12)',
  white: '#FFFFFF',
  inputBg: '#0F1117',
  shadow: '#000',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── Toast helpers ──────────────────────────────────────────────────────────────
const toast = {
  success: (msg: string, title = 'সফল!') =>
    Toast.show({
      type: 'success',
      text1: title,
      text2: msg,
      position: 'top',
      visibilityTime: 3000,
    }),
  error: (msg: string, title = 'ত্রুটি') =>
    Toast.show({ type: 'error', text1: title, text2: msg, position: 'top', visibilityTime: 4000 }),
  warn: (msg: string, title = 'সতর্কতা') =>
    Toast.show({ type: 'error', text1: title, text2: msg, position: 'top', visibilityTime: 3000 }),
};

// ─── Confirm ────────────────────────────────────────────────────────────────────
const confirm = (title: string, message: string, onConfirm: () => void) => {
  if (typeof window !== 'undefined' && window.confirm) {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, [
      { text: 'না', style: 'cancel' },
      { text: 'হ্যাঁ', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// ─── Status config ──────────────────────────────────────────────────────────────
const getStatusConfig = (T: typeof LIGHT) => ({
  pending: { label: 'পেন্ডিং', color: T.warning, bg: T.warningSoft, icon: 'time-outline' as const },
  delivered: {
    label: 'সম্পন্ন',
    color: T.success,
    bg: T.successSoft,
    icon: 'checkmark-circle-outline' as const,
  },
  partial: { label: 'আংশিক', color: T.info, bg: T.infoSoft, icon: 'git-branch-outline' as const },
});

// ─── Input field ────────────────────────────────────────────────────────────────
const InputField = ({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  T,
  note,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  T: any;
  note?: string;
  highlight?: boolean;
}) => (
  <View style={mStyles.field}>
    <Text style={[mStyles.fieldLabel, { color: highlight ? T.info : T.textSecondary }]}>
      {label}
    </Text>
    {note && <Text style={[mStyles.fieldNote, { color: T.textMuted }]}>{note}</Text>}
    <View
      style={[
        mStyles.inputRow,
        { borderColor: highlight ? T.info + '60' : T.border, backgroundColor: T.inputBg },
      ]}
    >
      <TextInput
        style={[mStyles.input, { color: T.textPrimary }]}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder ?? '0'}
        placeholderTextColor={T.textMuted}
      />
      {suffix && <Text style={[mStyles.inputSuffix, { color: T.textMuted }]}>{suffix}</Text>}
    </View>
  </View>
);

// ─── Calc row ───────────────────────────────────────────────────────────────────
const CalcRow = ({ label, value, color, T, bold, last }: any) => (
  <View style={[mStyles.calcRow, { borderBottomColor: last ? 'transparent' : T.border }]}>
    <Text style={[mStyles.calcLabel, { color: T.textSecondary, fontWeight: bold ? '700' : '400' }]}>
      {label}
    </Text>
    <Text
      style={[mStyles.calcVal, { color: color ?? T.textPrimary, fontWeight: bold ? '800' : '600' }]}
    >
      {value}
    </Text>
  </View>
);

// ─── Mir comparison display ─────────────────────────────────────────────────────
const MirCompare = ({ companyMir, ourMir, poly, T }: any) => {
  if (!companyMir || !ourMir || !poly) return null;
  const compTotal = companyMir * poly;
  const ourTotal = ourMir * poly;
  const diff = compTotal - ourTotal;
  const diffColor = diff === 0 ? T.success : diff > 0 ? T.danger : T.warning;

  return (
    <View style={[mStyles.mirCompare, { backgroundColor: T.infoSoft, borderColor: T.info + '33' }]}>
      <Text style={[mStyles.mirCompareTitle, { color: T.info }]}>মীর তুলনা</Text>
      <View style={mStyles.mirCompareRow}>
        <View style={mStyles.mirCompareItem}>
          <Text style={[mStyles.mirCompareNum, { color: T.info }]}>
            {companyMir} × {poly}
          </Text>
          <Text style={[mStyles.mirCompareLabel, { color: T.textMuted }]}>কোম্পানি মীর × পলি</Text>
          <Text style={[mStyles.mirCompareTotal, { color: T.info }]}>
            {compTotal.toLocaleString()} PL
          </Text>
        </View>
        <Text style={[mStyles.mirCompareVs, { color: T.textMuted }]}>VS</Text>
        <View style={mStyles.mirCompareItem}>
          <Text style={[mStyles.mirCompareNum, { color: T.accent }]}>
            {ourMir} × {poly}
          </Text>
          <Text style={[mStyles.mirCompareLabel, { color: T.textMuted }]}>আমাদের মীর × পলি</Text>
          <Text style={[mStyles.mirCompareTotal, { color: T.accent }]}>
            {ourTotal.toLocaleString()} PL
          </Text>
        </View>
      </View>
      <View style={[mStyles.mirDiffRow, { backgroundColor: diffColor + '18' }]}>
        <Ionicons
          name={
            diff === 0 ? 'checkmark-circle' : diff > 0 ? 'arrow-up-circle' : 'arrow-down-circle'
          }
          size={14}
          color={diffColor}
        />
        <Text style={[mStyles.mirDiffText, { color: diffColor }]}>
          {diff === 0
            ? 'মীর মিলছে'
            : diff > 0
              ? `কোম্পানি ${Math.abs(diff).toLocaleString()} PL বেশি দিয়েছে`
              : `কোম্পানি ${Math.abs(diff).toLocaleString()} PL কম দিয়েছে`}
        </Text>
      </View>
    </View>
  );
};

// ─── Delivery Modal ─────────────────────────────────────────────────────────────
const DeliveryModal = ({
  visible,
  batchOrder,
  onClose,
  onSubmit,
  saving,
}: {
  visible: boolean;
  batchOrder: BatchOrder | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  saving: boolean;
}) => {
  const T = useTheme();

  // Quantity
  const [deliveredQty, setDeliveredQty] = useState('');
  const [isPartial, setIsPartial] = useState(false);

  // ── NEW: Mir fields ──
  const [companyMir, setCompanyMir] = useState(''); // company's mir value
  const [ourMir, setOurMir] = useState(''); // our measured mir
  const [totalPoly, setTotalPoly] = useState(''); // number of poly bags

  // Payment
  const [deliveryRate, setDeliveryRate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [payment, setPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (batchOrder) {
      setDeliveredQty(batchOrder.order.plQuantity.toString());
      setDeliveryRate(batchOrder.order.unitRate.toString());
      setCompanyMir('');
      setOurMir('');
      setTotalPoly('');
      setDiscount('0');
      setPayment('');
      setDueDate('');
      setNotes('');
      setIsPartial(false);
    }
  }, [batchOrder]);

  if (!batchOrder) return null;

  const orderedQty = batchOrder.order.plQuantity;
  const advance = batchOrder.order.advanceAmount || 0;
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType) ?? T.accent;

  // Parsed values
  const cMir = parseFloat(companyMir) || 0;
  const oMir = parseFloat(ourMir) || 0;
  const poly = parseFloat(totalPoly) || 0;
  const qty = parseFloat(deliveredQty) || 0;
  const rate = parseFloat(deliveryRate) || 0;
  const disc = parseFloat(discount) || 0;
  const paid = parseFloat(payment) || 0;

  // If mir + poly provided, use ourMir × poly as the delivery quantity
  const actualQty = oMir > 0 && poly > 0 ? oMir * poly : qty;
  const remaining = orderedQty - actualQty;
  const finalAmt = Math.max(0, actualQty * rate - disc);
  const totalPaid = advance + paid;
  const dueAmt = Math.max(0, finalAmt - totalPaid);
  const isActPartial = actualQty < orderedQty && actualQty > 0;
  const pct = orderedQty > 0 ? Math.min((actualQty / orderedQty) * 100, 100) : 0;

  // Mir totals
  const compTotal = cMir * poly;
  const ourTotal = oMir * poly;
  const mirDiff = compTotal - ourTotal;

  const handleSubmit = () => {
    if (!qty && !actualQty) {
      toast.warn('ডেলিভারি পরিমাণ দিন');
      return;
    }
    if (!rate || rate <= 0) {
      toast.warn('দর দিন');
      return;
    }
    if (actualQty > orderedQty) {
      toast.warn(`সর্বোচ্চ ${orderedQty} PL`);
      return;
    }

    const msg = isActPartial
      ? `${actualQty.toLocaleString()} PL ডেলিভারি হবে। বাকি ${remaining.toLocaleString()} PL নতুন অর্ডার হবে।`
      : `${actualQty.toLocaleString()} PL ডেলিভারি নিশ্চিত করুন?`;

    confirm(isActPartial ? 'আংশিক ডেলিভারি' : 'ডেলিভারি নিশ্চিত', msg, () =>
      onSubmit({
        // Quantity
        deliveredQuantity: actualQty,
        // Mir data
        companyMir: cMir || undefined,
        ourMir: oMir || undefined,
        totalPoly: poly || undefined,
        mirDiff: cMir && oMir && poly ? mirDiff : undefined,
        totalFish: ourTotal || undefined,
        deliveredPL: poly || undefined,
        // Payment
        deliveryRate: rate,
        discount: disc,
        customerPayment: paid,
        dueAmount: dueAmt,
        duePaymentDate: dueAmt > 0 && dueDate ? dueDate : undefined,
        finalAmount: finalAmt,
        // Partial
        isPartial: isActPartial,
        remainingQuantity: isActPartial ? remaining : 0,
        notes,
      }),
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[mStyles.container, { backgroundColor: T.bg }]}>
          {/* Header */}
          <View
            style={[mStyles.header, { backgroundColor: T.surface, borderBottomColor: T.border }]}
          >
            <View style={[mStyles.headerBar, { backgroundColor: typeColor }]} />
            <View style={mStyles.headerContent}>
              <Text style={[mStyles.headerTitle, { color: T.textPrimary }]}>ডেলিভারি এন্ট্রি</Text>
              <Text style={[mStyles.headerSub, { color: T.textSecondary }]}>
                {batchOrder.order.customerName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[mStyles.closeBtn, { backgroundColor: T.bg }]}
            >
              <Ionicons name="close" size={22} color={T.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Order info */}
            <View
              style={[mStyles.infoCard, { backgroundColor: T.surface, borderTopColor: typeColor }]}
            >
              {[
                { label: 'পোনার ধরন', pill: batchOrder.order.ponaType, value: null },
                { label: 'অর্ডার পরিমাণ', pill: null, value: `${orderedQty.toLocaleString()} PL` },
                {
                  label: 'আগাম জমা',
                  pill: null,
                  value: formatCurrency(advance),
                  valueColor: T.success,
                },
              ].map((row, i) => (
                <View key={i} style={[mStyles.infoRow, { borderBottomColor: T.border }]}>
                  <Text style={[mStyles.infoLabel, { color: T.textSecondary }]}>{row.label}</Text>
                  {row.pill ? (
                    <View style={[mStyles.typePill, { backgroundColor: typeColor + '20' }]}>
                      <Text style={[mStyles.typePillText, { color: typeColor }]}>{row.pill}</Text>
                    </View>
                  ) : (
                    <Text style={[mStyles.infoValue, { color: row.valueColor ?? T.textPrimary }]}>
                      {row.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* ── MIR SECTION (NEW) ── */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: T.info }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>মীর তথ্য</Text>
              </View>
              <Text style={[mStyles.sectionDesc, { color: T.textMuted }]}>
                কোম্পানির মীর ও আমাদের গণনা করা মীর আলাদাভাবে লিখুন
              </Text>

              <InputField
                label="কোম্পানির মীর (প্রতি পলি)"
                value={companyMir}
                onChange={setCompanyMir}
                placeholder="যেমন: ১১৫০"
                T={T}
                highlight
                note="কোম্পানি প্রতি পলিতে কত পোনা দিয়েছে বলেছে"
              />

              <InputField
                label="আমাদের গণনা করা মীর"
                value={ourMir}
                onChange={setOurMir}
                placeholder="যেমন: ১১৩০"
                T={T}
                note="আমরা গুনে যা পেয়েছি"
              />

              <InputField
                label="মোট পলি সংখ্যা"
                value={totalPoly}
                onChange={(v) => {
                  setTotalPoly(v);
                  // Auto-fill delivered qty from ourMir × poly
                  if (oMir > 0) {
                    const auto = oMir * (parseFloat(v) || 0);
                    if (auto > 0) setDeliveredQty(auto.toString());
                  }
                }}
                suffix="পলি"
                placeholder="যেমন: ৪০"
                T={T}
                note="এই কাস্টমারের জন্য কতটি পলি"
              />

              {/* Live mir comparison */}
              <MirCompare companyMir={cMir} ourMir={oMir} poly={poly} T={T} />
            </View>

            {/* ── QUANTITY SECTION ── */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: typeColor }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>ডেলিভারি পরিমাণ</Text>
              </View>

              {/* Auto-filled note */}
              {oMir > 0 && poly > 0 && (
                <View style={[mStyles.autoFillNote, { backgroundColor: T.accentSoft }]}>
                  <Ionicons name="information-circle" size={13} color={T.accent} />
                  <Text style={[mStyles.autoFillText, { color: T.accent }]}>
                    মীর × পলি থেকে স্বয়ংক্রিয়ভাবে হিসাব হয়েছে: {ourTotal.toLocaleString()} PL
                  </Text>
                </View>
              )}

              <InputField
                label="ডেলিভারিকৃত পরিমাণ (PL)"
                value={deliveredQty}
                onChange={setDeliveredQty}
                suffix="PL"
                placeholder={`সর্বোচ্চ ${orderedQty.toLocaleString()}`}
                T={T}
              />

              {/* Progress bar */}
              {actualQty > 0 && (
                <View style={mStyles.progressWrap}>
                  <View style={[mStyles.progressBg, { backgroundColor: T.border }]}>
                    <View
                      style={[
                        mStyles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: isActPartial ? T.warning : T.success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[mStyles.progressPct, { color: T.textMuted }]}>
                    {pct.toFixed(0)}%
                  </Text>
                </View>
              )}

              {isActPartial && (
                <View style={[mStyles.partialBanner, { backgroundColor: T.infoSoft }]}>
                  <Ionicons name="information-circle" size={14} color={T.info} />
                  <Text style={[mStyles.partialBannerText, { color: T.info }]}>
                    বাকি {remaining.toLocaleString()} PL নতুন pending অর্ডার হবে
                  </Text>
                </View>
              )}
            </View>

            {/* ── PAYMENT SECTION ── */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: T.success }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>মূল্য ও পেমেন্ট</Text>
              </View>

              <InputField
                label="ডেলিভারি দর (৳/PL)"
                value={deliveryRate}
                onChange={setDeliveryRate}
                suffix="৳"
                T={T}
              />
              <InputField
                label="ছাড় (Discount)"
                value={discount}
                onChange={setDiscount}
                suffix="৳"
                placeholder="০"
                T={T}
              />
              <InputField
                label="আজকের পেমেন্ট"
                value={payment}
                onChange={setPayment}
                suffix="৳"
                placeholder="০"
                T={T}
              />

              {dueAmt > 0 && (
                <InputField
                  label="বাকি পরিশোধের তারিখ"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="YYYY-MM-DD"
                  T={T}
                  note="কবে বাকি টাকা দেবে"
                />
              )}
            </View>

            {/* ── SUMMARY ── */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: T.warning }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>হিসাব সারসংক্ষেপ</Text>
              </View>

              <CalcRow
                label={`${actualQty.toLocaleString()} PL × ৳${rate}`}
                value={formatCurrency(actualQty * rate)}
                T={T}
              />
              {disc > 0 && (
                <CalcRow label="ছাড়" value={`- ${formatCurrency(disc)}`} color={T.success} T={T} />
              )}
              <CalcRow
                label="চূড়ান্ত মূল্য"
                value={formatCurrency(finalAmt)}
                color={T.accent}
                T={T}
              />
              <CalcRow
                label="আগাম জমা"
                value={`- ${formatCurrency(advance)}`}
                color={T.success}
                T={T}
              />
              {paid > 0 && (
                <CalcRow
                  label="আজকের পেমেন্ট"
                  value={`- ${formatCurrency(paid)}`}
                  color={T.success}
                  T={T}
                />
              )}

              <View
                style={[
                  mStyles.dueBox,
                  { backgroundColor: dueAmt > 0 ? T.dangerSoft : T.successSoft },
                ]}
              >
                <Text style={[mStyles.dueLabel, { color: dueAmt > 0 ? T.danger : T.success }]}>
                  {dueAmt > 0 ? 'বাকি' : 'সম্পূর্ণ পরিশোধ ✓'}
                </Text>
                <Text style={[mStyles.dueValue, { color: dueAmt > 0 ? T.danger : T.success }]}>
                  {formatCurrency(dueAmt)}
                </Text>
              </View>

              {isActPartial && (
                <View
                  style={[
                    mStyles.calcRow,
                    {
                      backgroundColor: T.infoSoft,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      borderBottomColor: 'transparent',
                    },
                  ]}
                >
                  <Text style={[mStyles.calcLabel, { color: T.info }]}>নতুন অর্ডার (বাকি PL)</Text>
                  <Text style={[mStyles.calcVal, { color: T.info, fontWeight: '800' }]}>
                    {remaining.toLocaleString()} PL
                  </Text>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <Text style={[mStyles.fieldLabel, { color: T.textSecondary }]}>নোট</Text>
              <TextInput
                style={[
                  mStyles.notesInput,
                  { borderColor: T.border, color: T.textPrimary, backgroundColor: T.inputBg },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="অতিরিক্ত তথ্য..."
                placeholderTextColor={T.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Submit */}
          <View style={[mStyles.footer, { backgroundColor: T.surface, borderTopColor: T.border }]}>
            <TouchableOpacity
              style={[
                mStyles.submitBtn,
                { backgroundColor: saving ? T.success + '80' : T.success },
              ]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={mStyles.submitBtnInner}>
                  <Ionicons
                    name={isActPartial ? 'git-branch-outline' : 'checkmark-circle'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={mStyles.submitBtnText}>
                    {isActPartial ? 'আংশিক ডেলিভারি নিশ্চিত' : 'ডেলিভারি নিশ্চিত করুন'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Batch Order Row ────────────────────────────────────────────────────────────
const BatchOrderRow = ({
  batchOrder,
  onDeliver,
  onUnbatch,
}: {
  batchOrder: BatchOrder;
  onDeliver: () => void;
  onUnbatch: () => void;
}) => {
  const T = useTheme();
  const STATUS = getStatusConfig(T);
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType) ?? T.accent;
  const st = STATUS[batchOrder.deliveryStatus as keyof typeof STATUS] ?? STATUS.pending;
  const hasMir = batchOrder.ourMir && batchOrder.companyMir;

  return (
    <View
      style={[
        rowStyles.card,
        { backgroundColor: T.surface },
        batchOrder.deliveryStatus === 'delivered' && rowStyles.cardDone,
      ]}
    >
      <View style={[rowStyles.typeBar, { backgroundColor: typeColor }]} />
      <View style={{ flex: 1, paddingLeft: 10 }}>
        <View style={rowStyles.top}>
          <Text style={[rowStyles.customerName, { color: T.textPrimary }]}>
            {batchOrder.order.customerName}
          </Text>
          <View style={[rowStyles.statusPill, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={11} color={st.color} />
            <Text style={[rowStyles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <Text style={[rowStyles.mobile, { color: T.textSecondary }]}>
          {batchOrder.order.customerMobile}
        </Text>

        <View style={rowStyles.metaRow}>
          <View style={[rowStyles.typePill, { backgroundColor: typeColor + '20' }]}>
            <Text style={[rowStyles.typeText, { color: typeColor }]}>
              {batchOrder.order.ponaType}
            </Text>
          </View>
          <Text style={[rowStyles.qty, { color: T.textPrimary }]}>
            {batchOrder.deliveryStatus !== 'pending'
              ? `${(batchOrder.deliveredQuantity || 0).toLocaleString()} / ${batchOrder.order.plQuantity.toLocaleString()} PL`
              : `${batchOrder.order.plQuantity.toLocaleString()} PL`}
          </Text>
          {batchOrder.deliveryStatus === 'partial' && (
            <View style={[rowStyles.partialBadge, { backgroundColor: T.infoSoft }]}>
              <Text style={[rowStyles.partialBadgeText, { color: T.info }]}>আংশিক</Text>
            </View>
          )}
        </View>

        {/* Mir info after delivery */}
        {batchOrder.deliveryStatus !== 'pending' && hasMir && (
          <View style={[rowStyles.mirRow, { backgroundColor: T.infoSoft }]}>
            <View style={rowStyles.mirItem}>
              <Text style={[rowStyles.mirLabel, { color: T.textMuted }]}>কো. মীর</Text>
              <Text style={[rowStyles.mirVal, { color: T.info }]}>{batchOrder.companyMir}</Text>
            </View>
            <Text style={[rowStyles.mirSep, { color: T.border }]}>|</Text>
            <View style={rowStyles.mirItem}>
              <Text style={[rowStyles.mirLabel, { color: T.textMuted }]}>আমা. মীর</Text>
              <Text style={[rowStyles.mirVal, { color: T.accent }]}>{batchOrder.ourMir}</Text>
            </View>
            <Text style={[rowStyles.mirSep, { color: T.border }]}>|</Text>
            <View style={rowStyles.mirItem}>
              <Text style={[rowStyles.mirLabel, { color: T.textMuted }]}>মোট PL</Text>
              <Text style={[rowStyles.mirVal, { color: typeColor }]}>
                {(batchOrder.totalFish ?? 0).toLocaleString()}
              </Text>
            </View>
            {(batchOrder as any).mirDiff !== 0 && (batchOrder as any).mirDiff != null && (
              <View
                style={[
                  rowStyles.mirDiffBadge,
                  {
                    backgroundColor: (batchOrder as any).mirDiff > 0 ? T.dangerSoft : T.warningSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    rowStyles.mirDiffText,
                    {
                      color: (batchOrder as any).mirDiff > 0 ? T.danger : T.warning,
                    },
                  ]}
                >
                  {(batchOrder as any).mirDiff > 0 ? '+' : ''}
                  {(batchOrder as any).mirDiff}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Financial info */}
        {batchOrder.deliveryStatus !== 'pending' && (
          <View style={rowStyles.deliveredInfo}>
            <Text style={[rowStyles.deliveredInfoItem, { color: T.textSecondary }]}>
              পেয়েছি:{' '}
              <Text style={{ color: T.success, fontWeight: '700' }}>
                {formatCurrency(batchOrder.customerPayment || 0)}
              </Text>
            </Text>
            {(batchOrder.dueAmount || 0) > 0 && (
              <Text style={[rowStyles.deliveredInfoItem, { color: T.textSecondary }]}>
                বাকি:{' '}
                <Text style={{ color: T.danger, fontWeight: '700' }}>
                  {formatCurrency(batchOrder.dueAmount || 0)}
                </Text>
                {batchOrder.duePaymentDate ? (
                  <Text style={{ color: T.textMuted }}>
                    {' '}
                    ({formatDate(batchOrder.duePaymentDate)} এর মধ্যে)
                  </Text>
                ) : null}
              </Text>
            )}
          </View>
        )}

        {/* Action buttons */}
        {batchOrder.deliveryStatus === 'pending' && (
          <View style={rowStyles.actionRow}>
            <TouchableOpacity
              style={[rowStyles.deliverBtn, { backgroundColor: T.accent }]}
              onPress={onDeliver}
            >
              <Ionicons name="boat" size={13} color="#fff" />
              <Text style={rowStyles.deliverBtnText}>ডেলিভারি</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rowStyles.unbatchBtn, { borderColor: T.danger }]}
              onPress={onUnbatch}
            >
              <Ionicons name="remove-circle-outline" size={13} color={T.danger} />
              <Text style={[rowStyles.unbatchBtnText, { color: T.danger }]}>আনব্যাচ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────────
export const BatchDetailsScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBO, setSelectedBO] = useState<BatchOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBatch = useCallback(async () => {
    try {
      const res = await batchAPI.getById(batchId);
      setBatch(res.data.data);
    } catch {
      toast.error('ব্যাচ লোড হয়নি');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
  }, []);

  const handleUnbatch = (bo: BatchOrder) => {
    showConfirm(
      `"${bo.order.customerName}" এর অর্ডারটি ব্যাচ থেকে সরিয়ে দেবেন? এটি pending স্ট্যাটাসে ফিরে যাবে।`,
      async () => {
        try {
          await batchAPI.removeOrder(batchId, bo.id);
          Toast.show({ type: 'success', text1: 'অর্ডার আনব্যাচ হয়েছে' });
          fetchBatch();
        } catch {
          Toast.show({ type: 'error', text1: 'আনব্যাচ ব্যর্থ হয়েছে' });
        }
      },
      undefined,
      'আনব্যাচ করুন',
    );
  };

  const handleDeliverySubmit = async (data: any) => {
    if (!selectedBO) return;
    setSaving(true);
    try {
      await batchAPI.recordDelivery(batchId, selectedBO.id, data);
      setModalVisible(false);
      setSelectedBO(null);
      await fetchBatch();
      toast.success(
        data.isPartial
          ? `বাকি ${data.remainingQuantity.toLocaleString()} PL নতুন অর্ডার হয়েছে`
          : 'ডেলিভারি সম্পন্ন!',
        data.isPartial ? 'আংশিক ডেলিভারি' : 'সফল!',
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ডেলিভারি ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  const pendingCount =
    batch?.batchOrders?.filter((o) => o.deliveryStatus === 'pending').length || 0;
  const deliveredCount =
    batch?.batchOrders?.filter((o) => o.deliveryStatus !== 'pending').length || 0;
  const totalOrders = batch?.batchOrders?.length || 0;
  const canComplete = batch?.status !== 'completed' && pendingCount === 0 && totalOrders > 0;

  // Get company order if linked
  const companyOrderId = batch?.companyOrders?.[0]?.id;
  const companyOrderRemaining = batch?.companyOrders?.[0]?.remainingQuantity || 0;

  const PONA_CHIPS = [
    { key: 'Golda', label: 'গলদা', color: '#F5A623' },
    { key: 'Bagda', label: 'বাগদা', color: '#1E88E5' },
    { key: 'Vannamei', label: 'ভেনামি', color: '#43A047' },
  ];

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  if (!batch) return null;

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBatch();
            }}
            colors={[T.accent]}
            tintColor={T.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View
          style={[styles.headerCard, { backgroundColor: T.surface, borderBottomColor: T.border }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.batchNum, { color: T.textPrimary }]}>{batch.batchNumber}</Text>
              <Text style={[styles.batchDate, { color: T.textSecondary }]}>
                {formatDate(batch.batchDate)}
              </Text>
            </View>
            <View
              style={[
                styles.progressCircle,
                { backgroundColor: T.accentSoft, borderColor: T.accent },
              ]}
            >
              <Text style={[styles.progressNum, { color: T.accent }]}>
                {deliveredCount}/{totalOrders}
              </Text>
              <Text style={[styles.progressLabel, { color: T.accent }]}>সম্পন্ন</Text>
            </View>
          </View>

          <View style={[styles.progressBg, { backgroundColor: T.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: totalOrders > 0 ? `${(deliveredCount / totalOrders) * 100}%` : '0%',
                  backgroundColor: T.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: T.textSecondary }]}>
            {pendingCount > 0 ? `${pendingCount} টি বাকি` : 'সব ডেলিভারি সম্পন্ন ✓'}
          </Text>

          {/* Action buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { borderColor: T.accent, backgroundColor: T.accentSoft },
              ]}
              onPress={() =>
                navigation.navigate('CreateBatch', {
                  batchId: batch.id,
                  batchNumber: batch.batchNumber,
                })
              }
            >
              <Ionicons name="add-circle-outline" size={14} color={T.accent} />
              <Text style={[styles.headerActionText, { color: T.accent }]}>অর্ডার যোগ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { borderColor: T.warning, backgroundColor: T.warningSoft },
              ]}
              onPress={() =>
                navigation.navigate('CompanyOrderList', {
                  batchId: batch.id,
                  batchNumber: batch.batchNumber,
                  batchDate: batch.batchDate,
                })
              }
            >
              <Ionicons name="business-outline" size={14} color={T.warning} />
              <Text style={[styles.headerActionText, { color: T.warning }]}>কোম্পানি হিসাব</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtn, { borderColor: T.info, backgroundColor: T.infoSoft }]}
              onPress={() => navigation.navigate('Collection', { batchId: batch.id })}
            >
              <Ionicons name="analytics-outline" size={14} color={T.info} />
              <Text style={[styles.headerActionText, { color: T.info }]}>কালেকশন</Text>
            </TouchableOpacity>
          </View>

          {/* Pona chips */}
          <View style={styles.ponaRow}>
            {PONA_CHIPS.map(({ key, label, color }) => {
              const ordered = (batch as any)[`totalOrdered${key}`] ?? 0;
              const delivered = (batch as any)[`totalDelivered${key}`] ?? 0;
              if (ordered === 0) return null;
              return (
                <View
                  key={key}
                  style={[styles.ponaChip, { backgroundColor: color + '18', borderColor: color }]}
                >
                  <Text style={[styles.ponaChipTitle, { color }]}>{label}</Text>
                  <Text style={[styles.ponaChipSub, { color }]}>
                    {delivered}/{ordered}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Financial row */}
          <View style={styles.finRow}>
            <View style={[styles.finItem, { backgroundColor: T.successSoft }]}>
              <Text style={[styles.finLabel, { color: T.textSecondary }]}>প্রাপ্ত</Text>
              <Text style={[styles.finVal, { color: T.success }]}>
                {formatCurrency(batch.totalCollected)}
              </Text>
            </View>
            {(batch.totalDue ?? 0) > 0 && (
              <View style={[styles.finItem, { backgroundColor: T.dangerSoft }]}>
                <Text style={[styles.finLabel, { color: T.textSecondary }]}>বাকি</Text>
                <Text style={[styles.finVal, { color: T.danger }]}>
                  {formatCurrency(batch.totalDue)}
                </Text>
                {(batch.duePendingCount ?? 0) > 0 && (
                  <View style={[styles.duePeopleBadge, { backgroundColor: T.danger }]}>
                    <Text style={styles.duePeopleText}>{batch.duePendingCount} জন</Text>
                  </View>
                )}
              </View>
            )}
            <View style={[styles.finItem, { backgroundColor: T.accentSoft }]}>
              <Text style={[styles.finLabel, { color: T.textSecondary }]}>অর্ডার</Text>
              <Text style={[styles.finVal, { color: T.accent }]}>{totalOrders} টি</Text>
            </View>
          </View>
        </View>

        {/* Company Order Info */}
        {companyOrderId && (
          <View style={[styles.companyInfoCard, { backgroundColor: T.accentSoft }]}>
            <View style={styles.companyInfoHeader}>
              <View>
                <Text style={[styles.companyInfoLabel, { color: T.textMuted }]}>
                  কোম্পানি অর্ডার
                </Text>
                <Text style={[styles.companyInfoId, { color: T.accent }]}>
                  {companyOrderId.substring(0, 8)}...
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addMoreOrderBtn, { backgroundColor: T.accent }]}
                onPress={() =>
                  navigation.navigate('CreateBatch', {
                    batchId: batch.id,
                    companyOrderId: companyOrderId,
                  })
                }
              >
                <Ionicons name="add-circle" size={16} color="#fff" />
                <Text style={styles.addMoreOrderBtnText}>আরও অর্ডার</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>
            অর্ডার তালিকা ({totalOrders} টি)
          </Text>
          <View style={styles.orderList}>
            {batch.batchOrders?.map((bo) => (
              <BatchOrderRow
                key={bo.id}
                batchOrder={bo}
                onDeliver={() => {
                  setSelectedBO(bo);
                  setModalVisible(true);
                }}
                onUnbatch={() => handleUnbatch(bo)}
              />
            ))}
          </View>
        </View>

        {/* Expenses */}
        {batch.expenses && batch.expenses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>খরচের বিবরণ</Text>
            <View style={[styles.expenseCard, { backgroundColor: T.surface }]}>
              {batch.expenses.map((e: any, i: number) => (
                <View key={i} style={[styles.expenseRow, { borderBottomColor: T.border }]}>
                  <Text style={[styles.expenseLabel, { color: T.textSecondary }]}>{e.label}</Text>
                  <Text style={[styles.expenseAmt, { color: T.textPrimary }]}>
                    {formatCurrency(e.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.expenseRow, styles.expenseTotal]}>
                <Text style={[styles.expenseTotalLabel, { color: T.textPrimary }]}>মোট খরচ</Text>
                <Text style={[styles.expenseTotalAmt, { color: T.warning }]}>
                  {formatCurrency(batch.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      {batch.status !== 'completed' && (
        <View style={[styles.bottomBar, { backgroundColor: T.surface, borderTopColor: T.border }]}>
          {!canComplete ? (
            <View style={[styles.pendingWarn, { backgroundColor: T.warningSoft }]}>
              <Ionicons name="warning-outline" size={18} color={T.warning} />
              <Text style={[styles.pendingWarnText, { color: T.warning }]}>
                {pendingCount} টি বাকি। সব ডেলিভারি শেষে কমপ্লিট করা যাবে।
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: T.success }]}
              onPress={() => navigation.navigate('CompleteBatch', { batchId: batch.id })}
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>খরচ দিয়ে ব্যাচ কমপ্লিট করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <DeliveryModal
        visible={modalVisible}
        batchOrder={selectedBO}
        onClose={() => {
          setModalVisible(false);
          setSelectedBO(null);
        }}
        onSubmit={handleDeliverySubmit}
        saving={saving}
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { padding: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  batchNum: { fontSize: 20, fontWeight: '900' },
  batchDate: { fontSize: 13, marginTop: 2 },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  progressNum: { fontSize: 14, fontWeight: '800' },
  progressLabel: { fontSize: 9 },
  progressBg: { height: 8, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 11, marginBottom: 10 },
  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerActionText: { fontSize: 11, fontWeight: '700' },
  ponaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ponaChip: { flex: 1, borderRadius: 10, padding: 8, borderWidth: 1.5, alignItems: 'center' },
  ponaChipTitle: { fontSize: 11, fontWeight: '800' },
  ponaChipSub: { fontSize: 11, fontWeight: '600' },
  finRow: { flexDirection: 'row', gap: 8 },
  finItem: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 8 },
  finLabel: { fontSize: 11 },
  finVal: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  duePeopleBadge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2 },
  duePeopleText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  companyInfoCard: { marginHorizontal: 12, marginTop: 14, borderRadius: 12, padding: 14 },
  companyInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyInfoLabel: { fontSize: 11, fontWeight: '600' },
  companyInfoId: { fontSize: 14, fontWeight: '800', marginTop: 3 },
  addMoreOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addMoreOrderBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  section: { paddingHorizontal: 12, paddingTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  orderList: { gap: 8 },
  expenseCard: { borderRadius: 10, padding: 12 },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  expenseLabel: { fontSize: 13 },
  expenseAmt: { fontSize: 13, fontWeight: '700' },
  expenseTotal: { borderBottomWidth: 0, marginTop: 4 },
  expenseTotalLabel: { fontSize: 14, fontWeight: '800' },
  expenseTotalAmt: { fontSize: 16, fontWeight: '900' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    borderTopWidth: 1,
    elevation: 10,
  },
  pendingWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  pendingWarnText: { flex: 1, fontSize: 12, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  cardDone: { opacity: 0.85 },
  typeBar: { width: 5, alignSelf: 'stretch' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingRight: 10,
  },
  customerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  mobile: { fontSize: 12, paddingRight: 10, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingRight: 10 },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: '700' },
  qty: { fontSize: 12, fontWeight: '600' },
  partialBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  partialBadgeText: { fontSize: 9, fontWeight: '700' },
  // Mir row
  mirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginRight: 10,
    borderRadius: 8,
    padding: 8,
  },
  mirItem: { alignItems: 'center', flex: 1 },
  mirLabel: { fontSize: 9 },
  mirVal: { fontSize: 12, fontWeight: '700' },
  mirSep: { fontSize: 14 },
  mirDiffBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  mirDiffText: { fontSize: 10, fontWeight: '700' },
  deliveredInfo: { paddingBottom: 10, paddingRight: 10, marginTop: 4, gap: 2 },
  deliveredInfoItem: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 8, padding: 10, paddingTop: 6 },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deliverBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  unbatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unbatchBtnText: { fontSize: 11, fontWeight: '700' },
});

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, overflow: 'hidden' },
  headerBar: { width: 4, alignSelf: 'stretch' },
  headerContent: { flex: 1, paddingLeft: 14, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  infoCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '700' },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 11, fontWeight: '700' },

  sectionCard: { marginHorizontal: 14, marginTop: 10, borderRadius: 12, padding: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  sectionTitleDot: { width: 7, height: 7, borderRadius: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionDesc: { fontSize: 11, marginBottom: 14, lineHeight: 16 },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  fieldNote: { fontSize: 11, marginBottom: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10 },
  input: { flex: 1, padding: 12, fontSize: 15 },
  inputSuffix: { paddingRight: 12, fontSize: 13, fontWeight: '700' },

  autoFillNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 9,
    marginBottom: 10,
  },
  autoFillText: { flex: 1, fontSize: 12, fontWeight: '500' },

  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  progressBg: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: '600', width: 34 },
  partialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 9,
    marginTop: 6,
  },
  partialBannerText: { flex: 1, fontSize: 12, fontWeight: '500' },

  // Mir compare visual
  mirCompare: { borderRadius: 12, padding: 14, borderWidth: 1, marginTop: 4 },
  mirCompareTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  mirCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mirCompareItem: { flex: 1, alignItems: 'center' },
  mirCompareNum: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  mirCompareLabel: { fontSize: 10, marginBottom: 4 },
  mirCompareTotal: { fontSize: 18, fontWeight: '900' },
  mirCompareVs: { fontSize: 13, fontWeight: '600', marginHorizontal: 8 },
  mirDiffRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 9 },
  mirDiffText: { fontSize: 12, fontWeight: '600', flex: 1 },

  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  calcLabel: { fontSize: 13 },
  calcVal: { fontSize: 14 },

  dueBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  dueLabel: { fontSize: 13, fontWeight: '700' },
  dueValue: { fontSize: 20, fontWeight: '900' },

  notesInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  footer: { padding: 14, borderTopWidth: 1 },
  submitBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
