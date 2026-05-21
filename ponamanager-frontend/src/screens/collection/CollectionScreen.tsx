// src/screens/collection/CollectionScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  useColorScheme,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, formatDate } from '../../utils/helpers';
import apiClient from '../../api/client';

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F4F5F9',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.10)',
  success: '#18B565',
  successSoft: 'rgba(24,181,101,0.10)',
  danger: '#F03F5F',
  dangerSoft: 'rgba(240,63,95,0.09)',
  warning: '#E09400',
  warningSoft: 'rgba(224,148,0,0.10)',
  info: '#0EA5E9',
  infoSoft: 'rgba(14,165,233,0.10)',
  white: '#FFFFFF',
  shadow: '#000',
};
const DARK = {
  bg: '#0F1117',
  surface: '#1A1D27',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F0F2FF',
  textSecondary: '#8A8FA8',
  textMuted: '#545872',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.15)',
  success: '#2ECC71',
  successSoft: 'rgba(46,204,113,0.12)',
  danger: '#FF5E7E',
  dangerSoft: 'rgba(255,94,126,0.12)',
  warning: '#F0A500',
  warningSoft: 'rgba(240,165,0,0.12)',
  info: '#3B9EFF',
  infoSoft: 'rgba(59,158,255,0.12)',
  white: '#FFFFFF',
  shadow: '#000',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

const PONA_COLORS: Record<string, string> = {
  Golda: '#F5A623',
  Bagda: '#1E88E5',
  Vannamei: '#43A047',
};
const getPonaColor = (t: string) => PONA_COLORS[t] ?? '#6C63FF';

// ─── API ──────────────────────────────────────────────────────────────────────
const collectionAPI = {
  getBatchCollection: (batchId: string) => apiClient.get(`/batches/${batchId}/collection`),
  getAllCollections: (params?: any) => apiClient.get('/collection/summary', { params }),
};

// ─── Mir diff badge ───────────────────────────────────────────────────────────
const MirDiffBadge = ({ diff, T }: { diff: number; T: typeof LIGHT }) => {
  if (diff === 0)
    return (
      <View style={[mdStyles.badge, { backgroundColor: T.successSoft }]}>
        <Ionicons name="checkmark-circle" size={11} color={T.success} />
        <Text style={[mdStyles.text, { color: T.success }]}>মিলছে</Text>
      </View>
    );
  if (diff > 0)
    return (
      <View style={[mdStyles.badge, { backgroundColor: T.dangerSoft }]}>
        <Ionicons name="arrow-up-circle" size={11} color={T.danger} />
        <Text style={[mdStyles.text, { color: T.danger }]}>+{diff} বেশি</Text>
      </View>
    );
  return (
    <View style={[mdStyles.badge, { backgroundColor: T.warningSoft }]}>
      <Ionicons name="arrow-down-circle" size={11} color={T.warning} />
      <Text style={[mdStyles.text, { color: T.warning }]}>{diff} কম</Text>
    </View>
  );
};
const mdStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: { fontSize: 10, fontWeight: '700' },
});

