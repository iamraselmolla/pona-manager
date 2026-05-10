// src/screens/reports/CustomerDueReportScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { reportAPI } from '../../api/services';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/helpers';

export const CustomerDueReportScreen = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    reportAPI.getCustomerDue().then((res) => {
      const customers = res.data.data;
      setData(customers);
      setTotal(customers.reduce((sum: number, c: any) => sum + (c.totalDue || 0), 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Due</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.customerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.mobile}>{item.mobile}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dueAmount}>{formatCurrency(item.totalDue)}</Text>
              <Text style={styles.ordersCount}>{item.totalOrders} orders</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No dues found</Text>
          </View>
        }
      />
    </View>
  );
};

// src/screens/reports/ExpenseReportScreen.tsx
export const ExpenseReportScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getExpense().then((res) => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>{formatCurrency(data?.total || 0)}</Text>
      </View>

      <FlatList
        data={data?.categories || []}
        keyExtractor={(item) => item.category}
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{item.category}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 12, gap: 8 }}
      />
    </View>
  );
};

// src/screens/reports/ProfitLossReportScreen.tsx
export const ProfitLossReportScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getProfitLoss().then((res) => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profit & Loss Statement</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Sales</Text>
          <Text style={styles.value}>{formatCurrency(data?.totalSales || 0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Expenses</Text>
          <Text style={styles.value}>{formatCurrency(data?.totalExpenses || 0)}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Net Profit/Loss</Text>
          <Text style={[styles.totalValue, { color: (data?.netProfit || 0) >= 0 ? COLORS.success : COLORS.danger }]}>
            {formatCurrency(data?.netProfit || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  totalCard: { backgroundColor: COLORS.primary, margin: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  totalValue: { fontSize: 28, fontWeight: '900', color: COLORS.white },
  header: { backgroundColor: COLORS.primary, padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  customerRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 10, padding: 12, elevation: 1 },
  customerName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  mobile: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  dueAmount: { fontSize: 15, fontWeight: '800', color: COLORS.danger },
  ordersCount: { fontSize: 11, color: COLORS.textMuted },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, padding: 12, elevation: 1 },
  category: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  amount: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  card: { backgroundColor: COLORS.white, margin: 12, borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '60' },
  totalRow: { marginTop: 8, paddingTop: 8, backgroundColor: COLORS.successLight, borderRadius: 6, paddingHorizontal: 8, borderBottomWidth: 0 },
  label: { fontSize: 14, color: COLORS.textSecondary },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textSecondary },
});
