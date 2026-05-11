// src/screens/orders/OrderListScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { orderAPI } from "../../api/services";
import { Order } from "../../types";
import { COLORS, ORDER_STATUS, PONA_TYPES } from "../../constants";
import {
  formatCurrency,
  formatDate,
  getPonaTypeColor,
} from "../../utils/helpers";

// ─── Safe status getter ────────────────────────────────────────────────────────
// FIX: ORDER_STATUS[order.status] can be undefined if the API returns an
// unexpected status value. Always fall back to a safe default.
const DEFAULT_STATUS = { label: "Unknown", bg: "#F3F4F6", color: "#6B7280" };
const getSafeStatus = (status: string) =>
  (
    ORDER_STATUS as Record<string, { label: string; bg: string; color: string }>
  )[status] ?? DEFAULT_STATUS;

// ─── Design tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  bg: "#0F1117",
  surface: "#1A1D27",
  surfaceRaised: "#21253A",
  border: "rgba(255,255,255,0.07)",
  accent: "#6C63FF",
  accentSoft: "rgba(108,99,255,0.15)",
  gold: "#F5C542",
  danger: "#FF5E7E",
  dangerSoft: "rgba(255,94,126,0.12)",
  success: "#2ECC71",
  successSoft: "rgba(46,204,113,0.12)",
  warning: "#F0A500",
  warningSoft: "rgba(240,165,0,0.12)",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  white: "#FFFFFF",
};

const STATUS_THEME: Record<
  string,
  { label: string; bg: string; color: string; icon: string }
> = {
  pending: {
    label: "Pending",
    bg: PALETTE.warningSoft,
    color: PALETTE.warning,
    icon: "time-outline",
  },
  partial: {
    label: "Partial",
    bg: PALETTE.accentSoft,
    color: PALETTE.accent,
    icon: "hourglass-outline",
  },
  delivered: {
    label: "Delivered",
    bg: PALETTE.successSoft,
    color: PALETTE.success,
    icon: "checkmark-circle-outline",
  },
  cancelled: {
    label: "Cancelled",
    bg: PALETTE.dangerSoft,
    color: PALETTE.danger,
    icon: "close-circle-outline",
  },
  __default__: {
    label: "Unknown",
    bg: "rgba(255,255,255,0.06)",
    color: PALETTE.textMuted,
    icon: "help-circle-outline",
  },
};