// ─── Batch Collection Card ────────────────────────────────────────────────────
const BatchCollectionCard = ({ batch, index, T, onPress }: any) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const totalMirDiff = (batch.totalCompanyMir ?? 0) - (batch.totalOurMir ?? 0);
  const mirMatchPercent =
    batch.totalCompanyMir > 0
      ? (((batch.totalOurMir ?? 0) / batch.totalCompanyMir) * 100).toFixed(1)
      : '0';

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity
        style={[styles.batchCard, { backgroundColor: T.surface, borderColor: T.border }]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Header */}
        <View style={styles.batchCardHeader}>
          <View>
            <Text style={[styles.batchNum, { color: T.textPrimary }]}>{batch.batchNumber}</Text>
            <Text style={[styles.batchDate, { color: T.textMuted }]}>
              {formatDate(batch.batchDate)}
            </Text>
          </View>
          <View style={styles.batchHeaderRight}>
            <Text style={[styles.totalOrders, { color: T.textSecondary }]}>
              {batch._count?.batchOrders ?? 0} অর্ডার
            </Text>
            <Ionicons name="chevron-forward" size={14} color={T.textMuted} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: T.border }]} />

        {/* Mir comparison */}
        <View style={styles.mirRow}>
          <View style={styles.mirItem}>
            <Text style={[styles.mirLabel, { color: T.textMuted }]}>কোম্পানি মীর</Text>
            <Text style={[styles.mirValue, { color: T.info }]}>
              {(batch.totalCompanyMir ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.mirDivider, { backgroundColor: T.border }]} />
          <View style={styles.mirItem}>
            <Text style={[styles.mirLabel, { color: T.textMuted }]}>আমাদের মীর</Text>
            <Text style={[styles.mirValue, { color: T.accent }]}>
              {(batch.totalOurMir ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.mirDivider, { backgroundColor: T.border }]} />
          <View style={styles.mirItem}>
            <Text style={[styles.mirLabel, { color: T.textMuted }]}>পার্থক্য</Text>
            <Text
              style={[
                styles.mirValue,
                {
                  color: totalMirDiff === 0 ? T.success : totalMirDiff > 0 ? T.danger : T.warning,
                },
              ]}
            >
              {totalMirDiff > 0 ? '+' : ''}
              {totalMirDiff.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Progress bar for mir match */}
        <View style={styles.mirProgressWrap}>
          <View style={[styles.mirProgressBg, { backgroundColor: T.border }]}>
            <View
              style={[
                styles.mirProgressFill,
                {
                  width: `${Math.min(parseFloat(mirMatchPercent), 100)}%`,
                  backgroundColor:
                    parseFloat(mirMatchPercent) >= 95
                      ? T.success
                      : parseFloat(mirMatchPercent) >= 85
                        ? T.warning
                        : T.danger,
                },
              ]}
            />
          </View>
          <Text style={[styles.mirPct, { color: T.textMuted }]}>{mirMatchPercent}% মিল</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: T.border }]} />

        {/* Financial summary */}
        <View style={styles.finRow}>
          <View style={styles.finItem}>
            <Text style={[styles.finLabel, { color: T.textMuted }]}>সংগ্রহ</Text>
            <Text style={[styles.finValue, { color: T.success }]}>
              {formatCurrency(batch.totalCollected ?? 0)}
            </Text>
          </View>
          <View style={[styles.finDivider, { backgroundColor: T.border }]} />
          <View style={styles.finItem}>
            <Text style={[styles.finLabel, { color: T.textMuted }]}>বাকি</Text>
            <Text
              style={[styles.finValue, { color: (batch.totalDue ?? 0) > 0 ? T.danger : T.success }]}
            >
              {formatCurrency(batch.totalDue ?? 0)}
            </Text>
          </View>
          <View style={[styles.finDivider, { backgroundColor: T.border }]} />
          <View style={styles.finItem}>
            <Text style={[styles.finLabel, { color: T.textMuted }]}>মোট PL</Text>
            <Text style={[styles.finValue, { color: T.textPrimary }]}>
              {(batch.totalFishDelivered ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Delivery Mir Row ─────────────────────────────────────────────────────────
const DeliveryMirRow = ({ item, T, onPress }: any) => {
  const ponaColor = getPonaColor(item.order?.ponaType ?? '');
  const mirDiff = (item.companyMir ?? 0) - (item.ourMir ?? 0);
  const isDelivered = item.deliveryStatus !== 'pending';

  if (!isDelivered) return null;

  return (
    <TouchableOpacity
      style={[styles.deliveryRow, { borderBottomColor: T.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Customer */}
      <View style={[styles.deliveryAvatar, { backgroundColor: ponaColor + '20' }]}>
        <Text style={[styles.deliveryAvatarText, { color: ponaColor }]}>
          {(item.order?.customerName ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={[styles.deliveryCustomer, { color: T.textPrimary }]} numberOfLines={1}>
          {item.order?.customerName}
        </Text>
        <View style={styles.deliveryMeta}>
          <View style={[styles.ponaPill, { backgroundColor: ponaColor + '18' }]}>
            <Text style={[styles.ponaPillText, { color: ponaColor }]}>{item.order?.ponaType}</Text>
          </View>
          <Text style={[styles.deliveryPL, { color: T.textSecondary }]}>
            {(item.totalFish ?? 0).toLocaleString()} PL
          </Text>
        </View>
      </View>

      {/* Mir data */}
      <View style={styles.deliveryMirData}>
        <View style={styles.mirCompact}>
          <Text style={[styles.mirCompactLabel, { color: T.textMuted }]}>কো.</Text>
          <Text style={[styles.mirCompactVal, { color: T.info }]}>{item.companyMir ?? '—'}</Text>
        </View>
        <Text style={[styles.mirCompactSep, { color: T.border }]}>|</Text>
        <View style={styles.mirCompact}>
          <Text style={[styles.mirCompactLabel, { color: T.textMuted }]}>আমা.</Text>
          <Text style={[styles.mirCompactVal, { color: T.accent }]}>{item.ourMir ?? '—'}</Text>
        </View>
        <MirDiffBadge diff={mirDiff} T={T} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Batch Detail Collection View ─────────────────────────────────────────────
const BatchCollectionDetail = ({ batchId, T, onBack }: any) => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collectionAPI
      .getBatchCollection(batchId)
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );

  if (!data) return null;

  const batch = data.batch;
  const orders = data.batchOrders ?? [];
  const delivered = orders.filter((o: any) => o.deliveryStatus !== 'pending');
  const totalCMir = delivered.reduce((s: number, o: any) => s + (o.companyMir ?? 0), 0);
  const totalOMir = delivered.reduce((s: number, o: any) => s + (o.ourMir ?? 0), 0);
  const totalDiff = totalCMir - totalOMir;
  const totalFish = delivered.reduce((s: number, o: any) => s + (o.totalFish ?? 0), 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <TouchableOpacity style={[styles.backBtn, { borderColor: T.border }]} onPress={onBack}>
        <Ionicons name="arrow-back" size={16} color={T.textPrimary} />
        <Text style={[styles.backBtnText, { color: T.textPrimary }]}>সব ব্যাচ</Text>
      </TouchableOpacity>

      {/* Batch header */}
      <View style={[styles.detailHeader, { backgroundColor: T.surface, borderColor: T.border }]}>
        <Text style={[styles.detailBatchNum, { color: T.textPrimary }]}>{batch.batchNumber}</Text>
        <Text style={[styles.detailBatchDate, { color: T.textMuted }]}>
          {formatDate(batch.batchDate)}
        </Text>

        {/* Mir summary visual */}
        <View style={[styles.mirSummaryBox, { backgroundColor: T.bg }]}>
          <View style={styles.mirSummaryItem}>
            <Text style={[styles.mirSummaryNum, { color: T.info }]}>
              {totalCMir.toLocaleString()}
            </Text>
            <Text style={[styles.mirSummaryLabel, { color: T.textMuted }]}>কোম্পানি মীর</Text>
          </View>
          <View style={[styles.mirSummaryOp, { backgroundColor: T.border }]}>
            <Text style={[styles.mirSummaryOpText, { color: T.textMuted }]}>VS</Text>
          </View>
          <View style={styles.mirSummaryItem}>
            <Text style={[styles.mirSummaryNum, { color: T.accent }]}>
              {totalOMir.toLocaleString()}
            </Text>
            <Text style={[styles.mirSummaryLabel, { color: T.textMuted }]}>আমাদের মীর</Text>
          </View>
          <View style={[styles.mirSummaryOp, { backgroundColor: T.border }]}>
            <Text style={[styles.mirSummaryOpText, { color: T.textMuted }]}>=</Text>
          </View>
          <View style={styles.mirSummaryItem}>
            <Text
              style={[
                styles.mirSummaryNum,
                {
                  color: totalDiff === 0 ? T.success : totalDiff > 0 ? T.danger : T.warning,
                },
              ]}
            >
              {totalDiff > 0 ? '+' : ''}
              {totalDiff.toLocaleString()}
            </Text>
            <Text style={[styles.mirSummaryLabel, { color: T.textMuted }]}>পার্থক্য</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.detailStatsRow}>
          <View style={[styles.detailStat, { backgroundColor: T.successSoft }]}>
            <Ionicons name="fish-outline" size={14} color={T.success} />
            <Text style={[styles.detailStatNum, { color: T.success }]}>
              {totalFish.toLocaleString()}
            </Text>
            <Text style={[styles.detailStatLabel, { color: T.textMuted }]}>মোট পোনা</Text>
          </View>
          <View style={[styles.detailStat, { backgroundColor: T.accentSoft }]}>
            <Ionicons name="cash-outline" size={14} color={T.accent} />
            <Text style={[styles.detailStatNum, { color: T.accent }]}>
              {formatCurrency(batch.totalCollected ?? 0)}
            </Text>
            <Text style={[styles.detailStatLabel, { color: T.textMuted }]}>সংগ্রহ</Text>
          </View>
          <View
            style={[
              styles.detailStat,
              { backgroundColor: (batch.totalDue ?? 0) > 0 ? T.dangerSoft : T.successSoft },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={(batch.totalDue ?? 0) > 0 ? T.danger : T.success}
            />
            <Text
              style={[
                styles.detailStatNum,
                { color: (batch.totalDue ?? 0) > 0 ? T.danger : T.success },
              ]}
            >
              {formatCurrency(batch.totalDue ?? 0)}
            </Text>
            <Text style={[styles.detailStatLabel, { color: T.textMuted }]}>বাকি</Text>
          </View>
        </View>
      </View>

      {/* Company order link */}
      {data.companyOrder && (
        <View
          style={[styles.companyOrderLink, { backgroundColor: T.surface, borderColor: T.border }]}
        >
          <View style={styles.companyOrderLinkLeft}>
            <Ionicons name="business-outline" size={16} color={T.warning} />
            <View>
              <Text style={[styles.companyOrderLinkTitle, { color: T.textPrimary }]}>
                কোম্পানি অর্ডার
              </Text>
              <Text style={[styles.companyOrderLinkSub, { color: T.textMuted }]}>
                মীর: {data.companyOrder.mirValue} · পলি: {data.companyOrder.totalPoly} · PL:{' '}
                {(data.companyOrder.totalPL ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>
          {(data.companyOrder.netDue ?? 0) > 0 ? (
            <View style={[styles.companyDueChip, { backgroundColor: T.dangerSoft }]}>
              <Text style={[styles.companyDueText, { color: T.danger }]}>
                বাকি {formatCurrency(data.companyOrder.netDue)}
              </Text>
            </View>
          ) : (
            <View style={[styles.companyDueChip, { backgroundColor: T.successSoft }]}>
              <Text style={[styles.companyDueText, { color: T.success }]}>ক্লিয়ার</Text>
            </View>
          )}
        </View>
      )}

      {/* Per-delivery mir table */}
      <View style={[styles.deliveryTable, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={[styles.deliveryTableHeader, { borderBottomColor: T.border }]}>
          <Text style={[styles.deliveryTableTitle, { color: T.textMuted }]}>
            প্রতিটি ডেলিভারির মীর তুলনা
          </Text>
          <Text style={[styles.deliveryCount, { color: T.textMuted }]}>{delivered.length} টি</Text>
        </View>

        {delivered.length === 0 ? (
          <View style={styles.emptyDelivery}>
            <Text style={[styles.emptyDeliveryText, { color: T.textMuted }]}>
              কোনো ডেলিভারি সম্পন্ন হয়নি
            </Text>
          </View>
        ) : (
          delivered.map((item: any) => (
            <DeliveryMirRow
              key={item.id}
              item={item}
              T={T}
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
            />
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ─── Main Collection Screen ───────────────────────────────────────────────────
export const CollectionScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();

  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // Summary totals
  const totalCollected = batches.reduce((s, b) => s + (b.totalCollected ?? 0), 0);
  const totalDue = batches.reduce((s, b) => s + (b.totalDue ?? 0), 0);
  const totalMirDiff = batches.reduce(
    (s, b) => s + ((b.totalCompanyMir ?? 0) - (b.totalOurMir ?? 0)),
    0,
  );

  const fetchBatches = useCallback(async () => {
    try {
      const res = await collectionAPI.getAllCollections();
      const raw = res?.data?.data;
      setBatches(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setBatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, []);

  // Detail view
  if (selectedBatch) {
    return (
      <View style={[styles.container, { backgroundColor: T.bg }]}>
        <BatchCollectionDetail
          batchId={selectedBatch}
          T={T}
          onBack={() => setSelectedBatch(null)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: T.textPrimary }]}>কালেকশন</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>মীর তুলনা ও হিসাব</Text>
        </View>
      </View>

      {/* ── Summary banner ── */}
      <View style={[styles.summaryBanner, { backgroundColor: T.accent }]}>
        <View style={styles.summaryBannerBlob1} />
        <View style={styles.summaryBannerBlob2} />
        <View style={styles.summaryBannerRow}>
          <View style={styles.summaryBannerItem}>
            <Text style={styles.summaryBannerNum}>{formatCurrency(totalCollected)}</Text>
            <Text style={styles.summaryBannerLabel}>মোট সংগ্রহ</Text>
          </View>
          <View style={[styles.summaryBannerDiv]} />
          <View style={styles.summaryBannerItem}>
            <Text
              style={[styles.summaryBannerNum, { color: totalDue > 0 ? '#FFB3C1' : '#B7F5D4' }]}
            >
              {formatCurrency(totalDue)}
            </Text>
            <Text style={styles.summaryBannerLabel}>মোট বাকি</Text>
          </View>
          <View style={[styles.summaryBannerDiv]} />
          <View style={styles.summaryBannerItem}>
            <Text
              style={[
                styles.summaryBannerNum,
                {
                  color: totalMirDiff === 0 ? '#B7F5D4' : totalMirDiff > 0 ? '#FFB3C1' : '#FFE0A3',
                },
              ]}
            >
              {totalMirDiff > 0 ? '+' : ''}
              {totalMirDiff.toLocaleString()}
            </Text>
            <Text style={styles.summaryBannerLabel}>মীর পার্থক্য</Text>
          </View>
        </View>
      </View>

      {/* ── Legend ── */}
      <View style={[styles.legendRow, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.info }]} />
          <Text style={[styles.legendText, { color: T.textSecondary }]}>কোম্পানি মীর</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.accent }]} />
          <Text style={[styles.legendText, { color: T.textSecondary }]}>আমাদের মীর</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.success }]} />
          <Text style={[styles.legendText, { color: T.textSecondary }]}>মিলছে</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.danger }]} />
          <Text style={[styles.legendText, { color: T.textSecondary }]}>বেশি</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: T.warning }]} />
          <Text style={[styles.legendText, { color: T.textSecondary }]}>কম</Text>
        </View>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={[styles.loadingText, { color: T.textMuted }]}>লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBatches();
              }}
              colors={[T.accent]}
              tintColor={T.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: T.surface, borderColor: T.border },
                ]}
              >
                <Ionicons name="analytics-outline" size={44} color={T.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: T.textPrimary }]}>কোনো ডেটা নেই</Text>
              <Text style={[styles.emptySub, { color: T.textMuted }]}>
                ডেলিভারি সম্পন্ন হলে এখানে দেখাবে
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <BatchCollectionCard
              batch={item}
              index={index}
              T={T}
              onPress={() => setSelectedBatch(item.id)}
            />
          )}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },

  summaryBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
  },
  summaryBannerBlob1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -30,
  },
  summaryBannerBlob2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 10,
  },
  summaryBannerRow: { flexDirection: 'row', alignItems: 'center' },
  summaryBannerItem: { flex: 1, alignItems: 'center' },
  summaryBannerNum: { fontSize: 15, fontWeight: '900', color: '#fff', marginBottom: 3 },
  summaryBannerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
  summaryBannerDiv: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },

  // Batch card
  batchCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  batchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  batchNum: { fontSize: 15, fontWeight: '800' },
  batchDate: { fontSize: 11, marginTop: 2 },
  batchHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalOrders: { fontSize: 12 },
  divider: { height: 1, marginHorizontal: 14 },

  mirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mirItem: { flex: 1, alignItems: 'center' },
  mirDivider: { width: 1, height: 30 },
  mirLabel: { fontSize: 10, marginBottom: 3 },
  mirValue: { fontSize: 15, fontWeight: '800' },

  mirProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  mirProgressBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  mirProgressFill: { height: 4, borderRadius: 2 },
  mirPct: { fontSize: 10, fontWeight: '600', width: 56 },

  finRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  finItem: { flex: 1, alignItems: 'center' },
  finDivider: { width: 1, height: 28 },
  finLabel: { fontSize: 10, marginBottom: 3 },
  finValue: { fontSize: 13, fontWeight: '700' },

  listContent: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },

  // Detail
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backBtnText: { fontSize: 13, fontWeight: '600' },
  detailHeader: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  detailBatchNum: { fontSize: 18, fontWeight: '900' },
  detailBatchDate: { fontSize: 12, marginTop: 2, marginBottom: 14 },

  mirSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  mirSummaryItem: { flex: 1, alignItems: 'center' },
  mirSummaryNum: { fontSize: 20, fontWeight: '900' },
  mirSummaryLabel: { fontSize: 10, marginTop: 3 },
  mirSummaryOp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  mirSummaryOpText: { fontSize: 11, fontWeight: '700' },

  detailStatsRow: { flexDirection: 'row', gap: 8 },
  detailStat: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 3 },
  detailStatNum: { fontSize: 13, fontWeight: '800' },
  detailStatLabel: { fontSize: 10 },

  companyOrderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  companyOrderLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  companyOrderLinkTitle: { fontSize: 13, fontWeight: '700' },
  companyOrderLinkSub: { fontSize: 11, marginTop: 2 },
  companyDueChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  companyDueText: { fontSize: 12, fontWeight: '700' },

  deliveryTable: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  deliveryTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  deliveryTableTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deliveryCount: { fontSize: 11 },

  deliveryRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  deliveryAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliveryAvatarText: { fontSize: 13, fontWeight: '800' },
  deliveryInfo: { flex: 1 },
  deliveryCustomer: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  deliveryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponaPill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  ponaPillText: { fontSize: 9, fontWeight: '700' },
  deliveryPL: { fontSize: 11 },
  deliveryMirData: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mirCompact: { alignItems: 'center' },
  mirCompactLabel: { fontSize: 8 },
  mirCompactVal: { fontSize: 12, fontWeight: '700' },
  mirCompactSep: { fontSize: 14, marginHorizontal: 2 },

  emptyDelivery: { padding: 20, alignItems: 'center' },
  emptyDeliveryText: { fontSize: 13 },
});
