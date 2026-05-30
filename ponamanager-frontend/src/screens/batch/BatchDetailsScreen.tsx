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
import { PLDiscountModal } from '../../utils/PLDiscountModal';

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
  danger: '#F03F5F',
  dangerSoft: 'rgba(240,63,95,0.09)',
  success: '#18B565',
  successSoft: 'rgba(24,181,101,0.10)',
  warning: '#E09400',
  warningSoft: 'rgba(224,148,0,0.10)',
  info: '#0EA5E9',
  infoSoft: 'rgba(14,165,233,0.10)',
  inputBg: '#F4F5F9',
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
  danger: '#FF5E7E',
  dangerSoft: 'rgba(255,94,126,0.12)',
  success: '#2ECC71',
  successSoft: 'rgba(46,204,113,0.12)',
  warning: '#F0A500',
  warningSoft: 'rgba(240,165,0,0.12)',
  info: '#3B9EFF',
  infoSoft: 'rgba(59,158,255,0.12)',
  inputBg: '#0F1117',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

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
  in_progress: { label: 'চলছে', color: T.info, bg: T.infoSoft, icon: 'sync-outline' as const },
  completed: {
    label: 'সম্পন্ন',
    color: T.success,
    bg: T.successSoft,
    icon: 'checkmark-circle-outline' as const,
  },
  has_due: {
    label: 'বাকি আছে',
    color: T.danger,
    bg: T.dangerSoft,
    icon: 'alert-circle-outline' as const,
  },
  closed: { label: 'বন্ধ', color: T.textMuted, bg: T.border, icon: 'lock-closed-outline' as const },
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

// ─── Input Field ────────────────────────────────────────────────────────────────
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

