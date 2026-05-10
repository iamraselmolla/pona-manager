// src/screens/delivery/DeliveryEntryScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { orderAPI, deliveryAPI } from '../../api/services';
import { Order } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';

const CalcRow = ({ label, value, highlight }: any) => (
  <View style={[styles.calcRow, highlight && styles.calcRowHighlight]}>
    <Text style={styles.calcLabel}>{label}</Text>
    <Text style={[styles.calcValue, highlight && styles.calcValueHighlight]}>{value}</Text>
  </View>
);

export const DeliveryEntryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deliveredQty, setDeliveredQty] = useState('');
  const [companyProvidedQty, setCompanyProvidedQty] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [deliveryRate, setDeliveryRate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [customerPayment, setCustomerPayment] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    orderAPI.getById(orderId).then((res) => {
      const o = res.data.data;
      setOrder(o);
      setDeliveredQty(o.plQuantity.toString());
      setDeliveryRate(o.unitRate.toString());
      setLoading(false);
    });
  }, [orderId]);

  const delivered = parseFloat(deliveredQty) || 0;
  const companyProvided = parseFloat(companyProvidedQty) || 0;
  const counted = parseFloat(countedQty) || 0;
  const rate = parseFloat(deliveryRate) || 0;
  const disc = parseFloat(discount) || 0;
  const payment = parseFloat(customerPayment) || 0;

  const companyMir = companyProvided - delivered;
  const countingMir = counted - delivered;
  const finalAmount = (delivered * rate) - disc;
  const remainingDue = Math.max(0, finalAmount - (order?.advanceAmount || 0) - payment);
  const mirPercentage = order?.plQuantity ? ((order.plQuantity - delivered) / order.plQuantity) * 100 : 0;
  const profitLoss = finalAmount - (companyProvided * rate * 0.9); // Simplified

  const handleSubmit = async () => {
    if (!deliveredQty || !deliveryRate) {
      Alert.alert('Validation', 'Please enter delivered quantity and rate');
      return;
    }
    setSaving(true);
    try {
      await deliveryAPI.create({
        orderId,
        customerId: order?.customerId,
        customerName: order?.customerName,
        orderedQuantity: order?.plQuantity,
        deliveredQuantity: delivered,
        companyProvidedQuantity: companyProvided,
        countedQuantity: counted,
        companyMir,
        countingMir,
        deliveryRate: rate,
        discount: disc,
        finalAmount,
        customerPayment: payment,
        remainingDue,
        profitLoss,
        mirPercentage,
        notes,
        deliveryDate: new Date().toISOString(),
      });
      Alert.alert('Success', 'Delivery recorded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record delivery');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderCustomer}>{order?.customerName}</Text>
          <Text style={styles.orderDetail}>{order?.ponaType} | Ordered: {order?.plQuantity.toLocaleString()} PL</Text>
          <Text style={styles.orderDetail}>Order Amount: {formatCurrency(order?.totalPrice || 0)}</Text>
          {(order?.advanceAmount || 0) > 0 && (
            <Text style={styles.advanceText}>Advance Paid: {formatCurrency(order?.advanceAmount || 0)}</Text>
          )}
        </View>

        {/* Delivery Fields */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quantity Details</Text>

          {[
            { label: 'Delivered Quantity (PL) *', val: deliveredQty, set: setDeliveredQty },
            { label: 'Company Provided Quantity', val: companyProvidedQty, set: setCompanyProvidedQty },
            { label: 'Counted Quantity', val: countedQty, set: setCountedQty },
          ].map((f) => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.val}
                onChangeText={f.set}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          ))}

          <View style={styles.mirRow}>
            <View style={styles.mirBox}>
              <Text style={styles.mirLabel}>Company Mir</Text>
              <Text style={[styles.mirValue, { color: companyMir >= 0 ? COLORS.danger : COLORS.success }]}>
                {companyMir.toFixed(0)}
              </Text>
            </View>
            <View style={styles.mirBox}>
              <Text style={styles.mirLabel}>Counting Mir</Text>
              <Text style={[styles.mirValue, { color: countingMir >= 0 ? COLORS.danger : COLORS.success }]}>
                {countingMir.toFixed(0)}
              </Text>
            </View>
            <View style={styles.mirBox}>
              <Text style={styles.mirLabel}>Mir %</Text>
              <Text style={[styles.mirValue, { color: mirPercentage > 5 ? COLORS.danger : COLORS.success }]}>
                {mirPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Rate & Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rate & Payment</Text>

          {[
            { label: 'Delivery Rate (৳/PL) *', val: deliveryRate, set: setDeliveryRate },
            { label: 'Discount (৳)', val: discount, set: setDiscount },
            { label: 'Customer Payment (৳)', val: customerPayment, set: setCustomerPayment },
          ].map((f) => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.val}
                onChangeText={f.set}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          ))}
        </View>

        {/* Calculations */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <CalcRow label="Final Amount" value={formatCurrency(finalAmount)} />
          <CalcRow label="Advance Paid" value={formatCurrency(order?.advanceAmount || 0)} />
          <CalcRow label="Today's Payment" value={formatCurrency(payment)} />
          <CalcRow label="Remaining Due" value={formatCurrency(remainingDue)} highlight={remainingDue > 0} />
          <CalcRow
            label="Profit/Loss"
            value={formatCurrency(profitLoss)}
            highlight={profitLoss < 0}
          />
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : (
            <Text style={styles.submitBtnText}>Record Delivery</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginBottom: 16 },
  orderCustomer: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  orderDetail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  advanceText: { fontSize: 13, color: '#90EE90', marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
  mirRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  mirBox: { flex: 1, backgroundColor: COLORS.background, borderRadius: 8, padding: 10, alignItems: 'center' },
  mirLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  mirValue: { fontSize: 18, fontWeight: '800' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border + '60' },
  calcRowHighlight: { backgroundColor: COLORS.dangerLight, borderRadius: 6, paddingHorizontal: 8, borderBottomWidth: 0, marginTop: 4 },
  calcLabel: { fontSize: 13, color: COLORS.textSecondary },
  calcValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  calcValueHighlight: { color: COLORS.danger, fontSize: 16, fontWeight: '800' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
