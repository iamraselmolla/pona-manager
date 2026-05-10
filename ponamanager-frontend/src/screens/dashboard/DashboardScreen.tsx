// src/screens/dashboard/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { dashboardAPI } from '../../api/services';
import { useAppStore } from '../../store/appStore';
import { COLORS } from '../../constants';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { DashboardStats } from '../../types';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, bg, onPress }: any) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.statIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  </TouchableOpacity>
);

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { dashboardStats, setDashboardStats } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardAPI.getStats();
      setDashboardStats(res.data.data);
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 102, 64, ${opacity})`,
    labelColor: () => COLORS.textSecondary,
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
    propsForLabels: { fontSize: 10 },
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const stats = dashboardStats;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'add-circle', label: 'New Order', color: COLORS.primary, onPress: () => navigation.navigate('CreateOrder') },
            { icon: 'cash', label: 'Add Expense', color: COLORS.warning, onPress: () => navigation.navigate('AddExpense') },
            { icon: 'lock-closed', label: 'Daily Close', color: COLORS.danger, onPress: () => navigation.navigate('DailyClosing') },
            { icon: 'bar-chart', label: 'Reports', color: COLORS.info, onPress: () => navigation.navigate('Reports') },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.onPress} activeOpacity={0.8}>
              <View style={[styles.quickIcon, { backgroundColor: a.color + '20' }]}>
                <Ionicons name={a.icon as any} size={26} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Total Orders" value={formatNumber(stats?.totalOrders || 0)} icon="receipt-outline" color={COLORS.primary} bg={COLORS.successLight} />
          <StatCard title="PL Delivered" value={formatNumber(stats?.totalPLDelivered || 0)} icon="fish-outline" color={COLORS.info} bg={COLORS.infoLight} />
          <StatCard title="Total Sales" value={formatCurrency(stats?.totalSales || 0)} icon="trending-up-outline" color={COLORS.success} bg={COLORS.successLight} />
          <StatCard title="Total Due" value={formatCurrency(stats?.totalDue || 0)} icon="alert-circle-outline" color={COLORS.danger} bg={COLORS.dangerLight} />
          <StatCard title="Collections" value={formatCurrency(stats?.totalCollections || 0)} icon="wallet-outline" color={COLORS.secondary} bg={COLORS.warningLight} />
          <StatCard title="Expenses" value={formatCurrency(stats?.totalExpenses || 0)} icon="card-outline" color={COLORS.warning} bg={COLORS.warningLight} />
          <StatCard title="Profit/Loss" value={formatCurrency(stats?.totalProfitLoss || 0)} icon="stats-chart-outline" color={stats?.totalProfitLoss >= 0 ? COLORS.success : COLORS.danger} bg={stats?.totalProfitLoss >= 0 ? COLORS.successLight : COLORS.dangerLight} />
          <StatCard title="Company Mir" value={formatNumber(stats?.totalCompanyMir || 0)} icon="cube-outline" color={COLORS.textSecondary} bg={COLORS.background} />
        </View>
      </View>

      {/* Daily Sales Chart */}
      {stats?.dailySales && stats.dailySales.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Sales (Last 7 Days)</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: stats.dailySales.map((d: any) => d.date.slice(5)),
                datasets: [{ data: stats.dailySales.map((d: any) => d.amount) }],
              }}
              width={width - 48}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 12 }}
            />
          </View>
        </View>
      )}

      {/* Monthly Sales Chart */}
      {stats?.monthlySales && stats.monthlySales.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Sales</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={{
                labels: stats.monthlySales.map((m: any) => m.month),
                datasets: [{ data: stats.monthlySales.map((m: any) => m.amount) }],
              }}
              width={width - 48}
              height={200}
              chartConfig={chartConfig}
              yAxisLabel="৳"
              yAxisSuffix=""
              style={{ borderRadius: 12 }}
            />
          </View>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  statsGrid: { gap: 10 },
  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    borderLeftWidth: 4, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '800' },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12, elevation: 2 },
});