const getSafeStatusTheme = (status: string) =>
  STATUS_THEME[status] ?? STATUS_THEME["__default__"];

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({
  order,
  onPress,
  index,
}: {
  order: Order;
  onPress: () => void;
  index: number;
}) => {
  // FIX: Safely resolve status so undefined never crashes .bg / .color
  const statusTheme = getSafeStatusTheme(order.status);
  const typeColor = getPonaTypeColor?.(order.ponaType) ?? PALETTE.accent;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(18)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hasDue = order.dueAmount > 0;

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
        <View style={[styles.accentStripe, { backgroundColor: typeColor }]} />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.customerInfo}>
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: typeColor + "22" },
                ]}
              >
                <Text style={[styles.avatarText, { color: typeColor }]}>
                  {(order.customerName ?? "?")[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.customerName} numberOfLines={1}>
                  {order.customerName}
                </Text>
                <Text style={styles.mobile}>{order.customerMobile}</Text>
              </View>
            </View>

            {/* FIX: status badge now uses safe lookup — no crash on unknown status */}
            <View
              style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}
            >
              <Ionicons
                name={statusTheme.icon as any}
                size={10}
                color={statusTheme.color}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.statusText, { color: statusTheme.color }]}>
                {statusTheme.label}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.typePill,
                {
                  backgroundColor: typeColor + "18",
                  borderColor: typeColor + "44",
                },
              ]}
            >
              <Text style={[styles.typePillText, { color: typeColor }]}>
                {order.ponaType}
              </Text>
            </View>

            <View style={styles.qtyChip}>
              <Ionicons
                name="layers-outline"
                size={11}
                color={PALETTE.textMuted}
              />
              <Text style={styles.qtyText}>
                {(order.plQuantity ?? 0).toLocaleString()} PL
              </Text>
            </View>

            <View style={styles.dateChip}>
              <Ionicons
                name="calendar-outline"
                size={11}
                color={PALETTE.textMuted}
              />
              <Text style={styles.dateText}>
                {formatDate(order.deliveryDate)}
              </Text>
            </View>
          </View>

          {/* Footer row */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(order.totalPrice)}
              </Text>
            </View>

            {hasDue ? (
              <View style={styles.dueChip}>
                <Ionicons
                  name="alert-circle"
                  size={11}
                  color={PALETTE.danger}
                />
                <Text style={styles.dueText}>
                  Due {formatCurrency(order.dueAmount)}
                </Text>
              </View>
            ) : (
              <View style={styles.paidChip}>
                <Ionicons
                  name="checkmark-circle"
                  size={11}
                  color={PALETTE.success}
                />
                <Text style={styles.paidText}>Paid</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.chevronWrap}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={PALETTE.textMuted}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "partial", label: "Partial" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export const OrderListScreen = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderAPI.getAll({
        search,
        status: statusFilter || undefined,
      });
      // FIX: guard against unexpected API shape
      const raw = res?.data?.data?.data;
      setOrders(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error("fetchOrders error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [search, statusFilter]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSub}>
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("CreateOrder")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={PALETTE.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={PALETTE.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, mobile…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={PALETTE.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={PALETTE.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Status filters ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = statusFilter === f.key;
          const theme =
            f.key === ""
              ? { color: PALETTE.accent, bg: PALETTE.accentSoft }
              : getSafeStatusTheme(f.key);
          return (
            <TouchableOpacity
              key={f.key || "all"}
              style={[
                styles.filterChip,
                active && {
                  backgroundColor: theme.bg,
                  borderColor: theme.color + "55",
                },
              ]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && { color: theme.color },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OrderCard
              order={item}
              index={index}
              onPress={() =>
                navigation.navigate("OrderDetails", { orderId: item.id })
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              colors={[PALETTE.accent]}
              tintColor={PALETTE.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="receipt-outline"
                  size={44}
                  color={PALETTE.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `No results for "${search}"`
                  : "Create your first order to get started"}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: PALETTE.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: PALETTE.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addBtnText: {
    color: PALETTE.white,
    fontSize: 13,
    fontWeight: "700",
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: PALETTE.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textPrimary,
    paddingVertical: 0,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 7,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: PALETTE.textSecondary,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  accentStripe: { width: 4 },
  cardBody: { flex: 1, paddingLeft: 14, paddingRight: 4 },
  chevronWrap: {
    justifyContent: "center",
    paddingRight: 12,
    paddingLeft: 4,
  },

  // Card header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    paddingRight: 8,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800" },
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: PALETTE.textPrimary,
    maxWidth: 140,
  },
  mobile: { fontSize: 11, color: PALETTE.textSecondary, marginTop: 1 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: "700" },

  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 10,
    marginRight: 8,
  },

  // Meta row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    paddingRight: 8,
  },
  typePill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  typePillText: { fontSize: 11, fontWeight: "700" },
  qtyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qtyText: { fontSize: 11, fontWeight: "600", color: PALETTE.textSecondary },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateText: { fontSize: 11, color: PALETTE.textSecondary },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    paddingRight: 8,
    marginTop: 10,
  },
  amountLabel: { fontSize: 10, color: PALETTE.textMuted, fontWeight: "500" },
  amountValue: {
    fontSize: 17,
    fontWeight: "800",
    color: PALETTE.textPrimary,
    letterSpacing: -0.3,
  },
  dueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: PALETTE.dangerSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dueText: { fontSize: 11, color: PALETTE.danger, fontWeight: "700" },
  paidChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: PALETTE.successSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paidText: { fontSize: 11, color: PALETTE.success, fontWeight: "700" },

  // Loader / Empty
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: PALETTE.textMuted, fontSize: 13 },
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
    backgroundColor: PALETTE.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PALETTE.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  listContent: { padding: 16, flexGrow: 1 },
});
