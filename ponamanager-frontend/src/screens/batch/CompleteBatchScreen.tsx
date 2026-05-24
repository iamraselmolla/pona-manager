// src/screens/batch/CompleteBatchScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { batchAPI } from '../../api/batchServices';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { showModal, showConfirm } from '../../utils/AppModal';

// ─── Theme ─────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F0F2F8',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  textPrimary: '#0D1117',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  accent: '#4F46E5',
  accentSoft: 'rgba(79,70,229,0.09)',
  success: '#059669',
  successSoft: 'rgba(5,150,105,0.09)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220,38,38,0.09)',
  warning: '#D97706',
  warningSoft: 'rgba(217,119,6,0.09)',
  info: '#0284C7',
  infoSoft: 'rgba(2,132,199,0.09)',
  inputBg: '#F0F2F8',
};
const DARK = {
  bg: '#080B12',
  surface: '#111622',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#EEF0FF',
  textSecondary: '#8892B0',
  textMuted: '#4A5568',
  accent: '#6366F1',
  accentSoft: 'rgba(99,102,241,0.15)',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.12)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.12)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.12)',
  info: '#38BDF8',
  infoSoft: 'rgba(56,189,248,0.12)',
  inputBg: '#0D1117',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── Expense categories ─────────────────────────────────────────────────────────
const CATEGORIES = ['Transport', 'Labor', 'Food', 'Fuel', 'Repair', 'Other'];

// ─── Expense row ────────────────────────────────────────────────────────────────
const ExpenseRow = ({ expense, onDelete, T }: any) => (
  <View style={[erStyles.row, { backgroundColor: T.surface, borderColor: T.border }]}>
    <View style={[erStyles.catDot, { backgroundColor: T.warningSoft }]}>
      <Ionicons name="receipt-outline" size={13} color={T.warning} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[erStyles.label, { color: T.textPrimary }]}>{expense.label}</Text>
      <Text style={[erStyles.cat, { color: T.textMuted }]}>{expense.category}</Text>
    </View>
    <Text style={[erStyles.amount, { color: T.warning }]}>{formatCurrency(expense.amount)}</Text>
    <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name="trash-outline" size={15} color={T.danger} />
    </TouchableOpacity>
  </View>
);
const erStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  catDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '600' },
  cat: { fontSize: 10, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800' },
});

