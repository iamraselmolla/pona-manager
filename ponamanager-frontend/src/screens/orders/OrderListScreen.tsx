// src/screens/orders/OrderListScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { orderAPI } from '../../api/services';
import { Order } from '../../types';
import { COLORS, ORDER_STATUS, PONA_TYPES } from '../../constants';
import { formatCurrency, formatDate, getPonaTypeColor } from '../../utils/helpers';

const OrderCard = ({ order, onPress }: { order: Order; onPress: () => void }) => {
  const status = ORDER_STATUS[order.status];
  const typeColor = getPonaTypeColor(order.ponaType);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.mobile}>{order.customerMobile}</Text>
        <View style={styles.cardRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{order.ponaType}</Text>
          </View>
          <Text style={styles.qty}>{order.plQuantity.toLocaleString()} PL</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.date}><Ionicons name="calendar-outline" size={12} /> {formatDate(order.deliveryDate)}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amount}>{formatCurrency(order.totalPrice)}</Text>
            {order.dueAmount > 0 && (
              <Text style={styles.due}>Due: {formatCurrency(order.dueAmount)}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OrderListScreen = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderAPI.getAll({ search, status: statusFilter || undefined });
      setOrders(res.data.data.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [search, statusFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateOrder')}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {['', 'pending', 'partial', 'delivered', 'cancelled'].map((s) => (
          <TouchableOpacity
            key={s || 'all'}
            style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === '' ? 'All' : ORDER_STATUS[s as keyof typeof ORDER_STATUS]?.label || s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
          contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 10 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12,
    overflow: 'hidden', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  typeBar: { width: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingRight: 12 },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  mobile: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  typeBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  qty: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 12, paddingRight: 12, marginTop: 8 },
  date: { fontSize: 12, color: COLORS.textMuted },
  amount: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  due: { fontSize: 11, color: COLORS.danger, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
