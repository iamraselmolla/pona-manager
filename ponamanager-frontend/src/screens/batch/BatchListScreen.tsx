// src/screens/batch/BatchListScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { batchAPI } from "../../api/batchServices";
import { Batch, BatchStatus } from "../../types";
import { formatCurrency, formatDate } from "../../utils/helpers";
import dayjs from "dayjs";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const P = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "rgba(255,255,255,0.07)",
  accent: "#6C63FF",
  accentSoft: "rgba(108,99,255,0.15)",
  danger: "#FF5E7E",
  dangerSoft: "rgba(255,94,126,0.12)",
  success: "#2ECC71",
  successSoft: "rgba(46,204,113,0.12)",
  warning: "#F0A500",
  warningSoft: "rgba(240,165,0,0.12)",
  info: "#3B9EFF",
  infoSoft: "rgba(59,158,255,0.12)",
  teal: "#00C9A7",
  tealSoft: "rgba(0,201,167,0.12)",
  gold: "#F5C542",
  goldSoft: "rgba(245,197,66,0.12)",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  white: "#FFFFFF",
};

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  BatchStatus,
  { label: string; color: string; soft: string; icon: any; track: string }
> = {
  pending: {
    label: "অপেক্ষমান",
    color: P.warning,
    soft: P.warningSoft,
    icon: "time-outline",
    track: P.warning,
  },
  in_progress: {
    label: "চলমান",
    color: P.info,
    soft: P.infoSoft,
    icon: "boat-outline",
    track: P.info,
  },
  completed: {
    label: "সম্পন্ন",
    color: P.success,
    soft: P.successSoft,
    icon: "checkmark-circle-outline",
    track: P.success,
  },
  has_due: {
    label: "বাকি আছে",
    color: P.danger,
    soft: P.dangerSoft,
    icon: "alert-circle-outline",
    track: P.danger,
  },
};

const DEFAULT_STATUS = {
  label: "অজানা",
  color: P.textMuted,
  soft: "rgba(255,255,255,0.06)",
  icon: "help-circle-outline",
  track: P.textMuted,
};

const getSafeStatus = (s: string) =>
  (STATUS_CONFIG as any)[s] ?? DEFAULT_STATUS;

// ─── Pona chips config ─────────────────────────────────────────────────────────
const PONA_CHIPS = [
  { key: "Golda", label: "গলদা", color: P.gold, soft: P.goldSoft },
  { key: "Bagda", label: "বাগদা", color: P.info, soft: P.infoSoft },
  { key: "Vannamei", label: "ভেনামি", color: P.teal, soft: P.tealSoft },
] as const;

