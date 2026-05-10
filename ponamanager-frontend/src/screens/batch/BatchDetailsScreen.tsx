// src/screens/batch/BatchDetailsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { batchAPI } from '../../api/batchServices';
import { Batch, BatchOrder } from '../../types';
import { COLORS } from '../../constants';
import { formatCurrency, formatDate, getPonaTypeColor } from '../../utils/helpers';

const DeliveryStatusConfig = {
  pending: { label: 'পেন্ডিং', color: '#F5A623', bg: '#FFF8E1', icon: 'time-outline' as const },
  delivered: { label: 'ডেলিভারি হয়েছে', color: '#43A047', bg: '#E8F5E9', icon: 'checkmark-circle-outline' as const },
};

// ── Individual order row in batch ───────────────────────
const BatchOrderRow = ({
  batchOrder,
  onDeliver,
}: {
  batchOrder: BatchOrder;
  onDeliver: () => void;
}) => {
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType);
  const statusCfg = DeliveryStatusConfig[batchOrder.deliveryStatus];

  return (
    <View style={[styles.orderRow, batchOrder.deliveryStatus === 'delivered' && styles.orderRowDone]}>
      {/* Left type bar */}
      <View style={[styles.typeBar, { backgroundColor: typeColor }]} />

      <View style={{ flex: 1, paddingLeft: 10 }}>
        <View style={styles.orderRowTop}>
          <Text style={styles.customerName}>{batchOrder.order.customerName}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <Text style={styles.mobile}>{batchOrder.order.customerMobile}</Text>

        <View style={styles.orderMetaRow}>
          <View style={[styles.typePill, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{batchOrder.order.ponaType}</Text>
          </View>
          <Text style={styles.qty}>
            {batchOrder.deliveryStatus === 'delivered'
              ? `${batchOrder.deliveredQuantity?.toLocaleString()} / ${batchOrder.order.plQuantity.toLocaleString()} PL`
              : `${batchOrder.order.plQuantity.toLocaleString()} PL`}
          </Text>
        </View>

        {/* Financial info after delivery */}
        {batchOrder.deliveryStatus === 'delivered' && (
          <View style={styles.deliveredInfo}>
            <Text style={styles.deliveredInfoItem}>
              পেয়েছি: <Text style={styles.greenText}>{formatCurrency(batchOrder.customerPayment || 0)}</Text>
            </Text>
            {(batchOrder.dueAmount || 0) > 0 && (
              <Text style={styles.deliveredInfoItem}>
                বাকি: <Text style={styles.redText}>{formatCurrency(batchOrder.dueAmount || 0)}</Text>
                {batchOrder.duePaymentDate && (
                  <Text style={styles.greyText}> ({formatDate(batchOrder.duePaymentDate)} এর মধ্যে)</Text>
                )}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action button */}
      {batchOrder.deliveryStatus === 'pending' && (
        <TouchableOpacity style={styles.deliverBtn} onPress={onDeliver}>
          <Ionicons name="boat" size={16} color={COLORS.white} />
          <Text style={styles.deliverBtnText}>ডেলিভারি</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Main Screen ─────────────────────────────────────────
export const BatchDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatch = useCallback(async () => {
    try {
      const res = await batchAPI.getById(batchId);
      setBatch(res.data.data);
    } catch {
      Alert.alert('ত্রুটি', 'ব্যাচ লোড হয়নি');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [batchId]);

  useEffect(() => { fetchBatch(); }, []);

  const pendingCount = batch?.batchOrders?.filter(o => o.deliveryStatus === 'pending').length || 0;
  const canComplete = batch?.status !== 'completed' && pendingCount === 0;
  const totalOrders = batch?.batchOrders?.length || 0;
  const deliveredCount = totalOrders - pendingCount;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!batch) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBatch(); }} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.batchNum}>{batch.batchNumber}</Text>
              <Text style={styles.batchDate}>{formatDate(batch.batchDate)}</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNum}>{deliveredCount}/{totalOrders}</Text>
              <Text style={styles.progressLabel}>সম্পন্ন</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: totalOrders > 0 ? `${(deliveredCount / totalOrders) * 100}%` : '0%' }]} />
          </View>

          {/* Pona summary chips */}
          <View style={styles.ponaSummaryRow}>
            {batch.totalOrderedGolda > 0 && (
              <View style={[styles.ponaChip, { backgroundColor: '#F5A62320', borderColor: '#F5A623' }]}>
                <Text style={[styles.ponaChipTitle, { color: '#F5A623' }]}>গলদা</Text>
                <Text style={[styles.ponaChipSub, { color: '#F5A623' }]}>
                  অর্ডার: {batch.totalOrderedGolda.toLocaleString()}
                </Text>
                <Text style={[styles.ponaChipSub, { color: '#F5A623' }]}>
                  ডেলিভারি: {batch.totalDeliveredGolda.toLocaleString()}
                </Text>
              </View>
            )}
            {batch.totalOrderedBagda > 0 && (
              <View style={[styles.ponaChip, { backgroundColor: '#1E88E520', borderColor: '#1E88E5' }]}>
                <Text style={[styles.ponaChipTitle, { color: '#1E88E5' }]}>বাগদা</Text>
                <Text style={[styles.ponaChipSub, { color: '#1E88E5' }]}>
                  অর্ডার: {batch.totalOrderedBagda.toLocaleString()}
                </Text>
                <Text style={[styles.ponaChipSub, { color: '#1E88E5' }]}>
                  ডেলিভারি: {batch.totalDeliveredBagda.toLocaleString()}
                </Text>
              </View>
            )}
            {batch.totalOrderedVannamei > 0 && (
              <View style={[styles.ponaChip, { backgroundColor: '#43A04720', borderColor: '#43A047' }]}>
                <Text style={[styles.ponaChipTitle, { color: '#43A047' }]}>ভেনামি</Text>
                <Text style={[styles.ponaChipSub, { color: '#43A047' }]}>
                  অর্ডার: {batch.totalOrderedVannamei.toLocaleString()}
                </Text>
                <Text style={[styles.ponaChipSub, { color: '#43A047' }]}>
                  ডেলিভারি: {batch.totalDeliveredVannamei.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Financial summary */}
          <View style={styles.finSummaryRow}>
            <View style={styles.finSummaryItem}>
              <Text style={styles.finSummaryLabel}>মোট প্রাপ্ত</Text>
              <Text style={[styles.finSummaryVal, { color: COLORS.success }]}>
                {formatCurrency(batch.totalCollected)}
              </Text>
            </View>
            {batch.totalDue > 0 && (
              <View style={[styles.finSummaryItem, styles.dueSummary]}>
                <Text style={styles.finSummaryLabel}>মোট বাকি</Text>
                <Text style={[styles.finSummaryVal, { color: COLORS.danger }]}>
                  {formatCurrency(batch.totalDue)}
                </Text>
                <View style={styles.duePeopleBadge}>
                  <Text style={styles.duePeopleText}>{batch.duePendingCount} জনের বাকি</Text>
                </View>
              </View>
            )}
            {batch.totalExpenses > 0 && (
              <View style={styles.finSummaryItem}>
                <Text style={styles.finSummaryLabel}>মোট খরচ</Text>
                <Text style={[styles.finSummaryVal, { color: COLORS.warning }]}>
                  {formatCurrency(batch.totalExpenses)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Order list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>অর্ডার তালিকা ({totalOrders} টি)</Text>
          <View style={styles.orderList}>
            {batch.batchOrders?.map((bo) => (
              <BatchOrderRow
                key={bo.id}
                batchOrder={bo}
                onDeliver={() =>
                  navigation.navigate('BatchDeliveryModal', {
                    batchId: batch.id,
                    batchOrderId: bo.id,
                  })
                }
              />
            ))}
          </View>
        </View>

        {/* Expenses (if completed) */}
        {batch.expenses && batch.expenses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>খরচের বিবরণ</Text>
            <View style={styles.expenseCard}>
              {batch.expenses.map((e, i) => (
                <View key={i} style={styles.expenseRow}>
                  <Text style={styles.expenseLabel}>{e.label}</Text>
                  <Text style={styles.expenseAmount}>{formatCurrency(e.amount)}</Text>
                </View>
              ))}
              <View style={[styles.expenseRow, styles.expenseTotal]}>
                <Text style={styles.expenseTotalLabel}>মোট খরচ</Text>
                <Text style={styles.expenseTotalAmount}>{formatCurrency(batch.totalExpenses)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Complete button */}
      {batch.status !== 'completed' && (
        <View style={styles.bottomBar}>
          {pendingCount > 0 ? (
            <View style={styles.pendingWarning}>
              <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
              <Text style={styles.pendingWarningText}>
                {pendingCount} টি ডেলিভারি বাকি আছে। ব্যাচ কমপ্লিট করতে সব ডেলিভারি করুন।
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => navigation.navigate('CompleteBatch', { batchId: batch.id })}
            >
              <Ionicons name="checkmark-done-circle" size={20} color={COLORS.white} />
              <Text style={styles.completeBtnText}>খরচ দিয়ে ব্যাচ কমপ্লিট করুন</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerCard: {
    backgroundColor: COLORS.white, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  batchNum: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  batchDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  progressCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  progressNum: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  progressLabel: { fontSize: 9, color: COLORS.primary },
  progressBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 12 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  ponaSummaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  ponaChip: {
    flex: 1, borderRadius: 10, padding: 8, borderWidth: 1.5, alignItems: 'center',
  },
  ponaChipTitle: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  ponaChipSub: { fontSize: 10, fontWeight: '500' },

  finSummaryRow: { flexDirection: 'row', gap: 8 },
  finSummaryItem: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: COLORS.background, borderRadius: 8 },
  dueSummary: { backgroundColor: COLORS.dangerLight },
  finSummaryLabel: { fontSize: 11, color: COLORS.textSecondary },
  finSummaryVal: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  duePeopleBadge: {
    backgroundColor: COLORS.danger, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 4,
  },
  duePeopleText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  section: { paddingHorizontal: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  orderList: { gap: 8 },

  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  orderRowDone: { opacity: 0.8 },
  typeBar: { width: 5, alignSelf: 'stretch' },
  orderRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingRight: 10 },
  customerName: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700' },
  mobile: { fontSize: 12, color: COLORS.textSecondary, paddingRight: 10 },
  orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, paddingRight: 10, marginTop: 4 },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: '700' },
  qty: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  deliveredInfo: { paddingBottom: 10, paddingRight: 10 },
  deliveredInfoItem: { fontSize: 12, color: COLORS.textSecondary },
  greenText: { color: COLORS.success, fontWeight: '700' },
  redText: { color: COLORS.danger, fontWeight: '700' },
  greyText: { color: COLORS.textMuted },

  deliverBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, padding: 10, margin: 10,
    alignItems: 'center', gap: 4,
  },
  deliverBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  expenseCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border + '60' },
  expenseLabel: { fontSize: 13, color: COLORS.textSecondary },
  expenseAmount: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  expenseTotal: { borderBottomWidth: 0, marginTop: 4 },
  expenseTotalLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  expenseTotalAmount: { fontSize: 16, fontWeight: '900', color: COLORS.warning },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: 14,
    borderTopWidth: 1, borderTopColor: COLORS.border, elevation: 10,
  },
  pendingWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.warningLight, borderRadius: 10, padding: 12,
  },
  pendingWarningText: { flex: 1, fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.success, borderRadius: 12, paddingVertical: 14,
  },
  completeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
