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
  useColorScheme,
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

// ─── Palettes ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  shadow: "#000",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accent: "#6C63FF",
  danger: "#F03F5F",
  dangerSoft: "rgba(240,63,95,0.09)",
  success: "#18B565",
  successSoft: "rgba(24,181,101,0.10)",
  warning: "#E09400",
  white: "#FFFFFF",
  heroBg: "#6C63FF",
  heroText: "#FFFFFF",
  heroSubText: "rgba(255,255,255,0.65)",
  chartBg: "#FFFFFF",
  chartLine: "rgba(108,99,255,1)",
  chartLabel: "#6B7280",
};

const DARK = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "rgba(255,255,255,0.07)",
  shadow: "#000",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  accent: "#6C63FF",
  danger: "#FF5E7E",
  dangerSoft: "rgba(255,94,126,0.12)",
  success: "#2ECC71",
  successSoft: "rgba(46,204,113,0.12)",
  warning: "#F0A500",
  white: "#FFFFFF",
  heroBg: "#1A1D27",
  heroText: "#F0F2FF",
  heroSubText: "rgba(240,242,255,0.5)",
  chartBg: "#1A1D27",
  chartLine: "rgba(108,99,255,1)",
  chartLabel: "#8A8FA8",
};

const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Sub-components ────────────────────────────────────────────────────────────
const MiniCard = ({ title, value, icon, color, bg, onPress }: any) => {
  const T = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.miniCard,
        { width: CARD_W, backgroundColor: T.surface, shadowColor: T.shadow },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.miniCardIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.miniCardTitle, { color: T.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.miniCardValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );
};

