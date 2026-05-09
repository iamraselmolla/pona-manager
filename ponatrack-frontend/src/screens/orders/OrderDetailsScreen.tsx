// src/screens/orders/OrderDetailsScreen.tsx
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
import { orderAPI } from "../../api/services";
import { Order } from "../../types";
import { COLORS, ORDER_STATUS } from "../../constants";
import {
  formatCurrency,
  formatDate,
  getPonaTypeColor,
} from "../../utils/helpers";

const Row = ({ label, value, valueStyle }: any) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
  </View>
);

export const OrderDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI
      .getById(orderId)
      .then((res) => {
        setOrder(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert("Error", "Failed to load order");
        navigation.goBack();
      });
  }, [orderId]);

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await orderAPI.cancel(orderId);
            setOrder((prev) =>
              prev ? { ...prev, status: "cancelled" } : null,
            );
          } catch {
            Alert.alert("Error", "Failed to cancel order");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!order) return null;

  const status = ORDER_STATUS[order.status];
  const typeColor = getPonaTypeColor(order.ponaType);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderTopColor: typeColor }]}>
        <View style={styles.headerTop}>
          <View
            style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}
          >
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
              {order.ponaType}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.quantity}>
          {order.plQuantity.toLocaleString()} PL
        </Text>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.mobile}>{order.customerMobile}</Text>
      </View>

      {/* Order Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Information</Text>
        <Row label="Address" value={order.customerAddress || "-"} />
        <Row label="Delivery Date" value={formatDate(order.deliveryDate)} />
        <Row label="Unit Rate" value={formatCurrency(order.unitRate)} />
        <Row
          label="Total Price"
          value={formatCurrency(order.totalPrice)}
          valueStyle={{ fontWeight: "800", color: COLORS.primary }}
        />
        {order.notes && <Row label="Notes" value={order.notes} />}
      </View>

      {/* Payment Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Information</Text>
        <Row
          label="Advance Paid"
          value={formatCurrency(order.advanceAmount)}
          valueStyle={{ color: COLORS.success }}
        />
        <Row
          label="Due Amount"
          value={formatCurrency(order.dueAmount)}
          valueStyle={{
            color: order.dueAmount > 0 ? COLORS.danger : COLORS.success,
            fontWeight: "800",
          }}
        />
      </View>

      {/* Actions */}
      {order.status !== "cancelled" && order.status !== "delivered" && (
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.deliveryBtn}
            onPress={() => navigation.navigate("DeliveryEntry", { orderId })}
          >
            <Ionicons name="boat-outline" size={18} color={COLORS.white} />
            <Text style={styles.deliveryBtnText}>Record Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={COLORS.danger}
            />
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.orderId}>Order ID: {order.id}</Text>
      <Text style={styles.createdAt}>
        Created: {formatDate(order.createdAt)}
      </Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 4,
    marginBottom: 12,
    elevation: 2,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  typeBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  quantity: { fontSize: 32, fontWeight: "900", color: COLORS.text },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
  },
  mobile: { fontSize: 14, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "80",
  },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary },
  rowValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  actionsCard: { marginHorizontal: 12, gap: 10, marginBottom: 12 },
  deliveryBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
  },
  deliveryBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  cancelBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 10,
    padding: 12,
  },
  cancelBtnText: { color: COLORS.danger, fontWeight: "700", fontSize: 14 },
  orderId: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  createdAt: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
