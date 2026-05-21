// src/screens/company/CompanyOrderListScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { companyOrderAPI } from "../../api/companyOrderAPI";
import { formatCurrency, formatDate } from "../../utils/helpers";

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9", surface: "#FFFFFF", border: "rgba(0,0,0,0.07)",
  textPrimary: "#111827", textSecondary: "#6B7280", textMuted: "#9CA3AF",
  accent: "#6C63FF", accentSoft: "rgba(108,99,255,0.10)",
  success: "#18B565", successSoft: "rgba(24,181,101,0.10)",
  danger: "#F03F5F", dangerSoft: "rgba(240,63,95,0.09)",
  warning: "#E09400", warningSoft: "rgba(224,148,0,0.10)",
  info: "#0EA5E9", infoSoft: "rgba(14,165,233,0.10)",
  white: "#FFFFFF", shadow: "#000",
};
const DARK = {
  bg: "#0F1117", surface: "#1A1D27", border: "rgba(255,255,255,0.07)",
  textPrimary: "#F0F2FF", textSecondary: "#8A8FA8", textMuted: "#545872",
  accent: "#6C63FF", accentSoft: "rgba(108,99,255,0.15)",
  success: "#2ECC71", successSoft: "rgba(46,204,113,0.12)",
  danger: "#FF5E7E", dangerSoft: "rgba(255,94,126,0.12)",
  warning: "#F0A500", warningSoft: "rgba(240,165,0,0.12)",
  info: "#3B9EFF", infoSoft: "rgba(59,158,255,0.12)",
  white: "#FFFFFF", shadow: "#000",
};
const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Pona type config ──────────────────────────────────────────────────────────
const PONA_COLORS: Record<string, string> = {
  Golda:    "#F5A623",
  Bagda:    "#1E88E5",
  Vannamei: "#43A047",
};

const getPonaColor = (type: string) => PONA_COLORS[type] ?? "#6C63FF";

// ─── Status config ─────────────────────────────────────────────────────────────
const getStatusCfg = (status: string, T: typeof LIGHT) => {
  if (status === "delivered") return { label: "পোনা পাওয়া গেছে", color: T.success, bg: T.successSoft, icon: "checkmark-circle-outline" as const };
  return { label: "অপেক্ষায়", color: T.warning, bg: T.warningSoft, icon: "time-outline" as const };
};

