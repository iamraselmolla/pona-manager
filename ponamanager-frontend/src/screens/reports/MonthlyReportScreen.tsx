// src/screens/reports/MonthlyReportScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Animated,
  useColorScheme,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { reportAPI } from "../../api/services";
import { formatCurrency } from "../../utils/helpers";
import dayjs from "dayjs";

const { width } = Dimensions.get("window");

// ─── Palettes ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F9FAFB",
  border: "rgba(0,0,0,0.07)",
  textPrimary: "#0D1117",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accent: "#6C63FF",
  accentSoft: "rgba(108,99,255,0.10)",
  danger: "#F03F5F",
  dangerSoft: "rgba(240,63,95,0.09)",
  success: "#18B565",
  successSoft: "rgba(24,181,101,0.10)",
  warning: "#E09400",
  warningSoft: "rgba(224,148,0,0.10)",
  info: "#0EA5E9",
  infoSoft: "rgba(14,165,233,0.10)",
  white: "#FFFFFF",
  shadow: "#000",
  heroBg: "#6C63FF",
  heroText: "#FFFFFF",
  heroSub: "rgba(255,255,255,0.70)",
};
const DARK = {
  bg: "#0F1117",
  surface: "#1A1D27",
  surfaceAlt: "#21253A",
  border: "rgba(255,255,255,0.07)",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  accent: "#6C63FF",
  accentSoft: "rgba(108,99,255,0.15)",
  danger: "#FF5E7E",
  dangerSoft: "rgba(255,94,126,0.12)",
  success: "#2ECC71",
  successSoft: "rgba(46,204,113,0.12)",
  warning: "#F0A500",
  warningSoft: "rgba(240,165,0,0.12)",
  info: "#3B9EFF",
  infoSoft: "rgba(59,158,255,0.12)",
  white: "#FFFFFF",
  shadow: "#000",
  heroBg: "#1A1D27",
  heroText: "#F0F2FF",
  heroSub: "rgba(240,242,255,0.50)",
};
const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Animated number display ───────────────────────────────────────────────────
const useCountUp = (target: number, duration = 900) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [target]);
  return display;
};

// ─── Section title with dot accent ────────────────────────────────────────────
const SectionTitle = ({
  children,
  accent,
}: {
  children: string;
  accent: string;
}) => {
  const T = useTheme();
  return (
    <View style={sStyles.sectionTitleRow}>
      <View style={[sStyles.sectionDot, { backgroundColor: accent }]} />
      <Text style={[sStyles.sectionTitleText, { color: T.textPrimary }]}>
        {children}
      </Text>
    </View>
  );
};

