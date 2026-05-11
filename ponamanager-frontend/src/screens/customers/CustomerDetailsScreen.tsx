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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { customerAPI } from "../../api/services";
import { Customer, Order, Payment } from "../../types";
import { COLORS, ORDER_STATUS } from "../../constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = ({ name }: { name: string }) => (
  <View style={styles.avatarRing}>
    <View style={styles.avatarInner}>
      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  </View>
);

// ─── Stat item inside the hero shelf ──────────────────────────────────────────

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

// ─── Icon box used in order / payment cards ────────────────────────────────────

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

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const info = ORDER_STATUS[status] ?? {
    label: status,
    bg: "#EEE",
    color: "#555",
  };
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.badgeText, { color: info.color }]}>
        {info.label}
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CustomerDetailsScreen = () => {
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
        setOrders(ordersRes.data.data);
        setPayments(paymentsRes.data.data);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!customer) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0C447C" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <LinearGradient
          colors={["#0C447C", "#185FA5", "#378ADD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Decorative circles */}
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

          {/* Stats shelf — fused into the bottom of the hero */}
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
              style={styles.btnPrimary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("CreateOrder", { customerId })}
            >
              <Ionicons name="add-circle-outline" size={17} color="#fff" />
              <Text style={styles.btnPrimaryText}>New Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddPayment", { customerId })}
            >
              <Ionicons name="cash-outline" size={17} color={COLORS.text} />
              <Text style={styles.btnSecondaryText}>Add Payment</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsWrap}>
            {(["orders", "payments"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
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

          {/* ── Orders list ── */}
          {tab === "orders" && (
            <View style={styles.list}>
              {orders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="receipt-outline"
                    size={36}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyText}>No orders yet</Text>
                </View>
              ) : (
                orders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate("OrderDetails", { orderId: order.id })
                    }
                  >
                    <IconBox name="cube-outline" bg="#E6F1FB" color="#185FA5" />

                    <View style={styles.cardBody}>
                      {/* type + amount */}
                      <View style={styles.cardTopRow}>
                        <Text style={styles.orderType}>{order.ponaType}</Text>
                        <Text style={styles.orderAmount}>
                          {formatCurrency(order.totalPrice)}
                        </Text>
                      </View>
                      {/* qty + date */}
                      <View style={styles.cardMetaRow}>
                        <Text style={styles.orderQty}>
                          {order.plQuantity.toLocaleString()} PL
                        </Text>
                        <Text style={styles.orderDate}>
                          {formatDate(order.deliveryDate)}
                        </Text>
                      </View>
                      {/* status badge + due pill */}
                      <View style={styles.cardFootRow}>
                        <StatusBadge status={order.status} />
                        {order.dueAmount > 0 && (
                          <View style={styles.duePill}>
                            <Text style={styles.duePillText}>
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

          {/* ── Payments list ── */}
          {tab === "payments" && (
            <View style={styles.list}>
              {payments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="wallet-outline"
                    size={36}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyText}>No payments yet</Text>
                </View>
              ) : (
                payments.map((payment) => (
                  <View key={payment.id} style={styles.paymentCard}>
                    <IconBox name="cash-outline" bg="#E1F5EE" color="#0F6E56" />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.payAmount}>
                          {formatCurrency(payment.amount)}
                        </Text>
                        {(payment as any).method ? (
                          <Text style={styles.payMethod}>
                            {(payment as any).method}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.payDate}>
                        {formatDate(payment.date)}
                      </Text>
                      {payment.notes ? (
                        <Text style={styles.payNote}>{payment.notes}</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ── Hero ──
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

  // ── Nav bar ──
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

  // ── Profile row ──
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

  // ── Stats shelf ──
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
  statNum: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 18,
  },
  statLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statSuccess: { color: "#9FE1CB" },
  statDanger: { color: "#F09595" },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 16 },

  // ── Action buttons ──
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#185FA5",
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  // ── Tabs ──
  tabsWrap: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  tabBtnActive: { backgroundColor: "#185FA5" },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: { color: "#fff" },

  // ── Lists ──
  list: { gap: 8 },

  // ── Shared card layout ──
  orderCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 14,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
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

  // ── Order card specifics ──
  orderType: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  orderAmount: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  orderQty: { fontSize: 12, color: COLORS.textSecondary },
  orderDate: { fontSize: 11, color: COLORS.textMuted },

  // ── Status badge ──
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },

  // ── Due pill ──
  duePill: {
    backgroundColor: "#FCEBEB",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  duePillText: { fontSize: 11, color: "#A32D2D", fontWeight: "500" },

  // ── Payment card specifics ──
  payAmount: { fontSize: 16, fontWeight: "600", color: "#0F6E56" },
  payMethod: { fontSize: 11, color: COLORS.textSecondary },
  payDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  payNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },

  // ── Empty state ──
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});
