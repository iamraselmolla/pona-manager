// // src/screens/delivery/DeliveryEntryScreen.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, StyleSheet,
//   ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
// } from 'react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { orderAPI, deliveryAPI } from '../../api/services';
// import { Order } from '../../types';
// import { COLORS } from '../../constants';
// import { formatCurrency } from '../../utils/helpers';
// import showAlert from '../../utils/alert';

// const CalcRow = ({ label, value, highlight }: any) => (
//   <View style={[styles.calcRow, highlight && styles.calcRowHighlight]}>
//     <Text style={styles.calcLabel}>{label}</Text>
//     <Text style={[styles.calcValue, highlight && styles.calcValueHighlight]}>{value}</Text>
//   </View>
// );

// export const DeliveryEntryScreen = () => {
//   const navigation = useNavigation<any>();
//   const route = useRoute<any>();
//   const { orderId } = route.params;

//   const [order, setOrder] = useState<Order | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [deliveredQty, setDeliveredQty] = useState('');
//   const [companyProvidedQty, setCompanyProvidedQty] = useState('');
//   const [countedQty, setCountedQty] = useState('');
//   const [deliveryRate, setDeliveryRate] = useState('');
//   const [discount, setDiscount] = useState('0');
//   const [customerPayment, setCustomerPayment] = useState('');
//   const [notes, setNotes] = useState('');

//   useEffect(() => {
//     orderAPI.getById(orderId).then((res) => {
//       const o = res.data.data;
//       setOrder(o);
//       setDeliveredQty(o.plQuantity.toString());
//       setDeliveryRate(o.unitRate.toString());
//       setLoading(false);
//     });
//   }, [orderId]);

//   const delivered = parseFloat(deliveredQty) || 0;
//   const companyProvided = parseFloat(companyProvidedQty) || 0;
//   const counted = parseFloat(countedQty) || 0;
//   const rate = parseFloat(deliveryRate) || 0;
//   const disc = parseFloat(discount) || 0;
//   const payment = parseFloat(customerPayment) || 0;

//   const companyMir = companyProvided - delivered;
//   const countingMir = counted - delivered;
//   const finalAmount = (delivered * rate) - disc;
//   const remainingDue = Math.max(0, finalAmount - (order?.advanceAmount || 0) - payment);
//   const mirPercentage = order?.plQuantity ? ((order.plQuantity - delivered) / order.plQuantity) * 100 : 0;
//   const profitLoss = finalAmount - (companyProvided * rate * 0.9); // Simplified

//   const handleSubmit = async () => {
//     if (!deliveredQty || !deliveryRate) {
//     showAlert('Validation Error', 'Please fill in all required fields marked with *');
//       return;
//     }
//     setSaving(true);
//     try {
//       await deliveryAPI.create({
//         orderId,
//         customerId: order?.customerId,
//         customerName: order?.customerName,
//         orderedQuantity: order?.plQuantity,
//         deliveredQuantity: delivered,
//         companyProvidedQuantity: companyProvided,
//         countedQuantity: counted,
//         companyMir,
//         countingMir,
//         deliveryRate: rate,
//         discount: disc,
//         finalAmount,
//         customerPayment: payment,
//         remainingDue,
//         profitLoss,
//         mirPercentage,
//         notes,
//         deliveryDate: new Date().toISOString(),
//       });
//       Alert.alert('Success', 'Delivery recorded successfully', [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     } catch (err: any) {
//       Alert.alert('Error', err.response?.data?.message || 'Failed to record delivery');
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

//   return (
//     <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
//         {/* Order Info */}
//         <View style={styles.orderInfo}>
//           <Text style={styles.orderCustomer}>{order?.customerName}</Text>
//           <Text style={styles.orderDetail}>{order?.ponaType} | Ordered: {order?.plQuantity.toLocaleString()} PL</Text>
//           <Text style={styles.orderDetail}>Order Amount: {formatCurrency(order?.totalPrice || 0)}</Text>
//           {(order?.advanceAmount || 0) > 0 && (
//             <Text style={styles.advanceText}>Advance Paid: {formatCurrency(order?.advanceAmount || 0)}</Text>
//           )}
//         </View>

//         {/* Delivery Fields */}
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Quantity Details</Text>

