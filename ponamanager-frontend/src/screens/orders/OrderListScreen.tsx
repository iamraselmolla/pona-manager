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
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { orderAPI } from "../../api/services";
import { Order } from "../../types";
import {
  formatCurrency,
  formatDate,
  getPonaTypeColor,
} from "../../utils/helpers";

// ─────────────────────────────────────────────────────────────
// Theme creator
// ─────────────────────────────────────────────────────────────

const createPalette = (dark: boolean) => ({
  bg: dark ? "#0F1117" : "#F5F7FB",
  surface: dark ? "#1A1D27" : "#FFFFFF",
  surfaceRaised: dark ? "#21253A" : "#FFFFFF",
  border: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",

  accent: "#6C63FF",
  accentSoft: dark ? "rgba(108,99,255,0.15)" : "rgba(108,99,255,0.10)",

  gold: "#F5C542",

  danger: "#FF5E7E",
  dangerSoft: dark ? "rgba(255,94,126,0.12)" : "rgba(255,94,126,0.10)",

  success: "#2ECC71",
  successSoft: dark ? "rgba(46,204,113,0.12)" : "rgba(46,204,113,0.10)",

  warning: "#F0A500",
  warningSoft: dark ? "rgba(240,165,0,0.12)" : "rgba(240,165,0,0.10)",

  textPrimary: dark ? "#F0F2FF" : "#111827",
  textSecondary: dark ? "#8A8FA8" : "#4B5563",
  textMuted: dark ? "#545872" : "#9CA3AF",

  white: "#FFFFFF",
});

// ─────────────────────────────────────────────────────────────
// Status theme helper
// ─────────────────────────────────────────────────────────────

const getStatusTheme = (status: string, P: any) => {
  const STATUS_THEME: Record<
    string,
    { label: string; bg: string; color: string; icon: string }
  > = {
    pending: {
      label: "Pending",
      bg: P.warningSoft,
      color: P.warning,
      icon: "time-outline",
    },
    partial: {
      label: "Partial",
      bg: P.accentSoft,
      color: P.accent,
      icon: "hourglass-outline",
    },
    delivered: {
      label: "Delivered",
      bg: P.successSoft,
      color: P.success,
      icon: "checkmark-circle-outline",
    },
    cancelled: {
      label: "Cancelled",
      bg: P.dangerSoft,
      color: P.danger,
      icon: "close-circle-outline",
    },
    __default__: {
      label: "Unknown",
      bg: P.border,
      color: P.textMuted,
      icon: "help-circle-outline",
    },
  };

  return STATUS_THEME[status] ?? STATUS_THEME["__default__"];
};

// ─────────────────────────────────────────────────────────────
// Order Card
// ─────────────────────────────────────────────────────────────

