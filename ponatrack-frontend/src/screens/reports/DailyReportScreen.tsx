// src/screens/reports/DailyReportScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { reportAPI } from "../../api/services";
import { COLORS } from "../../constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

const Row = ({ label, value, highlight }: any) => (
  <View style={[styles.row, highlight && styles.rowHighlight]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
      {value}
    </Text>
  </View>
);

export const DailyReportScreen = () => {
  const route = useRoute<any>();
  const { date } = route.params;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI
      .getDaily(date)
      .then((res) => {
        setReport(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [date]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!report)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No data available</Text>
      </View>
    );

  const {
    totalOrders = 0,
    totalSales = 0,
    totalExpenses = 0,
    totalProfit = 0,
    totalDue = 0,
    totalCollections = 0,
  } = report;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.subtitle}>Daily Report</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summary</Text>
        <Row label="Total Orders" value={totalOrders} highlight={false} />
        <Row
          label="Total Sales"
          value={formatCurrency(totalSales)}
          highlight={false}
        />
        <Row
          label="Collections"
          value={formatCurrency(totalCollections)}
          highlight={false}
        />
        <Row
          label="Total Due"
          value={formatCurrency(totalDue)}
          highlight={false}
        />
        <Row
          label="Expenses"
          value={formatCurrency(totalExpenses)}
          highlight={false}
        />
        <Row
          label="Profit/Loss"
          value={formatCurrency(totalProfit)}
          highlight={true}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textSecondary },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: "center",
  },
  date: { fontSize: 20, fontWeight: "800", color: COLORS.white },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "60",
  },
  rowHighlight: {
    backgroundColor: COLORS.successLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  rowLabel: { fontSize: 14, color: COLORS.textSecondary },
  rowValue: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  rowValueHighlight: { color: COLORS.success, fontSize: 16, fontWeight: "800" },
});
