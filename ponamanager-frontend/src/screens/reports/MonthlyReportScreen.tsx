// src/screens/reports/MonthlyReportScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { reportAPI } from '../../api/services';
import { COLORS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/helpers';

const MetricBox = ({ label, value, color, subtext }: any) => (
  <View style={[styles.metricBox, { borderColor: color }]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    {subtext && <Text style={styles.metricSubtext}>{subtext}</Text>}
  </View>
);

export const MonthlyReportScreen = () => {
  const route = useRoute<any>();
  const { month } = route.params;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const [year, monthNum] = month.split('-');
    reportAPI.getMonthly(monthNum, year).then((res) => {
      setReport(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [month]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!report) return <View style={styles.center}><Text style={styles.errorText}>No data available</Text></View>;

  const {
    totalGoldaPL = 0, totalGoldaSales = 0, totalGoldaProfit = 0,
    totalBagdaPL = 0, totalBagdaSales = 0, totalBagdaProfit = 0,
    totalVannameiPL = 0, totalVannameiSales = 0, totalVannameiProfit = 0,
    totalExpenses = 0, totalCompanyMir = 0, totalCountingMir = 0,
    totalCompanyCommission = 0, totalReceivedCommission = 0,
    totalProfit = 0, totalSales = 0, totalOrders = 0,
  } = report;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.monthText}>{month}</Text>
        <Text style={styles.headerSubtext}>Monthly Summary Report</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Total Orders</Text>
            <Text style={styles.headerStatValue}>{totalOrders}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatLabel}>Total Sales</Text>
            <Text style={styles.headerStatValue}>{formatCurrency(totalSales)}</Text>
          </View>
        </View>
      </View>

      {/* Overall Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>সামগ্রিক সারসংক্ষেপ (Overall Summary)</Text>
        <View style={styles.metricsRow}>
          <MetricBox label="মোট বিক্রয়" value={formatCurrency(totalSales)} color={COLORS.primary} />
          <MetricBox label="মোট খরচ" value={formatCurrency(totalExpenses)} color={COLORS.warning} />
          <MetricBox label="মোট লাভ" value={formatCurrency(totalProfit)} color={totalProfit >= 0 ? COLORS.success : COLORS.danger} />
        </View>
      </View>

      {/* Pona Type Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>পোনা প্রকার বিশ্লেষণ (Pona Type Analysis)</Text>

        {/* Golda PL */}
        <View style={styles.ponaCard}>
          <View style={[styles.ponaHeader, { backgroundColor: '#F5A62320' }]}>
            <Text style={[styles.ponaTitle, { color: '#F5A623' }]}>গলদা পোনা (Golda PL)</Text>
            <Text style={[styles.ponaSubtitle, { color: '#F5A623' }]}>মাঠ</Text>
          </View>
          <MetricBox label="মোট পিএল" value={totalGoldaPL.toLocaleString()} color="#F5A623" />
          <MetricBox label="বিক্রয়" value={formatCurrency(totalGoldaSales)} color="#F5A623" />
          <MetricBox label="লাভ" value={formatCurrency(totalGoldaProfit)} color={totalGoldaProfit >= 0 ? COLORS.success : COLORS.danger} />
        </View>

        {/* Bagda PL */}
        <View style={styles.ponaCard}>
          <View style={[styles.ponaHeader, { backgroundColor: '#1E88E520' }]}>
            <Text style={[styles.ponaTitle, { color: '#1E88E5' }]}>বাগদা পোনা (Bagda PL)</Text>
            <Text style={[styles.ponaSubtitle, { color: '#1E88E5' }]}>জোছনা</Text>
          </View>
          <MetricBox label="মোট পিএল" value={totalBagdaPL.toLocaleString()} color="#1E88E5" />
          <MetricBox label="বিক্রয়" value={formatCurrency(totalBagdaSales)} color="#1E88E5" />
          <MetricBox label="লাভ" value={formatCurrency(totalBagdaProfit)} color={totalBagdaProfit >= 0 ? COLORS.success : COLORS.danger} />
        </View>

        {/* Vannamei PL */}
        <View style={styles.ponaCard}>
          <View style={[styles.ponaHeader, { backgroundColor: '#43A04720' }]}>
            <Text style={[styles.ponaTitle, { color: '#43A047' }]}>ভানামেই পোনা (Vannamei PL)</Text>
            <Text style={[styles.ponaSubtitle, { color: '#43A047' }]}>সাদা পা</Text>
          </View>
          <MetricBox label="মোট পিএল" value={totalVannameiPL.toLocaleString()} color="#43A047" />
          <MetricBox label="বিক্রয়" value={formatCurrency(totalVannameiSales)} color="#43A047" />
          <MetricBox label="লাভ" value={formatCurrency(totalVannameiProfit)} color={totalVannameiProfit >= 0 ? COLORS.success : COLORS.danger} />
        </View>
      </View>

      {/* Operational Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>অপারেশনাল মেট্রিক্স (Operational Metrics)</Text>
        <View style={styles.metricsRow}>
          <MetricBox label="কোম্পানি মীর" value={totalCompanyMir.toLocaleString()} color={COLORS.info} />
          <MetricBox label="কাউন্টিং মীর" value={totalCountingMir.toLocaleString()} color={COLORS.info} />
        </View>
      </View>

      {/* Commission */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>কমিশন (Commission)</Text>
        <View style={styles.metricsRow}>
          <MetricBox label="প্রদেয় কমিশন" value={formatCurrency(totalCompanyCommission)} color={COLORS.danger} />
          <MetricBox label="প্রাপ্ত কমিশন" value={formatCurrency(totalReceivedCommission)} color={COLORS.success} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Share.share({ message: 'Monthly Report' })}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => console.log('Export PDF')}>
          <Ionicons name="download-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.textSecondary, fontSize: 15 },
  header: { backgroundColor: COLORS.primary, paddingVertical: 24, paddingHorizontal: 16 },
  monthText: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  headerSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerStats: { flexDirection: 'row', marginTop: 14, alignItems: 'center' },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  headerStatValue: { fontSize: 16, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metricBox: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 12,
    borderLeftWidth: 3, elevation: 1,
  },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricSubtext: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  ponaCard: { backgroundColor: COLORS.white, borderRadius: 10, marginBottom: 12, overflow: 'hidden', elevation: 1 },
  ponaHeader: { padding: 10 },
  ponaTitle: { fontSize: 14, fontWeight: '800' },
  ponaSubtitle: { fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12 },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
