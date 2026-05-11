// src/screens/reports/ReportsDashboardScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  textPrimary: "#0D1117",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  white: "#FFFFFF",
  shadow: "rgba(0,0,0,0.06)",
};
const DARK = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "rgba(255,255,255,0.07)",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  white: "#FFFFFF",
  shadow: "rgba(0,0,0,0.35)",
};
const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Accent palette ───────────────────────────────────────────────────────────
const ACCENTS = {
  violet: { main: "#6C63FF", soft: "rgba(108,99,255,0.10)" },
  rose: { main: "#F03F5F", soft: "rgba(240,63,95,0.10)" },
  amber: { main: "#E09400", soft: "rgba(224,148,0,0.10)" },
  sky: { main: "#0EA5E9", soft: "rgba(14,165,233,0.10)" },
  emerald: { main: "#18B565", soft: "rgba(24,181,101,0.10)" },
  teal: { main: "#0ABFA3", soft: "rgba(10,191,163,0.10)" },
};

// ─── Animated card ────────────────────────────────────────────────────────────
const ReportCard = ({
  icon,
  title,
  description,
  accent,
  tag,
  onPress,
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  accent: { main: string; soft: string };
  tag?: string;
  onPress: () => void;
  delay?: number;
}) => {
  const T = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: T.surface,
            borderColor: T.border,
            shadowColor: T.shadow,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Left accent bar */}
        <View style={[styles.cardBar, { backgroundColor: accent.main }]} />

        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: accent.soft }]}>
          <Ionicons name={icon} size={20} color={accent.main} />
        </View>

        {/* Text */}
        <View style={styles.cardText}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: T.textPrimary }]}>
              {title}
            </Text>
            {tag && (
              <View style={[styles.cardTag, { backgroundColor: accent.soft }]}>
                <Text style={[styles.cardTagText, { color: accent.main }]}>
                  {tag}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDesc, { color: T.textSecondary }]}>
            {description}
          </Text>
        </View>

        {/* Arrow */}
        <View style={[styles.cardArrow, { backgroundColor: accent.soft }]}>
          <Ionicons name="arrow-forward" size={13} color={accent.main} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Date picker row ──────────────────────────────────────────────────────────
const DateStepper = ({
  value,
  onChange,
  format,
  unit,
}: {
  value: string;
  onChange: (v: string) => void;
  format: string;
  unit: "day" | "month";
}) => {
  const T = useTheme();
  const prev = () => onChange(dayjs(value).subtract(1, unit).format(format));
  const next = () => onChange(dayjs(value).add(1, unit).format(format));

  return (
    <View
      style={[
        styles.stepper,
        { backgroundColor: T.surface, borderColor: T.border },
      ]}
    >
      <TouchableOpacity
        style={[styles.stepBtn, { borderColor: T.border }]}
        onPress={prev}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={16} color={T.textSecondary} />
      </TouchableOpacity>

      <TextInput
        style={[styles.stepInput, { color: T.textPrimary }]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={T.textMuted}
        textAlign="center"
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[styles.stepBtn, { borderColor: T.border }]}
        onPress={next}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={16} color={T.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  label,
  accent,
}: {
  label: string;
  accent: string;
}) => {
  const T = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: accent }]} />
      <Text style={[styles.sectionLabel, { color: T.textPrimary }]}>
        {label}
      </Text>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const ReportsDashboardScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: T.bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Hero header ── */}
      <View style={styles.hero}>
        <View
          style={[styles.heroIcon, { backgroundColor: ACCENTS.violet.soft }]}
        >
          <Ionicons
            name="analytics-outline"
            size={26}
            color={ACCENTS.violet.main}
          />
        </View>
        <View>
          <Text style={[styles.heroTitle, { color: T.textPrimary }]}>
            Reports
          </Text>
          <Text style={[styles.heroSub, { color: T.textMuted }]}>
            {dayjs().format("ddd, D MMM YYYY")}
          </Text>
        </View>
      </View>

      {/* ══════════════════════════════
          DAILY REPORTS
      ══════════════════════════════ */}
      <SectionHeader label="Daily Reports" accent={ACCENTS.violet.main} />

      <DateStepper
        value={selectedDate}
        onChange={setSelectedDate}
        format="YYYY-MM-DD"
        unit="day"
      />

      <TouchableOpacity
        style={[styles.goBtn, { backgroundColor: ACCENTS.violet.main }]}
        onPress={() =>
          navigation.navigate("DailyReport", { date: selectedDate })
        }
        activeOpacity={0.85}
      >
        <Ionicons name="calendar-outline" size={15} color="#fff" />
        <Text style={styles.goBtnText}>
          View Daily Report → {dayjs(selectedDate).format("D MMM")}
        </Text>
      </TouchableOpacity>

      <ReportCard
        icon="receipt-outline"
        title="Daily Sales"
        description="Full sales breakdown for the selected day"
        accent={ACCENTS.violet}
        tag="Daily"
        onPress={() =>
          navigation.navigate("DailyReport", { date: selectedDate })
        }
        delay={0}
      />
      <ReportCard
        icon="people-outline"
        title="Customer Due"
        description="Track all pending customer payments"
        accent={ACCENTS.rose}
        tag="Overdue"
        onPress={() => navigation.navigate("CustomerDueReport")}
        delay={60}
      />
      <ReportCard
        icon="card-outline"
        title="Expense Report"
        description="Itemised expenses by category"
        accent={ACCENTS.amber}
        onPress={() => navigation.navigate("ExpenseReport")}
        delay={120}
      />

      {/* ══════════════════════════════
          MONTHLY REPORTS
      ══════════════════════════════ */}
      <SectionHeader label="Monthly Reports" accent={ACCENTS.sky.main} />

      <DateStepper
        value={selectedMonth}
        onChange={setSelectedMonth}
        format="YYYY-MM"
        unit="month"
      />

      <TouchableOpacity
        style={[styles.goBtn, { backgroundColor: ACCENTS.sky.main }]}
        onPress={() =>
          navigation.navigate("MonthlyReport", { month: selectedMonth })
        }
        activeOpacity={0.85}
      >
        <Ionicons name="bar-chart-outline" size={15} color="#fff" />
        <Text style={styles.goBtnText}>
          View Monthly Report → {dayjs(selectedMonth).format("MMM YYYY")}
        </Text>
      </TouchableOpacity>

      <ReportCard
        icon="bar-chart-outline"
        title="Monthly Summary"
        description="Complete overview — orders, sales, collections"
        accent={ACCENTS.sky}
        tag="Summary"
        onPress={() =>
          navigation.navigate("MonthlyReport", { month: selectedMonth })
        }
        delay={0}
      />
      <ReportCard
        icon="trending-up-outline"
        title="Profit & Loss"
        description="Monthly P&L analysis with net margin"
        accent={ACCENTS.emerald}
        tag="P&L"
        onPress={() => navigation.navigate("ProfitLossReport")}
        delay={60}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 12, marginTop: 2 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  // Date stepper
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  stepBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "transparent",
  },
  stepInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 10,
  },

  // Go button
  goBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    paddingVertical: 12,
  },
  goBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Report card
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBar: { width: 4, alignSelf: "stretch" },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
    marginVertical: 14,
    flexShrink: 0,
  },
  cardText: { flex: 1, paddingLeft: 12, paddingVertical: 14 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardTag: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardDesc: { fontSize: 12 },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
  },
});