const WideCard = ({ title, value, sub, icon, color, bg }: any) => {
  const T = useTheme();
  return (
    <View
      style={[
        styles.wideCard,
        {
          backgroundColor: T.surface,
          borderLeftColor: color,
          shadowColor: T.shadow,
        },
      ]}
    >
      <View style={[styles.wideCardIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.wideCardTitle, { color: T.textSecondary }]}>
          {title}
        </Text>
        <Text style={[styles.wideCardValue, { color }]}>{value}</Text>
        {sub ? (
          <Text style={[styles.wideCardSub, { color: T.textMuted }]}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const QuickAction = ({ icon, label, color, onPress }: any) => {
  const T = useTheme();
  return (
    <TouchableOpacity
      style={styles.quickBtn}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={[styles.quickLabel, { color: T.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title, actionLabel, onAction }: any) => {
  const T = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>
        {title}
      </Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.sectionAction, { color: T.accent }]}>
            {actionLabel} →
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const ReportCard = ({ icon, label, color, onPress }: any) => {
  const T = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.reportCard,
        { width: REPORT_W, backgroundColor: T.surface, shadowColor: T.shadow },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.reportCardIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.reportCardLabel, { color: T.textPrimary }]}>
        {label}
      </Text>
      <View style={[styles.reportCardArrow, { backgroundColor: color + "18" }]}>
        <Ionicons name="arrow-forward" size={12} color={color} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const DashboardScreen = () => {
  const T = useTheme();
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
    backgroundColor: T.chartBg,
    backgroundGradientFrom: T.chartBg,
    backgroundGradientTo: T.chartBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108,99,255,${opacity})`,
    labelColor: () => T.chartLabel,
    propsForDots: { r: "4", strokeWidth: "2", stroke: T.accent },
    propsForLabels: { fontSize: 10 },
    propsForBackgroundLines: { strokeDasharray: "", stroke: T.border },
  };

  if (loading) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: T.bg }]}>
        <View style={[styles.loadingLogo, { backgroundColor: T.successSoft }]}>
          <Ionicons name="fish" size={40} color={T.accent} />
        </View>
        <ActivityIndicator
          size="large"
          color={T.accent}
          style={{ marginTop: 16 }}
        />
        <Text style={[styles.loadingText, { color: T.textSecondary }]}>
          লোড হচ্ছে...
        </Text>
      </View>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const reports = [
    {
      icon: "calendar-outline",
      label: "দৈনিক রিপোর্ট",
      color: T.accent,
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
      color: T.danger,
      screen: "CustomerDueReport",
      params: undefined,
    },
    {
      icon: "card-outline",
      label: "খরচ রিপোর্ট",
      color: T.warning,
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
      style={[styles.container, { backgroundColor: T.bg }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats();
          }}
          colors={[T.accent]}
          tintColor={T.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Banner ── */}
      <View style={[styles.heroBanner, { backgroundColor: T.heroBg }]}>
        <View>
          <Text style={[styles.heroGreeting, { color: T.heroSubText }]}>
            স্বাগতম 👋
          </Text>
          <Text style={[styles.heroTitle, { color: T.heroText }]}>
            PonaTrack
          </Text>
          <Text style={[styles.heroSub, { color: T.heroSubText }]}>
            পোনা ব্যবসা ম্যানেজমেন্ট
          </Text>
        </View>
        <View style={styles.heroRight}>
          {(s?.activeBatches ?? 0) > 0 && (
            <TouchableOpacity
              style={[
                styles.activePill,
                { backgroundColor: "rgba(108,99,255,0.18)" },
              ]}
              onPress={() => navigation.navigate("Batches")}
            >
              <View style={styles.activeDot} />
              <Text style={[styles.activePillText, { color: T.heroText }]}>
                {s!.activeBatches} ব্যাচ চলছে
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.notifBtn,
              { backgroundColor: "rgba(108,99,255,0.18)" },
            ]}
            onPress={() => navigation.navigate("NotificationScreen")}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={T.heroText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Floating Profit Card ── */}
      <View
        style={[
          styles.profitCard,
          { backgroundColor: T.surface, shadowColor: T.shadow },
        ]}
      >
        <View style={styles.profitLeft}>
          <Text style={[styles.profitLabel, { color: T.textSecondary }]}>
            মোট লাভ / ক্ষতি
          </Text>
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
        <View style={[styles.profitDivider, { backgroundColor: T.border }]} />
        <View style={styles.profitRight}>
          <View style={styles.profitMini}>
            <Text style={[styles.profitMiniLabel, { color: T.textMuted }]}>
              মোট বিক্রয়
            </Text>
            <Text style={[styles.profitMiniVal, { color: T.textPrimary }]}>
              {formatCurrency(s?.totalSales || 0)}
            </Text>
          </View>
          <View
            style={[styles.profitMiniDivider, { backgroundColor: T.border }]}
          />
          <View style={styles.profitMini}>
            <Text style={[styles.profitMiniLabel, { color: T.textMuted }]}>
              মোট খরচ
            </Text>
            <Text style={[styles.profitMiniVal, { color: T.textPrimary }]}>
              {formatCurrency(s?.totalExpenses || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <SectionHeader title="দ্রুত কার্যক্রম" />
        <View style={styles.quickRow}>
          <QuickAction
            icon="add-circle-outline"
            label="নতুন অর্ডার"
            color={T.accent}
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
            color={T.warning}
            onPress={() => navigation.navigate("AddExpense")}
          />
          <QuickAction
            icon="lock-closed-outline"
            label="হিসাব বন্ধ"
            color={T.danger}
            onPress={() => navigation.navigate("DailyClosing")}
          />
        </View>
      </View>

      {/* ── Key Stats 2×2 ── */}
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
            color={T.accent}
            bg={T.successSoft}
            onPress={() => navigation.navigate("Orders")}
          />
          <MiniCard
            title="PL ডেলিভারি"
            value={formatNumber(s?.totalPLDelivered || 0)}
            icon="fish-outline"
            color="#1E88E5"
            bg="#1E88E518"
            onPress={() => navigation.navigate("Batches")}
          />
          <MiniCard
            title="সংগ্রহ"
            value={formatCurrency(s?.totalCollections || 0)}
            icon="cash-outline"
            color="#43A047"
            bg="#43A04718"
          />
          <MiniCard
            title="মোট বাকি"
            value={formatCurrency(s?.totalDue || 0)}
            icon="alert-circle-outline"
            color={T.danger}
            bg={T.dangerSoft}
            onPress={() => navigation.navigate("CustomerDueReport")}
          />
        </View>
      </View>

      {/* ── Mir Row ── */}
      <View style={styles.section}>
        <SectionHeader title="মীর / শর্টেজ" />
        <View style={styles.mirRow}>
          <WideCard
            title="কোম্পানি মীর"
            value={formatNumber(s?.totalCompanyMir || 0)}
            sub="মোট ঘাটতি"
            icon="cube-outline"
            color="#7B1FA2"
            bg="#7B1FA218"
          />
          <WideCard
            title="কাউন্টিং মীর"
            value={formatNumber(s?.totalCountingMir || 0)}
            sub="গণনা পার্থক্য"
            icon="calculator-outline"
            color="#00838F"
            bg="#00838F18"
          />
        </View>
      </View>

      {/* ── Chart ── */}
      {s?.dailySales && s.dailySales.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="দৈনিক বিক্রয় (শেষ ৭ দিন)"
            actionLabel="রিপোর্ট"
            onAction={() => navigation.navigate("Reports")}
          />
          <View
            style={[
              styles.chartCard,
              { backgroundColor: T.surface, shadowColor: T.shadow },
            ]}
          >
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

      {/* ── Report Shortcuts 2×3 ── */}
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

// ─── Styles (color-neutral) ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Loading
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { marginTop: 10, fontWeight: "600" },

  // Hero
  heroBanner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroGreeting: { fontSize: 12, fontWeight: "500" },
  heroTitle: { fontSize: 26, fontWeight: "900" },
  heroSub: { fontSize: 11, marginTop: 1 },
  heroRight: { alignItems: "flex-end", gap: 8 },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
  activePillText: { fontSize: 11, fontWeight: "700" },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profit card
  profitCard: {
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  profitLeft: { flex: 1, gap: 6 },
  profitLabel: { fontSize: 11, fontWeight: "500" },
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
  profitDivider: { width: 1, height: "80%", marginHorizontal: 14 },
  profitRight: { gap: 8 },
  profitMini: { alignItems: "flex-end" },
  profitMiniLabel: { fontSize: 10 },
  profitMiniVal: { fontSize: 13, fontWeight: "800" },
  profitMiniDivider: { height: 1 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  sectionAction: { fontSize: 12, fontWeight: "700" },

  // Quick actions
  quickRow: { flexDirection: "row", gap: 8 },
  quickBtn: { flex: 1, alignItems: "center", gap: 6 },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },

  // Mini cards
  miniGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniCard: {
    borderRadius: 14,
    padding: 14,
    elevation: 2,
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
  miniCardTitle: { fontSize: 11, fontWeight: "500", marginBottom: 4 },
  miniCardValue: { fontSize: 17, fontWeight: "900" },

  // Wide cards (Mir)
  mirRow: { gap: 10 },
  wideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 2,
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
  wideCardTitle: { fontSize: 11, fontWeight: "500" },
  wideCardValue: { fontSize: 19, fontWeight: "900", marginTop: 2 },
  wideCardSub: { fontSize: 11, marginTop: 1 },

  // Chart
  chartCard: {
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: "hidden",
  },

  // Report cards
  reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reportCard: {
    borderRadius: 14,
    padding: 14,
    elevation: 2,
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
  reportCardLabel: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  reportCardArrow: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