// ─── Compact Batch Card ────────────────────────────────────────────────────────
const BatchCard = ({
  batch,
  onPress,
  index,
}: {
  batch: Batch;
  onPress: () => void;
  index: number;
}) => {
  const cfg = getSafeStatus(batch.status);
  const total = batch.batchOrders?.length ?? 0;
  const delivered =
    batch.batchOrders?.filter((o) => o.deliveryStatus === "delivered").length ??
    0;
  const pct = total > 0 ? delivered / total : 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Left accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: cfg.color }]} />

        <View style={styles.cardInner}>
          {/* ── Row 1: batch number + status pill ── */}
          <View style={styles.row1}>
            <View style={styles.batchNumWrap}>
              <Text style={styles.batchNum}>{batch.batchNumber}</Text>
              <View style={styles.dateChip}>
                <Ionicons
                  name="calendar-outline"
                  size={10}
                  color={P.textMuted}
                />
                <Text style={styles.dateText}>
                  {formatDate(batch.batchDate)}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: cfg.soft }]}>
              <Ionicons name={cfg.icon} size={11} color={cfg.color} />
              <Text style={[styles.statusLabel, { color: cfg.color }]}>
                {cfg.label}
              </Text>
            </View>
          </View>

          {/* ── Row 2: progress bar ── */}
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(pct * 100, 100)}%`,
                    backgroundColor: cfg.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {delivered}/{total}
            </Text>
          </View>

          {/* ── Row 3: pona chips + financials ── */}
          <View style={styles.row3}>
            {/* Pona chips */}
            <View style={styles.ponaRow}>
              {PONA_CHIPS.map(({ key, label, color, soft }) => {
                const ordered = (batch as any)[`totalOrdered${key}`] ?? 0;
                const deld = (batch as any)[`totalDelivered${key}`] ?? 0;
                if (ordered === 0) return null;
                return (
                  <View
                    key={key}
                    style={[
                      styles.ponaChip,
                      { backgroundColor: soft, borderColor: color + "44" },
                    ]}
                  >
                    <Text style={[styles.ponaLabel, { color }]}>{label}</Text>
                    <Text style={[styles.ponaVal, { color }]}>
                      {deld}/{ordered}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Financial pills */}
            <View style={styles.finRow}>
              <View
                style={[styles.finChip, { backgroundColor: P.successSoft }]}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={11}
                  color={P.success}
                />
                <Text style={[styles.finVal, { color: P.success }]}>
                  {formatCurrency(batch.totalCollected)}
                </Text>
              </View>
              {(batch.totalDue ?? 0) > 0 && (
                <View
                  style={[styles.finChip, { backgroundColor: P.dangerSoft }]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={11}
                    color={P.danger}
                  />
                  <Text style={[styles.finVal, { color: P.danger }]}>
                    {formatCurrency(batch.totalDue)}
                  </Text>
                  {(batch.duePendingCount ?? 0) > 0 && (
                    <View style={styles.countBubble}>
                      <Text style={styles.countBubbleText}>
                        {batch.duePendingCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={14} color={P.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Screen ────────────────────────────────────────────────────────────────────
const FILTERS: { key: BatchStatus | ""; label: string }[] = [
  { key: "", label: "সব" },
  { key: "pending", label: "অপেক্ষমান" },
  { key: "in_progress", label: "চলমান" },
  { key: "completed", label: "সম্পন্ন" },
  { key: "has_due", label: "বাকি" },
];

export const BatchListScreen = () => {
  const navigation = useNavigation<any>();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState(dayjs().format("YYYY-MM"));

  const fetchBatches = useCallback(async () => {
    try {
      const res = await batchAPI.getAll({
        month: monthFilter,
        status: statusFilter || undefined,
        limit: 50,
      });
      const raw = res?.data?.data?.data;
      setBatches(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error("fetchBatches error:", e);
      setBatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [monthFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchBatches();
  }, [monthFilter, statusFilter]);

  const prevMonth = () =>
    setMonthFilter(dayjs(monthFilter).subtract(1, "month").format("YYYY-MM"));
  const nextMonth = () =>
    setMonthFilter(dayjs(monthFilter).add(1, "month").format("YYYY-MM"));

  return (
    <View style={styles.container}>
      {/* ── Month navigator ── */}
      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={prevMonth}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={18} color={P.textSecondary} />
        </TouchableOpacity>

        <View style={styles.monthCenter}>
          <Ionicons name="calendar" size={13} color={P.accent} />
          <Text style={styles.monthText}>
            {dayjs(monthFilter).format("MMMM YYYY")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.monthArrow}
          onPress={nextMonth}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-forward" size={18} color={P.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() =>
            navigation.navigate("MonthlyBatchReport", { month: monthFilter })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="bar-chart-outline" size={13} color={P.white} />
          <Text style={styles.reportBtnText}>রিপোর্ট</Text>
        </TouchableOpacity>
      </View>

      {/* ── Status filter chips ── */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(i) => i.key || "all"}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const active = statusFilter === item.key;
          const cfg = item.key ? getSafeStatus(item.key) : null;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                active && {
                  backgroundColor: cfg ? cfg.soft : P.accentSoft,
                  borderColor: cfg ? cfg.color + "55" : P.accent + "55",
                },
              ]}
              onPress={() => setStatusFilter(item.key)}
              activeOpacity={0.75}
            >
              {cfg && (
                <View
                  style={[styles.filterDot, { backgroundColor: cfg.color }]}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  active && { color: cfg ? cfg.color : P.accent },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.accent} />
          <Text style={styles.loadingText}>লোড হচ্ছে…</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(b) => b.id}
          renderItem={({ item, index }) => (
            <BatchCard
              batch={item}
              index={index}
              onPress={() =>
                navigation.navigate("BatchDetails", { batchId: item.id })
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBatches();
              }}
              colors={[P.accent]}
              tintColor={P.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="boat-outline" size={44} color={P.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>কোনো ব্যাচ নেই</Text>
              <Text style={styles.emptySubtitle}>
                নতুন ব্যাচ তৈরি করতে + চাপুন
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateBatch")}
        activeOpacity={0.88}
      >
        <Ionicons name="add" size={28} color={P.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },

  // Month bar
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  monthArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: P.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: P.border,
  },
  monthCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  monthText: {
    fontSize: 14,
    fontWeight: "800",
    color: P.textPrimary,
    letterSpacing: -0.2,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: P.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  reportBtnText: { color: P.white, fontWeight: "700", fontSize: 12 },

  // Filter chips
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 7,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
  },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterChipText: { fontSize: 12, fontWeight: "600", color: P.textSecondary },

  // Card — compact
  card: {
    flexDirection: "row",
    backgroundColor: P.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.border,
    overflow: "hidden",
    marginBottom: 9,
  },
  accentStripe: { width: 4 },
  cardInner: { flex: 1, paddingHorizontal: 12, paddingVertical: 11 },
  chevronWrap: { justifyContent: "center", paddingRight: 10, paddingLeft: 2 },

  // Row 1
  row1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  batchNumWrap: { gap: 2 },
  batchNum: {
    fontSize: 14,
    fontWeight: "900",
    color: P.textPrimary,
    letterSpacing: -0.2,
  },
  dateChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  dateText: { fontSize: 10, color: P.textMuted },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusLabel: { fontSize: 10, fontWeight: "700" },

  // Row 2: progress
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 10, color: P.textMuted, minWidth: 28 },

  // Row 3
  row3: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  ponaRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  ponaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  ponaLabel: { fontSize: 10, fontWeight: "600" },
  ponaVal: { fontSize: 11, fontWeight: "800" },

  finRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  finChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  finVal: { fontSize: 11, fontWeight: "700" },
  countBubble: {
    backgroundColor: P.danger,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  countBubbleText: { color: P.white, fontSize: 9, fontWeight: "800" },

  // States
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: P.textMuted, fontSize: 13 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: P.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: P.border,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: P.textPrimary },
  emptySubtitle: {
    fontSize: 13,
    color: P.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  listContent: { padding: 14, paddingBottom: 90, flexGrow: 1 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 22,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: P.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: P.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
});