// ─── Big KPI card ──────────────────────────────────────────────────────────────
const KpiCard = ({
  label,
  value,
  icon,
  accent,
  soft,
  index = 0,
}: {
  label: string;
  value: string;
  icon: any;
  accent: string;
  soft: string;
  index?: number;
}) => {
  const T = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={[{ opacity: fade, transform: [{ translateY: slide }], flex: 1 }]}
    >
      <View
        style={[
          kStyles.card,
          {
            backgroundColor: T.surface,
            borderColor: T.border,
            shadowColor: T.shadow,
          },
        ]}
      >
        <View style={[kStyles.iconWrap, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text style={[kStyles.label, { color: T.textMuted }]}>{label}</Text>
        <Text
          style={[kStyles.value, { color: accent }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Pona breakdown card ───────────────────────────────────────────────────────
const PonaCard = ({
  title,
  subtitle,
  color,
  pl,
  sales,
  profit,
  successColor,
  dangerColor,
  index = 0,
}: any) => {
  const T = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        delay: 200 + index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 320,
        delay: 200 + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const profitColor = profit >= 0 ? successColor : dangerColor;

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      <View
        style={[
          pStyles.card,
          {
            backgroundColor: T.surface,
            borderColor: T.border,
            shadowColor: T.shadow,
          },
        ]}
      >
        {/* Left bar */}
        <View style={[pStyles.bar, { backgroundColor: color }]} />

        <View style={pStyles.inner}>
          {/* Header */}
          <View style={pStyles.header}>
            <View
              style={[
                pStyles.titleDot,
                { backgroundColor: color + "22", borderColor: color + "44" },
              ]}
            >
              <Text style={[pStyles.titleEmoji]}>🦐</Text>
            </View>
            <View>
              <Text style={[pStyles.title, { color: T.textPrimary }]}>
                {title}
              </Text>
              <Text style={[pStyles.subtitle, { color: color }]}>
                {subtitle}
              </Text>
            </View>
            <View
              style={[
                pStyles.plBadge,
                { backgroundColor: color + "18", borderColor: color + "44" },
              ]}
            >
              <Text style={[pStyles.plBadgeText, { color }]}>
                {pl.toLocaleString()} PL
              </Text>
            </View>
          </View>

          {/* Metrics row */}
          <View style={pStyles.metrics}>
            <View style={pStyles.metricItem}>
              <Text style={[pStyles.metricLabel, { color: T.textMuted }]}>
                বিক্রয়
              </Text>
              <Text style={[pStyles.metricValue, { color }]}>
                {formatCurrency(sales)}
              </Text>
            </View>
            <View
              style={[pStyles.metricDivider, { backgroundColor: T.border }]}
            />
            <View style={pStyles.metricItem}>
              <Text style={[pStyles.metricLabel, { color: T.textMuted }]}>
                লাভ / ক্ষতি
              </Text>
              <Text style={[pStyles.metricValue, { color: profitColor }]}>
                {profit >= 0 ? "+" : ""}
                {formatCurrency(profit)}
              </Text>
            </View>
            <View
              style={[pStyles.metricDivider, { backgroundColor: T.border }]}
            />
            <View style={pStyles.metricItem}>
              <Text style={[pStyles.metricLabel, { color: T.textMuted }]}>
                অবস্থা
              </Text>
              <View
                style={[
                  pStyles.statusChip,
                  { backgroundColor: profitColor + "18" },
                ]}
              >
                <Ionicons
                  name={profit >= 0 ? "trending-up" : "trending-down"}
                  size={11}
                  color={profitColor}
                />
                <Text style={[pStyles.statusText, { color: profitColor }]}>
                  {profit >= 0 ? "লাভ" : "ক্ষতি"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Horizontal stat row (commission / mir) ────────────────────────────────────
const StatRow = ({ label, value, accent, soft, icon }: any) => {
  const T = useTheme();
  return (
    <View style={[rStyles.row, { borderBottomColor: T.border }]}>
      <View style={[rStyles.iconWrap, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={14} color={accent} />
      </View>
      <Text style={[rStyles.label, { color: T.textSecondary }]}>{label}</Text>
      <Text style={[rStyles.value, { color: accent }]}>{value}</Text>
    </View>
  );
};

// ─── Profit headline hero ──────────────────────────────────────────────────────
const ProfitHero = ({ profit, sales, expenses, T }: any) => {
  const isProfit = profit >= 0;
  const color = isProfit ? "#00C853" : "#FF1744";

  return (
    <View style={[hStyles.wrap, { backgroundColor: T.heroBg }]}>
      {/* Decorative blobs */}
      <View style={hStyles.blob1} />
      <View style={hStyles.blob2} />

      <Text style={[hStyles.label, { color: T.heroSub }]}>
        মাসিক লাভ / ক্ষতি
      </Text>
      <Text style={[hStyles.value, { color }]}>
        {isProfit ? "+" : ""}
        {formatCurrency(profit)}
      </Text>

      <View style={[hStyles.badge, { backgroundColor: color + "22" }]}>
        <Ionicons
          name={isProfit ? "trending-up" : "trending-down"}
          size={14}
          color={color}
        />
        <Text style={[hStyles.badgeText, { color }]}>
          {isProfit ? "লাভজনক মাস" : "ক্ষতির মাস"}
        </Text>
      </View>

      {/* Mini stats */}
      <View style={hStyles.miniRow}>
        <View style={hStyles.miniItem}>
          <Text style={[hStyles.miniLabel, { color: T.heroSub }]}>
            মোট বিক্রয়
          </Text>
          <Text style={[hStyles.miniVal, { color: T.heroText }]}>
            {formatCurrency(sales)}
          </Text>
        </View>
        <View style={[hStyles.miniDivider]} />
        <View style={hStyles.miniItem}>
          <Text style={[hStyles.miniLabel, { color: T.heroSub }]}>মোট খরচ</Text>
          <Text style={[hStyles.miniVal, { color: T.heroText }]}>
            {formatCurrency(expenses)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const MonthlyReportScreen = () => {
  const T = useRoute<any>() as any; // just to avoid redeclaration
  const route = useRoute<any>();
  const theme = useTheme();
  const { month } = route.params;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const [year, monthNum] = month.split("-");
    reportAPI
      .getMonthly(monthNum, year)
      .then((res) => {
        setReport(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month]);

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          লোড হচ্ছে...
        </Text>
      </View>
    );

  if (!report)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.emptyIconWrap,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons
            name="bar-chart-outline"
            size={40}
            color={theme.textMuted}
          />
        </View>
        <Text style={[styles.errorText, { color: theme.textMuted }]}>
          কোনো ডেটা পাওয়া যায়নি
        </Text>
      </View>
    );

  const {
    totalGoldaPL = 0,
    totalGoldaSales = 0,
    totalGoldaProfit = 0,
    totalBagdaPL = 0,
    totalBagdaSales = 0,
    totalBagdaProfit = 0,
    totalVannameiPL = 0,
    totalVannameiSales = 0,
    totalVannameiProfit = 0,
    totalExpenses = 0,
    totalCompanyMir = 0,
    totalCountingMir = 0,
    totalCompanyCommission = 0,
    totalReceivedCommission = 0,
    totalProfit = 0,
    totalSales = 0,
    totalOrders = 0,
  } = report;

  const formattedMonth = dayjs(month).format("MMMM YYYY");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Month Header ── */}
      <View style={[styles.monthHeader, { backgroundColor: theme.heroBg }]}>
        <View style={styles.monthHeaderBlob1} />
        <View style={styles.monthHeaderBlob2} />
        <View style={styles.monthHeaderContent}>
          <View style={styles.monthChip}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.monthChipText}>{formattedMonth}</Text>
          </View>
          <Text style={styles.monthTitle}>মাসিক রিপোর্ট</Text>
          <Text style={styles.monthSub}>Monthly Summary Report</Text>
        </View>

        {/* Order count pill */}
        <View style={styles.orderPill}>
          <Text style={styles.orderPillNum}>{totalOrders}</Text>
          <Text style={styles.orderPillLabel}>অর্ডার</Text>
        </View>
      </View>

      {/* ── Profit hero (floats out of header) ── */}
      <View style={styles.profitHeroWrap}>
        <ProfitHero
          profit={totalProfit}
          sales={totalSales}
          expenses={totalExpenses}
          T={theme}
        />
      </View>

      {/* ── KPI grid ── */}
      <View style={styles.section}>
        <SectionTitle accent={theme.accent}>সামগ্রিক সারসংক্ষেপ</SectionTitle>
        <View style={styles.kpiRow}>
          <KpiCard
            label="মোট বিক্রয়"
            value={formatCurrency(totalSales)}
            icon="cash-outline"
            accent={theme.accent}
            soft={theme.accentSoft}
            index={0}
          />
          <KpiCard
            label="মোট খরচ"
            value={formatCurrency(totalExpenses)}
            icon="card-outline"
            accent={theme.warning}
            soft={theme.warningSoft}
            index={1}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            label="মোট অর্ডার"
            value={totalOrders.toString()}
            icon="receipt-outline"
            accent={theme.info}
            soft={theme.infoSoft}
            index={2}
          />
          <KpiCard
            label="মোট PL"
            value={(
              totalGoldaPL +
              totalBagdaPL +
              totalVannameiPL
            ).toLocaleString()}
            icon="fish-outline"
            accent="#F5A623"
            soft="#F5A62318"
            index={3}
          />
        </View>
      </View>

      {/* ── Pona breakdown ── */}
      <View style={styles.section}>
        <SectionTitle accent="#F5A623">পোনা প্রকার বিশ্লেষণ</SectionTitle>
        <View style={styles.ponaList}>
          <PonaCard
            title="গলদা পোনা"
            subtitle="Golda PL"
            color="#F5A623"
            pl={totalGoldaPL}
            sales={totalGoldaSales}
            profit={totalGoldaProfit}
            successColor={theme.success}
            dangerColor={theme.danger}
            index={0}
          />
          <PonaCard
            title="বাগদা পোনা"
            subtitle="Bagda PL"
            color="#1E88E5"
            pl={totalBagdaPL}
            sales={totalBagdaSales}
            profit={totalBagdaProfit}
            successColor={theme.success}
            dangerColor={theme.danger}
            index={1}
          />
          <PonaCard
            title="ভানামেই পোনা"
            subtitle="Vannamei PL"
            color="#43A047"
            pl={totalVannameiPL}
            sales={totalVannameiSales}
            profit={totalVannameiProfit}
            successColor={theme.success}
            dangerColor={theme.danger}
            index={2}
          />
        </View>
      </View>

      {/* ── Operational metrics ── */}
      <View style={styles.section}>
        <SectionTitle accent={theme.info}>অপারেশনাল মেট্রিক্স</SectionTitle>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <StatRow
            label="কোম্পানি মীর"
            value={totalCompanyMir.toLocaleString()}
            accent={theme.info}
            soft={theme.infoSoft}
            icon="cube-outline"
          />
          <StatRow
            label="কাউন্টিং মীর"
            value={totalCountingMir.toLocaleString()}
            accent={theme.accent}
            soft={theme.accentSoft}
            icon="calculator-outline"
          />
        </View>
      </View>

      {/* ── Commission ── */}
      <View style={styles.section}>
        <SectionTitle accent={theme.success}>কমিশন</SectionTitle>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <StatRow
            label="প্রদেয় কমিশন"
            value={formatCurrency(totalCompanyCommission)}
            accent={theme.danger}
            soft={theme.dangerSoft}
            icon="arrow-up-circle-outline"
          />
          <StatRow
            label="প্রাপ্ত কমিশন"
            value={formatCurrency(totalReceivedCommission)}
            accent={theme.success}
            soft={theme.successSoft}
            icon="arrow-down-circle-outline"
          />
        </View>
      </View>

      {/* ── Action row ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.accent }]}
          onPress={() =>
            Share.share({ message: `Monthly Report - ${formattedMonth}` })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={17} color="#fff" />
          <Text style={styles.actionBtnText}>শেয়ার</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
            },
          ]}
          onPress={() => console.log("Export PDF")}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={17} color={theme.accent} />
          <Text style={[styles.actionBtnText, { color: theme.accent }]}>
            এক্সপোর্ট
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── Style groups ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { fontSize: 13 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  errorText: { fontSize: 15 },

  // Month header
  monthHeader: {
    height: 140,
    overflow: "hidden",
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  monthHeaderBlob1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    right: -40,
  },
  monthHeaderBlob2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    left: 30,
  },
  monthHeaderContent: { paddingHorizontal: 20 },
  monthChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  monthChipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  monthSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  orderPill: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  orderPillNum: { fontSize: 20, fontWeight: "900", color: "#fff" },
  orderPillLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)" },

  // Profit hero wrapper
  profitHeroWrap: {
    marginHorizontal: 16,
    marginTop: -18,
    marginBottom: 6,
    zIndex: 10,
  },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 22 },

  // KPI grid
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 10 },

  // Pona list
  ponaList: { gap: 10 },

  // Stat card container
  statCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1 },

  // Action row
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 22,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    paddingVertical: 13,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

// Section title styles
const sStyles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});

// KPI card styles
const kStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  label: { fontSize: 11, fontWeight: "500", marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
});

// Pona card styles
const pStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  bar: { width: 5 },
  inner: { flex: 1, padding: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  titleDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  titleEmoji: { fontSize: 18 },
  title: { fontSize: 14, fontWeight: "700" },
  subtitle: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  plBadge: {
    marginLeft: "auto",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  plBadgeText: { fontSize: 12, fontWeight: "800" },
  metrics: { flexDirection: "row", alignItems: "center" },
  metricItem: { flex: 1, alignItems: "center" },
  metricDivider: { width: 1, height: 32 },
  metricLabel: { fontSize: 10, fontWeight: "500", marginBottom: 4 },
  metricValue: { fontSize: 13, fontWeight: "800" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
});

// Stat row styles
const rStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: 13, fontWeight: "500" },
  value: { fontSize: 14, fontWeight: "800" },
});

// Profit hero styles
const hStyles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    padding: 20,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  blob1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -50,
    right: -30,
  },
  blob2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    left: -10,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 18,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  miniRow: { flexDirection: "row", alignItems: "center" },
  miniItem: { flex: 1 },
  miniDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 16,
  },
  miniLabel: { fontSize: 10, marginBottom: 3 },
  miniVal: { fontSize: 14, fontWeight: "800" },
});
