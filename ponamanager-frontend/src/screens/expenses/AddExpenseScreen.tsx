// src/screens/expenses/AddExpenseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { expenseAPI } from '../../api/services';
import { batchAPI } from '../../api/batchServices';
import { EXPENSE_CATEGORIES } from '../../constants';
import { getTodayDate, formatCurrency } from '../../utils/helpers';

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
  inputBg: '#F0F2F8',
  overlay: 'rgba(0,0,0,0.45)',
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
  inputBg: '#0D1117',
  overlay: 'rgba(0,0,0,0.65)',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── Batch Picker Modal ─────────────────────────────────────────────────────────
const BatchPickerModal = ({ visible, batches, selected, onSelect, onClose, T }: any) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={[bpStyles.overlay, { backgroundColor: T.overlay }]}>
      <View style={[bpStyles.sheet, { backgroundColor: T.surface }]}>
        <View style={[bpStyles.handle, { backgroundColor: T.border }]} />
        <Text style={[bpStyles.title, { color: T.textPrimary }]}>ব্যাচ বেছে নিন</Text>
        <Text style={[bpStyles.sub, { color: T.textMuted }]}>এই খরচ কোন ব্যাচের সাথে যুক্ত?</Text>

        {/* No batch option */}
        <TouchableOpacity
          style={[
            bpStyles.row,
            {
              borderColor: !selected ? T.accent : T.border,
              backgroundColor: !selected ? T.accentSoft : 'transparent',
            },
          ]}
          onPress={() => {
            onSelect(null);
            onClose();
          }}
        >
          <View
            style={[
              bpStyles.check,
              {
                borderColor: !selected ? T.accent : T.border,
                backgroundColor: !selected ? T.accent : 'transparent',
              },
            ]}
          >
            {!selected && <Ionicons name="checkmark" size={11} color="#fff" />}
          </View>
          <View>
            <Text style={[bpStyles.rowTitle, { color: T.textPrimary }]}>ব্যাচ ছাড়া</Text>
            <Text style={[bpStyles.rowSub, { color: T.textMuted }]}>সাধারণ খরচ</Text>
          </View>
        </TouchableOpacity>

        <FlatList
          data={batches}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 340 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSel = selected === item.id;
            return (
              <TouchableOpacity
                style={[
                  bpStyles.row,
                  {
                    borderColor: isSel ? T.accent : T.border,
                    backgroundColor: isSel ? T.accentSoft : 'transparent',
                  },
                ]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <View
                  style={[
                    bpStyles.check,
                    {
                      borderColor: isSel ? T.accent : T.border,
                      backgroundColor: isSel ? T.accent : 'transparent',
                    },
                  ]}
                >
                  {isSel && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[bpStyles.rowTitle, { color: T.textPrimary }]}>
                    {item.batchNumber}
                  </Text>
                  <Text style={[bpStyles.rowSub, { color: T.textMuted }]}>
                    {item._count?.batchOrders ?? 0} অর্ডার ·{' '}
                    {formatCurrency(item.totalCollected ?? 0)}
                  </Text>
                </View>
                <View style={[bpStyles.statusPill, { backgroundColor: T.warningSoft }]}>
                  <Text style={[bpStyles.statusText, { color: T.warning }]}>চলছে</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[bpStyles.empty, { color: T.textMuted }]}>কোনো রানিং ব্যাচ নেই</Text>
          }
        />
      </View>
    </View>
  </Modal>
);
const bpStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowSub: { fontSize: 11, marginTop: 2 },
  statusPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', padding: 16, fontSize: 13 },
});

