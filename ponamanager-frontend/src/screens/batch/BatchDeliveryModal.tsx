// src/screens/batch/BatchDeliveryModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { batchAPI } from '../../api/batchServices';
import { Batch, BatchOrder } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency, getPonaTypeColor } from '../../utils/helpers';
import dayjs from 'dayjs';

const FieldRow = ({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  editable = true,
  suffix,
}: any) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldInputWrapper}>
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
        value={String(value ?? '')}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder || '0'}
        placeholderTextColor={COLORS.textMuted}
        editable={editable}
      />
      {suffix && <Text style={styles.fieldSuffix}>{suffix}</Text>}
    </View>
  </View>
);

const CalcRow = ({ label, value, highlight, valueColor }: any) => (
  <View style={[styles.calcRow, highlight && styles.calcRowHighlight]}>
    <Text style={styles.calcLabel}>{label}</Text>
    <Text style={[styles.calcValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

export const BatchDeliveryModal = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId, batchOrderId } = route.params;

  const [batchOrder, setBatchOrder] = useState<BatchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [deliveredQty, setDeliveredQty] = useState('');
  const [deliveryRate, setDeliveryRate] = useState('');
  const [customerPayment, setCustomerPayment] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'complete' | 'partial'>('complete');
  const [hasDue, setHasDue] = useState(false);
  const [duePaymentDate, setDuePaymentDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Fetch batch and find the specific batch order
    batchAPI
      .getById(batchId)
      .then((res) => {
        const batch = res.data.data;
        const bo = batch.batchOrders?.find((o: BatchOrder) => o.id === batchOrderId);
        if (bo) {
          setBatchOrder(bo);
          // Pre-fill from order data
          setDeliveredQty(bo.order.plQuantity.toString());
          setDeliveryRate(bo.order.unitRate.toString());
          // Advance already paid
          setCustomerPayment('');
        }
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('ত্রুটি', 'ডেটা লোড হয়নি');
        navigation.goBack();
      });
  }, []);

  // Calculations
  const orderedQty = batchOrder?.order.plQuantity || 0;
  const advance = batchOrder?.order.advanceAmount || 0;
  const delivered = parseFloat(deliveredQty) || 0;
  const rate = parseFloat(deliveryRate) || 0;
  const payment = parseFloat(customerPayment) || 0;
  const finalAmount = delivered * rate;
  const totalReceived = advance + payment;
  const dueAmount = Math.max(0, finalAmount - totalReceived);
  const overpaid = Math.max(0, totalReceived - finalAmount);

  const validate = () => {
    if (!deliveredQty || delivered <= 0) {
      Alert.alert('সতর্কতা', 'ডেলিভারি পরিমাণ দিন');
      return false;
    }
    if (!deliveryRate || rate <= 0) {
      Alert.alert('সতর্কতা', 'দর (রেট) দিন');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const isPartial = deliveryMode === 'partial' && delivered < orderedQty;
      const remaining = Math.max(0, orderedQty - delivered);
      await batchAPI.recordDelivery(batchId, batchOrderId, {
        deliveredQuantity: delivered,
        deliveryRate: rate,
        customerPayment: payment,
        dueAmount,
        duePaymentDate: dueAmount > 0 ? duePaymentDate : undefined,
        notes,
        isPartial,
        remainingQuantity: isPartial ? remaining : 0,
      });
      Alert.alert('সফল', 'ডেলিভারি সম্পন্ন হয়েছে!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('ত্রুটি', err.response?.data?.message || 'ডেলিভারি রেকর্ড ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!batchOrder) return null;

  const typeColor = getPonaTypeColor(batchOrder.order.ponaType);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Customer info */}
        <View style={[styles.customerCard, { borderTopColor: typeColor }]}>
          <View style={styles.customerCardLeft}>
            <Text style={styles.customerName}>{batchOrder.order.customerName}</Text>
            <Text style={styles.customerMobile}>{batchOrder.order.customerMobile}</Text>
            <Text style={styles.customerAddress}>{batchOrder.order.customerAddress}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>
                {batchOrder.order.ponaType}
              </Text>
            </View>
            <Text style={styles.orderedQtyText}>অর্ডার: {orderedQty.toLocaleString()} PL</Text>
            {advance > 0 && <Text style={styles.advanceText}>জমা: {formatCurrency(advance)}</Text>}
          </View>
        </View>

        {/* Delivery input card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ডেলিভারির বিবরণ</Text>

          {/* Mode switcher */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => setDeliveryMode('complete')}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: deliveryMode === 'complete' ? COLORS.success : COLORS.background,
              }}
            >
              <Text style={{ color: deliveryMode === 'complete' ? COLORS.white : COLORS.text }}>
                সম্পূর্ণ ও বন্ধ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeliveryMode('partial')}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: deliveryMode === 'partial' ? COLORS.info : COLORS.background,
              }}
            >
              <Text style={{ color: deliveryMode === 'partial' ? COLORS.white : COLORS.text }}>
                আংশিক
              </Text>
            </TouchableOpacity>
          </View>

          <FieldRow
            label="ডেলিভারিকৃত পরিমাণ"
            value={deliveredQty}
            onChangeText={setDeliveredQty}
            keyboardType="numeric"
            suffix="PL"
          />
          <FieldRow
            label="বিক্রয় মূল্য (দর)"
            value={deliveryRate}
            onChangeText={setDeliveryRate}
            keyboardType="numeric"
            suffix="৳/PL"
          />
        </View>

        {/* Payment card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>পেমেন্টের বিবরণ</Text>

          {/* Advance (readonly) */}
          <FieldRow label="আগাম জমা" value={formatCurrency(advance)} editable={false} />
          <FieldRow
            label="আজকের পেমেন্ট"
            value={customerPayment}
            onChangeText={setCustomerPayment}
            keyboardType="numeric"
            suffix="৳"
          />

          {/* Summary */}
          <View style={styles.calcBlock}>
            <CalcRow label="মোট মূল্য" value={formatCurrency(finalAmount)} />
            <CalcRow label="মোট পেয়েছি (জমা+আজ)" value={formatCurrency(totalReceived)} />
            {dueAmount > 0 && (
              <CalcRow
                label="বাকি"
                value={formatCurrency(dueAmount)}
                highlight
                valueColor={COLORS.danger}
              />
            )}
            {overpaid > 0 && (
              <CalcRow
                label="বেশি দিয়েছেন"
                value={formatCurrency(overpaid)}
                valueColor={COLORS.success}
              />
            )}
          </View>

          {/* Due date input when due exists */}
          {dueAmount > 0 && (
            <View style={styles.dueDateWrapper}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.danger} />
              <Text style={styles.dueDateLabel}>বাকি পরিশোধের তারিখ:</Text>
              <TextInput
                style={styles.dueDateInput}
                value={duePaymentDate}
                onChangeText={setDuePaymentDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>নোট</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="অতিরিক্ত তথ্য..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.submitBtnText}>ডেলিভারি নিশ্চিত করুন</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  customerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 4,
    marginBottom: 14,
    elevation: 2,
  },
  customerCardLeft: { flex: 1 },
  customerName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  customerMobile: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  customerAddress: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 11, fontWeight: '700' },
  orderedQtyText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  advanceText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },

  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 14 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  fieldLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    flex: 1,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  fieldInputDisabled: { color: COLORS.textSecondary },
  fieldSuffix: { paddingRight: 10, fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  calcBlock: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10, gap: 0 },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  calcRowHighlight: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginTop: 4,
  },
  calcLabel: { fontSize: 13, color: COLORS.textSecondary },
  calcValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  dueDateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
    padding: 10,
  },
  dueDateLabel: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  dueDateInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 6,
    padding: 6,
  },

  notesInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
