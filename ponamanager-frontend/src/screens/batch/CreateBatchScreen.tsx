// src/screens/batch/CreateBatchScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { orderAPI } from '../../api/services';
import { batchAPI } from '../../api/batchServices';
import { Order } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency, formatDate, getPonaTypeColor, getTodayDate } from '../../utils/helpers';
import dayjs from 'dayjs';

const OrderSelectCard = ({
  order,
  selected,
  onToggle,
}: {
  order: Order;
  selected: boolean;
  onToggle: () => void;
}) => {
  const typeColor = getPonaTypeColor(order.ponaType);
  return (
    <TouchableOpacity
      style={[styles.orderCard, selected && styles.orderCardSelected, { borderLeftColor: typeColor }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.orderCustomer}>{order.customerName}</Text>
        <Text style={styles.orderMobile}>{order.customerMobile}</Text>
        <View style={styles.orderMeta}>
          <View style={[styles.typePill, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{order.ponaType}</Text>
          </View>
          <Text style={styles.qty}>{order.plQuantity.toLocaleString()} PL</Text>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.orderTotal}>{formatCurrency(order.totalPrice)}</Text>
        {order.advanceAmount > 0 && (
          <Text style={styles.advanceText}>জমা: {formatCurrency(order.advanceAmount)}</Text>
        )}
        <Text style={styles.dueDate}>{formatDate(order.deliveryDate)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const CreateBatchScreen = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDate, setBatchDate] = useState(getTodayDate());
  const [search, setSearch] = useState('');

  useEffect(() => {
    orderAPI.getAll({ status: 'pending', limit: 200 }).then((res) => {
      setOrders(res.data.data.data);
      setLoading(false);
    });
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  };

  const filtered = orders.filter((o) =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerMobile.includes(search)
  );

  const handleCreate = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('সতর্কতা', 'অন্তত একটি অর্ডার সিলেক্ট করুন');
      return;
    }
    setSaving(true);
    try {
      const res = await batchAPI.create({ batchDate, orderIds: Array.from(selectedIds) });
      Alert.alert('সফল', 'ব্যাচ তৈরি হয়েছে!', [
        { text: 'OK', onPress: () => navigation.replace('BatchDetails', { batchId: res.data.data.id }) },
      ]);
    } catch (err: any) {
      Alert.alert('ত্রুটি', err.response?.data?.message || 'ব্যাচ তৈরি ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const totalPL = filtered
    .filter((o) => selectedIds.has(o.id))
    .reduce((s, o) => s + o.plQuantity, 0);

  return (
    <View style={styles.container}>
      {/* Date picker */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        <Text style={styles.dateLabel}>ডেলিভারি তারিখ:</Text>
        <TextInput
          style={styles.dateInput}
          value={batchDate}
          onChangeText={setBatchDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.textMuted}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 8 }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Select all row */}
      <View style={styles.selectAllRow}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
          <Ionicons
            name={selectedIds.size === filtered.length && filtered.length > 0 ? 'checkbox' : 'square-outline'}
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.selectAllText}>সব সিলেক্ট ({filtered.length})</Text>
        </TouchableOpacity>
        {selectedIds.size > 0 && (
          <Text style={styles.selectedInfo}>
            {selectedIds.size} টি | {totalPL.toLocaleString()} PL
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrderSelectCard
              order={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleSelect(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>কোনো pending অর্ডার নেই</Text>
            </View>
          }
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 100 }}
        />
      )}

      {/* Bottom bar */}
      {selectedIds.size > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomCount}>{selectedIds.size} টি অর্ডার সিলেক্ট</Text>
            <Text style={styles.bottomPL}>মোট {totalPL.toLocaleString()} PL</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                <Text style={styles.createBtnText}>ব্যাচ তৈরি করুন</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dateLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  dateInput: {
    flex: 1, fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: COLORS.text },
  selectAllRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectAllText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  selectedInfo: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  orderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    borderLeftWidth: 4, borderWidth: 1.5, borderColor: 'transparent',
    elevation: 1,
  },
  orderCardSelected: { borderColor: COLORS.primary },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  orderCustomer: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  orderMobile: { fontSize: 12, color: COLORS.textSecondary },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: '700' },
  qty: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  orderTotal: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  advanceText: { fontSize: 11, color: COLORS.success },
  dueDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10,
  },
  bottomCount: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  bottomPL: { fontSize: 12, color: COLORS.textSecondary },
  createBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
  },
  createBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
});
