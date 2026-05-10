// src/screens/batch/BatchListScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { batchAPI } from '../../api/batchServices';
import { Batch, BatchStatus } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/helpers';
import dayjs from 'dayjs';

// ── Batch status colours ────────────────────────────────
const STATUS_CONFIG: Record<
  BatchStatus,
  { label: string; bg: string; border: string; icon: any; textColor: string }
> = {
  pending: {
    label: 'অপেক্ষমান',
    bg: '#FFF8E1',
    border: '#F5A623',
    icon: 'time-outline',
    textColor: '#F5A623',
  },
  in_progress: {
    label: 'চলমান',
    bg: '#E3F2FD',
    border: '#1E88E5',
    icon: 'boat-outline',
    textColor: '#1E88E5',
  },
  completed: {
    label: 'সম্পন্ন',
    bg: '#E8F5E9',
    border: '#43A047',
    icon: 'checkmark-circle-outline',
    textColor: '#43A047',
  },
  has_due: {
    label: 'বাকি আছে',
    bg: '#FFF3E0',
    border: '#FB8C00',
    icon: 'alert-circle-outline',
    textColor: '#FB8C00',
  },
};

// ── Single batch card ───────────────────────────────────
const BatchCard = ({ batch, onPress }: { batch: Batch; onPress: () => void }) => {
  const cfg = STATUS_CONFIG[batch.status];
  const total = batch.batchOrders?.length || 0;
  const delivered = batch.batchOrders?.filter(o => o.deliveryStatus === 'delivered').length || 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.cardBatchNum}>{batch.batchNumber}</Text>
          <Text style={styles.cardDate}>{formatDate(batch.batchDate)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.border + '25' }]}>
          <Ionicons name={cfg.icon} size={13} color={cfg.textColor} />
          <Text style={[styles.statusLabel, { color: cfg.textColor }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: total > 0 ? `${(delivered / total) * 100}%` : '0%', backgroundColor: cfg.border },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{delivered}/{total} ডেলিভারি সম্পন্ন</Text>

      {/* Pona summary */}
      <View style={styles.ponaSummaryRow}>
        {batch.totalOrderedGolda > 0 && (
          <View style={[styles.ponaChip, { backgroundColor: '#F5A62320' }]}>
            <Text style={[styles.ponaChipLabel, { color: '#F5A623' }]}>গলদা</Text>
            <Text style={[styles.ponaChipVal, { color: '#F5A623' }]}>
              {batch.totalDeliveredGolda}/{batch.totalOrderedGolda}
            </Text>
          </View>
        )}
        {batch.totalOrderedBagda > 0 && (
          <View style={[styles.ponaChip, { backgroundColor: '#1E88E520' }]}>
            <Text style={[styles.ponaChipLabel, { color: '#1E88E5' }]}>বাগদা</Text>
            <Text style={[styles.ponaChipVal, { color: '#1E88E5' }]}>
              {batch.totalDeliveredBagda}/{batch.totalOrderedBagda}
            </Text>
          </View>
        )}
        {batch.totalOrderedVannamei > 0 && (
          <View style={[styles.ponaChip, { backgroundColor: '#43A04720' }]}>
            <Text style={[styles.ponaChipLabel, { color: '#43A047' }]}>ভেনামি</Text>
            <Text style={[styles.ponaChipVal, { color: '#43A047' }]}>
              {batch.totalDeliveredVannamei}/{batch.totalOrderedVannamei}
            </Text>
          </View>
        )}
      </View>

      {/* Financial summary */}
      <View style={styles.finRow}>
        <View style={styles.finItem}>
          <Text style={styles.finLabel}>প্রাপ্ত</Text>
          <Text style={[styles.finVal, { color: COLORS.success }]}>
            {formatCurrency(batch.totalCollected)}
          </Text>
        </View>
        {batch.totalDue > 0 && (
          <View style={[styles.finItem, styles.dueBadge]}>
            <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
            <Text style={styles.finLabel}>বাকি</Text>
            <Text style={[styles.finVal, { color: COLORS.danger }]}>
              {formatCurrency(batch.totalDue)}
            </Text>
            {batch.duePendingCount > 0 && (
              <View style={styles.dueCount}>
                <Text style={styles.dueCountText}>{batch.duePendingCount} জন</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.finItem}>
          <Text style={styles.finLabel}>মোট অর্ডার</Text>
          <Text style={styles.finVal}>{total} টি</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Screen ──────────────────────────────────────────────
export const BatchListScreen = () => {
  const navigation = useNavigation<any>();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState(dayjs().format('YYYY-MM'));

  const fetchBatches = useCallback(async () => {
    try {
      const res = await batchAPI.getAll({
        month: monthFilter,
        status: statusFilter || undefined,
        limit: 50,
      });
      setBatches(res.data.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [monthFilter, statusFilter]);

  useEffect(() => { fetchBatches(); }, [monthFilter, statusFilter]);

  const filters: { key: BatchStatus | ''; label: string }[] = [
    { key: '', label: 'সব' },
    { key: 'pending', label: 'অপেক্ষমান' },
    { key: 'in_progress', label: 'চলমান' },
    { key: 'completed', label: 'সম্পন্ন' },
    { key: 'has_due', label: 'বাকি' },
  ];

  return (
    <View style={styles.container}>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={() => setMonthFilter(dayjs(monthFilter).subtract(1, 'month').format('YYYY-MM'))}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{dayjs(monthFilter).format('MMMM YYYY')}</Text>
        <TouchableOpacity
          onPress={() => setMonthFilter(dayjs(monthFilter).add(1, 'month').format('YYYY-MM'))}
        >
          <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.monthReportBtn}
          onPress={() => navigation.navigate('MonthlyBatchReport', { month: monthFilter })}
        >
          <Ionicons name="bar-chart-outline" size={16} color={COLORS.white} />
          <Text style={styles.monthReportBtnText}>রিপোর্ট</Text>
        </TouchableOpacity>
      </View>

      {/* Status filters */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterBtn, statusFilter === item.key && styles.filterBtnActive]}
            onPress={() => setStatusFilter(item.key)}
          >
            {item.key !== '' && (
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: STATUS_CONFIG[item.key as BatchStatus]?.border || COLORS.primary },
                ]}
              />
            )}
            <Text style={[styles.filterText, statusFilter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BatchCard
              batch={item}
              onPress={() => navigation.navigate('BatchDetails', { batchId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBatches(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="boat-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>কোনো ব্যাচ নেই</Text>
              <Text style={styles.emptySubtext}>নতুন ব্যাচ তৈরি করুন</Text>
            </View>
          }
          contentContainerStyle={{ padding: 12, gap: 10, flexGrow: 1 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateBatch')}>
        <Ionicons name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  monthText: { fontSize: 15, fontWeight: '800', color: COLORS.text, flex: 1, textAlign: 'center' },
  monthReportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  monthReportBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },

  // card
  card: {
    borderRadius: 14, borderWidth: 2, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardBatchNum: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  cardDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 10 },

  ponaSummaryRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  ponaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  ponaChipLabel: { fontSize: 11, fontWeight: '600' },
  ponaChipVal: { fontSize: 12, fontWeight: '800' },

  finRow: { flexDirection: 'row', gap: 8 },
  finItem: { flex: 1, alignItems: 'center' },
  dueBadge: {
    backgroundColor: COLORS.dangerLight, borderRadius: 8, padding: 4, position: 'relative',
  },
  finLabel: { fontSize: 11, color: COLORS.textSecondary },
  finVal: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  dueCount: {
    backgroundColor: COLORS.danger, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, marginTop: 2,
  },
  dueCountText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  emptySubtext: { fontSize: 13, color: COLORS.textMuted },

  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});
