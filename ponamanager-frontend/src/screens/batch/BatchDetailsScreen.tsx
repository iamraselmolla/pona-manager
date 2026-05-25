// src/screens/batch/BatchDetailsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { batchAPI } from '../../api/batchServices';
import { companyOrderAPI } from '../../api/companyOrderAPI';
import { orderAPI } from '../../api/services';
import { Batch, BatchOrder } from '../../types';
import { formatCurrency, formatDate, getPonaTypeColor } from '../../utils/helpers';
import { showConfirm } from '../../utils/AppModal';
showConfirm;

// ─── Theme ──────────────────────────────────────────────────────────────────────
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
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── Toast ──────────────────────────────────────────────────────────────────────
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

// ─── Status config ──────────────────────────────────────────────────────────────
const getStatusConfig = (T: typeof LIGHT) => ({
  pending: { label: 'পেন্ডিং', color: T.warning, bg: T.warningSoft, icon: 'time-outline' as const },
  delivered: {
    label: 'সম্পন্ন',
    color: T.success,
    bg: T.successSoft,
    icon: 'checkmark-circle-outline' as const,
  },
  partial: {
    label: 'সম্পন্ন',
    color: T.success,
    bg: T.successSoft,
    icon: 'checkmark-circle-outline' as const,
  },
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
  keyboardType = 'numeric',
}: any) => (
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
        keyboardType={keyboardType}
        placeholder={placeholder ?? '0'}
        placeholderTextColor={T.textMuted}
      />
      {suffix && <Text style={[mStyles.inputSuffix, { color: T.textMuted }]}>{suffix}</Text>}
    </View>
  </View>
);

// ─── Calc row ───────────────────────────────────────────────────────────────────
const CalcRow = ({ label, value, color, T, bold }: any) => (
  <View style={[mStyles.calcRow, { borderBottomColor: T.border }]}>
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

// ─── Mir compare ────────────────────────────────────────────────────────────────
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
          <Text style={[mStyles.mirCompareLabel, { color: T.textMuted }]}>কোম্পানি × পলি</Text>
          <Text style={[mStyles.mirCompareTotal, { color: T.info }]}>
            {compTotal.toLocaleString()} PL
          </Text>
        </View>
        <Text style={[mStyles.mirCompareVs, { color: T.textMuted }]}>VS</Text>
        <View style={mStyles.mirCompareItem}>
          <Text style={[mStyles.mirCompareNum, { color: T.accent }]}>
            {ourMir} × {poly}
          </Text>
          <Text style={[mStyles.mirCompareLabel, { color: T.textMuted }]}>আমাদের × পলি</Text>
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
              ? `কোম্পানি ${Math.abs(diff).toLocaleString()} PL বেশি`
              : `কোম্পানি ${Math.abs(diff).toLocaleString()} PL কম`}
        </Text>
      </View>
    </View>
  );
};

