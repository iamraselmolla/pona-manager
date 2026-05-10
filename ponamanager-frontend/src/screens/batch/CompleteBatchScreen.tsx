// src/screens/batch/CompleteBatchScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { batchAPI } from '../../api/batchServices';
import { Batch, BatchExpense } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';

const EXPENSE_PRESETS = [
  { label: 'পরিবহন', icon: 'car-outline' as const },
  { label: 'লেবার', icon: 'people-outline' as const },
  { label: 'খাবার/চা', icon: 'restaurant-outline' as const },
  { label: 'অক্সিজেন', icon: 'water-outline' as const },
  { label: 'প্যাকেজিং', icon: 'cube-outline' as const },
  { label: 'অন্যান্য', icon: 'ellipsis-horizontal-circle-outline' as const },
];

export const CompleteBatchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expenses, setExpenses] = useState<BatchExpense[]>(
    EXPENSE_PRESETS.map((p) => ({ label: p.label, amount: 0 }))
  );
  const [customExpenses, setCustomExpenses] = useState<BatchExpense[]>([]);

  useEffect(() => {
    batchAPI.getById(batchId).then((res) => {
      setBatch(res.data.data);
      setLoading(false);
    }).catch(() => { Alert.alert('ত্রুটি', 'ডেটা লোড হয়নি'); navigation.goBack(); });
  }, []);

  const updateExpense = (idx: number, amount: string) => {
    setExpenses((prev) => prev.map((e, i) => i === idx ? { ...e, amount: parseFloat(amount) || 0 } : e));
  };

  const addCustomExpense = () => {
    setCustomExpenses((prev) => [...prev, { label: '', amount: 0 }]);
  };

  const updateCustomExpense = (idx: number, field: 'label' | 'amount', value: string) => {
    setCustomExpenses((prev) =>
      prev.map((e, i) => i === idx ? { ...e, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : e)
    );
  };

  const removeCustomExpense = (idx: number) => {
    setCustomExpenses((prev) => prev.filter((_, i) => i !== idx));
  };

  const allExpenses = [
    ...expenses.filter((e) => e.amount > 0),
    ...customExpenses.filter((e) => e.label && e.amount > 0),
  ];

  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = (batch?.totalCollected || 0) - totalExpenses;

  const handleComplete = () => {
    Alert.alert(
      'ব্যাচ কমপ্লিট করুন',
      `মোট খরচ: ${formatCurrency(totalExpenses)}\nনেট প্রফিট: ${formatCurrency(netProfit)}\n\nনিশ্চিত করতে চান?`,
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, কমপ্লিট করুন',
          style: 'default',
          onPress: async () => {
            setSaving(true);
            try {
              await batchAPI.completeBatch(batchId, allExpenses);
              Alert.alert('সফল!', 'ব্যাচ সম্পন্ন হয়েছে!', [
                { text: 'OK', onPress: () => navigation.navigate('BatchList') },
              ]);
            } catch (err: any) {
              Alert.alert('ত্রুটি', err.response?.data?.message || 'ব্যাচ কমপ্লিট ব্যর্থ');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!batch) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Batch summary reminder */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{batch.batchNumber} — সারসংক্ষেপ</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>মোট অর্ডার</Text>
            <Text style={styles.summaryValue}>{batch.batchOrders?.length || 0} টি</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>মোট প্রাপ্ত</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {formatCurrency(batch.totalCollected)}
            </Text>
          </View>
          {batch.totalDue > 0 && (
            <View style={[styles.summaryRow, styles.dueSummaryRow]}>
              <Text style={styles.summaryLabel}>মোট বাকি ({batch.duePendingCount} জন)</Text>
              <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                {formatCurrency(batch.totalDue)}
              </Text>
            </View>
          )}
        </View>

        {/* Expense entry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>খরচের হিসাব</Text>
          <Text style={styles.cardSubtitle}>
            ব্যাচ কমপ্লিট করতে আজকের সব খরচ যোগ করুন
          </Text>

          {expenses.map((expense, idx) => {
            const preset = EXPENSE_PRESETS[idx];
            return (
              <View key={idx} style={styles.expenseItem}>
                <View style={[styles.expenseIconBox, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name={preset.icon} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.expenseItemLabel}>{expense.label}</Text>
                <View style={styles.expenseInputWrapper}>
                  <TextInput
                    style={styles.expenseInput}
                    value={expense.amount ? expense.amount.toString() : ''}
                    onChangeText={(v) => updateExpense(idx, v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.expenseSuffix}>৳</Text>
                </View>
              </View>
            );
          })}

          {/* Custom expenses */}
          {customExpenses.map((e, idx) => (
            <View key={`custom-${idx}`} style={styles.customExpenseItem}>
              <TextInput
                style={styles.customLabelInput}
                value={e.label}
                onChangeText={(v) => updateCustomExpense(idx, 'label', v)}
                placeholder="খরচের নাম"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.expenseInputWrapper}>
                <TextInput
                  style={styles.expenseInput}
                  value={e.amount ? e.amount.toString() : ''}
                  onChangeText={(v) => updateCustomExpense(idx, 'amount', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.expenseSuffix}>৳</Text>
              </View>
              <TouchableOpacity onPress={() => removeCustomExpense(idx)}>
                <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addExpenseBtn} onPress={addCustomExpense}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addExpenseBtnText}>অন্য খরচ যোগ করুন</Text>
          </TouchableOpacity>
        </View>

        {/* Totals card */}
        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>সামগ্রিক হিসাব</Text>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>মোট প্রাপ্ত</Text>
            <Text style={[styles.totalsValue, { color: COLORS.success }]}>
              {formatCurrency(batch.totalCollected)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>মোট খরচ</Text>
            <Text style={[styles.totalsValue, { color: COLORS.warning }]}>
              - {formatCurrency(totalExpenses)}
            </Text>
          </View>
          {batch.totalDue > 0 && (
            <View style={[styles.totalsRow, { backgroundColor: COLORS.dangerLight, borderRadius: 6, paddingHorizontal: 8 }]}>
              <Text style={styles.totalsLabel}>বাকি (পাওনা)</Text>
              <Text style={[styles.totalsValue, { color: COLORS.danger }]}>
                {formatCurrency(batch.totalDue)}
              </Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.netProfitRow]}>
            <Text style={styles.netProfitLabel}>নেট লাভ/ক্ষতি</Text>
            <Text style={[styles.netProfitValue, { color: netProfit >= 0 ? COLORS.success : COLORS.danger }]}>
              {formatCurrency(netProfit)}
            </Text>
          </View>
        </View>

        {/* Complete button */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={COLORS.white} />
              <Text style={styles.completeBtnText}>ব্যাচ কমপ্লিট করুন</Text>
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

  summaryCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginBottom: 14 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  dueSummaryRow: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 8, marginTop: 4 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 },

  expenseItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  expenseIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expenseItemLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  expenseInputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 8, backgroundColor: COLORS.background,
  },
  expenseInput: { width: 80, paddingVertical: 8, paddingHorizontal: 10, fontSize: 15, color: COLORS.text, textAlign: 'right' },
  expenseSuffix: { paddingRight: 8, fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  customExpenseItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  customLabelInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.text,
  },
  addExpenseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8, borderStyle: 'dashed',
    padding: 10, marginTop: 6,
  },
  addExpenseBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  totalsCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 14, gap: 8 },
  totalsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 6 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalsLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalsValue: { fontSize: 15, fontWeight: '700' },
  netProfitRow: {
    borderTopWidth: 2, borderTopColor: COLORS.border, marginTop: 4, paddingTop: 10,
  },
  netProfitLabel: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  netProfitValue: { fontSize: 22, fontWeight: '900' },

  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.success, borderRadius: 12, paddingVertical: 16,
  },
  completeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