//           {[
//             { label: 'Delivered Quantity (PL) *', val: deliveredQty, set: setDeliveredQty },
//             { label: 'Company Provided Quantity', val: companyProvidedQty, set: setCompanyProvidedQty },
//             { label: 'Counted Quantity', val: countedQty, set: setCountedQty },
//           ].map((f) => (
//             <View key={f.label} style={styles.field}>
//               <Text style={styles.label}>{f.label}</Text>
//               <TextInput
//                 style={styles.input}
//                 value={f.val}
//                 onChangeText={f.set}
//                 keyboardType="numeric"
//                 placeholder="0"
//                 placeholderTextColor={COLORS.textMuted}
//               />
//             </View>
//           ))}

//           <View style={styles.mirRow}>
//             <View style={styles.mirBox}>
//               <Text style={styles.mirLabel}>Company Mir</Text>
//               <Text style={[styles.mirValue, { color: companyMir >= 0 ? COLORS.danger : COLORS.success }]}>
//                 {companyMir.toFixed(0)}
//               </Text>
//             </View>
//             <View style={styles.mirBox}>
//               <Text style={styles.mirLabel}>Counting Mir</Text>
//               <Text style={[styles.mirValue, { color: countingMir >= 0 ? COLORS.danger : COLORS.success }]}>
//                 {countingMir.toFixed(0)}
//               </Text>
//             </View>
//             <View style={styles.mirBox}>
//               <Text style={styles.mirLabel}>Mir %</Text>
//               <Text style={[styles.mirValue, { color: mirPercentage > 5 ? COLORS.danger : COLORS.success }]}>
//                 {mirPercentage.toFixed(1)}%
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Rate & Payment */}
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Rate & Payment</Text>

//           {[
//             { label: 'Delivery Rate (৳/PL) *', val: deliveryRate, set: setDeliveryRate },
//             { label: 'Discount (৳)', val: discount, set: setDiscount },
//             { label: 'Customer Payment (৳)', val: customerPayment, set: setCustomerPayment },
//           ].map((f) => (
//             <View key={f.label} style={styles.field}>
//               <Text style={styles.label}>{f.label}</Text>
//               <TextInput
//                 style={styles.input}
//                 value={f.val}
//                 onChangeText={f.set}
//                 keyboardType="numeric"
//                 placeholder="0"
//                 placeholderTextColor={COLORS.textMuted}
//               />
//             </View>
//           ))}
//         </View>

//         {/* Calculations */}
//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Summary</Text>
//           <CalcRow label="Final Amount" value={formatCurrency(finalAmount)} />
//           <CalcRow label="Advance Paid" value={formatCurrency(order?.advanceAmount || 0)} />
//           <CalcRow label="Today's Payment" value={formatCurrency(payment)} />
//           <CalcRow label="Remaining Due" value={formatCurrency(remainingDue)} highlight={remainingDue > 0} />
//           <CalcRow
//             label="Profit/Loss"
//             value={formatCurrency(profitLoss)}
//             highlight={profitLoss < 0}
//           />
//         </View>

//         {/* Notes */}
//         <View style={styles.card}>
//           <Text style={styles.label}>Notes</Text>
//           <TextInput
//             style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
//             value={notes}
//             onChangeText={setNotes}
//             placeholder="Additional notes..."
//             placeholderTextColor={COLORS.textMuted}
//             multiline
//           />
//         </View>

//         <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
//           {saving ? <ActivityIndicator color={COLORS.white} /> : (
//             <Text style={styles.submitBtnText}>Record Delivery</Text>
//           )}
//         </TouchableOpacity>
//         <View style={{ height: 30 }} />
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
//   center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   orderInfo: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginBottom: 16 },
//   orderCustomer: { fontSize: 18, fontWeight: '800', color: COLORS.white },
//   orderDetail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
//   advanceText: { fontSize: 13, color: '#90EE90', marginTop: 4, fontWeight: '600' },
//   card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
//   sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase' },
//   field: { marginBottom: 14 },
//   label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
//   input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
//   mirRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
//   mirBox: { flex: 1, backgroundColor: COLORS.background, borderRadius: 8, padding: 10, alignItems: 'center' },
//   mirLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
//   mirValue: { fontSize: 18, fontWeight: '800' },
//   calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border + '60' },
//   calcRowHighlight: { backgroundColor: COLORS.dangerLight, borderRadius: 6, paddingHorizontal: 8, borderBottomWidth: 0, marginTop: 4 },
//   calcLabel: { fontSize: 13, color: COLORS.textSecondary },
//   calcValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
//   calcValueHighlight: { color: COLORS.danger, fontSize: 16, fontWeight: '800' },
//   submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
//   submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
// });

