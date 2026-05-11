// src/screens/dashboard/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import { dashboardAPI } from "../../api/services";
import { useAppStore } from "../../store/appStore";
import { COLORS } from "../../constants";
import { formatCurrency, formatNumber } from "../../utils/helpers";

const { width } = Dimensions.get("window");
const CARD_W = (width - 52) / 2;
const REPORT_W = (width - 52) / 2;

const MiniCard = ({ title, value, icon, color, bg, onPress }: any) => (
  <TouchableOpacity
    style={[styles.miniCard, { width: CARD_W }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.miniCardIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.miniCardTitle}>{title}</Text>
    <Text style={[styles.miniCardValue, { color }]}>{value}</Text>
  </TouchableOpacity>
);

const WideCard = ({ title, value, sub, icon, color, bg }: any) => (
  <View style={[styles.wideCard, { borderLeftColor: color }]}>
    <View style={[styles.wideCardIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.wideCardTitle}>{title}</Text>
      <Text style={[styles.wideCardValue, { color }]}>{value}</Text>
      {sub ? <Text style={styles.wideCardSub}>{sub}</Text> : null}
    </View>
  </View>
);

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity
    style={styles.quickBtn}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.quickIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={22} color={COLORS.white} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title, actionLabel, onAction }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel ? (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionLabel} →</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const ReportCard = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.reportCard, { width: REPORT_W }]}
    onPress={onPress}
    activeOpacity={0.82}
  >
    <View style={[styles.reportCardIcon, { backgroundColor: color + "18" }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.reportCardLabel}>{label}</Text>
    <View style={[styles.reportCardArrow, { backgroundColor: color + "18" }]}>
      <Ionicons name="arrow-forward" size={12} color={color} />
    </View>
  </TouchableOpacity>
);

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { dashboardStats, setDashboardStats } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardAPI.getStats();
      setDashboardStats(res.data.data);
    } catch (e) {
      console.log("Dashboard error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const s = dashboardStats;
  const profit = s?.totalProfitLoss ?? 0;
  const isProfit = profit >= 0;

  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10,102,64,${opacity})`,
    labelColor: () => COLORS.textSecondary,
    propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primary },
    propsForLabels: { fontSize: 10 },
    propsForBackgroundLines: { strokeDasharray: "", stroke: COLORS.border },
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <View style={styles.loadingLogo}>
          <Ionicons name="fish" size={40} color={COLORS.primary} />
        </View>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 16 }}
        />
        <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const reports = [
    {
      icon: "calendar-outline",
      label: "দৈনিক রিপোর্ট",
      color: COLORS.primary,
      screen: "DailyReport",
      params: { date: today },
    },
    {
      icon: "bar-chart-outline",
      label: "মাসিক রিপোর্ট",
      color: "#1E88E5",
      screen: "MonthlyBatchReport",
      params: { month: thisMonth },
    },
    {
      icon: "people-outline",
      label: "বাকি রিপোর্ট",
      color: COLORS.danger,
      screen: "CustomerDueReport",
      params: undefined,
    },
    {
      icon: "card-outline",
      label: "খরচ রিপোর্ট",
      color: COLORS.warning,
      screen: "ExpenseReport",
      params: undefined,
    },
    {
      icon: "trending-up-outline",
      label: "লাভ/ক্ষতি",
      color: "#43A047",
      screen: "ProfitLossReport",
      params: undefined,
    },
    {
      icon: "boat-outline",
      label: "ব্যাচ তালিকা",
      color: "#7B1FA2",
      screen: "BatchList",
      params: undefined,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats();
          }}
          colors={[COLORS.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Banner ───────────────────────────────── */}
      <View style={styles.heroBanner}>
        <View>
          <Text style={styles.heroGreeting}>স্বাগতম 👋</Text>
          <Text style={styles.heroTitle}>PonaTrack</Text>
          <Text style={styles.heroSub}>পোনা ব্যবসা ম্যানেজমেন্ট</Text>
        </View>
        <View style={styles.heroRight}>
          {(s?.activeBatches ?? 0) > 0 && (
            <TouchableOpacity
              style={styles.activePill}
              onPress={() => navigation.navigate("Batches")}
            >
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>
                {s!.activeBatches} ব্যাচ চলছে
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate("NotificationScreen")}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Floating Profit Card ──────────────────────── */}
      <View style={styles.profitCard}>
        <View style={styles.profitLeft}>
          <Text style={styles.profitLabel}>মোট লাভ / ক্ষতি</Text>
          <Text
            style={[
              styles.profitValue,
              { color: isProfit ? "#00C853" : "#FF1744" },
            ]}
          >
            {isProfit ? "+" : ""}
            {formatCurrency(profit)}
          </Text>
          <View
            style={[
              styles.profitBadge,
              { backgroundColor: isProfit ? "#00C85322" : "#FF174422" },
            ]}
          >
            <Ionicons
              name={isProfit ? "trending-up" : "trending-down"}
              size={13}
              color={isProfit ? "#00C853" : "#FF1744"}
            />
            <Text
              style={[
                styles.profitBadgeText,
                { color: isProfit ? "#00C853" : "#FF1744" },
              ]}
            >
              {isProfit ? "লাভজনক" : "ক্ষতি"}
            </Text>
          </View>
        </View>
        <View style={styles.profitDivider} />
        <View style={styles.profitRight}>
          <View style={styles.profitMini}>
            <Text style={styles.profitMiniLabel}>মোট বিক্রয়</Text>
            <Text style={styles.profitMiniVal}>
              {formatCurrency(s?.totalSales || 0)}
            </Text>
          </View>
          <View style={styles.profitMiniDivider} />
          <View style={styles.profitMini}>
            <Text style={styles.profitMiniLabel}>মোট খরচ</Text>
            <Text style={styles.profitMiniVal}>
              {formatCurrency(s?.totalExpenses || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Quick Actions ─────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="দ্রুত কার্যক্রম" />
        <View style={styles.quickRow}>
          <QuickAction
            icon="add-circle-outline"
            label="নতুন অর্ডার"
            color={COLORS.primary}
            onPress={() => navigation.navigate("CreateOrder")}
          />
          <QuickAction
            icon="boat-outline"
            label="নতুন ব্যাচ"
            color="#1E88E5"
            onPress={() => navigation.navigate("CreateBatch")}
          />
          <QuickAction
            icon="wallet-outline"
            label="খরচ যোগ"
            color={COLORS.warning}
            onPress={() => navigation.navigate("AddExpense")}
          />
          <QuickAction
            icon="lock-closed-outline"
            label="হিসাব বন্ধ"
            color={COLORS.danger}
            onPress={() => navigation.navigate("DailyClosing")}
          />
        </View>
      </View>

      {/* ── Key Stats 2×2 ────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="মূল পরিসংখ্যান"
          actionLabel="রিপোর্ট"
          onAction={() => navigation.navigate("Reports")}
        />
        <View style={styles.miniGrid}>
          <MiniCard
            title="মোট অর্ডার"
            value={formatNumber(s?.totalOrders || 0)}
            icon="receipt-outline"
            color={COLORS.primary}
            bg={COLORS.successLight}
            onPress={() => navigation.navigate("Orders")}
          />
          <MiniCard
            title="PL ডেলিভারি"
            value={formatNumber(s?.totalPLDelivered || 0)}
            icon="fish-outline"
            color="#1E88E5"
            bg="#E3F2FD"
            onPress={() => navigation.navigate("Batches")}
          />
          <MiniCard
            title="সংগ্রহ"
            value={formatCurrency(s?.totalCollections || 0)}
            icon="cash-outline"
            color="#43A047"
            bg="#E8F5E9"
          />
          <MiniCard
            title="মোট বাকি"
            value={formatCurrency(s?.totalDue || 0)}
            icon="alert-circle-outline"
            color={COLORS.danger}
            bg={COLORS.dangerLight}
            onPress={() => navigation.navigate("CustomerDueReport")}
          />
        </View>
      </View>

      {/* ── Mir Row ──────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="মীর / শর্টেজ" />
        <View style={styles.mirRow}>
          <WideCard
            title="কোম্পানি মীর"
            value={formatNumber(s?.totalCompanyMir || 0)}
            sub="মোট ঘাটতি"
            icon="cube-outline"
            color="#7B1FA2"
            bg="#F3E5F5"
          />
          <WideCard
            title="কাউন্টিং মীর"
            value={formatNumber(s?.totalCountingMir || 0)}
            sub="গণনা পার্থক্য"
            icon="calculator-outline"
            color="#00838F"
            bg="#E0F7FA"
          />
        </View>
      </View>

      {/* ── Chart ────────────────────────────────────── */}
      {s?.dailySales && s.dailySales.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="দৈনিক বিক্রয় (শেষ ৭ দিন)"
            actionLabel="রিপোর্ট"
            onAction={() => navigation.navigate("Reports")}
          />
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: s.dailySales.map((d: any) => d.date.slice(5)),
                datasets: [
                  { data: s.dailySales.map((d: any) => d.amount || 0) },
                ],
              }}
              width={width - 48}
              height={175}
              chartConfig={chartConfig}
              bezier
              withInnerLines={false}
              style={{ borderRadius: 12 }}
            />
          </View>
        </View>
      )}

      {/* ── Report Shortcuts 2×3 ─────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="রিপোর্ট শর্টকাট" />
        <View style={styles.reportGrid}>
          {reports.map((r) => (
            <ReportCard
              key={r.label}
              icon={r.icon}
              label={r.label}
              color={r.color}
              onPress={() => navigation.navigate(r.screen as any, r.params)}
            />
          ))}
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6F2" },

  /* Loading */
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F6F2",
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: "600",
  },

  /* Hero */
  heroBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroGreeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  heroTitle: { fontSize: 26, fontWeight: "900", color: COLORS.white },
  heroSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  heroRight: { alignItems: "flex-end", gap: 8 },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#69FF85",
  },
  activePillText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Profit Float Card */
  profitCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  profitLeft: { flex: 1, gap: 6 },
  profitLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" },
  profitValue: { fontSize: 26, fontWeight: "900" },
  profitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  profitBadgeText: { fontSize: 11, fontWeight: "700" },
  profitDivider: {
    width: 1,
    height: "80%",
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },
  profitRight: { gap: 8 },
  profitMini: { alignItems: "flex-end" },
  profitMiniLabel: { fontSize: 10, color: COLORS.textMuted },
  profitMiniVal: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  profitMiniDivider: { height: 1, backgroundColor: COLORS.border },

  /* Section */
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  sectionAction: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  /* Quick Actions */
  quickRow: { flexDirection: "row", gap: 8 },
  quickBtn: { flex: 1, alignItems: "center", gap: 6 },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  /* Mini Cards 2×2 */
  miniGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  miniCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  miniCardTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  miniCardValue: { fontSize: 17, fontWeight: "900" },

  /* Mir Row */
  mirRow: { gap: 10 },
  wideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  wideCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  wideCardTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  wideCardValue: { fontSize: 19, fontWeight: "900", marginTop: 2 },
  wideCardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  /* Chart */
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: "hidden",
  },

  /* Report Cards 2×3 */
  reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    alignItems: "flex-start",
    gap: 8,
  },
  reportCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  reportCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
  },
  reportCardArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
