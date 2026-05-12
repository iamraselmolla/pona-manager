// src/screens/customers/CustomerDetailsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { customerAPI } from "../../api/services";
import { Customer, Order, Payment } from "../../types";
import { ORDER_STATUS } from "../../constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

// ─── Palettes ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accent: "#6C63FF",
  danger: "#F03F5F",
  dangerSoft: "rgba(240,63,95,0.09)",
  success: "#18B565",
  successSoft: "rgba(24,181,101,0.10)",
  heroGradient: ["#6C63FF", "#9D5CFF", "#C26EFF"] as [string, string, string],
  heroStatusBar: "light-content" as "light-content" | "dark-content",
  orderIconBg: "#EEECFF",
  orderIconColor: "#6C63FF",
  payIconBg: "#E1F5EE",
  payIconColor: "#18B565",
  tabActiveBg: "#6C63FF",
  btnPrimaryBg: "#6C63FF",
  duePillBg: "#FCEBEB",
  duePillText: "#A32D2D",
};

const DARK = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "rgba(255,255,255,0.07)",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  accent: "#6C63FF",
  danger: "#FF5E7E",
  dangerSoft: "rgba(255,94,126,0.12)",
  success: "#2ECC71",
  successSoft: "rgba(46,204,113,0.12)",
  heroGradient: ["#1A1D27", "#21253A", "#2A2F47"] as [string, string, string],
  heroStatusBar: "light-content" as "light-content" | "dark-content",
  orderIconBg: "rgba(108,99,255,0.15)",
  orderIconColor: "#6C63FF",
  payIconBg: "rgba(46,204,113,0.12)",
  payIconColor: "#2ECC71",
  tabActiveBg: "#6C63FF",
  btnPrimaryBg: "#6C63FF",
  duePillBg: "rgba(255,94,126,0.12)",
  duePillText: "#FF5E7E",
};

const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name }: { name: string }) => (
  <View style={styles.avatarRing}>
    <View style={styles.avatarInner}>
      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  </View>
);