// ─── Filters ──────────────────────────────────────────────────────────────────
const STATUS_FILTERS  = [
  { key: "",          label: "সব"     },
  { key: "pending",   label: "অপেক্ষায়" },
  { key: "delivered", label: "পাওয়া গেছে" },
];
const PONA_FILTERS = [
  { key: "",          label: "সব পোনা" },
  { key: "Golda",     label: "গলদা"   },
  { key: "Bagda",     label: "বাগদা"  },
  { key: "Vannamei",  label: "ভেনামি" },
];

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({ item, index, T, onPress }: { item: any; index: number; T: typeof LIGHT; onPress: () => void }) => {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 280, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const ponaColor = getPonaColor(item.ponaType);
  const statusCfg = getStatusCfg(item.status, T);
  const isDelivered = item.status === "delivered";

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: T.surface, borderColor: T.border, borderLeftColor: ponaColor }]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            {/* Pona type badge */}
            <View style={[styles.ponaBadge, { backgroundColor: ponaColor + "18", borderColor: ponaColor + "44" }]}>
              <Text style={[styles.ponaBadgeText, { color: ponaColor }]}>{item.ponaType}</Text>
            </View>
            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Ionicons name={statusCfg.icon} size={10} color={statusCfg.color} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>
          <Text style={[styles.date, { color: T.textMuted }]}>{formatDate(item.expectedDate)}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: T.border }]} />

        {/* Middle row — payment info */}
        <View style={styles.cardMid}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: T.textMuted }]}>পেমেন্ট</Text>
            <Text style={[styles.statValue, { color: T.textPrimary }]}>{formatCurrency(item.paymentAmount)}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: T.textMuted }]}>প্রতি PL</Text>
            <Text style={[styles.statValue, { color: T.textPrimary }]}>৳{item.ratePerPL}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: T.textMuted }]}>আনুমানিক PL</Text>
            <Text style={[styles.statValue, { color: T.accent }]}>{(item.expectedPL ?? 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* If delivered — show actual data */}
        {isDelivered && (
          <>
            <View style={[styles.divider, { backgroundColor: T.border }]} />
            <View style={styles.deliveredRow}>
              <View style={styles.deliveredStat}>
                <Text style={[styles.deliveredLabel, { color: T.textMuted }]}>মীর</Text>
                <Text style={[styles.deliveredValue, { color: T.textPrimary }]}>{item.mirValue ?? "—"}</Text>
              </View>
              <View style={styles.deliveredStat}>
                <Text style={[styles.deliveredLabel, { color: T.textMuted }]}>পলি</Text>
                <Text style={[styles.deliveredValue, { color: T.textPrimary }]}>{item.totalPoly ?? "—"}</Text>
              </View>
              <View style={styles.deliveredStat}>
                <Text style={[styles.deliveredLabel, { color: T.textMuted }]}>মোট PL</Text>
                <Text style={[styles.deliveredValue, { color: ponaColor }]}>{(item.totalPL ?? 0).toLocaleString()}</Text>
              </View>
              {(item.netDue ?? 0) > 0 && (
                <View style={[styles.dueChip, { backgroundColor: T.dangerSoft }]}>
                  <Text style={[styles.dueChipText, { color: T.danger }]}>বাকি {formatCurrency(item.netDue)}</Text>
                </View>
              )}
              {(item.netAdvance ?? 0) > 0 && (
                <View style={[styles.advChip, { backgroundColor: T.successSoft }]}>
                  <Text style={[styles.advChipText, { color: T.success }]}>অগ্রীম {formatCurrency(item.netAdvance)}</Text>
                </View>
              )}
            </View>

            {/* Batch link */}
            {item.batch && (
              <View style={[styles.batchLink, { backgroundColor: T.accentSoft }]}>
                <Ionicons name="boat-outline" size={12} color={T.accent} />
                <Text style={[styles.batchLinkText, { color: T.accent }]}>
                  ব্যাচ: {item.batch.batchNumber}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={14} color={T.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const CompanyOrderListScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();

  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [ponaFilter,   setPonaFilter]   = useState("");

  // Summary stats
  const totalPending   = orders.filter(o => o.status === "pending").length;
  const totalDue       = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.netDue ?? 0), 0);
  const totalAdvance   = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.netAdvance ?? 0), 0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await companyOrderAPI.getAll({
        ...(statusFilter ? { status: statusFilter }   : {}),
        ...(ponaFilter   ? { ponaType: ponaFilter }   : {}),
      });
      const raw = res?.data?.data;
      setOrders(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, ponaFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [statusFilter, ponaFilter]);

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: T.textPrimary }]}>কোম্পানি অর্ডার</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>{orders.length} টি অর্ডার</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: T.accent }]}
          onPress={() => navigation.navigate("CreateCompanyOrder")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>নতুন</Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary chips ── */}
      {(totalPending > 0 || totalDue > 0 || totalAdvance > 0) && (
        <View style={styles.summaryRow}>
          {totalPending > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: T.warningSoft }]}>
              <Ionicons name="time-outline" size={12} color={T.warning} />
              <Text style={[styles.summaryChipText, { color: T.warning }]}>{totalPending} অপেক্ষায়</Text>
            </View>
          )}
          {totalDue > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: T.dangerSoft }]}>
              <Ionicons name="alert-circle-outline" size={12} color={T.danger} />
              <Text style={[styles.summaryChipText, { color: T.danger }]}>বাকি {formatCurrency(totalDue)}</Text>
            </View>
          )}
          {totalAdvance > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: T.successSoft }]}>
              <Ionicons name="checkmark-circle-outline" size={12} color={T.success} />
              <Text style={[styles.summaryChipText, { color: T.success }]}>অগ্রীম {formatCurrency(totalAdvance)}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Status filter ── */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key || "all-status"}
              style={[styles.filterChip, { backgroundColor: T.surface, borderColor: T.border },
                active && { backgroundColor: T.accentSoft, borderColor: T.accent + "55" }]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.filterChipText, { color: T.textSecondary }, active && { color: T.accent }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Pona type filter ── */}
      <View style={[styles.filterRow, { marginTop: -6 }]}>
        {PONA_FILTERS.map((f) => {
          const active = ponaFilter === f.key;
          const color  = f.key ? getPonaColor(f.key) : T.accent;
          return (
            <TouchableOpacity
              key={f.key || "all-pona"}
              style={[styles.filterChip, { backgroundColor: T.surface, borderColor: T.border },
                active && { backgroundColor: color + "18", borderColor: color + "55" }]}
              onPress={() => setPonaFilter(f.key)}
            >
              <Text style={[styles.filterChipText, { color: T.textSecondary }, active && { color }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={[styles.loadingText, { color: T.textMuted }]}>লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={[T.accent]} tintColor={T.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: T.surface, borderColor: T.border }]}>
                <Ionicons name="business-outline" size={44} color={T.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: T.textPrimary }]}>কোনো অর্ডার নেই</Text>
              <Text style={[styles.emptySub, { color: T.textMuted }]}>
                কোম্পানিকে পেমেন্ট করে নতুন অর্ডার তৈরি করুন
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <OrderCard
              item={item} index={index} T={T}
              onPress={() => navigation.navigate("CompanyOrderDetail", { orderId: item.id })}
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
  center:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13 },

  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, marginTop: 2 },
  addBtn:      { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText:  { color: "#fff", fontSize: 13, fontWeight: "700" },

  summaryRow:  { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  summaryChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  summaryChipText: { fontSize: 11, fontWeight: "700" },

  filterRow:     { flexDirection: "row", paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  filterChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText:{ fontSize: 11, fontWeight: "600" },

  card: {
    borderRadius: 14, borderWidth: 1, borderLeftWidth: 4,
    marginBottom: 10, overflow: "hidden",
  },
  cardTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, paddingBottom: 10 },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  ponaBadge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  ponaBadgeText: { fontSize: 11, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText:  { fontSize: 10, fontWeight: "700" },
  date:        { fontSize: 11 },

  divider: { height: 1, marginHorizontal: 12 },

  cardMid:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  statBox:     { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 28 },
  statLabel:   { fontSize: 10, marginBottom: 3 },
  statValue:   { fontSize: 13, fontWeight: "700" },

  deliveredRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  deliveredStat:  { alignItems: "center" },
  deliveredLabel: { fontSize: 10 },
  deliveredValue: { fontSize: 13, fontWeight: "700" },
  dueChip:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dueChipText:    { fontSize: 11, fontWeight: "700" },
  advChip:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  advChipText:    { fontSize: 11, fontWeight: "700" },

  batchLink:     { flexDirection: "row", alignItems: "center", gap: 5, marginHorizontal: 12, marginBottom: 10, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  batchLinkText: { fontSize: 11, fontWeight: "600" },

  chevronWrap: { position: "absolute", right: 12, top: "50%" },

  listContent: { padding: 16, flexGrow: 1 },
  empty:         { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 4 },
  emptyTitle:    { fontSize: 16, fontWeight: "700" },
  emptySub:      { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});