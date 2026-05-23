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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { expenseAPI } from '../../api/services';
import { COLORS, EXPENSE_CATEGORIES } from '../../constants';
import { getTodayDate } from '../../utils/helpers';

export const AddExpenseScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { expenseId } = route.params || {};
  const isEdit = !!expenseId;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<any>('Transport');
  const [date, setDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Expense' : 'Add Expense' });
    if (isEdit) {
      expenseAPI
        .getById(expenseId)
        .then((res) => {
          const e = res.data.data;
          setAmount(e.amount.toString());
          setCategory(e.category);
          setDate(e.date);
          setNotes(e.notes || '');
          setFetchLoading(false);
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load expense');
          navigation.goBack();
        });
    }
  }, []);

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Validation', 'Amount is required');
      return;
    }
    setLoading(true);
    try {
      const payload = { amount: parseFloat(amount), category, date, notes };
      if (isEdit) {
        await expenseAPI.update(expenseId, payload);
        Alert.alert('Success', 'Expense updated', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await expenseAPI.create(payload);
        Alert.alert('Success', 'Expense added', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Amount (৳) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryRow}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryBtnText,
                      category === cat && styles.categoryBtnTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.field}>
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
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Expense' : 'Add Expense'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryBtn: {
    flex: 1,
    minWidth: '45%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  categoryBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.successLight },
  categoryBtnText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  categoryBtnTextActive: { color: COLORS.primary },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