const OrderCard = ({
  order,
  onPress,
  index,
  palette,
}: {
  order: Order;
  onPress: () => void;
  index: number;
  palette: any;
}) => {
  const statusTheme = getStatusTheme(order.status, palette);

  const typeColor = getPonaTypeColor?.(order.ponaType) ?? palette.accent;

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
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        <View style={[styles.accentStripe, { backgroundColor: typeColor }]} />

        <View style={styles.cardBody}>
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
                <Text
                  style={[styles.customerName, { color: palette.textPrimary }]}
                  numberOfLines={1}
                >
                  {order.customerName}
                </Text>

                <Text style={[styles.mobile, { color: palette.textSecondary }]}>
                  {order.customerMobile}
                </Text>
              </View>
            </View>

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

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

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

            <View
              style={[
                styles.qtyChip,
                {
                  backgroundColor: palette.border,
                },
              ]}
            >
              <Ionicons
                name="layers-outline"
                size={11}
                color={palette.textMuted}
              />

              <Text style={[styles.qtyText, { color: palette.textSecondary }]}>
                {(order.plQuantity ?? 0).toLocaleString()} PL
              </Text>
            </View>

            <View
              style={[
                styles.dateChip,
                {
                  backgroundColor: palette.border,
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={palette.textMuted}
              />

              <Text style={[styles.dateText, { color: palette.textSecondary }]}>
                {formatDate(order.deliveryDate)}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={[styles.amountLabel, { color: palette.textMuted }]}>
                Total
              </Text>

              <Text
                style={[styles.amountValue, { color: palette.textPrimary }]}
              >
                {formatCurrency(order.totalPrice)}
              </Text>
            </View>

            {hasDue ? (
              <View
                style={[
                  styles.dueChip,
                  { backgroundColor: palette.dangerSoft },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={11}
                  color={palette.danger}
                />

                <Text style={[styles.dueText, { color: palette.danger }]}>
                  Due {formatCurrency(order.dueAmount)}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.paidChip,
                  { backgroundColor: palette.successSoft },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={11}
                  color={palette.success}
                />

                <Text style={[styles.paidText, { color: palette.success }]}>
                  Paid
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chevronWrap}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={palette.textMuted}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "partial", label: "Partial" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export const OrderListScreen = () => {
  const navigation = useNavigation<any>();

  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const P = createPalette(dark);

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
    <View style={[styles.container, { backgroundColor: P.bg }]}>
      {/* Header */}

      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: P.textPrimary }]}>
            Orders
          </Text>

          <Text style={[styles.headerSub, { color: P.textMuted }]}>
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: P.accent }]}
          onPress={() => navigation.navigate("CreateOrder")}
        >
          <Ionicons name="add" size={20} color={P.white} />

          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}

      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: P.surface,
            borderColor: P.border,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={P.textMuted} />

        <TextInput
          style={[styles.searchInput, { color: P.textPrimary }]}
          placeholder="Search by name, mobile…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={P.textMuted}
        />

        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={P.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = statusFilter === f.key;

          const theme =
            f.key === ""
              ? { color: P.accent, bg: P.accentSoft }
              : getStatusTheme(f.key, P);

          return (
            <TouchableOpacity
              key={f.key || "all"}
              style={[
                styles.filterChip,
                {
                  backgroundColor: P.surface,
                  borderColor: P.border,
                },
                active && {
                  backgroundColor: theme.bg,
                  borderColor: theme.color + "55",
                },
              ]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: P.textSecondary },
                  active && { color: theme.color },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.accent} />

          <Text style={[styles.loadingText, { color: P.textMuted }]}>
            Loading orders…
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OrderCard
              order={item}
              index={index}
              palette={P}
              onPress={() =>
                navigation.navigate("OrderDetails", {
                  orderId: item.id,
                })
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
              colors={[P.accent]}
              tintColor={P.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIconWrap,
                  {
                    backgroundColor: P.surface,
                    borderColor: P.border,
                  },
                ]}
              >
                <Ionicons
                  name="receipt-outline"
                  size={44}
                  color={P.textMuted}
                />
              </View>

              <Text style={[styles.emptyTitle, { color: P.textPrimary }]}>
                No orders found
              </Text>

              <Text style={[styles.emptySubtitle, { color: P.textMuted }]}>
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

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

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
    letterSpacing: -0.5,
  },

  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

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
    borderWidth: 1,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 10,
  },

  accentStripe: {
    width: 4,
  },

  cardBody: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 4,
  },

  chevronWrap: {
    justifyContent: "center",
    paddingRight: 12,
    paddingLeft: 4,
  },

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

  avatarText: {
    fontSize: 15,
    fontWeight: "800",
  },

  customerName: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 140,
  },

  mobile: {
    fontSize: 11,
    marginTop: 1,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    marginVertical: 10,
    marginRight: 8,
  },

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

  typePillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  qtyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  qtyText: {
    fontSize: 11,
    fontWeight: "600",
  },

  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  dateText: {
    fontSize: 11,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    paddingRight: 8,
    marginTop: 10,
  },

  amountLabel: {
    fontSize: 10,
    fontWeight: "500",
  },

  amountValue: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  dueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  dueText: {
    fontSize: 11,
    fontWeight: "700",
  },

  paidChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  paidText: {
    fontSize: 11,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 13,
  },

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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});