// ─── Field ──────────────────────────────────────────────────────────────────────
const Field = ({ label, children, T }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text
      style={{
        fontSize: 12,
        fontWeight: '700',
        color: T.textMuted,
        marginBottom: 7,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Text>
    {children}
  </View>
);

// ─── Main Screen ────────────────────────────────────────────────────────────────
export const AddExpenseScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { expenseId } = route.params || {};
  const isEdit = !!expenseId;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Transport');
  const [date, setDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoad, setFetchLoad] = useState(isEdit);
  const [batches, setBatches] = useState<any[]>([]);
  const [showBatch, setShowBatch] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'খরচ সম্পাদনা' : 'খরচ যোগ করুন' });

    // Load running batches
    batchAPI
      .getAll({ status: 'pending' })
      .then((res: any) => {
        const raw = res?.data?.data?.data ?? res?.data?.data ?? [];
        setBatches(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {});

    if (isEdit) {
      expenseAPI
        .getById(expenseId)
        .then((res: any) => {
          const e = res.data.data;
          setAmount(e.amount.toString());
          setCategory(e.category);
          setDate(e.date);
          setNotes(e.notes || '');
          setBatchId(e.batchId || null);
        })
        .catch(() => navigation.goBack())
        .finally(() => setFetchLoad(false));
    }
  }, []);

  const handleSave = async () => {
    if (!amount) {
      Toast.show({ type: 'error', text1: 'সতর্কতা', text2: 'পরিমাণ আবশ্যিক' });
      return;
    }
    setLoading(true);
    try {
      const payload = { amount: parseFloat(amount), category, date, notes, batchId };
      if (isEdit) {
        await expenseAPI.update(expenseId, payload);
        Toast.show({ type: 'success', text1: 'আপডেট হয়েছে' });
      } else {
        await expenseAPI.create(payload);
        Toast.show({ type: 'success', text1: 'খরচ যোগ হয়েছে' });
      }
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'ত্রুটি',
        text2: err?.response?.data?.message || 'সেভ ব্যর্থ',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBatch = batches.find((b) => b.id === batchId);

  if (fetchLoad)
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );

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
        {/* ── Amount hero ── */}
        <View style={[styles.amountHero, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.amountLabel, { color: T.textMuted }]}>পরিমাণ (৳)</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountSymbol, { color: T.textMuted }]}>৳</Text>
            <TextInput
              style={[styles.amountInput, { color: T.textPrimary }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="০"
              keyboardType="numeric"
              placeholderTextColor={T.textMuted}
            />
          </View>
          {!!amount && (
            <Text style={[styles.amountWords, { color: T.textMuted }]}>
              {parseFloat(amount).toLocaleString()} টাকা
            </Text>
          )}
        </View>

        {/* ── Card ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          {/* Category */}
          <Field label="ক্যাটাগরি" T={T}>
            <View style={styles.catGrid}>
              {EXPENSE_CATEGORIES.map((cat: string) => {
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catBtn,
                      {
                        borderColor: active ? T.accent : T.border,
                        backgroundColor: active ? T.accentSoft : T.inputBg,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.catBtnText,
                        {
                          color: active ? T.accent : T.textSecondary,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Batch selector */}
          <Field label="ব্যাচ (ঐচ্ছিক)" T={T}>
            <TouchableOpacity
              style={[
                styles.batchSelector,
                {
                  borderColor: batchId ? T.accent : T.border,
                  backgroundColor: batchId ? T.accentSoft : T.inputBg,
                },
              ]}
              onPress={() => setShowBatch(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="boat-outline" size={16} color={batchId ? T.accent : T.textMuted} />
              <Text style={[styles.batchSelectorText, { color: batchId ? T.accent : T.textMuted }]}>
                {selectedBatch ? selectedBatch.batchNumber : 'ব্যাচ সিলেক্ট করুন'}
              </Text>
              {batchId && (
                <TouchableOpacity
                  onPress={() => setBatchId(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={T.textMuted} />
                </TouchableOpacity>
              )}
              {!batchId && <Ionicons name="chevron-down" size={14} color={T.textMuted} />}
            </TouchableOpacity>
            {batchId && selectedBatch && (
              <Text style={[styles.batchNote, { color: T.textMuted }]}>
                {selectedBatch._count?.batchOrders ?? 0} অর্ডার ·{' '}
                {formatCurrency(selectedBatch.totalCollected ?? 0)} সংগ্রহ
              </Text>
            )}
          </Field>

          {/* Date */}
          <Field label="তারিখ" T={T}>
            <View style={[styles.inputWrap, { borderColor: T.border, backgroundColor: T.inputBg }]}>
              <Ionicons name="calendar-outline" size={15} color={T.textMuted} />
              <TextInput
                style={[styles.inputInner, { color: T.textPrimary }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={T.textMuted}
              />
            </View>
          </Field>

          {/* Notes */}
          <Field label="নোট" T={T}>
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
              numberOfLines={3}
            />
          </Field>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: loading ? T.accent + '99' : T.accent }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isEdit ? 'save-outline' : 'add-circle-outline'}
                size={18}
                color="#fff"
              />
              <Text style={styles.saveBtnText}>{isEdit ? 'আপডেট করুন' : 'খরচ যোগ করুন'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BatchPickerModal
        visible={showBatch}
        batches={batches}
        selected={batchId}
        onSelect={setBatchId}
        onClose={() => setShowBatch(false)}
        T={T}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  amountHero: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountSymbol: { fontSize: 28, fontWeight: '300' },
  amountInput: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    minWidth: 120,
    textAlign: 'center',
  },
  amountWords: { fontSize: 12, marginTop: 8 },

  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  catBtnText: { fontSize: 12 },

  batchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 11,
    borderWidth: 1.5,
    padding: 13,
  },
  batchSelectorText: { flex: 1, fontSize: 14 },
  batchNote: { fontSize: 11, marginTop: 5 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1.5,
    borderRadius: 11,
    paddingHorizontal: 12,
  },
  inputInner: { flex: 1, paddingVertical: 12, fontSize: 14 },

  notesInput: {
    borderWidth: 1.5,
    borderRadius: 11,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