// src/screens/delivery/DeliveryEntryScreen.tsx
// Full standalone delivery screen (used from OrderDetails → Record Delivery)
// Supports both batch and non-batch delivery, with full mir calculation

import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { orderAPI } from '../../api/services';
import { batchAPI } from '../../api/batchServices';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

// ─── Theme ─────────────────────────────────────────────────────────────────────
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
  white: '#FFFFFF',
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
  white: '#FFFFFF',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── Input field ───────────────────────────────────────────────────────────────
const Field = ({
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
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: highlight ? T.info : T.textSecondary }]}>
      {label}
    </Text>
    {note && <Text style={[styles.fieldNote, { color: T.textMuted }]}>{note}</Text>}
    <View
      style={[
        styles.inputWrap,
        {
          borderColor: highlight ? T.info + '60' : T.border,
          backgroundColor: T.inputBg,
        },
      ]}
    >
      <TextInput
        style={[styles.input, { color: T.textPrimary }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder ?? '0'}
        placeholderTextColor={T.textMuted}
      />
      {suffix && <Text style={[styles.inputSuffix, { color: T.textMuted }]}>{suffix}</Text>}
    </View>
  </View>
);

// ─── Calc row ───────────────────────────────────────────────────────────────────
const CalcRow = ({ label, value, color, T, bold }: any) => (
  <View style={[styles.calcRow, { borderBottomColor: T.border }]}>
    <Text style={[styles.calcLabel, { color: T.textSecondary, fontWeight: bold ? '700' : '400' }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.calcValue,
        { color: color ?? T.textPrimary, fontWeight: bold ? '800' : '600' },
      ]}
    >
      {value}
    </Text>
  </View>
);