// ─── Delivery Modal ──────────────────────────────────────────────────────────────
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

  const [deliveredQty, setDeliveredQty] = useState('');
  const [companyMir, setCompanyMir] = useState('');
  const [ourMir, setOurMir] = useState('');
  const [totalPoly, setTotalPoly] = useState('');
  const [deliveryRate, setDeliveryRate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [payment, setPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isPartialMode, setIsPartialMode] = useState(false);
  const [remainingQtyInput, setRemainingQtyInput] = useState('');

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
      setIsPartialMode(false);
      setRemainingQtyInput('');
    }
  }, [batchOrder]);

  if (!batchOrder) return null;

  const orderedQty = batchOrder.order.plQuantity;
  const advance = batchOrder.order.advanceAmount || 0;
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType) ?? T.accent;

  const cMir = parseFloat(companyMir) || 0;
  const oMir = parseFloat(ourMir) || 0;
  const poly = parseFloat(totalPoly) || 0;
  const rate = parseFloat(deliveryRate) || 0;
  const disc = parseFloat(discount) || 0;
  const paid = parseFloat(payment) || 0;

  // Delivered qty — from mir×poly or manual input
  const mirCalcQty = oMir > 0 && poly > 0 ? oMir * poly : 0;
  const deliveredNum = mirCalcQty > 0 ? mirCalcQty : parseFloat(deliveredQty) || 0;

  // Remaining — orderedQty - deliveredNum, editable
  const autoRemaining = Math.max(0, orderedQty - deliveredNum);
  const remainingNum = remainingQtyInput
    ? Math.max(0, parseFloat(remainingQtyInput) || 0)
    : autoRemaining;

  // Payment
  const ourTotal = oMir * poly;
  const mirDiff = cMir * poly - ourTotal;
  const finalAmt = Math.max(0, deliveredNum * rate - disc);
  const totalPaid = advance + paid;
  const dueAmt = Math.max(0, finalAmt - totalPaid);

  // If partial mode and overpaid → carry to new order as advance
  const advanceCarry = isPartialMode && totalPaid > finalAmt ? totalPaid - finalAmt : 0;

  const pct = orderedQty > 0 ? Math.min((deliveredNum / orderedQty) * 100, 100) : 0;

  const handleSubmit = () => {
    if (!deliveredNum || deliveredNum <= 0) {
      toast.warn('ডেলিভারি পরিমাণ দিন');
      return;
    }
    if (!rate || rate <= 0) {
      toast.warn('দর দিন');
      return;
    }

    const autoNote = isPartialMode
      ? `[আংশিক ডেলিভারি] বাকি ${remainingNum.toLocaleString()} PL নতুন অর্ডার হয়েছে।${advanceCarry > 0 ? ` অগ্রীম ৳${advanceCarry.toLocaleString()} নতুন অর্ডারে যোগ হয়েছে।` : ''}${notes ? ' ' + notes : ''}`
      : notes;

    onSubmit({
      deliveredQuantity: deliveredNum,
      companyMir: cMir || undefined,
      ourMir: oMir || undefined,
      totalPoly: poly || undefined,
      mirDiff: cMir && oMir && poly ? mirDiff : undefined,
      totalFish: ourTotal || undefined,
      deliveredPL: poly || undefined,
      deliveryRate: rate,
      discount: disc,
      customerPayment: paid,
      dueAmount: dueAmt,
      duePaymentDate: dueAmt > 0 && dueDate ? dueDate : undefined,
      finalAmount: finalAmt,
      // always delivered status — partial is just a flag
      isPartial: isPartialMode,
      remainingQuantity: isPartialMode ? remainingNum : 0,
      advanceCarryOver: advanceCarry,
      notes: autoNote,
    });
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
                    <Text
                      style={[
                        mStyles.infoValue,
                        { color: (row as any).valueColor ?? T.textPrimary },
                      ]}
                    >
                      {row.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Mir section */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: T.info }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>মীর তথ্য</Text>
              </View>
              <InputField
                label="কোম্পানির মীর"
                value={companyMir}
                onChange={setCompanyMir}
                placeholder="যেমন: ১১৫০"
                T={T}
                highlight
                note="কোম্পানি প্রতি পলিতে কত পোনা দিয়েছে"
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
                onChange={(v: string) => {
                  setTotalPoly(v);
                  if (oMir > 0) {
                    const auto = oMir * (parseFloat(v) || 0);
                    if (auto > 0) setDeliveredQty(auto.toString());
                  }
                }}
                suffix="পলি"
                placeholder="যেমন: ৪০"
                T={T}
                note="এই কাস্টমারের কতটি পলি"
              />
              <MirCompare companyMir={cMir} ourMir={oMir} poly={poly} T={T} />
            </View>

            {/* Quantity section */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: typeColor }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>ডেলিভারি পরিমাণ</Text>
              </View>

              {mirCalcQty > 0 && (
                <View style={[mStyles.autoFillNote, { backgroundColor: T.accentSoft }]}>
                  <Ionicons name="information-circle" size={13} color={T.accent} />
                  <Text style={[mStyles.autoFillText, { color: T.accent }]}>
                    মীর × পলি = {ourTotal.toLocaleString()} PL (স্বয়ংক্রিয়)
                  </Text>
                </View>
              )}

              <InputField
                label="ডেলিভারিকৃত পরিমাণ (PL)"
                value={mirCalcQty > 0 ? mirCalcQty.toString() : deliveredQty}
                onChange={(v: string) => {
                  if (mirCalcQty === 0) setDeliveredQty(v);
                }}
                suffix="PL"
                placeholder={`সর্বোচ্চ ${orderedQty.toLocaleString()}`}
                T={T}
              />

              {/* Progress */}
              {deliveredNum > 0 && (
                <View style={mStyles.progressWrap}>
                  <View style={[mStyles.progressBg, { backgroundColor: T.border }]}>
                    <View
                      style={[
                        mStyles.progressFill,
                        { width: `${pct}%`, backgroundColor: T.success },
                      ]}
                    />
                  </View>
                  <Text style={[mStyles.progressPct, { color: T.textMuted }]}>
                    {pct.toFixed(0)}%
                  </Text>
                </View>
              )}

              {/* Partial switcher */}
              <TouchableOpacity
                style={[
                  mStyles.partialSwitcher,
                  {
                    backgroundColor: isPartialMode ? T.infoSoft : T.inputBg,
                    borderColor: isPartialMode ? T.info + '60' : T.border,
                  },
                ]}
                onPress={() => {
                  setIsPartialMode(!isPartialMode);
                  setRemainingQtyInput('');
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[mStyles.partialSwitcherTitle, { color: T.textPrimary }]}>
                    আংশিক ডেলিভারি
                  </Text>
                  <Text style={[mStyles.partialSwitcherSub, { color: T.textMuted }]}>
                    চালু হলে বাকি PL নতুন pending অর্ডার হবে
                  </Text>
                </View>
                <View
                  style={[
                    mStyles.switchTrack,
                    { backgroundColor: isPartialMode ? T.info : T.border },
                  ]}
                >
                  <View style={[mStyles.switchThumb, { left: isPartialMode ? 20 : 2 }]} />
                </View>
              </TouchableOpacity>

              {/* Remaining — shown only in partial mode */}
              {isPartialMode && (
                <View
                  style={[
                    mStyles.remainingBox,
                    { backgroundColor: T.infoSoft, borderColor: T.info + '33' },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[mStyles.remainingLabel, { color: T.info }]}>
                      বাকি PL (নতুন অর্ডার)
                    </Text>
                    <Text style={[mStyles.remainingAuto, { color: T.textMuted }]}>
                      {orderedQty} − {deliveredNum.toFixed(0)} = {autoRemaining.toFixed(0)} PL
                      (ডিফল্ট)
                    </Text>
                    {advanceCarry > 0 && (
                      <Text style={[mStyles.remainingAuto, { color: T.success, marginTop: 2 }]}>
                        অগ্রীম ৳{advanceCarry.toLocaleString()} নতুন অর্ডারে যাবে
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={[
                      mStyles.remainingInput,
                      { borderColor: T.info + '60', color: T.info, backgroundColor: T.inputBg },
                    ]}
                    value={remainingQtyInput}
                    onChangeText={setRemainingQtyInput}
                    keyboardType="numeric"
                    placeholder={autoRemaining.toString()}
                    placeholderTextColor={T.info + '80'}
                  />
                </View>
              )}
            </View>

            {/* Payment section */}
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
                  note="কবে বাকি দেবে"
                  keyboardType="default"
                />
              )}
            </View>

            {/* Summary */}
            <View style={[mStyles.sectionCard, { backgroundColor: T.surface }]}>
              <View style={mStyles.sectionTitleRow}>
                <View style={[mStyles.sectionTitleDot, { backgroundColor: T.warning }]} />
                <Text style={[mStyles.sectionTitle, { color: T.textMuted }]}>হিসাব সারসংক্ষেপ</Text>
              </View>
              <CalcRow
                label={`${deliveredNum.toLocaleString()} PL × ৳${rate}`}
                value={formatCurrency(deliveredNum * rate)}
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
                bold
              />
              {advance > 0 && (
                <CalcRow
                  label="আগাম জমা"
                  value={`- ${formatCurrency(advance)}`}
                  color={T.success}
                  T={T}
                />
              )}
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
              {isPartialMode && (
                <View
                  style={[
                    mStyles.calcRow,
                    {
                      backgroundColor: T.infoSoft,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      borderBottomColor: 'transparent',
                      marginTop: 6,
                    },
                  ]}
                >
                  <Text style={[mStyles.calcLabel, { color: T.info }]}>নতুন অর্ডার (বাকি PL)</Text>
                  <Text style={[mStyles.calcVal, { color: T.info, fontWeight: '800' }]}>
                    {remainingNum.toLocaleString()} PL
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
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={mStyles.submitBtnText}>
                    {isPartialMode ? 'ডেলিভারি ও নতুন অর্ডার তৈরি' : 'ডেলিভারি নিশ্চিত করুন'}
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

// ─── Connect Company Order Modal ─────────────────────────────────────────────────
const ConnectCompanyOrderModal = ({
  visible,
  batchId,
  onClose,
  onConnected,
}: {
  visible: boolean;
  batchId: string;
  onClose: () => void;
  onConnected: () => void;
}) => {
  const T = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    companyOrderAPI
      .getAll()
      .then((res) => {
        const raw = res?.data?.data;
        setOrders(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleConnect = async (id: string) => {
    setConnecting(id);
    try {
      await batchAPI.linkCompanyOrder(batchId, id);
      toast.success('কোম্পানি অর্ডার কানেক্ট হয়েছে');
      onConnected();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'কানেক্ট ব্যর্থ');
    } finally {
      setConnecting(null);
    }
  };

  const PONA_COLORS: Record<string, string> = {
    Golda: '#F5A623',
    Bagda: '#1E88E5',
    Vannamei: '#43A047',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[cStyles.container, { backgroundColor: T.bg }]}>
        <View style={[cStyles.header, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
          <View style={[cStyles.headerBar, { backgroundColor: T.warning }]} />
          <View style={cStyles.headerContent}>
            <Text style={[cStyles.headerTitle, { color: T.textPrimary }]}>
              কোম্পানি অর্ডার কানেক্ট
            </Text>
            <Text style={[cStyles.headerSub, { color: T.textMuted }]}>অর্ডার বেছে নিন</Text>
          </View>
          <TouchableOpacity style={[cStyles.closeBtn, { backgroundColor: T.bg }]} onPress={onClose}>
            <Ionicons name="close" size={20} color={T.textPrimary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={cStyles.center}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : orders.length === 0 ? (
          <View style={cStyles.center}>
            <Ionicons name="business-outline" size={44} color={T.textMuted} />
            <Text style={[cStyles.emptyText, { color: T.textMuted }]}>
              কোনো কোম্পানি অর্ডার নেই
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const color = PONA_COLORS[item.ponaType] ?? T.accent;
              const isConn = connecting === item.id;
              return (
                <View
                  style={[
                    cStyles.orderCard,
                    { backgroundColor: T.surface, borderColor: T.border, borderLeftColor: color },
                  ]}
                >
                  <View style={cStyles.orderCardTop}>
                    <View style={[cStyles.ponaBadge, { backgroundColor: color + '18' }]}>
                      <Text style={[cStyles.ponaBadgeText, { color }]}>{item.ponaType}</Text>
                    </View>
                    <Text style={[cStyles.orderDate, { color: T.textMuted }]}>
                      {formatDate(item.expectedDate)}
                    </Text>
                  </View>
                  {item.mirValue && (
                    <View style={[cStyles.mirBox, { backgroundColor: T.infoSoft }]}>
                      <Text style={[cStyles.mirBoxText, { color: T.info }]}>
                        মীর: {item.mirValue} × পলি: {item.totalPoly} ={' '}
                        {(item.totalPL ?? 0).toLocaleString()} PL
                      </Text>
                    </View>
                  )}
                  <View style={cStyles.orderStats}>
                    <View style={cStyles.orderStat}>
                      <Text style={[cStyles.orderStatLabel, { color: T.textMuted }]}>পেমেন্ট</Text>
                      <Text style={[cStyles.orderStatVal, { color: T.textPrimary }]}>
                        {formatCurrency(item.paymentAmount)}
                      </Text>
                    </View>
                    <View style={[cStyles.orderStatDiv, { backgroundColor: T.border }]} />
                    <View style={cStyles.orderStat}>
                      <Text style={[cStyles.orderStatLabel, { color: T.textMuted }]}>দর/PL</Text>
                      <Text style={[cStyles.orderStatVal, { color: T.textPrimary }]}>
                        ৳{item.ratePerPL}
                      </Text>
                    </View>
                    <View style={[cStyles.orderStatDiv, { backgroundColor: T.border }]} />
                    <View style={cStyles.orderStat}>
                      <Text style={[cStyles.orderStatLabel, { color: T.textMuted }]}>মোট PL</Text>
                      <Text style={[cStyles.orderStatVal, { color }]}>
                        {(item.totalPL ?? item.expectedPL ?? 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      cStyles.connectBtn,
                      { backgroundColor: isConn ? T.warning + '80' : T.warning },
                    ]}
                    onPress={() => handleConnect(item.id)}
                    disabled={!!connecting}
                    activeOpacity={0.85}
                  >
                    {isConn ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="link-outline" size={15} color="#fff" />
                        <Text style={cStyles.connectBtnText}>এই ব্যাচে কানেক্ট করুন</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
};

// ─── Add Order To Batch Modal ────────────────────────────────────────────────────
const AddOrderToBatchModal = ({
  visible,
  batchId,
  onClose,
  onAdded,
}: {
  visible: boolean;
  batchId: string;
  onClose: () => void;
  onAdded: () => void;
}) => {
  const T = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    orderAPI
      .getAll({ status: 'pending', limit: 200 })
      .then((res: any) => {
        const raw = res?.data?.data?.data;
        setOrders(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleAdd = async (orderId: string) => {
    setAdding(orderId);
    try {
      await batchAPI.addOrderToBatch(batchId, orderId);
      toast.success('অর্ডার ব্যাচে যোগ হয়েছে');
      onAdded();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'যোগ ব্যর্থ');
    } finally {
      setAdding(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[cStyles.container, { backgroundColor: T.bg }]}>
        <View style={[cStyles.header, { backgroundColor: T.surface, borderBottomColor: T.border }]}>
          <View style={[cStyles.headerBar, { backgroundColor: T.accent }]} />
          <View style={cStyles.headerContent}>
            <Text style={[cStyles.headerTitle, { color: T.textPrimary }]}>অর্ডার যোগ করুন</Text>
            <Text style={[cStyles.headerSub, { color: T.textMuted }]}>
              পেন্ডিং অর্ডার থেকে বেছে নিন
            </Text>
          </View>
          <TouchableOpacity style={[cStyles.closeBtn, { backgroundColor: T.bg }]} onPress={onClose}>
            <Ionicons name="close" size={20} color={T.textPrimary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={cStyles.center}>
            <ActivityIndicator size="large" color={T.accent} />
          </View>
        ) : orders.length === 0 ? (
          <View style={cStyles.center}>
            <Ionicons name="list-outline" size={44} color={T.textMuted} />
            <Text style={[cStyles.emptyText, { color: T.textMuted }]}>কোনো পেন্ডিং অর্ডার নেই</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const typeColor = getPonaTypeColor(item.ponaType) ?? T.accent;
              const isAdding = adding === item.id;
              return (
                <View
                  style={[
                    cStyles.orderCard,
                    {
                      backgroundColor: T.surface,
                      borderColor: T.border,
                      borderLeftColor: typeColor,
                    },
                  ]}
                >
                  <View style={cStyles.orderCardTop}>
                    <View style={[cStyles.ponaBadge, { backgroundColor: typeColor + '18' }]}>
                      <Text style={[cStyles.ponaBadgeText, { color: typeColor }]}>
                        {item.ponaType}
                      </Text>
                    </View>
                    <Text style={[cStyles.orderDate, { color: T.textMuted }]}>
                      {formatDate(item.deliveryDate)}
                    </Text>
                  </View>
                  <View style={cStyles.orderStats}>
                    <View style={cStyles.orderStat}>
                      <Text style={[cStyles.orderStatLabel, { color: T.textMuted }]}>কাস্টমার</Text>
                      <Text style={[cStyles.orderStatVal, { color: T.textPrimary }]}>
                        {item.customerName}
                      </Text>
                    </View>
                    <View style={[cStyles.orderStatDiv, { backgroundColor: T.border }]} />
                    <View style={cStyles.orderStat}>
                      <Text style={[cStyles.orderStatLabel, { color: T.textMuted }]}>পরিমাণ</Text>
                      <Text style={[cStyles.orderStatVal, { color: T.textPrimary }]}>
                        {item.plQuantity?.toLocaleString()} PL
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      cStyles.connectBtn,
                      { backgroundColor: isAdding ? T.accent + '80' : T.accent },
                    ]}
                    onPress={() => handleAdd(item.id)}
                    disabled={!!adding}
                    activeOpacity={0.85}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={15} color="#fff" />
                        <Text style={cStyles.connectBtnText}>এই ব্যাচে যোগ করুন</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
};

// ─── Company Order Summary ────────────────────────────────────────────────────────
const CompanyOrderSummary = ({ companyOrder, batchOrders, T, onDisconnect, onViewDetail }: any) => {
  const totalOurMir = batchOrders?.reduce((s: number, o: any) => s + (o.ourMir ?? 0), 0) ?? 0;
  const totalCompanyMir =
    batchOrders?.reduce((s: number, o: any) => s + (o.companyMir ?? 0), 0) ?? 0;
  const totalFish = batchOrders?.reduce((s: number, o: any) => s + (o.totalFish ?? 0), 0) ?? 0;
  const totalMirDiff = totalCompanyMir - totalOurMir;
  const color =
    ({ Golda: '#F5A623', Bagda: '#1E88E5', Vannamei: '#43A047' } as any)[companyOrder.ponaType] ??
    T.accent;

  return (
    <View style={[styles.companyCard, { backgroundColor: T.surface, borderColor: T.border }]}>
      <View style={[styles.companyCardHeader, { borderBottomColor: T.border }]}>
        <View style={[styles.companyCardIcon, { backgroundColor: T.warningSoft }]}>
          <Ionicons name="business-outline" size={16} color={T.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.companyCardTitle, { color: T.textPrimary }]}>কোম্পানি অর্ডার</Text>
          <Text style={[styles.companyCardSub, { color: T.textMuted }]}>
            {companyOrder.ponaType} · {formatDate(companyOrder.expectedDate)}
          </Text>
        </View>
        <View style={styles.companyCardActions}>
          <View
            style={[
              styles.companyStatusBadge,
              {
                backgroundColor:
                  companyOrder.status === 'delivered' ? T.successSoft : T.warningSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.companyStatusText,
                { color: companyOrder.status === 'delivered' ? T.success : T.warning },
              ]}
            >
              {companyOrder.status === 'delivered' ? 'পাওয়া গেছে' : 'অপেক্ষায়'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.companyDisconnectBtn, { borderColor: T.border }]}
            onPress={onDisconnect}
          >
            <Ionicons name="unlink-outline" size={13} color={T.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {companyOrder.mirValue > 0 && companyOrder.totalPoly > 0 && (
        <View style={[styles.companyMirVisual, { backgroundColor: T.infoSoft }]}>
          <View style={styles.companyMirItem}>
            <Text style={[styles.companyMirNum, { color: T.info }]}>{companyOrder.mirValue}</Text>
            <Text style={[styles.companyMirLabel, { color: T.textMuted }]}>মীর</Text>
          </View>
          <Text style={[styles.companyMirOp, { color: T.textMuted }]}>×</Text>
          <View style={styles.companyMirItem}>
            <Text style={[styles.companyMirNum, { color: T.info }]}>{companyOrder.totalPoly}</Text>
            <Text style={[styles.companyMirLabel, { color: T.textMuted }]}>পলি</Text>
          </View>
          <Text style={[styles.companyMirOp, { color: T.textMuted }]}>=</Text>
          <View style={styles.companyMirItem}>
            <Text style={[styles.companyMirNumBig, { color: T.info }]}>
              {(companyOrder.totalPL ?? 0).toLocaleString()}
            </Text>
            <Text style={[styles.companyMirLabel, { color: T.textMuted }]}>মোট PL</Text>
          </View>
        </View>
      )}

      <View style={styles.companyStatsRow}>
        <View style={styles.companyStatItem}>
          <Text style={[styles.companyStatLabel, { color: T.textMuted }]}>পেমেন্ট</Text>
          <Text style={[styles.companyStatVal, { color: T.textPrimary }]}>
            {formatCurrency(companyOrder.paymentAmount)}
          </Text>
        </View>
        <View style={[styles.companyStatDiv, { backgroundColor: T.border }]} />
        <View style={styles.companyStatItem}>
          <Text style={[styles.companyStatLabel, { color: T.textMuted }]}>দর/PL</Text>
          <Text style={[styles.companyStatVal, { color: T.textPrimary }]}>
            ৳{companyOrder.ratePerPL}
          </Text>
        </View>
        <View style={[styles.companyStatDiv, { backgroundColor: T.border }]} />
        <View style={styles.companyStatItem}>
          <Text style={[styles.companyStatLabel, { color: T.textMuted }]}>
            {companyOrder.status === 'delivered' ? 'মোট দাম' : 'আনু. PL'}
          </Text>
          <Text style={[styles.companyStatVal, { color }]}>
            {companyOrder.status === 'delivered'
              ? formatCurrency(companyOrder.actualAmount ?? companyOrder.paymentAmount)
              : `${(companyOrder.expectedPL ?? 0).toLocaleString()} PL`}
          </Text>
        </View>
      </View>

      {companyOrder.status === 'delivered' && (
        <View
          style={[
            styles.companyNetRow,
            {
              backgroundColor: companyOrder.netDue > 0 ? T.dangerSoft : T.successSoft,
              marginHorizontal: 14,
              marginBottom: 10,
            },
          ]}
        >
          <Ionicons
            name={companyOrder.netDue > 0 ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={13}
            color={companyOrder.netDue > 0 ? T.danger : T.success}
          />
          <Text
            style={[
              styles.companyNetLabel,
              { color: companyOrder.netDue > 0 ? T.danger : T.success },
            ]}
          >
            {companyOrder.netDue > 0
              ? `কোম্পানিকে দিতে হবে: ${formatCurrency(companyOrder.netDue)}`
              : companyOrder.netAdvance > 0
                ? `কোম্পানি দেবে: ${formatCurrency(companyOrder.netAdvance)}`
                : 'হিসাব ক্লিয়ার ✓'}
          </Text>
        </View>
      )}

      {totalOurMir > 0 && (
        <>
          <View style={[styles.companyDivider, { backgroundColor: T.border }]} />
          <View style={{ paddingHorizontal: 14, paddingBottom: 4 }}>
            <Text style={[styles.companyMirCompareTitle, { color: T.textMuted }]}>
              ব্যাচ ডেলিভারি মীর তুলনা
            </Text>
          </View>
          <View style={styles.companyMirCompareRow}>
            <View style={styles.companyMirCompareItem}>
              <Text style={[styles.companyMirCompareNum, { color: T.info }]}>
                {totalCompanyMir.toLocaleString()}
              </Text>
              <Text style={[styles.companyMirCompareLabel, { color: T.textMuted }]}>
                কোম্পানি মীর
              </Text>
            </View>
            <View style={[styles.companyMirVsDot, { backgroundColor: T.border }]}>
              <Text style={[styles.companyMirVsText, { color: T.textMuted }]}>VS</Text>
            </View>
            <View style={styles.companyMirCompareItem}>
              <Text style={[styles.companyMirCompareNum, { color: T.accent }]}>
                {totalOurMir.toLocaleString()}
              </Text>
              <Text style={[styles.companyMirCompareLabel, { color: T.textMuted }]}>
                আমাদের মীর
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.companyMirDiffBanner,
              {
                backgroundColor:
                  totalMirDiff === 0
                    ? T.successSoft
                    : totalMirDiff > 0
                      ? T.dangerSoft
                      : T.warningSoft,
                marginHorizontal: 14,
                marginBottom: 12,
              },
            ]}
          >
            <Ionicons
              name={
                totalMirDiff === 0
                  ? 'checkmark-circle'
                  : totalMirDiff > 0
                    ? 'arrow-up-circle'
                    : 'arrow-down-circle'
              }
              size={13}
              color={totalMirDiff === 0 ? T.success : totalMirDiff > 0 ? T.danger : T.warning}
            />
            <Text
              style={[
                styles.companyMirDiffText,
                { color: totalMirDiff === 0 ? T.success : totalMirDiff > 0 ? T.danger : T.warning },
              ]}
            >
              {totalMirDiff === 0
                ? 'মীর সম্পূর্ণ মিলছে'
                : totalMirDiff > 0
                  ? `${Math.abs(totalMirDiff).toLocaleString()} PL বেশি (কোম্পানি)`
                  : `${Math.abs(totalMirDiff).toLocaleString()} PL কম (কোম্পানি)`}
            </Text>
            {totalFish > 0 && (
              <Text
                style={[
                  styles.companyTotalFish,
                  {
                    color: totalMirDiff === 0 ? T.success : totalMirDiff > 0 ? T.danger : T.warning,
                  },
                ]}
              >
                মোট: {totalFish.toLocaleString()} PL
              </Text>
            )}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.companyViewBtn, { borderTopColor: T.border }]}
        onPress={onViewDetail}
        activeOpacity={0.8}
      >
        <Text style={[styles.companyViewBtnText, { color: T.textSecondary }]}>বিস্তারিত দেখুন</Text>
        <Ionicons name="chevron-forward" size={13} color={T.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Batch Order Row ─────────────────────────────────────────────────────────────
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
  const wasPartial = batchOrder.isPartial;

  return (
    <View
      style={[
        rowStyles.card,
        { backgroundColor: T.surface },
        batchOrder.deliveryStatus !== 'pending' && rowStyles.cardDone,
      ]}
    >
      <View style={[rowStyles.typeBar, { backgroundColor: typeColor }]} />
      <View style={{ flex: 1, paddingLeft: 10 }}>
        <View style={rowStyles.top}>
          <Text style={[rowStyles.customerName, { color: T.textPrimary }]}>
            {batchOrder.order.customerName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {wasPartial && batchOrder.deliveryStatus !== 'pending' && (
              <View style={[rowStyles.partialBadge, { backgroundColor: T.infoSoft }]}>
                <Text style={[rowStyles.partialBadgeText, { color: T.info }]}>আংশিক</Text>
              </View>
            )}
            <View style={[rowStyles.statusPill, { backgroundColor: st.bg }]}>
              <Ionicons name={st.icon} size={11} color={st.color} />
              <Text style={[rowStyles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
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
        </View>

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
                    { color: (batchOrder as any).mirDiff > 0 ? T.danger : T.warning },
                  ]}
                >
                  {(batchOrder as any).mirDiff > 0 ? '+' : ''}
                  {(batchOrder as any).mirDiff}
                </Text>
              </View>
            )}
          </View>
        )}

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
                {batchOrder.duePaymentDate && (
                  <Text style={{ color: T.textMuted }}>
                    {' '}
                    ({formatDate(batchOrder.duePaymentDate)} এর মধ্যে)
                  </Text>
                )}
              </Text>
            )}
          </View>
        )}

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

// ─── Main Screen ─────────────────────────────────────────────────────────────────
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
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [addOrderModalVisible, setAddOrderModalVisible] = useState(false);
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
      `"${bo.order.customerName}" এর অর্ডারটি ব্যাচ থেকে সরিয়ে দেবেন?`,
      async () => {
        try {
          await batchAPI.removeOrder(batchId, bo.id);
          toast.success('অর্ডার আনব্যাচ হয়েছে');
          fetchBatch();
        } catch {
          toast.error('আনব্যাচ ব্যর্থ হয়েছে');
        }
      },
      undefined,
      'আনব্যাচ করুন',
    );
  };

  const handleDisconnectCompany = () => {
    showConfirm(
      'এই ব্যাচ থেকে কোম্পানি অর্ডার কানেকশন সরাতে চান?',
      async () => {
        try {
          await batchAPI.unlinkCompanyOrder(batchId);
          toast.success('কোম্পানি অর্ডার সরানো হয়েছে');
          fetchBatch();
        } catch {
          toast.error('সরানো ব্যর্থ');
        }
      },
      undefined,
      'কোম্পানি অর্ডার সরান',
    );
  };

  const handleDeliverySubmit = async (data: any) => {
    const currentBO = selectedBO;
    if (!currentBO) return;
    setSaving(true);
    try {
      await batchAPI.recordDelivery(batchId, currentBO.id, data);
      toast.success(
        data.isPartial
          ? `বাকি ${data.remainingQuantity.toLocaleString()} PL নতুন অর্ডার হয়েছে`
          : 'ডেলিভারি সম্পন্ন!',
        data.isPartial ? 'আংশিক ডেলিভারি' : 'সফল!',
      );
      setModalVisible(false);
      setTimeout(() => setSelectedBO(null), 300);
      await fetchBatch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ডেলিভারি ব্যর্থ');
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
  const companyOrder = (batch as any)?.companyOrders?.[0] ?? null;

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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { borderColor: T.accent, backgroundColor: T.accentSoft },
              ]}
              onPress={() => setAddOrderModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={14} color={T.accent} />
              <Text style={[styles.headerActionText, { color: T.accent }]}>অর্ডার যোগ</Text>
            </TouchableOpacity>
            {!companyOrder ? (
              <TouchableOpacity
                style={[
                  styles.headerActionBtn,
                  { borderColor: T.warning, backgroundColor: T.warningSoft },
                ]}
                onPress={() => setConnectModalVisible(true)}
              >
                <Ionicons name="link-outline" size={14} color={T.warning} />
                <Text style={[styles.headerActionText, { color: T.warning }]}>
                  কোম্পানি কানেক্ট
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.headerActionBtn,
                  { borderColor: T.warning, backgroundColor: T.warningSoft },
                ]}
                onPress={() =>
                  navigation.navigate('CompanyOrderDetail', { orderId: companyOrder.id })
                }
              >
                <Ionicons name="business-outline" size={14} color={T.warning} />
                <Text style={[styles.headerActionText, { color: T.warning }]}>কোম্পানি হিসাব</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerActionBtn, { borderColor: T.info, backgroundColor: T.infoSoft }]}
              onPress={() => navigation.navigate('Collection', { batchId: batch.id })}
            >
              <Ionicons name="analytics-outline" size={14} color={T.info} />
              <Text style={[styles.headerActionText, { color: T.info }]}>কালেকশন</Text>
            </TouchableOpacity>
          </View>
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

        {/* Company order */}
        {companyOrder ? (
          <View style={{ marginTop: 14 }}>
            <CompanyOrderSummary
              companyOrder={companyOrder}
              batchOrders={batch.batchOrders}
              T={T}
              onDisconnect={handleDisconnectCompany}
              onViewDetail={() =>
                navigation.navigate('CompanyOrderDetail', { orderId: companyOrder.id })
              }
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.connectCompanyBanner,
              { backgroundColor: T.warningSoft, borderColor: T.warning + '44' },
            ]}
            onPress={() => setConnectModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="link-outline" size={16} color={T.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.connectCompanyTitle, { color: T.warning }]}>
                কোম্পানি অর্ডার কানেক্ট করুন
              </Text>
              <Text style={[styles.connectCompanySub, { color: T.warning }]}>
                মীর হিসাব ও কোম্পানির সাথে তুলনা করতে
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={T.warning} />
          </TouchableOpacity>
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
          setTimeout(() => setSelectedBO(null), 300);
        }}
        onSubmit={handleDeliverySubmit}
        saving={saving}
      />
      <ConnectCompanyOrderModal
        visible={connectModalVisible}
        batchId={batchId}
        onClose={() => setConnectModalVisible(false)}
        onConnected={fetchBatch}
      />
      <AddOrderToBatchModal
        visible={addOrderModalVisible}
        batchId={batchId}
        onClose={() => setAddOrderModalVisible(false)}
        onAdded={fetchBatch}
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────────
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
  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
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
  connectCompanyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  connectCompanyTitle: { fontSize: 13, fontWeight: '700' },
  connectCompanySub: { fontSize: 11, marginTop: 2 },
  companyCard: { marginHorizontal: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  companyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
  },
  companyCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyCardTitle: { fontSize: 14, fontWeight: '700' },
  companyCardSub: { fontSize: 11, marginTop: 1 },
  companyCardActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  companyStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  companyStatusText: { fontSize: 10, fontWeight: '700' },
  companyDisconnectBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyMirVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 6,
  },
  companyMirItem: { alignItems: 'center', flex: 1 },
  companyMirNum: { fontSize: 20, fontWeight: '800' },
  companyMirNumBig: { fontSize: 26, fontWeight: '900' },
  companyMirLabel: { fontSize: 10, marginTop: 3 },
  companyMirOp: { fontSize: 18, fontWeight: '300' },
  companyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  companyStatItem: { flex: 1, alignItems: 'center' },
  companyStatDiv: { width: 1, height: 28 },
  companyStatLabel: { fontSize: 10, marginBottom: 3 },
  companyStatVal: { fontSize: 13, fontWeight: '700' },
  companyNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    padding: 10,
  },
  companyNetLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  companyDivider: { height: 1, marginHorizontal: 14, marginBottom: 10, marginTop: 4 },
  companyMirCompareTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  companyMirCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  companyMirCompareItem: { flex: 1, alignItems: 'center' },
  companyMirCompareNum: { fontSize: 18, fontWeight: '900' },
  companyMirCompareLabel: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  companyMirVsDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  companyMirVsText: { fontSize: 9, fontWeight: '700' },
  companyMirDiffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 8,
    padding: 10,
  },
  companyMirDiffText: { flex: 1, fontSize: 12, fontWeight: '600' },
  companyTotalFish: { fontSize: 11, fontWeight: '700' },
  companyViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: 1,
    padding: 12,
  },
  companyViewBtnText: { fontSize: 13, fontWeight: '600' },
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
  partialSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 13,
    marginTop: 10,
  },
  partialSwitcherTitle: { fontSize: 13, fontWeight: '700' },
  partialSwitcherSub: { fontSize: 11, marginTop: 2 },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    position: 'relative',
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    position: 'absolute',
    elevation: 2,
  },
  remainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  remainingLabel: { fontSize: 12, fontWeight: '700' },
  remainingAuto: { fontSize: 10, marginTop: 3 },
  remainingInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    fontWeight: '800',
    width: 72,
    textAlign: 'center',
  },
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

const cStyles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  emptyText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, overflow: 'hidden' },
  headerBar: { width: 4, alignSelf: 'stretch' },
  headerContent: { flex: 1, paddingLeft: 14, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  orderCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, overflow: 'hidden' },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingBottom: 8,
  },
  ponaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  ponaBadgeText: { fontSize: 11, fontWeight: '700' },
  orderDate: { fontSize: 11 },
  mirBox: { marginHorizontal: 12, borderRadius: 8, padding: 9, marginBottom: 8 },
  mirBoxText: { fontSize: 12, fontWeight: '600' },
  orderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  orderStat: { flex: 1, alignItems: 'center' },
  orderStatDiv: { width: 1, height: 24 },
  orderStatLabel: { fontSize: 10, marginBottom: 2 },
  orderStatVal: { fontSize: 13, fontWeight: '700' },
  netChip: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  netChipText: { fontSize: 12, fontWeight: '700' },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    margin: 12,
    marginTop: 4,
    borderRadius: 10,
    paddingVertical: 12,
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
