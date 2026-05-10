// src/screens/monthly/MonthlyBatchReportScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { batchAPI } from '../../api/batchServices';
import { Batch, BatchStatus } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<BatchStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'অপেক্ষমান', color: '#F5A623', bg: '#FFF8E1' },
  in_progress: { label: 'চলমান',    color: '#1E88E5', bg: '#E3F2FD' },
  completed:   { label: 'সম্পন্ন',  color: '#43A047', bg: '#E8F5E9' },
  has_due:     { label: 'বাকি আছে', color: '#FB8C00', bg: '#FFF3E0' },
};

const MiniStat = ({ label, value, color }: any) => (
  <View style={styles.miniStat}>
    <Text style={styles.miniStatLabel}>{label}</Text>
    <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
  </View>
);

// Compact batch card inside monthly report
const MiniBatchCard = ({ batch, onPress }: { batch: Batch; onPress: () => void }) => {
  const cfg = STATUS_CONFIG[batch.status];
  const total = batch.batchOrders?.length || 0;
  const delivered = batch.batchOrders?.filter(o => o.deliveryStatus === 'delivered').length || 0;

  return (
    <TouchableOpacity
      style={[styles.miniBatchCard, { borderLeftColor: cfg.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.miniBatchTop}>
        <View>
          <Text style={styles.miniBatchNum}>{batch.batchNumber}</Text>
          <Text style={styles.miniBatchDate}>{formatDate(batch.batchDate)}</Text>
        </View>
        <View style={[styles.miniStatusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.miniStatusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Pona chips */}
      <View style={styles.miniPonaRow}>
        {batch.totalOrderedGolda > 0 && (
          <View style={styles.miniPonaChip}>
            <Text style={[styles.miniPonaLabel, { color: '#F5A623' }]}>গলদা</Text>
            <Text style={styles.miniPonaVal}>
              {batch.totalDeliveredGolda}/{batch.totalOrderedGolda}
            </Text>
          </View>
        )}
        {batch.totalOrderedBagda > 0 && (
          <View style={styles.miniPonaChip}>
            <Text style={[styles.miniPonaLabel, { color: '#1E88E5' }]}>বাগদা</Text>
            <Text style={styles.miniPonaVal}>
              {batch.totalDeliveredBagda}/{batch.totalOrderedBagda}
            </Text>
          </View>
        )}
        {batch.totalOrderedVannamei > 0 && (
          <View style={styles.miniPonaChip}>
            <Text style={[styles.miniPonaLabel, { color: '#43A047' }]}>ভেনামি</Text>
            <Text style={styles.miniPonaVal}>
              {batch.totalDeliveredVannamei}/{batch.totalOrderedVannamei}
            </Text>
          </View>
        )}
      </View>

      {/* Financial */}
      <View style={styles.miniFinRow}>
        <Text style={styles.miniFinItem}>
          প্রাপ্ত: <Text style={[styles.miniFinVal, { color: COLORS.success }]}>{formatCurrency(batch.totalCollected)}</Text>
        </Text>
        {batch.totalDue > 0 && (
          <Text style={styles.miniFinItem}>
            বাকি: <Text style={[styles.miniFinVal, { color: COLORS.danger }]}>{formatCurrency(batch.totalDue)}</Text>
            <Text style={styles.miniDueCount}> ({batch.duePendingCount}জন)</Text>
          </Text>
        )}
        <Text style={styles.miniFinItem}>
          খরচ: <Text style={[styles.miniFinVal, { color: COLORS.warning }]}>{formatCurrency(batch.totalExpenses)}</Text>
        </Text>
      </View>

      {/* Delivery progress */}
      <View style={styles.miniProgressBg}>
        <View style={[styles.miniProgressFill, { width: total > 0 ? `${(delivered / total) * 100}%` : '0%', backgroundColor: cfg.color }]} />
      </View>
    </TouchableOpacity>
  );
};

// ── Screen ──────────────────────────────────────────────
export const MonthlyBatchReportScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { month } = route.params;

  const [report, setReport] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [reportRes, batchRes] = await Promise.all([
        batchAPI.getMonthlyReport(month),
        batchAPI.getAll({ month, limit: 100 }),
      ]);
      setReport(reportRes.data.data);
      setBatches(batchRes.data.data.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const monthLabel = dayjs(month).format('MMMM YYYY');
  const totalBatches    = batches.length;
  const completedBatches = batches.filter(b => b.status === 'completed' || b.status === 'has_due').length;
  const totalDue         = batches.reduce((s, b) => s + (b.totalDue || 0), 0);
  const totalCollected   = batches.reduce((s, b) => s + (b.totalCollected || 0), 0);
  const totalExpenses    = batches.reduce((s, b) => s + (b.totalExpenses || 0), 0);
  const totalGoldaOrdered   = batches.reduce((s, b) => s + (b.totalOrderedGolda || 0), 0);
  const totalGoldaDel       = batches.reduce((s, b) => s + (b.totalDeliveredGolda || 0), 0);
  const totalBagdaOrdered   = batches.reduce((s, b) => s + (b.totalOrderedBagda || 0), 0);
  const totalBagdaDel       = batches.reduce((s, b) => s + (b.totalDeliveredBagda || 0), 0);
  const totalVannameiOrdered = batches.reduce((s, b) => s + (b.totalOrderedVannamei || 0), 0);
  const totalVannameiDel    = batches.reduce((s, b) => s + (b.totalDeliveredVannamei || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerMonth}>{monthLabel}</Text>
        <Text style={styles.headerSubtitle}>মাসিক ব্যাচ রিপোর্ট</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{totalBatches}</Text>
            <Text style={styles.headerStatLabel}>মোট ব্যাচ</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{completedBatches}</Text>
            <Text style={styles.headerStatLabel}>সম্পন্ন</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{totalBatches - completedBatches}</Text>
            <Text style={styles.headerStatLabel}>বাকি</Text>
          </View>
        </View>
      </View>

      {/* Pona Type Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>পোনা সারসংক্ষেপ</Text>
        <View style={styles.ponaCards}>
          {totalGoldaOrdered > 0 && (
            <View style={[styles.ponaCard, { borderTopColor: '#F5A623' }]}>
              <Text style={[styles.ponaCardTitle, { color: '#F5A623' }]}>গলদা পোনা</Text>
              <Text style={styles.ponaCardStat}>অর্ডার: {totalGoldaOrdered.toLocaleString()}</Text>
              <Text style={styles.ponaCardStat}>ডেলিভারি: {totalGoldaDel.toLocaleString()}</Text>
            </View>
          )}
          {totalBagdaOrdered > 0 && (
            <View style={[styles.ponaCard, { borderTopColor: '#1E88E5' }]}>
              <Text style={[styles.ponaCardTitle, { color: '#1E88E5' }]}>বাগদা পোনা</Text>
              <Text style={styles.ponaCardStat}>অর্ডার: {totalBagdaOrdered.toLocaleString()}</Text>
              <Text style={styles.ponaCardStat}>ডেলিভারি: {totalBagdaDel.toLocaleString()}</Text>
            </View>
          )}
          {totalVannameiOrdered > 0 && (
            <View style={[styles.ponaCard, { borderTopColor: '#43A047' }]}>
              <Text style={[styles.ponaCardTitle, { color: '#43A047' }]}>ভেনামি পোনা</Text>
              <Text style={styles.ponaCardStat}>অর্ডার: {totalVannameiOrdered.toLocaleString()}</Text>
              <Text style={styles.ponaCardStat}>ডেলিভারি: {totalVannameiDel.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>আর্থিক সারসংক্ষেপ</Text>
        <View style={styles.finCard}>
          <View style={styles.finCardRow}>
            <MiniStat label="মোট প্রাপ্ত" value={formatCurrency(totalCollected)} color={COLORS.success} />
            <MiniStat label="মোট বাকি" value={formatCurrency(totalDue)} color={totalDue > 0 ? COLORS.danger : COLORS.textMuted} />
            <MiniStat label="মোট খরচ" value={formatCurrency(totalExpenses)} color={COLORS.warning} />
          </View>
        </View>
      </View>

      {/* Batch list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ব্যাচ তালিকা ({totalBatches} টি)
        </Text>
        <View style={styles.batchList}>
          {batches.map((batch) => (
            <MiniiBatchCard
              key={batch.id}
              batch={batch}
              onPress={() => navigation.navigate('BatchDetails', { batchId: batch.id })}
            />
          ))}
          {batches.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="boat-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>এই মাসে কোনো ব্যাচ নেই</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// alias so JSX works
const MiniiBatchCard = MiniiBatchCardFn;
function MiniiBatchCardFn({ batch, onPress }: { batch: Batch; onPress: () => void }) {
  return <MiniiBatchCardImpl batch={batch} onPress={onPress} />;
}
const MiniiBatchCardImpl = MiniiBatchCardCompImpl;
function MiniiBatchCardCompImpl({ batch, onPress }: { batch: Batch; onPress: () => void }) {
  const cfg = STATUS_CONFIG[batch.status];
  const total = batch.batchOrders?.length || 0;
  const delivered = batch.batchOrders?.filter(o => o.deliveryStatus === 'delivered').length || 0;

  return (
    <TouchableOpacity
      style={[styles.miniBatchCard, { borderLeftColor: cfg.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.miniBatchTop}>
        <View>
          <Text style={styles.miniBatchNum}>{batch.batchNumber}</Text>
          <Text style={styles.miniBatchDate}>{formatDate(batch.batchDate)}</Text>
        </View>
        <View style={[styles.miniStatusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.miniStatusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.miniPonaRow}>
        {batch.totalOrderedGolda > 0 && (
          <View style={styles.miniPonaChip}>
            <Text style={[styles.miniPonaLabel, { color: '#F5A623' }]}>গলদা</Text>
            <Text style={styles.miniPonaVal}>{batch.totalDeliveredGolda}/{batch.totalOrderedGolda}</Text>
          </View>
        )}
        {batch.totalOrderedBagda > 0 && (
          <View style={styles.miniPonaChip}>
            <Text style={[styles.miniPonaLabel, { color: '#1E88E5' }]}>বাগদা</Text>
            <Text style={styles.miniPonaVal}>{batch.totalDeliveredBagda}/{batch.totalOrderedBagda}</Text>
          </View>
        )}
        {batch.totalOrderedVannamei > 0 && (
          <View style={styles.miniPonaChip}>
            <Text style={[styles.miniPonaLabel, { color: '#43A047' }]}>ভেনামি</Text>
            <Text style={styles.miniPonaVal}>{batch.totalDeliveredVannamei}/{batch.totalOrderedVannamei}</Text>
          </View>
        )}
      </View>

      <View style={styles.miniFinRow}>
        <Text style={styles.miniFinItem}>
          প্রাপ্ত: <Text style={[styles.miniFinVal, { color: COLORS.success }]}>{formatCurrency(batch.totalCollected)}</Text>
        </Text>
        {batch.totalDue > 0 && (
          <Text style={styles.miniFinItem}>
            বাকি: <Text style={[styles.miniFinVal, { color: COLORS.danger }]}>{formatCurrency(batch.totalDue)}</Text>
            <Text style={styles.miniDueCount}> ({batch.duePendingCount}জন)</Text>
          </Text>
        )}
        <Text style={styles.miniFinItem}>
          খরচ: <Text style={[styles.miniFinVal, { color: COLORS.warning }]}>{formatCurrency(batch.totalExpenses)}</Text>
        </Text>
      </View>

      <View style={styles.miniProgressBg}>
        <View style={[styles.miniProgressFill, { width: total > 0 ? `${(delivered / total) * 100}%` : '0%', backgroundColor: cfg.color }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { backgroundColor: COLORS.primary, padding: 20 },
  headerMonth: { fontSize: 22, fontWeight: '900', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerStats: { flexDirection: 'row', marginTop: 14, alignItems: 'center' },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatVal: { fontSize: 22, fontWeight: '900', color: COLORS.white },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  headerDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

  section: { padding: 14, paddingBottom: 0 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 10 },

  ponaCards: { flexDirection: 'row', gap: 8 },
  ponaCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 12,
    borderTopWidth: 3, elevation: 1,
  },
  ponaCardTitle: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  ponaCardStat: { fontSize: 12, color: COLORS.textSecondary },

  finCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, elevation: 1 },
  finCardRow: { flexDirection: 'row' },
  miniStat: { flex: 1, alignItems: 'center', padding: 8 },
  miniStatLabel: { fontSize: 11, color: COLORS.textSecondary },
  miniStatValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },

  batchList: { gap: 10 },

  miniBatchCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    borderLeftWidth: 4, elevation: 1,
  },
  miniBatchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  miniBatchNum: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  miniBatchDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  miniStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  miniStatusText: { fontSize: 11, fontWeight: '700' },
  miniPonaRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  miniPonaChip: { backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  miniPonaLabel: { fontSize: 10, fontWeight: '700' },
  miniPonaVal: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  miniFinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  miniFinItem: { fontSize: 12, color: COLORS.textSecondary },
  miniFinVal: { fontWeight: '700' },
  miniDueCount: { color: COLORS.danger, fontWeight: '600' },
  miniProgressBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  miniProgressFill: { height: 4, borderRadius: 2 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});
