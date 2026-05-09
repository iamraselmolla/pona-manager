// src/screens/delivery/DeliveryDetailsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { deliveryAPI } from "../../api/services";
import { Delivery } from "../../types";
import { COLORS } from "../../constants";
import { formatCurrency, formatDateTime } from "../../utils/helpers";

const Row = ({ label, value, valueStyle }: any) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
  </View>
);

export const DeliveryDetailsScreen = () => {
  const route = useRoute<any>();
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryAPI
      .getById(deliveryId)
      .then((res: any) => {
        setDelivery(res.data.data);
        setLoading(false);
      })
      .catch(() => Alert.alert("Error", "Failed to load delivery"));
  }, [deliveryId]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!delivery) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.customerName}>{delivery.customerName}</Text>
        <Text style={styles.date}>{formatDateTime(delivery.deliveryDate)}</Text>
        <Text style={styles.amount}>
          {formatCurrency(delivery.finalAmount)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quantity Details</Text>
        <Row
          label="Ordered"
          value={`${delivery.orderedQuantity?.toLocaleString()} PL`}
        />
        <Row
          label="Delivered"
          value={`${delivery.deliveredQuantity?.toLocaleString()} PL`}
          valueStyle={{ color: COLORS.primary, fontWeight: "800" }}
        />
        <Row
          label="Company Provided"
          value={`${delivery.companyProvidedQuantity?.toLocaleString()} PL`}
        />
        <Row
          label="Counted"
          value={`${delivery.countedQuantity?.toLocaleString()} PL`}
        />
        <Row
          label="Company Mir"
          value={delivery.companyMir?.toFixed(0)}
          valueStyle={{
            color: delivery.companyMir > 0 ? COLORS.danger : COLORS.success,
          }}
        />
        <Row
          label="Counting Mir"
          value={delivery.countingMir?.toFixed(0)}
          valueStyle={{
            color: delivery.countingMir > 0 ? COLORS.danger : COLORS.success,
          }}
        />
        <Row label="Mir %" value={`${delivery.mirPercentage?.toFixed(1)}%`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial Details</Text>
        <Row
          label="Delivery Rate"
          value={formatCurrency(delivery.deliveryRate)}
        />
        <Row label="Discount" value={formatCurrency(delivery.discount)} />
        <Row
          label="Final Amount"
          value={formatCurrency(delivery.finalAmount)}
          valueStyle={{ fontWeight: "800", color: COLORS.primary }}
        />
        <Row
          label="Customer Payment"
          value={formatCurrency(delivery.customerPayment)}
          valueStyle={{ color: COLORS.success }}
        />
        <Row
          label="Remaining Due"
          value={formatCurrency(delivery.remainingDue)}
          valueStyle={{
            color: delivery.remainingDue > 0 ? COLORS.danger : COLORS.success,
            fontWeight: "800",
          }}
        />
        <Row
          label="Profit/Loss"
          value={formatCurrency(delivery.profitLoss)}
          valueStyle={{
            color: delivery.profitLoss >= 0 ? COLORS.success : COLORS.danger,
            fontWeight: "800",
          }}
        />
      </View>

      {delivery.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notes}>{delivery.notes}</Text>
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
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  customerName: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  date: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  amount: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    marginBottom: 0,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "60",
  },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary },
  rowValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  notes: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
});