const MirCompare = ({ companyMir, ourMir, poly, T }: any) => {
  if (!companyMir || !ourMir || !poly) return null;
  const compTotal = companyMir * poly,
    ourTotal = ourMir * poly,
    diff = compTotal - ourTotal;
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

// ─── Due Payment Modal ───────────────────────────────────────────────────────────
const DuePaymentModal = ({ visible, batchOrder, onClose, onSaved, T }: any) => {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const due = Number(batchOrder?.dueAmount || 0);
      setAmount(due > 0 ? due.toString() : '');
    }
  }, [visible, batchOrder]);

  if (!batchOrder) return null;

  const maxDue = Number(batchOrder.dueAmount || 0);

  const handleSave = async () => {
    const amt = Number(amount);

    if (!amt || isNaN(amt) || amt <= 0) {
      toast.warn('সঠিক পরিমাণ দিন');
      return;
    }

    // exact amount only
    if (amt > maxDue) {
      toast.warn(`ঠিক ${formatCurrency(maxDue)} পরিশোধ করতে হবে`);
      return;
    }

    setSaving(true);

    try {
      await batchAPI.recordDuePayment(batchOrder.id, amt);

      toast.success('পেমেন্ট যোগ হয়েছে');

      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: T.surface,
            borderRadius: 20,
            padding: 24,
            width: '100%',
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: T.textPrimary,
              marginBottom: 4,
            }}
          >
            বাকি পরিশোধ
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: T.textMuted,
              marginBottom: 16,
            }}
          >
            {batchOrder.order?.customerName} · বাকি: {formatCurrency(maxDue)}
          </Text>

          <InputField
            label="পরিমাণ (৳)"
            value={amount}
            onChange={setAmount}
            suffix="৳"
            placeholder={maxDue.toString()}
            keyboardType="numeric"
            T={T}
          />

          <Text
            style={{
              fontSize: 12,
              color: T.warning,
              marginTop: 8,
            }}
          >
            সম্পূর্ণ বাকি একবারেই পরিশোধ করতে হবে
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 16,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: T.border,
                alignItems: 'center',
              }}
              onPress={onClose}
              disabled={saving}
            >
              <Text
                style={{
                  fontWeight: '700',
                  color: T.textSecondary,
                }}
              >
                বাতিল
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 14,
                backgroundColor: saving ? T.success + '80' : T.success,
                alignItems: 'center',
              }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={{
                    fontWeight: '800',
                    color: '#fff',
                  }}
                >
                  সেভ করুন
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Advance Refund Modal ────────────────────────────────────────────────────────
const AdvanceRefundModal = ({ visible, batchOrder, onClose, onSaved, T }: any) => {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const advance = Number(batchOrder?.order?.advanceAmount || 0);
  const finalAmount = Number(batchOrder?.finalAmount || 0);

  const refundable = Math.max(0, advance - finalAmount);

  useEffect(() => {
    if (visible) {
      setAmount(refundable > 0 ? refundable.toString() : '');
    }
  }, [visible, refundable]);

  if (!batchOrder) return null;

  const handleSave = async () => {
    const amt = Number(amount);

    if (!amt || isNaN(amt) || amt <= 0) {
      toast.warn('সঠিক পরিমাণ দিন');
      return;
    }

    if (amt !== refundable) {
      toast.warn(`ঠিক ${formatCurrency(refundable)} সমন্বয় করতে হবে`);
      return;
    }

    setSaving(true);

    try {
      await batchAPI.recordAdvanceRefund(batchOrder.order.id, amt);

      toast.success('অগ্রীম সমন্বয় হয়েছে');

      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: T.surface,
            borderRadius: 20,
            padding: 24,
            width: '100%',
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: T.textPrimary,
              marginBottom: 4,
            }}
          >
            অগ্রীম সমন্বয়
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: T.textMuted,
              marginBottom: 16,
            }}
          >
            {batchOrder.order?.customerName} · অগ্রীম: {formatCurrency(advance)} · সমন্বয়যোগ্য:{' '}
            {formatCurrency(refundable)}
          </Text>

          <InputField
            label="পরিমাণ (৳)"
            value={amount}
            onChange={setAmount}
            suffix="৳"
            placeholder={refundable.toString()}
            keyboardType="numeric"
            T={T}
          />

          <Text
            style={{
              fontSize: 12,
              color: T.warning,
              marginTop: 8,
            }}
          >
            অতিরিক্ত অগ্রীম সম্পূর্ণ সমন্বয় করতে হবে
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 16,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: T.border,
                alignItems: 'center',
              }}
              onPress={onClose}
              disabled={saving}
            >
              <Text
                style={{
                  fontWeight: '700',
                  color: T.textSecondary,
                }}
              >
                বাতিল
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 14,
                backgroundColor: saving ? T.accent + '80' : T.accent,
                alignItems: 'center',
              }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={{
                    fontWeight: '800',
                    color: '#fff',
                  }}
                >
                  সমন্বয় করুন
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  const [isPartial, setIsPartial] = useState(false);
  const [customRemaining, setCustomRemaining] = useState('');

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
      setCustomRemaining('');
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

  const mirCalcQty = oMir > 0 && poly > 0 ? oMir * poly : 0;
  const deliveredNum = mirCalcQty > 0 ? mirCalcQty : parseFloat(deliveredQty) || 0;
  const ourTotal = oMir * poly;
  const mirDiff = cMir * poly - ourTotal;
  const autoRemaining = Math.max(0, orderedQty - deliveredNum);
  const remainingNum = customRemaining
    ? Math.max(0, parseFloat(customRemaining) || 0)
    : autoRemaining;
  const finalAmt = Math.max(0, deliveredNum * rate - disc);
  const totalPaid = advance + paid;
  const dueAmt = Math.max(0, finalAmt - totalPaid);
  const advanceCarry = isPartial && totalPaid > finalAmt ? totalPaid - finalAmt : 0;
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

    const autoNote = isPartial
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
      isPartial,
      remainingQuantity: isPartial ? remainingNum : 0,
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

            {/* Mir */}
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
                    const a = oMir * (parseFloat(v) || 0);
                    if (a > 0) setDeliveredQty(a.toString());
                  }
                }}
                suffix="পলি"
                placeholder="যেমন: ৪০"
                T={T}
              />
              <MirCompare companyMir={cMir} ourMir={oMir} poly={poly} T={T} />
            </View>

            {/* Quantity */}
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
                    backgroundColor: isPartial ? T.infoSoft : T.inputBg,
                    borderColor: isPartial ? T.info + '60' : T.border,
                  },
                ]}
                onPress={() => {
                  setIsPartial(!isPartial);
                  setCustomRemaining('');
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
                  style={[mStyles.switchTrack, { backgroundColor: isPartial ? T.info : T.border }]}
                >
                  <View style={[mStyles.switchThumb, { left: isPartial ? 20 : 2 }]} />
                </View>
              </TouchableOpacity>

              {isPartial && (
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
                    value={customRemaining}
                    onChangeText={setCustomRemaining}
                    keyboardType="numeric"
                    placeholder={autoRemaining.toString()}
                    placeholderTextColor={T.info + '80'}
                  />
                </View>
              )}
            </View>

            {/* Payment */}
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
              {isPartial && (
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
                    {isPartial ? 'ডেলিভারি ও নতুন অর্ডার তৈরি' : 'ডেলিভারি নিশ্চিত করুন'}
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

// ─── Batch Order Row ─────────────────────────────────────────────────────────────

// ─── Expense Section ─────────────────────────────────────────────────────────────
const ExpenseSection = ({ expenses, totalExpenses, onAdd, onDelete, isClosed, T }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Transport');
  const [adding, setAdding] = useState(false);
  const CATS = ['Transport', 'Labor', 'Food', 'Fuel', 'Repair', 'Other'];

  const handleAdd = async () => {
    if (!label.trim()) {
      toast.warn('বিবরণ দিন');
      return;
    }
    if (!amount) {
      toast.warn('পরিমাণ দিন');
      return;
    }
    setAdding(true);
    try {
      await onAdd({ label: label.trim(), amount: parseFloat(amount), category });
      setLabel('');
      setAmount('');
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.section, { marginTop: 4 }]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>
          খরচের বিবরণ ({expenses.length})
        </Text>
        {!isClosed && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderRadius: 9,
              borderWidth: 1.5,
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderColor: T.accent,
              backgroundColor: T.accentSoft,
            }}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={13} color={T.accent} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: T.accent }}>
              {showForm ? 'বাতিল' : 'খরচ যোগ'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <View
          style={[styles.expenseForm, { backgroundColor: T.surface, borderColor: T.accent + '44' }]}
        >
          <View style={[styles.expenseFormAccent, { backgroundColor: T.accent }]} />
          <View style={{ flex: 1, padding: 14, gap: 10 }}>
            <View style={[mStyles.inputRow, { borderColor: T.border, backgroundColor: T.inputBg }]}>
              <TextInput
                style={[mStyles.input, { color: T.textPrimary }]}
                value={label}
                onChangeText={setLabel}
                placeholder="খরচের বিবরণ"
                placeholderTextColor={T.textMuted}
                keyboardType="default"
              />
            </View>
            <View style={[mStyles.inputRow, { borderColor: T.border, backgroundColor: T.inputBg }]}>
              <TextInput
                style={[mStyles.input, { color: T.textPrimary }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="পরিমাণ (৳)"
                placeholderTextColor={T.textMuted}
              />
              <Text style={[mStyles.inputSuffix, { color: T.textMuted }]}>৳</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {CATS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: category === cat ? T.accent : T.border,
                    backgroundColor: category === cat ? T.accentSoft : T.inputBg,
                  }}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: category === cat ? T.accent : T.textMuted,
                      fontWeight: category === cat ? '700' : '400',
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={{
                borderRadius: 10,
                paddingVertical: 12,
                backgroundColor: adding ? T.accent + '80' : T.accent,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
              onPress={handleAdd}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>যোগ করুন</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {expenses.length === 0 ? (
        <View style={[styles.emptyExp, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Ionicons name="receipt-outline" size={26} color={T.textMuted} />
          <Text style={{ fontSize: 13, color: T.textMuted }}>কোনো খরচ নেই</Text>
        </View>
      ) : (
        <View style={[styles.expenseCard, { backgroundColor: T.surface }]}>
          {expenses.map((e: any, i: number) => (
            <View key={e.id ?? i} style={[styles.expenseRow, { borderBottomColor: T.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.expenseLabel, { color: T.textSecondary }]}>{e.label}</Text>
                <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{e.category}</Text>
              </View>
              <Text style={[styles.expenseAmt, { color: T.warning }]}>
                {formatCurrency(e.amount)}
              </Text>
              {!isClosed && (
                <TouchableOpacity
                  style={{ marginLeft: 10 }}
                  onPress={() => onDelete(e.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={14} color={T.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={[styles.expenseRow, styles.expenseTotal]}>
            <Text style={[styles.expenseTotalLabel, { color: T.textPrimary }]}>মোট খরচ</Text>
            <Text style={[styles.expenseTotalAmt, { color: T.warning }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Connect Company Order Modal ─────────────────────────────────────────────────
const ConnectCompanyOrderModal = ({ visible, batchId, onClose, onConnected }: any) => {
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
                        <Text style={cStyles.connectBtnText}>কানেক্ট করুন</Text>
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

// ─── Add Order Modal ─────────────────────────────────────────────────────────────
const AddOrderToBatchModal = ({ visible, batchId, onClose, onAdded }: any) => {
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
      await batchAPI.addOrders(batchId, [orderId]);
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
const CompanyOrderSummary = ({
  companyOrder,
  batchOrders,
  T,
  onDisconnect,
  onViewDetail,
  isClosed,
  showDiscount,
  setShowDiscount,
  onSaved,
}: any) => {
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
          <PLDiscountModal
            visible={showDiscount}
            companyOrder={companyOrder}
            onClose={() => setShowDiscount(false)}
            onSaved={onSaved}
          />
          {!isClosed && companyOrder?.status === 'delivered' && (
            <TouchableOpacity
              style={[
                styles.companyDiscountBtn,
                { borderColor: T.warning, backgroundColor: T.warningSoft },
              ]}
              onPress={() => setShowDiscount(true)}
            >
              <Ionicons name="pricetag-outline" size={12} color={T.warning} />
              <Text style={[{ fontSize: 10, fontWeight: '700', color: T.warning }]}>PL ছাড়</Text>
            </TouchableOpacity>
          )}
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
const BatchFinancialSummary = ({ batch, companyOrder, T }: any) => {
  // ── Customer side ──
  let totalDeliveredPL = 0;
  let totalRevenue = 0;
  const totalCustomerPaid = batch.totalCollected || 0;
  const totalCustomerDue = batch.totalDue || 0;

  batch.batchOrders?.forEach((bo: any) => {
    const qty = bo.deliveredQuantity || 0;
    const rate = bo.order?.unitRate || 0;
    totalDeliveredPL += qty;
    totalRevenue += qty * rate;
  });

  // ── Company side ──
  let companyMir = 0;
  let companyPoly = 0;
  let companyTotalPL = 0;
  let companyRate = 0;
  let companyTotalPrice = 0;
  let companyPaid = 0;
  let companyAdvance = 0;
  let companyDue = 0;

  if (companyOrder) {
    companyMir = companyOrder.mirValue || 0;
    companyPoly = companyOrder.totalPoly || 0;
    companyTotalPL = companyOrder.totalPL || companyOrder.expectedPL || 0;
    companyRate = companyOrder.ratePerPL || 0;
    companyTotalPrice =
      companyOrder.actualAmount || companyOrder.paymentAmount || companyTotalPL * companyRate;
    companyPaid = companyOrder.paymentAmount || 0;
    if (companyOrder.netDue > 0) companyDue = companyOrder.netDue;
    if (companyOrder.netAdvance > 0) companyAdvance = companyOrder.netAdvance;
  }

  const totalExpenses = batch.totalExpenses || 0;
  const companyCost = companyTotalPrice;
  const profit = totalRevenue - (totalExpenses + companyCost);
  const profitColor = profit >= 0 ? T.success : T.danger;

  return (
    <View style={[summaryStyles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
      {/* Header */}
      <View style={summaryStyles.header}>
        <Ionicons name="stats-chart" size={18} color={T.accent} />
        <Text style={[summaryStyles.title, { color: T.textPrimary }]}>লাভ-ক্ষতির হিসাব</Text>
      </View>

      {/* Big numbers */}
      <View style={summaryStyles.bigRow}>
        <View style={[summaryStyles.bigBox, { backgroundColor: T.accentSoft }]}>
          <Text style={[summaryStyles.bigLabel, { color: T.textMuted }]}>মোট বিক্রয়</Text>
          <Text style={[summaryStyles.bigVal, { color: T.accent }]}>
            {formatCurrency(totalRevenue)}
          </Text>
        </View>
        <View style={[summaryStyles.bigBox, { backgroundColor: T.warningSoft }]}>
          <Text style={[summaryStyles.bigLabel, { color: T.textMuted }]}>
            মোট খরচ{'\n'}(কোম্পানি + অন্যান্য)
          </Text>
          <Text style={[summaryStyles.bigVal, { color: T.warning }]}>
            {formatCurrency(totalExpenses + companyCost)}
          </Text>
        </View>
      </View>

      {/* Profit highlight */}
      <View
        style={[
          summaryStyles.profitBox,
          { backgroundColor: profitColor + '12', borderColor: profitColor + '30' },
        ]}
      >
        <View>
          <Text style={[summaryStyles.profitLabel, { color: profitColor }]}>নিট লাভ / (ক্ষতি)</Text>
          <Text style={[summaryStyles.profitSub, { color: T.textMuted }]}>
            বিক্রয় − (কোম্পানি + খরচ)
          </Text>
        </View>
        <Text style={[summaryStyles.profitVal, { color: profitColor }]}>
          {profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`}
        </Text>
      </View>

      <View style={[summaryStyles.divider, { backgroundColor: T.border }]} />

      {/* Company section */}
      {companyOrder && (
        <>
          <View style={summaryStyles.sectionRow}>
            <Ionicons name="business-outline" size={13} color={T.info} />
            <Text style={[summaryStyles.sectionTitle, { color: T.textPrimary }]}>
              কোম্পানির তথ্য
            </Text>
          </View>
          <View style={summaryStyles.grid}>
            {[
              { label: 'মীর', val: companyMir.toLocaleString(), color: T.info },
              { label: 'পলি', val: companyPoly.toLocaleString(), color: T.info },
              { label: 'মোট PL', val: `${companyTotalPL.toLocaleString()} PL`, color: T.info },
              { label: 'দর/PL', val: `৳${companyRate}`, color: T.info },
              { label: 'মোট টাকা', val: formatCurrency(companyTotalPrice), color: T.warning },
              {
                label: 'জমা/অগ্রীম',
                val: formatCurrency(companyAdvance > 0 ? companyAdvance : companyPaid),
                color: T.success,
              },
              ...(companyDue > 0
                ? [{ label: 'বাকি দিতে হবে', val: formatCurrency(companyDue), color: T.danger }]
                : []),
            ].map((item, i) => (
              <View key={i} style={summaryStyles.gridItem}>
                <Text style={[summaryStyles.gridLabel, { color: T.textMuted }]}>{item.label}</Text>
                <Text style={[summaryStyles.gridVal, { color: item.color }]}>{item.val}</Text>
              </View>
            ))}
          </View>
          <View style={[summaryStyles.divider, { backgroundColor: T.border }]} />
        </>
      )}

      {/* Customer section */}
      <View style={summaryStyles.sectionRow}>
        <Ionicons name="people-outline" size={13} color={T.success} />
        <Text style={[summaryStyles.sectionTitle, { color: T.textPrimary }]}>
          গ্রাহক ডেলিভারি সারাংশ
        </Text>
      </View>
      <View style={summaryStyles.grid}>
        {[
          {
            label: 'মোট ডেলিভারি PL',
            val: `${totalDeliveredPL.toLocaleString()} PL`,
            color: T.textPrimary,
          },
          { label: 'মোট বিক্রয়', val: formatCurrency(totalRevenue), color: T.accent },
          { label: 'মোট প্রাপ্ত', val: formatCurrency(totalCustomerPaid), color: T.success },
          ...(totalCustomerDue > 0
            ? [{ label: 'বাকি', val: formatCurrency(totalCustomerDue), color: T.danger }]
            : []),
        ].map((item, i) => (
          <View key={i} style={summaryStyles.gridItem}>
            <Text style={[summaryStyles.gridLabel, { color: T.textMuted }]}>{item.label}</Text>
            <Text style={[summaryStyles.gridVal, { color: item.color }]}>{item.val}</Text>
          </View>
        ))}
      </View>

      {/* Expense section */}
      {totalExpenses > 0 && (
        <>
          <View style={[summaryStyles.divider, { backgroundColor: T.border }]} />
          <View style={summaryStyles.sectionRow}>
            <Ionicons name="receipt-outline" size={13} color={T.warning} />
            <Text style={[summaryStyles.sectionTitle, { color: T.textPrimary }]}>অন্যান্য খরচ</Text>
          </View>
          <View style={summaryStyles.grid}>
            <View style={summaryStyles.gridItem}>
              <Text style={[summaryStyles.gridLabel, { color: T.textMuted }]}>মোট খরচ</Text>
              <Text style={[summaryStyles.gridVal, { color: T.warning }]}>
                {formatCurrency(totalExpenses)}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};
const BatchOrderRow = ({
  batchOrder,
  onDeliver,
  onUnbatch,
  onPayDue,
  onRefundAdvance,
  isClosed,
}: {
  batchOrder: BatchOrder;
  onDeliver: () => void;
  onUnbatch: () => void;
  onPayDue: () => void;
  onRefundAdvance: () => void;
  isClosed: boolean;
}) => {
  const T = useTheme();
  const STATUS = getStatusConfig(T);
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType) ?? T.accent;
  const st = STATUS[batchOrder.deliveryStatus as keyof typeof STATUS] ?? STATUS.pending;
  const hasMir = batchOrder.ourMir && batchOrder.companyMir;
  const wasPartial = (batchOrder as any).isPartial;

  const deliveredQty = batchOrder.deliveredQuantity || 0;
  const orderedQty = batchOrder.order.plQuantity;
  const unitRate = batchOrder.order.unitRate;
  const totalPrice = deliveredQty * unitRate;
  const advance = batchOrder.order.advanceAmount || 0;
  const customerPaid = batchOrder.customerPayment || 0;
  const totalPaid = advance + customerPaid;
  const dueAmount = batchOrder.dueAmount || 0;
  const isFullyPaid = dueAmount === 0 && totalPaid >= totalPrice;
  const isPending = batchOrder.deliveryStatus === 'pending';

  return (
    <View
      style={[rowStyles.card, { backgroundColor: T.surface }, !isPending && rowStyles.cardDone]}
    >
      <View style={[rowStyles.typeBar, { backgroundColor: typeColor }]} />
      <View style={{ flex: 1, paddingLeft: 10 }}>
        {/* Header: Name + Status */}
        <View style={rowStyles.top}>
          <Text style={[rowStyles.customerName, { color: T.textPrimary }]}>
            {batchOrder.order.customerName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {wasPartial && !isPending && (
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

        {/* Mobile */}
        <Text style={[rowStyles.mobile, { color: T.textSecondary }]}>
          {batchOrder.order.customerMobile}
        </Text>

        {/* Pona type + Quantity */}
        <View style={rowStyles.metaRow}>
          <View style={[rowStyles.typePill, { backgroundColor: typeColor + '20' }]}>
            <Text style={[rowStyles.typeText, { color: typeColor }]}>
              {batchOrder.order.ponaType}
            </Text>
          </View>
          <Text style={[rowStyles.qty, { color: T.textPrimary }]}>
            {!isPending
              ? `${deliveredQty.toLocaleString()} / ${orderedQty.toLocaleString()} PL`
              : `${orderedQty.toLocaleString()} PL`}
          </Text>
        </View>

        {/* Price card — show after delivery */}
        {!isPending && (
          <View
            style={[
              rowStyles.priceCard,
              { backgroundColor: T.surfaceAlt ?? T.inputBg, borderColor: T.border },
            ]}
          >
            <View style={rowStyles.priceRow}>
              <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>ডেলিভারি PL</Text>
              <Text style={[rowStyles.priceValue, { color: T.textPrimary }]}>
                {deliveredQty.toLocaleString()} PL
              </Text>
            </View>
            <View style={rowStyles.priceRow}>
              <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>PL রেট</Text>
              <Text style={[rowStyles.priceValue, { color: T.textPrimary }]}>৳{unitRate}</Text>
            </View>
            <View style={rowStyles.priceRow}>
              <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>মোট মূল্য</Text>
              <Text style={[rowStyles.priceValue, { color: typeColor }]}>
                {formatCurrency(totalPrice)}
              </Text>
            </View>
            <View style={rowStyles.priceRow}>
              <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>অগ্রীম + পেমেন্ট</Text>
              <Text style={[rowStyles.priceValue, { color: T.success }]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            {dueAmount > 0 ? (
              <View style={rowStyles.priceRow}>
                <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>বাকি</Text>
                <Text style={[rowStyles.priceValue, { color: T.danger }]}>
                  {formatCurrency(dueAmount)}
                </Text>
              </View>
            ) : isFullyPaid ? (
              <View style={rowStyles.priceRow}>
                <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>
                  পেমেন্ট স্ট্যাটাস
                </Text>
                <Text style={[rowStyles.priceValue, { color: T.success }]}>সম্পূর্ণ পরিশোধ ✓</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Pending advance */}
        {isPending && advance > 0 && (
          <View
            style={[
              rowStyles.priceCard,
              { backgroundColor: T.infoSoft, borderColor: T.info + '33' },
            ]}
          >
            <View style={rowStyles.priceRow}>
              <Text style={[rowStyles.priceLabel, { color: T.textMuted }]}>অগ্রিম জমা</Text>
              <Text style={[rowStyles.priceValue, { color: T.info }]}>
                {formatCurrency(advance)}
              </Text>
            </View>
          </View>
        )}

        {/* Mir row */}
        {!isPending && hasMir && (
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

        {/* Due date */}
        {!isPending && dueAmount > 0 && batchOrder.duePaymentDate && (
          <Text style={[rowStyles.dueDateText, { color: T.textMuted }]}>
            পরিশোধের তারিখ: {formatDate(batchOrder.duePaymentDate)}
          </Text>
        )}

        {/* Pending action buttons */}
        {isPending && !isClosed && (
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

        {/* Due payment button */}
        {!isPending && dueAmount > 0 && !isClosed && (
          <TouchableOpacity
            style={[
              rowStyles.dueBtn,
              { backgroundColor: T.dangerSoft, borderColor: T.danger + '44' },
            ]}
            onPress={onPayDue}
          >
            <Ionicons name="cash-outline" size={13} color={T.danger} />
            <Text style={[rowStyles.dueBtnText, { color: T.danger }]}>
              বাকি পরিশোধ করুন · {formatCurrency(dueAmount)}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={T.danger} />
          </TouchableOpacity>
        )}

        {/* Advance refund button */}
        {!isPending && advance > 0 && totalPrice < advance && !isClosed && (
          <TouchableOpacity
            style={[
              rowStyles.advanceBtn,
              { backgroundColor: T.successSoft, borderColor: T.success + '44' },
            ]}
            onPress={onRefundAdvance}
          >
            <Ionicons name="return-down-back-outline" size={13} color={T.success} />
            <Text style={[rowStyles.advanceBtnText, { color: T.success }]}>
              অগ্রীম ফেরত · {formatCurrency(advance - totalPrice)}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={T.success} />
          </TouchableOpacity>
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
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBO, setSelectedBO] = useState<BatchOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [addOrderModalVisible, setAddOrderModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);

  // Due / Advance modals
  const [dueBO, setDueBO] = useState<any>(null);
  const [advanceBO, setAdvanceBO] = useState<any>(null);

  const fetchBatch = useCallback(async () => {
    try {
      const [batchRes, expRes] = await Promise.all([
        batchAPI.getById(batchId),
        batchAPI.getExpenses(batchId),
      ]);
      setBatch(batchRes.data.data);
      const raw = expRes?.data?.data;
      setExpenses(Array.isArray(raw) ? raw : []);
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
          toast.success('আনব্যাচ হয়েছে');
          fetchBatch();
        } catch {
          toast.error('আনব্যাচ ব্যর্থ');
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
          toast.success('সরানো হয়েছে');
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

  const handleAddExpense = async (data: any) => {
    try {
      await batchAPI.addExpense(batchId, data);
      toast.success('খরচ যোগ হয়েছে');
      fetchBatch();
    } catch {
      toast.error('খরচ যোগ ব্যর্থ');
      throw new Error('failed');
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    showConfirm(
      'এই খরচটি মুছে দিতে চান?',
      async () => {
        try {
          await batchAPI.deleteExpense(batchId, expenseId);
          toast.success('মুছে গেছে');
          fetchBatch();
        } catch {
          toast.error('মুছতে ব্যর্থ');
        }
      },
      undefined,
      'খরচ মুছুন',
    );
  };

  const handleCloseBatch = () => {
    const hasDue = (batch?.totalDue ?? 0) > 0;
    showConfirm(
      hasDue
        ? `এই ব্যাচে ${formatCurrency(batch?.totalDue ?? 0)} বাকি আছে। তবুও বন্ধ করবেন?`
        : `${batch?.batchNumber} ব্যাচ স্থায়ীভাবে বন্ধ করবেন? পরে আর পরিবর্তন করা যাবে না।`,
      async () => {
        setClosing(true);
        try {
          await batchAPI.closeBatch(batchId);
          toast.success('ব্যাচ বন্ধ হয়েছে!');
          fetchBatch();
        } catch (e: any) {
          toast.error(e?.response?.data?.message || 'ব্যর্থ');
        } finally {
          setClosing(false);
        }
      },
      undefined,
      hasDue ? 'বাকি আছে!' : 'ব্যাচ বন্ধ করুন',
    );
  };

  const isClosed = batch?.status === 'closed';
  const isComplete = batch?.status === 'completed' || batch?.status === 'has_due';
  const pendingCount =
    batch?.batchOrders?.filter((o) => o.deliveryStatus === 'pending').length || 0;
  const deliveredCount =
    batch?.batchOrders?.filter((o) => o.deliveryStatus !== 'pending').length || 0;
  const totalOrders = batch?.batchOrders?.length || 0;
  const companyOrder = (batch as any)?.companyOrders?.[0] ?? null;
  const BATCH_STATUS = getStatusConfig(T);
  const batchSt =
    BATCH_STATUS[(batch?.status ?? 'pending') as keyof typeof BATCH_STATUS] ?? BATCH_STATUS.pending;

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
        {/* Header */}
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
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
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
              <View style={[rowStyles.statusPill, { backgroundColor: batchSt.bg }]}>
                <Ionicons name={batchSt.icon} size={11} color={batchSt.color} />
                <Text style={[rowStyles.statusText, { color: batchSt.color }]}>
                  {batchSt.label}
                </Text>
              </View>
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

          {!isClosed && (
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
                  <Text style={[styles.headerActionText, { color: T.warning }]}>
                    কোম্পানি হিসাব
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.headerActionBtn,
                  { borderColor: T.info, backgroundColor: T.infoSoft },
                ]}
                onPress={() => navigation.navigate('Collection', { batchId: batch.id })}
              >
                <Ionicons name="analytics-outline" size={14} color={T.info} />
                <Text style={[styles.headerActionText, { color: T.info }]}>কালেকশন</Text>
              </TouchableOpacity>
            </View>
          )}

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
            {(batch.totalExpenses ?? 0) > 0 && (
              <View style={[styles.finItem, { backgroundColor: T.warningSoft }]}>
                <Text style={[styles.finLabel, { color: T.textSecondary }]}>খরচ</Text>
                <Text style={[styles.finVal, { color: T.warning }]}>
                  {formatCurrency(batch.totalExpenses)}
                </Text>
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
              isClosed={isClosed}
              showDiscount={showDiscount}
              setShowDiscount={setShowDiscount}
              onSaved={fetchBatch}
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
                isClosed={isClosed}
                onDeliver={() => {
                  setSelectedBO(bo);
                  setModalVisible(true);
                }}
                onUnbatch={() => handleUnbatch(bo)}
                onPayDue={() => setDueBO(bo)}
                onRefundAdvance={() => setAdvanceBO(bo)}
              />
            ))}
          </View>
        </View>

        {/* Expense section */}
        <ExpenseSection
          expenses={expenses}
          totalExpenses={batch.totalExpenses ?? 0}
          onAdd={handleAddExpense}
          onDelete={handleDeleteExpense}
          isClosed={isClosed}
          T={T}
        />

        {/* Net profit */}
        {(batch.totalExpenses ?? 0) > 0 && (
          <View style={[styles.section, { marginTop: 4 }]}>
            <View
              style={[
                styles.profitCard,
                {
                  backgroundColor: (batch.totalProfit ?? 0) >= 0 ? T.successSoft : T.dangerSoft,
                  borderColor: (batch.totalProfit ?? 0) >= 0 ? T.success + '33' : T.danger + '33',
                },
              ]}
            >
              <View>
                <Text style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
                  সংগ্রহ − খরচ = নিট লাভ
                </Text>
                <Text style={{ fontSize: 12, color: T.textSecondary }}>
                  {formatCurrency(batch.totalCollected)} −{' '}
                  {formatCurrency(batch.totalExpenses ?? 0)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: (batch.totalProfit ?? 0) >= 0 ? T.success : T.danger,
                  letterSpacing: -1,
                }}
              >
                {(batch.totalProfit ?? 0) >= 0 ? '+' : ''}
                {formatCurrency(batch.totalProfit ?? 0)}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />

        {/* Financial Summary */}
        <BatchFinancialSummary batch={batch} companyOrder={companyOrder} T={T} />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      {!isClosed && (
        <View style={[styles.bottomBar, { backgroundColor: T.surface, borderTopColor: T.border }]}>
          {pendingCount > 0 ? (
            <View style={[styles.pendingWarn, { backgroundColor: T.warningSoft }]}>
              <Ionicons name="warning-outline" size={18} color={T.warning} />
              <Text style={[styles.pendingWarnText, { color: T.warning }]}>
                {pendingCount} টি ডেলিভারি বাকি।
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.completeBtn,
                { backgroundColor: closing ? T.danger + '80' : T.danger },
              ]}
              onPress={handleCloseBatch}
              disabled={closing}
            >
              {closing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={20} color="#fff" />
                  <Text style={styles.completeBtnText}>ব্যাচ বন্ধ করুন</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {isClosed && (
        <View style={[styles.bottomBar, { backgroundColor: T.surface, borderTopColor: T.border }]}>
          <View style={[styles.pendingWarn, { backgroundColor: T.border }]}>
            <Ionicons name="lock-closed" size={16} color={T.textMuted} />
            <Text style={[styles.pendingWarnText, { color: T.textMuted }]}>
              এই ব্যাচ স্থায়ীভাবে বন্ধ হয়ে গেছে।
            </Text>
          </View>
        </View>
      )}

      {/* Modals */}
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
      <DuePaymentModal
        visible={!!dueBO}
        batchOrder={dueBO}
        onClose={() => setDueBO(null)}
        onSaved={fetchBatch}
        T={T}
      />
      <AdvanceRefundModal
        visible={!!advanceBO}
        batchOrder={advanceBO}
        onClose={() => setAdvanceBO(null)}
        onSaved={fetchBatch}
        T={T}
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
  finRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  finItem: { flex: 1, minWidth: '22%', alignItems: 'center', padding: 8, borderRadius: 8 },
  finLabel: { fontSize: 11 },
  finVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
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
  expenseForm: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  expenseFormAccent: { width: 4 },
  expenseCard: { borderRadius: 10, padding: 12 },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  expenseLabel: { fontSize: 13 },
  expenseAmt: { fontSize: 13, fontWeight: '700' },
  expenseTotal: { borderBottomWidth: 0, marginTop: 4 },
  expenseTotalLabel: { fontSize: 14, fontWeight: '800' },
  expenseTotalAmt: { fontSize: 16, fontWeight: '900' },
  emptyExp: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  profitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  companyDiscountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  cardDone: { opacity: 0.88 },
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

  // Price card
  priceCard: {
    marginTop: 8,
    marginRight: 10,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  priceLabel: { fontSize: 11 },
  priceValue: { fontSize: 12, fontWeight: '700' },

  // Mir
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

  // Delivered info
  deliveredInfo: { paddingBottom: 8, paddingRight: 10, marginTop: 4, gap: 2 },
  deliveredInfoItem: { fontSize: 12 },

  // Due date
  dueDateText: { fontSize: 10, paddingHorizontal: 10, paddingBottom: 4, color: '#9CA3AF' },

  // Action buttons
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

  // Due payment button
  dueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 10,
    marginTop: 4,
    borderRadius: 9,
    borderWidth: 1,
    padding: 9,
  },
  dueBtnText: { fontSize: 12, fontWeight: '700', flex: 1 },

  // Advance refund button
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 9,
    borderWidth: 1,
    padding: 9,
  },
  advanceBtnText: { fontSize: 12, fontWeight: '700', flex: 1 },
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

const summaryStyles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 12 },
  title: { fontSize: 15, fontWeight: '800' },
  bigRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 12 },
  bigBox: { flex: 1, borderRadius: 12, padding: 12 },
  bigLabel: { fontSize: 10, marginBottom: 6, lineHeight: 14 },
  bigVal: { fontSize: 16, fontWeight: '900' },
  profitBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  profitLabel: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  profitSub: { fontSize: 10 },
  profitVal: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  divider: { height: 1, marginHorizontal: 14, marginVertical: 12 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 4, gap: 2 },
  gridItem: { width: '48%', paddingHorizontal: 6, paddingVertical: 7 },
  gridLabel: { fontSize: 10, marginBottom: 3 },
  gridVal: { fontSize: 13, fontWeight: '800' },
});
