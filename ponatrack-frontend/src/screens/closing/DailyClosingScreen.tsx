// src/screens/closing/DailyClosingScreen.tsx
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
import { useNavigation } from "@react-navigation/native";
import { dailyClosingAPI, dashboardAPI } from "../../api/services";
import { COLORS } from "../../constants";
import { formatCurrency, getTodayDate } from "../../utils/helpers";

const SummaryBox = ({ label, value, color, subtext }: any) => (
  <View style={[styles.summaryBox, { borderTopColor: color }]}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    {subtext && <Text style={styles.summarySubtext}>{subtext}</Text>}
  </View>
);

export const DailyClosingScreen = () => {
  const navigation = useNavigation<any>();
  const [todayDate] = useState(getTodayDate());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [alreadyClosed, setAlreadyClosed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await dashboardAPI.getStats();
        setStats(statsRes.data.data);

        const closingRes = await dailyClosingAPI.getByDate(todayDate);
        if (closingRes.data.data) {
          setAlreadyClosed(true);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClose = () => {
    Alert.alert(
      "Close Day",
      "Are you sure you want to close today's business?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Day",
          style: "default",
          onPress: async () => {
            setClosing(true);
            try {
              await dailyClosingAPI.close({
                date: todayDate,
                totalOrders: stats?.totalOrders || 0,
                totalDeliveries: stats?.totalDeliveries || 0,
                totalSales: stats?.totalSales || 0,
                totalCollections: stats?.totalCollections || 0,
                totalDue: stats?.totalDue || 0,
                totalExpenses: stats?.totalExpenses || 0,
                totalCompanyMir: stats?.totalCompanyMir || 0,
                totalCountingMir: stats?.totalCountingMir || 0,
              });
              Alert.alert("Success", "Day closed successfully", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to close day",
              );
            } finally {
              setClosing(false);
            }
          },
        },
      ],
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Ionicons name="calendar" size={24} color={COLORS.white} />
        <Text style={styles.dateText}>{todayDate}</Text>
        {alreadyClosed && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>

      {/* Summary Grid */}
      <View style={styles.summaryGrid}>
        <SummaryBox
          label="Total Orders"
          value={stats?.totalOrders || 0}
          color={COLORS.primary}
        />
        <SummaryBox
          label="Total Deliveries"
          value={stats?.totalDeliveries || 0}
          color={COLORS.info}
        />
        <SummaryBox
          label="Total Sales"
          value={formatCurrency(stats?.totalSales || 0)}
          color={COLORS.success}
        />
        <SummaryBox
          label="Collections"
          value={formatCurrency(stats?.totalCollections || 0)}
          color={COLORS.secondary}
        />
        <SummaryBox
          label="Due"
          value={formatCurrency(stats?.totalDue || 0)}
          color={COLORS.danger}
        />
        <SummaryBox
          label="Expenses"
          value={formatCurrency(stats?.totalExpenses || 0)}
          color={COLORS.warning}
        />
        <SummaryBox
          label="Company Mir"
          value={formatCurrency(stats?.totalCompanyMir || 0)}
          color={COLORS.textSecondary}
        />
        <SummaryBox
          label="Counting Mir"
          value={formatCurrency(stats?.totalCountingMir || 0)}
          color={COLORS.textSecondary}
        />
      </View>

      {/* Profit/Loss Card */}
      <View
        style={[
          styles.card,
          {
            borderTopColor:
              stats?.totalProfitLoss >= 0 ? COLORS.success : COLORS.danger,
            borderTopWidth: 4,
          },
        ]}
      >
        <Text style={styles.cardTitle}>Daily Summary</Text>
        <View style={styles.profitLossRow}>
          <Text style={styles.profitLossLabel}>Net Profit/Loss</Text>
          <Text
            style={[
              styles.profitLossValue,
              {
                color:
                  stats?.totalProfitLoss >= 0 ? COLORS.success : COLORS.danger,
              },
            ]}
          >
            {formatCurrency(stats?.totalProfitLoss || 0)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {!alreadyClosed && (
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.viewHistoryBtn}
            onPress={() => navigation.navigate("DailyClosingHistory")}
          >
            <Ionicons name="history" size={18} color={COLORS.primary} />
            <Text style={styles.viewHistoryBtnText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            disabled={closing}
          >
            {closing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={COLORS.white}
                />
                <Text style={styles.closeBtnText}>Close Day</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {alreadyClosed && (
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate("DailyClosingHistory")}
          >
            <Ionicons name="history" size={20} color={COLORS.white} />
            <Text style={styles.historyBtnText}>View Closing History</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  dateHeader: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  dateText: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  closedBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  closedText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  summaryGrid: { padding: 12, gap: 8 },
  summaryBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summarySubtext: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  profitLossRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profitLossLabel: { fontSize: 14, color: COLORS.textSecondary },
  profitLossValue: { fontSize: 24, fontWeight: "900" },
  actionCard: { marginHorizontal: 12, gap: 10, marginBottom: 20 },
  viewHistoryBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
  },
  viewHistoryBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  closeBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    padding: 14,
  },
  closeBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  historyBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
  },
  historyBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});