// ─── Stat item ─────────────────────────────────────────────────────────────────
const StatItem = ({
  label,
  value,
  valueStyle,
  borderRight,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  borderRight?: boolean;
}) => (
  <View style={[styles.statItem, borderRight && styles.statItemBorder]}>
    <Text style={[styles.statNum, valueStyle]}>{value}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

// ─── Icon box ──────────────────────────────────────────────────────────────────
const IconBox = ({
  name,
  bg,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
  color: string;
}) => (
  <View style={[styles.iconBox, { backgroundColor: bg }]}>
    <Ionicons name={name} size={20} color={color} />
  </View>
);

// ─── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const info = (
    ORDER_STATUS as Record<string, { label: string; bg: string; color: string }>
  )[status] ?? { label: status, bg: "#EEE", color: "#555" };
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.badgeText, { color: info.color }]}>
        {info.label}
      </Text>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const CustomerDetailsScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tab, setTab] = useState<"orders" | "payments">("orders");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, ordersRes, paymentsRes] = await Promise.all([
          customerAPI.getById(customerId),
          customerAPI.getOrders(customerId),
          customerAPI.getPayments(customerId),
        ]);
        setCustomer(custRes.data.data);
        setOrders(
          Array.isArray(ordersRes.data.data) ? ordersRes.data.data : [],
        );
        setPayments(
          Array.isArray(paymentsRes.data.data) ? paymentsRes.data.data : [],
        );
      } catch {
        Alert.alert("Error", "Failed to load customer");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  if (!customer) return null;

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.heroStatusBar} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <LinearGradient
          colors={T.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.decCircleLarge} />
          <View style={styles.decCircleSmall} />

          {/* Nav bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navIcon}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Customer</Text>
            <TouchableOpacity style={styles.navIcon}>
              <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile row */}
          <View style={styles.profileRow}>
            <Avatar name={customer.name} />
            <View style={styles.profileInfo}>
              <Text style={styles.custName} numberOfLines={1}>
                {customer.name}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons
                  name="call-outline"
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.custMobile}>{customer.mobile}</Text>
              </View>
              <Text style={styles.custAddr} numberOfLines={1}>
                {customer.address}
              </Text>
              {customer.area ? (
                <View style={styles.areaPill}>
                  <Ionicons
                    name="location-outline"
                    size={10}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.areaPillText}>{customer.area}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() =>
                navigation.navigate("AddEditCustomer", { customerId })
              }
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats shelf */}
          <View style={styles.statsShelf}>
            <StatItem
              label="Orders"
              value={customer.totalOrders.toString()}
              borderRight
            />
            <StatItem
              label="PL Bought"
              value={customer.totalPLPurchased.toLocaleString()}
              borderRight
            />
            <StatItem
              label="Paid"
              value={formatCurrency(customer.totalPaid)}
              valueStyle={styles.statSuccess}
              borderRight
            />
            <StatItem
              label="Due"
              value={formatCurrency(customer.totalDue)}
              valueStyle={styles.statDanger}
            />
          </View>
        </LinearGradient>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: T.btnPrimaryBg }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("CreateOrder", { customerId })}
            >
              <Ionicons name="add-circle-outline" size={17} color="#fff" />
              <Text style={styles.btnPrimaryText}>New Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnSecondary,
                { backgroundColor: T.surface, borderColor: T.border },
              ]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddPayment", { customerId })}
            >
              <Ionicons name="cash-outline" size={17} color={T.textPrimary} />
              <Text style={[styles.btnSecondaryText, { color: T.textPrimary }]}>
                Add Payment
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View
            style={[
              styles.tabsWrap,
              { backgroundColor: T.surface, borderColor: T.border },
            ]}
          >
            {(["orders", "payments"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tabBtn,
                  tab === t && [
                    styles.tabBtnActive,
                    { backgroundColor: T.tabActiveBg },
                  ],
                ]}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: T.textSecondary },
                    tab === t && styles.tabBtnTextActive,
                  ]}
                >
                  {t === "orders"
                    ? `Orders (${orders.length})`
                    : `Payments (${payments.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Orders ── */}
          {tab === "orders" && (
            <View style={styles.list}>
              {orders.length === 0 ? (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconWrap,
                      { backgroundColor: T.surface, borderColor: T.border },
                    ]}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={36}
                      color={T.textMuted}
                    />
                  </View>
                  <Text style={[styles.emptyText, { color: T.textMuted }]}>
                    No orders yet
                  </Text>
                </View>
              ) : (
                orders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={[
                      styles.orderCard,
                      { backgroundColor: T.surface, borderColor: T.border },
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate("OrderDetails", { orderId: order.id })
                    }
                  >
                    <IconBox
                      name="cube-outline"
                      bg={T.orderIconBg}
                      color={T.orderIconColor}
                    />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        <Text
                          style={[styles.orderType, { color: T.textPrimary }]}
                        >
                          {order.ponaType}
                        </Text>
                        <Text
                          style={[styles.orderAmount, { color: T.textPrimary }]}
                        >
                          {formatCurrency(order.totalPrice)}
                        </Text>
                      </View>
                      <View style={styles.cardMetaRow}>
                        <Text
                          style={[styles.orderQty, { color: T.textSecondary }]}
                        >
                          {(order.plQuantity ?? 0).toLocaleString()} PL
                        </Text>
                        <Text
                          style={[styles.orderDate, { color: T.textMuted }]}
                        >
                          {formatDate(order.deliveryDate)}
                        </Text>
                      </View>
                      <View style={styles.cardFootRow}>
                        <StatusBadge status={order.status} />
                        {(order.dueAmount ?? 0) > 0 && (
                          <View
                            style={[
                              styles.duePill,
                              { backgroundColor: T.duePillBg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.duePillText,
                                { color: T.duePillText },
                              ]}
                            >
                              Due: {formatCurrency(order.dueAmount)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* ── Payments ── */}
          {tab === "payments" && (
            <View style={styles.list}>
              {payments.length === 0 ? (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconWrap,
                      { backgroundColor: T.surface, borderColor: T.border },
                    ]}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={36}
                      color={T.textMuted}
                    />
                  </View>
                  <Text style={[styles.emptyText, { color: T.textMuted }]}>
                    No payments yet
                  </Text>
                </View>
              ) : (
                payments.map((payment) => (
                  <View
                    key={payment.id}
                    style={[
                      styles.paymentCard,
                      { backgroundColor: T.surface, borderColor: T.border },
                    ]}
                  >
                    <IconBox
                      name="cash-outline"
                      bg={T.payIconBg}
                      color={T.payIconColor}
                    />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        <Text style={[styles.payAmount, { color: T.success }]}>
                          {formatCurrency(payment.amount)}
                        </Text>
                        {(payment as any).method ? (
                          <Text
                            style={[
                              styles.payMethod,
                              { color: T.textSecondary },
                            ]}
                          >
                            {(payment as any).method}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.payDate, { color: T.textMuted }]}>
                        {formatDate(payment.date)}
                      </Text>
                      {payment.notes ? (
                        <Text
                          style={[styles.payNote, { color: T.textSecondary }]}
                        >
                          {payment.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles (color-neutral) ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    overflow: "hidden",
  },
  decCircleLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -40,
  },
  decCircleSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: 20,
    left: -20,
  },

  // Nav
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
  },

  // Profile row
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.4)",
    padding: 3,
    flexShrink: 0,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontWeight: "500", color: "#fff" },
  profileInfo: { flex: 1, minWidth: 0 },
  custName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 24,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  custMobile: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  custAddr: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  areaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 5,
  },
  areaPillText: { fontSize: 11, color: "rgba(255,255,255,0.85)" },
  editIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Stats shelf
  statsShelf: {
    flexDirection: "row",
    marginHorizontal: -20,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statItemBorder: {
    borderRightWidth: 0.5,
    borderRightColor: "rgba(255,255,255,0.12)",
  },
  statNum: { fontSize: 14, fontWeight: "600", color: "#fff", lineHeight: 18 },
  statLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statSuccess: { color: "#9FE1CB" },
  statDanger: { color: "#F09595" },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 16 },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  btnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: "600" },

  // Tabs
  tabsWrap: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  tabBtnActive: {},
  tabBtnText: { fontSize: 13, fontWeight: "500" },
  tabBtnTextActive: { color: "#fff", fontWeight: "700" },

  // Lists
  list: { gap: 8 },

  // Cards
  orderCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardFootRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  // Order specifics
  orderType: { fontSize: 13, fontWeight: "600" },
  orderAmount: { fontSize: 14, fontWeight: "600" },
  orderQty: { fontSize: 12 },
  orderDate: { fontSize: 11 },

  // Badge
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "600" },

  // Due pill
  duePill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  duePillText: { fontSize: 11, fontWeight: "500" },

  // Payment specifics
  payAmount: { fontSize: 16, fontWeight: "600" },
  payMethod: { fontSize: 11 },
  payDate: { fontSize: 12, marginTop: 2 },
  payNote: { fontSize: 12, fontStyle: "italic", marginTop: 2 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyText: { fontSize: 14 },
});
