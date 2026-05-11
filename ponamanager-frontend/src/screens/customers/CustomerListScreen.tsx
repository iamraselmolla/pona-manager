// src/screens/customers/CustomerListScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { customerAPI } from "../../api/services";
import { Customer } from "../../types";
import { formatCurrency } from "../../utils/helpers";

// ─── Theme: always light by default; gracefully adapts if system is dark ───────
const LIGHT = {
  bg: "#F5F6FA",
  surface: "#FFFFFF",
  surfaceRaised: "#FAFBFF",
  border: "rgba(0,0,0,0.07)",
  accent: "#6C63FF",
  accentSoft: "rgba(108,99,255,0.10)",
  danger: "#F03F5F",
  dangerSoft: "rgba(240,63,95,0.09)",
  success: "#18B565",
  successSoft: "rgba(24,181,101,0.10)",
  warning: "#E09400",
  warningSoft: "rgba(224,148,0,0.10)",
  teal: "#00A896",
  tealSoft: "rgba(0,168,150,0.10)",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  white: "#FFFFFF",
  shadow: "rgba(0,0,0,0.06)",
};

// Minimal dark fallback — only used when system forces dark mode
const DARK = {
  bg: "#0F1117",
  surface: "#1A1D27",
  surfaceRaised: "#21253A",
  border: "rgba(255,255,255,0.07)",
  accent: "#6C63FF",
  accentSoft: "rgba(108,99,255,0.15)",
  danger: "#FF5E7E",
  dangerSoft: "rgba(255,94,126,0.12)",
  success: "#2ECC71",
  successSoft: "rgba(46,204,113,0.12)",
  warning: "#F0A500",
  warningSoft: "rgba(240,165,0,0.12)",
  teal: "#00C9A7",
  tealSoft: "rgba(0,201,167,0.12)",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  textMuted: "#545872",
  white: "#FFFFFF",
  shadow: "rgba(0,0,0,0.30)",
};

// Hook — always returns LIGHT unless the device OS theme is dark
const usePalette = () => {
  const scheme = useColorScheme();
  return scheme === "dark" ? DARK : LIGHT;
};

// Deterministic avatar color per initial letter — vivid, works on both light & dark
const AVATAR_COLORS = [
  "#6C63FF",
  "#F03F5F",
  "#00A896",
  "#E09400",
  "#3B82F6",
  "#D946A8",
  "#18B565",
  "#E07B39",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) ?? 65) % AVATAR_COLORS.length];

// ─── Customer Card ─────────────────────────────────────────────────────────────
type Palette = typeof LIGHT;