// ─── Mir compare visual ────────────────────────────────────────────────────────
const MirVisual = ({ cMir, oMir, poly, T }: any) => {
  if (!cMir || !oMir || !poly) return null;
  const compTotal = cMir * poly;
  const ourTotal = oMir * poly;
  const diff = compTotal - ourTotal;
  const color = diff === 0 ? T.success : diff > 0 ? T.danger : T.warning;

  return (
    <View style={[styles.mirVisual, { backgroundColor: T.infoSoft, borderColor: T.info + '33' }]}>
      <Text style={[styles.mirVisualTitle, { color: T.info }]}>মীর তুলনা</Text>

      <View style={styles.mirVisualRow}>
        <View style={styles.mirVisualItem}>
          <Text style={[styles.mirVisualNum, { color: T.info }]}>
            {cMir} × {poly}
          </Text>
          <Text style={[styles.mirVisualLabel, { color: T.textMuted }]}>কোম্পানি</Text>
          <Text style={[styles.mirVisualTotal, { color: T.info }]}>
            {compTotal.toLocaleString()} PL
          </Text>
        </View>

        <View style={[styles.mirVisualVsDot, { backgroundColor: T.border }]}>
          <Text style={[styles.mirVisualVsText, { color: T.textMuted }]}>VS</Text>
        </View>

        <View style={styles.mirVisualItem}>
          <Text style={[styles.mirVisualNum, { color: T.accent }]}>
            {oMir} × {poly}
          </Text>
          <Text style={[styles.mirVisualLabel, { color: T.textMuted }]}>আমাদের</Text>
          <Text style={[styles.mirVisualTotal, { color: T.accent }]}>
            {ourTotal.toLocaleString()} PL
          </Text>
        </View>
      </View>

      <View style={[styles.mirDiffBanner, { backgroundColor: color + '18' }]}>
        <Ionicons
          name={
            diff === 0 ? 'checkmark-circle' : diff > 0 ? 'arrow-up-circle' : 'arrow-down-circle'
          }
          size={14}
          color={color}
        />
        <Text style={[styles.mirDiffBannerText, { color }]}>
          {diff === 0
            ? 'মীর সম্পূর্ণ মিলছে'
            : diff > 0
              ? `কোম্পানি ${Math.abs(diff).toLocaleString()} PL বেশি দিয়েছে`
              : `কোম্পানি ${Math.abs(diff).toLocaleString()} PL কম দিয়েছে`}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const DeliveryEntryScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, batchId, batchOrderId } = route.params ?? {};

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Mir fields ───────────────────────────────────────────────────────────────
  const [companyMir, setCompanyMir] = useState('');
  const [ourMir, setOurMir] = useState('');
  const [totalPoly, setTotalPoly] = useState('');

  // ── Quantity ─────────────────────────────────────────────────────────────────
  const [deliveredQty, setDeliveredQty] = useState('');

  // ── Payment ──────────────────────────────────────────────────────────────────
  const [deliveryRate, setDeliveryRate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [payment, setPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    orderAPI
      .getById(orderId)
      .then((res) => {
        const o = res.data.data;
        setOrder(o);
        setDeliveredQty(o.plQuantity.toString());
        setDeliveryRate(o.unitRate.toString());
        setLoading(false);
      })
      .catch(() => {
        Toast.show({ type: 'error', text1: 'ত্রুটি', text2: 'অর্ডার লোড ব্যর্থ' });
        navigation.goBack();
      });
  }, [orderId]);

  // ── Calculations ──────────────────────────────────────────────────────────────
  const orderedQty = order?.plQuantity ?? 0;
  const advance = order?.advanceAmount ?? 0;

  const cMir = parseFloat(companyMir) || 0;
  const oMir = parseFloat(ourMir) || 0;
  const poly = parseFloat(totalPoly) || 0;
  const rate = parseFloat(deliveryRate) || 0;
  const disc = parseFloat(discount) || 0;
  const paid = parseFloat(payment) || 0;

  // If mir + poly provided → use ourMir × poly as actual quantity
  const mirQty = oMir > 0 && poly > 0 ? oMir * poly : 0;
  const actualQty = mirQty > 0 ? mirQty : parseFloat(deliveredQty) || 0;

  const compTotal = cMir * poly;
  const ourTotal = oMir * poly;
  const mirDiff = compTotal - ourTotal;

  const finalAmt = Math.max(0, actualQty * rate - disc);
  const totalPaid = advance + paid;
  const dueAmt = Math.max(0, finalAmt - totalPaid);
  const isPartial = actualQty > 0 && actualQty < orderedQty;
  const remaining = orderedQty - actualQty;
  const pct = orderedQty > 0 ? Math.min((actualQty / orderedQty) * 100, 100) : 0;

  // Auto-update deliveredQty when mir × poly changes
  useEffect(() => {
    if (mirQty > 0) setDeliveredQty(mirQty.toString());
  }, [mirQty]);

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    if (!actualQty || actualQty <= 0) {
      setError('ডেলিভারি পরিমাণ দিন');
      return false;
    }
    if (!rate || rate <= 0) {
      setError('দর আবশ্যিক');
      return false;
    }
    if (actualQty > orderedQty) {
      setError(`সর্বোচ্চ ${orderedQty} PL`);
      return false;
    }
    setError('');
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        deliveredQuantity: actualQty,
        // Mir
        companyMir: cMir || undefined,
        ourMir: oMir || undefined,
        totalPoly: poly || undefined,
        mirDiff: cMir && oMir && poly ? mirDiff : undefined,
        totalFish: ourTotal || undefined,
        deliveredPL: poly || undefined,
        // Payment
        deliveryRate: rate,
        discount: disc || undefined,
        customerPayment: paid,
        dueAmount: dueAmt,
        duePaymentDate: dueAmt > 0 && dueDate ? dueDate : undefined,
        finalAmount: finalAmt,
        // Partial
        isPartial,
        remainingQuantity: isPartial ? remaining : 0,
        notes,
      };

      if (batchId && batchOrderId) {
        await batchAPI.recordDelivery(batchId, batchOrderId, payload);
      } else {
        await (orderAPI as any).recordDelivery(orderId, payload);
      }

      Toast.show({
        type: 'success',
        text1: isPartial ? 'আংশিক ডেলিভারি সম্পন্ন' : 'ডেলিভারি সম্পন্ন!',
        text2: isPartial
          ? `বাকি ${remaining.toLocaleString()} PL নতুন অর্ডার হয়েছে`
          : `${actualQty.toLocaleString()} PL ডেলিভারি রেকর্ড হয়েছে`,
      });

      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'ডেলিভারি ব্যর্থ হয়েছে';
      setError(msg);
      Toast.show({ type: 'error', text1: 'ত্রুটি', text2: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );

  if (!order) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: T.bg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: T.accent }]}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          {batchId && (
            <View style={[styles.batchBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="boat-outline" size={11} color="#fff" />
              <Text style={styles.batchBadgeText}>ব্যাচ ডেলিভারি</Text>
            </View>
          )}

          <Text style={styles.heroName}>{order.customerName}</Text>
          <Text style={styles.heroSub}>
            {order.ponaType} · অর্ডার {order.plQuantity.toLocaleString()} PL
          </Text>

          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroStatLabel}>মোট দাম</Text>
              <Text style={styles.heroStatVal}>{formatCurrency(order.totalPrice)}</Text>
            </View>
            {advance > 0 && (
              <View>
                <Text style={styles.heroStatLabel}>আগাম জমা</Text>
                <Text style={[styles.heroStatVal, { color: '#90EE90' }]}>
                  {formatCurrency(advance)}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.heroStatLabel}>ডেলিভারির তারিখ</Text>
              <Text style={styles.heroStatVal}>{formatDate(order.deliveryDate)}</Text>
            </View>
          </View>
        </View>

        {/* ── Error ── */}
        {!!error && (
          <View style={[styles.errorBanner, { backgroundColor: T.dangerSoft }]}>
            <Ionicons name="alert-circle-outline" size={14} color={T.danger} />
            <Text style={[styles.errorText, { color: T.danger }]}>{error}</Text>
          </View>
        )}

        {/* ── Section: Mir ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardTitleDot, { backgroundColor: T.info }]} />
            <Text style={[styles.cardTitle, { color: T.textMuted }]}>মীর তথ্য</Text>
          </View>

          <Field
            label="কোম্পানির মীর (প্রতি পলি)"
            value={companyMir}
            onChange={(v: string) => {
              setCompanyMir(v);
              setError('');
            }}
            placeholder="যেমন: ১১৫০"
            T={T}
            highlight
            note="কোম্পানি প্রতি পলিতে কত পোনা বলেছে"
          />
          <Field
            label="আমাদের গণনা করা মীর"
            value={ourMir}
            onChange={(v: string) => {
              setOurMir(v);
              setError('');
            }}
            placeholder="যেমন: ১১৩০"
            T={T}
            note="আমরা গুনে যা পেয়েছি"
          />
          <Field
            label="মোট পলি সংখ্যা"
            value={totalPoly}
            onChange={(v: string) => {
              setTotalPoly(v);
              setError('');
            }}
            suffix="পলি"
            placeholder="যেমন: ৪০"
            T={T}
            note="এই কাস্টমারকে কতটি পলি দিলেন"
          />

          <MirVisual cMir={cMir} oMir={oMir} poly={poly} T={T} />
        </View>

        {/* ── Section: Quantity ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardTitleDot, { backgroundColor: T.accent }]} />
            <Text style={[styles.cardTitle, { color: T.textMuted }]}>ডেলিভারি পরিমাণ</Text>
          </View>

          {mirQty > 0 && (
            <View style={[styles.autoNote, { backgroundColor: T.accentSoft }]}>
              <Ionicons name="calculator-outline" size={13} color={T.accent} />
              <Text style={[styles.autoNoteText, { color: T.accent }]}>
                মীর × পলি = {ourTotal.toLocaleString()} PL (স্বয়ংক্রিয়)
              </Text>
            </View>
          )}

          <Field
            label="ডেলিভারিকৃত পরিমাণ (PL)"
            value={deliveredQty}
            onChange={(v: string) => {
              setDeliveredQty(v);
              setError('');
            }}
            suffix="PL"
            placeholder={`সর্বোচ্চ ${orderedQty.toLocaleString()}`}
            T={T}
          />

          {actualQty > 0 && (
            <>
              <View style={styles.progressWrap}>
                <View style={[styles.progressBg, { backgroundColor: T.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: isPartial ? T.warning : T.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPct, { color: T.textMuted }]}>{pct.toFixed(0)}%</Text>
              </View>

              {isPartial && (
                <View style={[styles.partialNote, { backgroundColor: T.infoSoft }]}>
                  <Ionicons name="information-circle" size={13} color={T.info} />
                  <Text style={[styles.partialNoteText, { color: T.info }]}>
                    বাকি {remaining.toLocaleString()} PL নতুন pending অর্ডার হবে
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Section: Payment ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardTitleDot, { backgroundColor: T.success }]} />
            <Text style={[styles.cardTitle, { color: T.textMuted }]}>মূল্য ও পেমেন্ট</Text>
          </View>

          <Field
            label="ডেলিভারি দর (৳/PL)"
            value={deliveryRate}
            onChange={(v: string) => {
              setDeliveryRate(v);
              setError('');
            }}
            suffix="৳"
            T={T}
          />
          <Field
            label="ছাড় (Discount)"
            value={discount}
            onChange={setDiscount}
            suffix="৳"
            placeholder="০"
            T={T}
          />
          <Field
            label="আজকের পেমেন্ট"
            value={payment}
            onChange={setPayment}
            suffix="৳"
            placeholder="০"
            T={T}
          />

          {dueAmt > 0 && (
            <Field
              label="বাকি পরিশোধের তারিখ"
              value={dueDate}
              onChange={setDueDate}
              placeholder="YYYY-MM-DD"
              T={T}
              keyboardType="default"
              note="কবে বাকি টাকা দেবে"
            />
          )}
        </View>

        {/* ── Section: Summary ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardTitleDot, { backgroundColor: T.warning }]} />
            <Text style={[styles.cardTitle, { color: T.textMuted }]}>হিসাব সারসংক্ষেপ</Text>
          </View>

          {oMir > 0 && poly > 0 && (
            <CalcRow
              label={`${oMir} × ${poly} পলি`}
              value={`${ourTotal.toLocaleString()} PL`}
              color={T.accent}
              T={T}
            />
          )}
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
            style={[styles.dueRow, { backgroundColor: dueAmt > 0 ? T.dangerSoft : T.successSoft }]}
          >
            <Text style={[styles.dueLabel, { color: dueAmt > 0 ? T.danger : T.success }]}>
              {dueAmt > 0 ? 'বাকি' : 'সম্পূর্ণ পরিশোধ ✓'}
            </Text>
            <Text style={[styles.dueValue, { color: dueAmt > 0 ? T.danger : T.success }]}>
              {formatCurrency(dueAmt)}
            </Text>
          </View>

          {isPartial && (
            <View style={[styles.partialRow, { backgroundColor: T.infoSoft }]}>
              <Text style={[styles.partialRowLabel, { color: T.info }]}>নতুন অর্ডার (বাকি PL)</Text>
              <Text style={[styles.partialRowValue, { color: T.info }]}>
                {remaining.toLocaleString()} PL
              </Text>
            </View>
          )}
        </View>

        {/* ── Notes ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.fieldLabel, { color: T.textSecondary }]}>নোট (ঐচ্ছিক)</Text>
          <TextInput
            style={[
              styles.notesInput,
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

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: saving ? T.accent + '99' : T.accent }]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.submitBtnInner}>
              <Ionicons
                name={isPartial ? 'git-branch-outline' : 'checkmark-circle-outline'}
                size={18}
                color="#fff"
              />
              <Text style={styles.submitBtnText}>
                {isPartial ? 'আংশিক ডেলিভারি রেকর্ড করুন' : 'ডেলিভারি রেকর্ড করুন'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { borderRadius: 16, padding: 20, marginBottom: 14, overflow: 'hidden' },
  heroBlob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -30,
  },
  heroBlob2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 20,
  },
  batchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 10,
  },
  batchBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  heroStats: { flexDirection: 'row', gap: 20 },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  heroStatVal: { fontSize: 13, fontWeight: '700', color: '#fff' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },

  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  cardTitleDot: { width: 7, height: 7, borderRadius: 4 },
  cardTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  fieldNote: { fontSize: 11, marginBottom: 5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10 },
  input: { flex: 1, padding: 12, fontSize: 15 },
  inputSuffix: { paddingRight: 12, fontSize: 13, fontWeight: '700' },

  // Mir visual
  mirVisual: { borderRadius: 12, padding: 14, borderWidth: 1, marginTop: 4 },
  mirVisualTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  mirVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mirVisualItem: { flex: 1, alignItems: 'center' },
  mirVisualNum: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  mirVisualLabel: { fontSize: 10, marginBottom: 4 },
  mirVisualTotal: { fontSize: 18, fontWeight: '900' },
  mirVisualVsDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  mirVisualVsText: { fontSize: 10, fontWeight: '700' },
  mirDiffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 9,
  },
  mirDiffBannerText: { fontSize: 12, fontWeight: '600', flex: 1 },

  autoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 9,
    marginBottom: 12,
  },
  autoNoteText: { fontSize: 12, fontWeight: '500', flex: 1 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressBg: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: '600', width: 34 },

  partialNote: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 9 },
  partialNoteText: { fontSize: 12, fontWeight: '500', flex: 1 },

  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  calcLabel: { fontSize: 13 },
  calcValue: { fontSize: 14 },

  dueRow: {
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

  partialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  partialRowLabel: { fontSize: 13, fontWeight: '600' },
  partialRowValue: { fontSize: 14, fontWeight: '800' },

  notesInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  submitBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
