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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { customerAPI } from "../../api/services";
import { Customer, Order, Payment } from "../../types";
import { COLORS, ORDER_STATUS } from "../../constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <View style={[styles.statBox, { borderColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

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
      } catch (e) {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.mobile}>{customer.mobile}</Text>
        <Text style={styles.address}>{customer.address}</Text>
        {customer.area && <Text style={styles.area}>{customer.area}</Text>}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("AddEditCustomer", { customerId })}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox
          label="Orders"
          value={customer.totalOrders.toString()}
          color={COLORS.primary}
        />
        <StatBox
          label="PL Bought"
          value={customer.totalPLPurchased.toLocaleString()}
          color={COLORS.info}
        />
        <StatBox
          label="Paid"
          value={formatCurrency(customer.totalPaid)}
          color={COLORS.success}
        />
        <StatBox
          label="Due"
          value={formatCurrency(customer.totalDue)}
          color={COLORS.danger}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("CreateOrder", { customerId })}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.primaryBtnText}>New Order</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["orders", "payments"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders Tab */}
      {tab === "orders" && (
        <View style={styles.listSection}>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            orders.map((order) => {
              const statusInfo = ORDER_STATUS[order.status];
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() =>
                    navigation.navigate("OrderDetails", { orderId: order.id })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderType}>{order.ponaType}</Text>
                    <Text style={styles.orderQty}>
                      {order.plQuantity.toLocaleString()} PL
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.deliveryDate)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusInfo.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusInfo.color }]}
                      >
                        {statusInfo.label}
                      </Text>
                    </View>
                    <Text style={styles.orderAmount}>
                      {formatCurrency(order.totalPrice)}
                    </Text>
                    {order.dueAmount > 0 && (
                      <Text style={styles.dueText}>
                        Due: {formatCurrency(order.dueAmount)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* Payments Tab */}
      {tab === "payments" && (
        <View style={styles.listSection}>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments yet</Text>
          ) : (
            payments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <Ionicons
                  name="cash-outline"
                  size={22}
                  color={COLORS.success}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.date)}
                  </Text>
                  {payment.notes && (
                    <Text style={styles.paymentNote}>{payment.notes}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: COLORS.white },
  name: { fontSize: 22, fontWeight: "800", color: COLORS.white },
  mobile: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  address: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  area: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  editBtn: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  editBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  statsRow: { flexDirection: "row", padding: 12, gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderTopWidth: 3,
    elevation: 1,
  },
  statValue: { fontSize: 14, fontWeight: "800" },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  actionRow: { paddingHorizontal: 12, marginBottom: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    justifyContent: "center",
  },
  primaryBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  tab: { flex: 1, padding: 8, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: "600", color: COLORS.textSecondary, fontSize: 13 },
  tabTextActive: { color: COLORS.white },
  listSection: { paddingHorizontal: 12, gap: 8 },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    paddingVertical: 30,
  },
  orderCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  orderType: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  orderQty: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  orderDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: "700" },
  orderAmount: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  dueText: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
  paymentCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  paymentAmount: { fontSize: 16, fontWeight: "800", color: COLORS.success },
  paymentDate: { fontSize: 12, color: COLORS.textMuted },
  paymentNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