const CustomerItem = ({
  customer,
  onPress,
  index,
  P,
}: {
  customer: Customer;
  onPress: () => void;
  index: number;
  P: Palette;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const avatarColor = getAvatarColor(customer.name ?? "A");
  const initial = (customer.name ?? "?")[0].toUpperCase();
  const hasDue = (customer.totalDue ?? 0) > 0;
  const location = customer.area || customer.address;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: P.surface,
            borderColor: P.border,
            shadowColor: P.shadow,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        {/* Left accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: avatarColor }]} />

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor + "18" }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>
            {initial}
          </Text>
        </View>

        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.topRow}>
            <Text
              style={[styles.customerName, { color: P.textPrimary }]}
              numberOfLines={1}
            >
              {customer.name}
            </Text>
            <View style={styles.badgeRow}>
              {customer.hasRunningOrder && (
                <View
                  style={[
                    styles.runningBadge,
                    { backgroundColor: P.successSoft },
                  ]}
                >
                  <View
                    style={[styles.runningDot, { backgroundColor: P.success }]}
                  />
                  <Text style={[styles.runningText, { color: P.success }]}>
                    Active
                  </Text>
                </View>
              )}
              {hasDue && (
                <View
                  style={[styles.dueBadge, { backgroundColor: P.dangerSoft }]}
                >
                  <Ionicons name="alert-circle" size={9} color={P.danger} />
                  <Text style={[styles.dueText, { color: P.danger }]}>Due</Text>
                </View>
              )}
            </View>
          </View>

          {/* Mobile */}
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={11} color={P.textMuted} />
            <Text style={[styles.mobile, { color: P.textSecondary }]}>
              {customer.mobile}
            </Text>
          </View>

          {/* Location */}
          {!!location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={11} color={P.textMuted} />
              <Text
                style={[styles.area, { color: P.textMuted }]}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          )}

          {/* Footer: due amount */}
          {hasDue && (
            <>
              <View style={[styles.divider, { backgroundColor: P.border }]} />
              <View style={styles.dueRow}>
                <Text style={[styles.dueLabelText, { color: P.textMuted }]}>
                  Outstanding Due
                </Text>
                <Text style={[styles.dueAmountText, { color: P.danger }]}>
                  {formatCurrency(customer.totalDue)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Chevron */}
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={15} color={P.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const CustomerListScreen = () => {
  const P = usePalette();
  const navigation = useNavigation<any>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCustomers = useCallback(
    async (reset = false) => {
      try {
        const currentPage = reset ? 1 : page;
        const res = await customerAPI.getAll({
          search,
          page: currentPage,
          limit: 20,
        });
        const data = res?.data?.data;
        const rows: Customer[] = Array.isArray(data?.data) ? data.data : [];
        if (reset) {
          setCustomers(rows);
          setPage(2);
        } else {
          setCustomers((prev) => [...prev, ...rows]);
          setPage((p) => p + 1);
        }
        setHasMore((data?.page ?? 1) < (data?.totalPages ?? 1));
      } catch (e) {
        console.error("fetchCustomers error:", e);
        if (reset) setCustomers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [search, page],
  );

  useEffect(() => {
    setLoading(true);
    fetchCustomers(true);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers(true);
  };
  const onEndReached = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchCustomers();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: P.bg }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: P.textPrimary }]}>
            Customers
          </Text>
          <Text style={[styles.headerSub, { color: P.textMuted }]}>
            {customers.length}{" "}
            {customers.length === 1 ? "customer" : "customers"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: P.accent }]}
          onPress={() => navigation.navigate("AddEditCustomer")}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={17} color={P.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: P.surface, borderColor: P.border },
        ]}
      >
        <Ionicons name="search" size={16} color={P.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: P.textPrimary }]}
          placeholder="Search by name or mobile…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={P.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={P.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.accent} />
          <Text style={[styles.loadingText, { color: P.textMuted }]}>
            Loading customers…
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <CustomerItem
              customer={item}
              index={index}
              P={P}
              onPress={() =>
                navigation.navigate("CustomerDetails", { customerId: item.id })
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[P.accent]}
              tintColor={P.accent}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={P.accent} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: P.surface, borderColor: P.border },
                ]}
              >
                <Ionicons name="people-outline" size={44} color={P.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: P.textPrimary }]}>
                No customers found
              </Text>
              <Text style={[styles.emptySubtitle, { color: P.textMuted }]}>
                {search
                  ? `No results for "${search}"`
                  : "Add your first customer to get started"}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// ─── Styles (color-neutral — all theme colors applied inline) ─────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  accentStripe: { width: 4, alignSelf: "stretch" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
    marginVertical: 14,
    flexShrink: 0,
  },
  avatarText: { fontSize: 17, fontWeight: "800" },
  cardContent: { flex: 1, paddingLeft: 12, paddingVertical: 14 },
  chevronWrap: { paddingHorizontal: 12, justifyContent: "center" },

  // Card rows
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 4,
    marginBottom: 4,
  },
  customerName: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 8 },
  badgeRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  runningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  runningDot: { width: 6, height: 6, borderRadius: 3 },
  runningText: { fontSize: 10, fontWeight: "700" },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dueText: { fontSize: 10, fontWeight: "700" },

  // Info rows
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  mobile: { fontSize: 12 },
  area: { fontSize: 12, flex: 1 },

  // Due footer
  divider: { height: 1, marginTop: 10, marginBottom: 8, marginRight: 8 },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 8,
  },
  dueLabelText: { fontSize: 11 },
  dueAmountText: { fontSize: 14, fontWeight: "800" },

  // States
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13 },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },

  listContent: { padding: 16, flexGrow: 1 },
});