// ─── Main Screen ────────────────────────────────────────────────────────────────
export const CompleteBatchScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params;

  const [batch, setBatch] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Add expense form
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Transport');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = useCallback(async () => {
    try {
      const [batchRes, expRes] = await Promise.all([
        batchAPI.getById(batchId),
        batchAPI.getExpenses(batchId),
      ]);
      setBatch(batchRes.data.data);
      const raw = expRes?.data?.data;
      setExpenses(Array.isArray(raw) ? raw : []);
    } catch {
      Toast.show({ type: 'error', text1: 'লোড ব্যর্থ' });
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [batchId]);

  useEffect(() => {
    loadData();
  }, []);

  // Add expense
  const handleAddExpense = async () => {
    if (!label.trim()) {
      Toast.show({ type: 'error', text1: 'খরচের নাম দিন' });
      return;
    }
    if (!amount) {
      Toast.show({ type: 'error', text1: 'পরিমাণ দিন' });
      return;
    }
    setAdding(true);
    try {
      await batchAPI.addExpense(batchId, {
        label: label.trim(),
        amount: parseFloat(amount),
        category,
        notes: notes.trim() || undefined,
      });
      setLabel('');
      setAmount('');
      setNotes('');
      setShowForm(false);
      Toast.show({ type: 'success', text1: 'খরচ যোগ হয়েছে' });
      loadData();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'ত্রুটি', text2: e?.response?.data?.message || 'ব্যর্থ' });
    } finally {
      setAdding(false);
    }
  };

  // Delete expense (called from Delete confirm modal)
  const handleDeleteExpense = async (expenseId: string) => {
    showConfirm(
      'এই খরচটি মুছে দিতে চান?',
      async () => {
        try {
          await batchAPI.deleteExpense(batchId, expenseId);
          showModal({ type: 'success', message: 'খরচ মুছে গেছে', autoDismiss: 1500 });
          loadData();
        } catch {
          showModal({ type: 'error', message: 'মুছতে ব্যর্থ' });
        }
      },
      undefined,
      'খরচ মুছুন',
    );
  };

  // Complete batch
  const tryComplete = () => {
    if (expenses.length === 0) {
      showConfirm('এই ব্যাচে কোনো খরচ নেই। খরচ ছাড়াই বন্ধ করতে চান?', () =>
        showConfirm(
          `${batch.batchNumber} সম্পন্ন করতে চান?\nসংগ্রহ: ${formatCurrency(totalCollected)} · খরচ: ${formatCurrency(0)} · নিট: ${formatCurrency(netProfit)}`,
          handleComplete,
        ),
      );
      return;
    }
    showConfirm(
      `${batch.batchNumber} সম্পন্ন করতে চান?\nসংগ্রহ: ${formatCurrency(totalCollected)} · খরচ: ${formatCurrency(totalExpenses)} · নিট: ${formatCurrency(netProfit)}`,
      handleComplete,
    );
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await batchAPI.complete(batchId);
      showModal({
        type: 'success',
        title: 'ব্যাচ সম্পন্ন!',
        message: `${batch.batchNumber} সফলভাবে বন্ধ হয়েছে`,
        autoDismiss: 2000,
      });
      navigation.goBack();
    } catch (e: any) {
      showModal({
        type: 'error',
        title: 'ত্রুটি',
        message: e?.response?.data?.message || 'ব্যাচ বন্ধ ব্যর্থ',
      });
    } finally {
      setCompleting(false);
    }
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );

  if (!batch) return null;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCollected = batch.totalCollected ?? 0;
  const totalDue = batch.totalDue ?? 0;
  const netProfit = totalCollected - totalExpenses;
  const pendingCount =
    batch.batchOrders?.filter((o: any) => o.deliveryStatus === 'pending').length ?? 0;
  const canComplete = pendingCount === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Batch hero ── */}
        <View style={[styles.hero, { backgroundColor: T.surface, borderColor: T.border }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: T.textMuted }]}>ব্যাচ বন্ধ</Text>
              <Text style={[styles.heroBatchNum, { color: T.textPrimary }]}>
                {batch.batchNumber}
              </Text>
              <Text style={[styles.heroDate, { color: T.textMuted }]}>
                {formatDate(batch.batchDate)}
              </Text>
            </View>
            {pendingCount > 0 && (
              <View style={[styles.pendingBadge, { backgroundColor: T.dangerSoft }]}>
                <Ionicons name="warning-outline" size={13} color={T.danger} />
                <Text style={[styles.pendingBadgeText, { color: T.danger }]}>
                  {pendingCount} ডেলিভারি বাকি
                </Text>
              </View>
            )}
          </View>

          {/* Financial summary */}
          <View style={styles.heroStats}>
            <View style={[styles.heroStat, { backgroundColor: T.successSoft }]}>
              <Text style={[styles.heroStatLabel, { color: T.textMuted }]}>সংগ্রহ</Text>
              <Text style={[styles.heroStatVal, { color: T.success }]}>
                {formatCurrency(totalCollected)}
              </Text>
            </View>
            <View style={[styles.heroStat, { backgroundColor: T.warningSoft }]}>
              <Text style={[styles.heroStatLabel, { color: T.textMuted }]}>খরচ</Text>
              <Text style={[styles.heroStatVal, { color: T.warning }]}>
                {formatCurrency(totalExpenses)}
              </Text>
            </View>
            {totalDue > 0 && (
              <View style={[styles.heroStat, { backgroundColor: T.dangerSoft }]}>
                <Text style={[styles.heroStatLabel, { color: T.textMuted }]}>বাকি</Text>
                <Text style={[styles.heroStatVal, { color: T.danger }]}>
                  {formatCurrency(totalDue)}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.heroStat,
                { backgroundColor: netProfit >= 0 ? T.successSoft : T.dangerSoft },
              ]}
            >
              <Text style={[styles.heroStatLabel, { color: T.textMuted }]}>নিট লাভ</Text>
              <Text style={[styles.heroStatVal, { color: netProfit >= 0 ? T.success : T.danger }]}>
                {netProfit >= 0 ? '+' : ''}
                {formatCurrency(netProfit)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Expense list ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: T.textMuted }]}>
              খরচের তালিকা ({expenses.length})
            </Text>
            <TouchableOpacity
              style={[styles.addExpBtn, { backgroundColor: T.accentSoft, borderColor: T.accent }]}
              onPress={() => setShowForm(!showForm)}
            >
              <Ionicons name={showForm ? 'close' : 'add'} size={14} color={T.accent} />
              <Text style={[styles.addExpBtnText, { color: T.accent }]}>
                {showForm ? 'বাতিল' : 'খরচ যোগ'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add form */}
          {showForm && (
            <View
              style={[styles.addForm, { backgroundColor: T.surface, borderColor: T.accent + '44' }]}
            >
              <View style={[styles.formAccent, { backgroundColor: T.accent }]} />
              <View style={styles.formBody}>
                {/* Label */}
                <View
                  style={[styles.inputWrap, { borderColor: T.border, backgroundColor: T.inputBg }]}
                >
                  <TextInput
                    style={[styles.input, { color: T.textPrimary }]}
                    value={label}
                    onChangeText={setLabel}
                    placeholder="খরচের বিবরণ"
                    placeholderTextColor={T.textMuted}
                  />
                </View>

                {/* Amount */}
                <View
                  style={[styles.inputWrap, { borderColor: T.border, backgroundColor: T.inputBg }]}
                >
                  <TextInput
                    style={[styles.input, { color: T.textPrimary }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="পরিমাণ (৳)"
                    placeholderTextColor={T.textMuted}
                  />
                  <Text style={[styles.inputSuffix, { color: T.textMuted }]}>৳</Text>
                </View>

                {/* Category */}
                <View style={styles.catRow}>
                  {CATEGORIES.map((cat) => {
                    const active = category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: active ? T.accentSoft : T.inputBg,
                            borderColor: active ? T.accent : T.border,
                          },
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.catChipText,
                            {
                              color: active ? T.accent : T.textMuted,
                              fontWeight: active ? '700' : '400',
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Notes */}
                <View
                  style={[styles.inputWrap, { borderColor: T.border, backgroundColor: T.inputBg }]}
                >
                  <TextInput
                    style={[styles.input, { color: T.textPrimary }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="নোট (ঐচ্ছিক)"
                    placeholderTextColor={T.textMuted}
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[
                    styles.addFormBtn,
                    { backgroundColor: adding ? T.accent + '80' : T.accent },
                  ]}
                  onPress={handleAddExpense}
                  disabled={adding}
                >
                  {adding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={16} color="#fff" />
                      <Text style={styles.addFormBtnText}>যোগ করুন</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Expense items */}
          {expenses.length === 0 ? (
            <View style={[styles.emptyExp, { backgroundColor: T.surface, borderColor: T.border }]}>
              <Ionicons name="receipt-outline" size={28} color={T.textMuted} />
              <Text style={[styles.emptyExpTitle, { color: T.textPrimary }]}>কোনো খরচ নেই</Text>
              <Text style={[styles.emptyExpSub, { color: T.textMuted }]}>
                ব্যাচ বন্ধ করার আগে খরচ যোগ করুন
              </Text>
            </View>
          ) : (
            <View style={styles.expList}>
              {expenses.map((exp) => (
                <ExpenseRow
                  key={exp.id}
                  expense={exp}
                  T={T}
                  onDelete={() =>
                    showConfirm('এই খরচটি মুছে দিতে চান?', () => handleDeleteExpense(exp.id))
                  }
                />
              ))}
              {/* Total row */}
              <View
                style={[
                  styles.totalRow,
                  { backgroundColor: T.warningSoft, borderColor: T.warning + '33' },
                ]}
              >
                <Text style={[styles.totalLabel, { color: T.warning }]}>মোট খরচ</Text>
                <Text style={[styles.totalValue, { color: T.warning }]}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Net profit summary ── */}
        <View style={styles.section}>
          <View
            style={[
              styles.profitCard,
              {
                backgroundColor: netProfit >= 0 ? T.successSoft : T.dangerSoft,
                borderColor: netProfit >= 0 ? T.success + '33' : T.danger + '33',
              },
            ]}
          >
            <View>
              <Text style={[styles.profitLabel, { color: T.textMuted }]}>
                সংগ্রহ − খরচ = নিট লাভ
              </Text>
              <Text style={[styles.profitCalc, { color: T.textSecondary }]}>
                {formatCurrency(totalCollected)} − {formatCurrency(totalExpenses)}
              </Text>
            </View>
            <Text style={[styles.profitValue, { color: netProfit >= 0 ? T.success : T.danger }]}>
              {netProfit >= 0 ? '+' : ''}
              {formatCurrency(netProfit)}
            </Text>
          </View>
        </View>

        {/* ── Complete button ── */}
        <View style={[styles.section, { paddingBottom: 40 }]}>
          {!canComplete ? (
            <View
              style={[
                styles.cantComplete,
                { backgroundColor: T.dangerSoft, borderColor: T.danger + '33' },
              ]}
            >
              <Ionicons name="warning-outline" size={16} color={T.danger} />
              <Text style={[styles.cantCompleteText, { color: T.danger }]}>
                {pendingCount}টি ডেলিভারি বাকি আছে। সব ডেলিভারি সম্পন্ন করুন।
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: T.success }]}
              onPress={tryComplete}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>ব্যাচ বন্ধ করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero: { margin: 16, borderRadius: 18, borderWidth: 1, padding: 18 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroBatchNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  heroDate: { fontSize: 12, marginTop: 2 },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '700' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroStat: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 12, gap: 4 },
  heroStatLabel: { fontSize: 10 },
  heroStatVal: { fontSize: 15, fontWeight: '900' },

  // Section
  section: { paddingHorizontal: 16, marginBottom: 4 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  addExpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  addExpBtnText: { fontSize: 12, fontWeight: '700' },

  // Add form
  addForm: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  formAccent: { width: 4 },
  formBody: { flex: 1, padding: 14, gap: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10 },
  input: { flex: 1, padding: 11, fontSize: 14 },
  inputSuffix: { paddingRight: 12, fontSize: 13, fontWeight: '700' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  catChipText: { fontSize: 11 },
  addFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addFormBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Expense list
  expList: { gap: 8 },
  emptyExp: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptyExpTitle: { fontSize: 14, fontWeight: '700' },
  emptyExpSub: { fontSize: 12, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  totalLabel: { fontSize: 13, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '900' },

  // Profit card
  profitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: { fontSize: 11, marginBottom: 4 },
  profitCalc: { fontSize: 12 },
  profitValue: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },

  // Complete
  cantComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cantCompleteText: { flex: 1, fontSize: 13, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 17,
  },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
