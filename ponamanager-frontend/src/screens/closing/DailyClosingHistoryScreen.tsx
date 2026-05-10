// src/screens/closing/DailyClosingHistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { dailyClosingAPI } from '../../api/services';
import { DailyClosing } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ClosingCard = ({ closing }: { closing: DailyClosing }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.date}>{formatDate(closing.date)}</Text>
      <View style={[styles.profitBadge, { backgroundColor: closing.netProfitLoss >= 0 ? COLORS.successLight : COLORS.dangerLight }]}>
        <Text style={[styles.profitText, { color: closing.netProfitLoss >= 0 ? COLORS.success : COLORS.danger }]}>
          {formatCurrency(closing.netProfitLoss)}
        </Text>
      </View>
    </View>
    <View style={styles.statsRow}>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>Orders</Text>
        <Text style={styles.statValue}>{closing.totalOrders}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>Sales</Text>
        <Text style={styles.statValue}>{formatCurrency(closing.totalSales)}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>Expenses</Text>
        <Text style={styles.statValue}>{formatCurrency(closing.totalExpenses)}</Text>
      </View>
    </View>
  </View>
);

export const DailyClosingHistoryScreen = () => {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClosings = async () => {
    try {
      const res = await dailyClosingAPI.getAll();
      setClosings(res.data.data.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchClosings(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <FlatList
      data={closings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ClosingCard closing={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClosings(); }} colors={[COLORS.primary]} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No closing records yet</Text>
        </View>
      }
      contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  profitBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  profitText: { fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, padding: 8 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  statValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
