// src/screens/customers/CustomerListScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { customerAPI } from "../../api/services";
import { Customer } from "../../types";
import { COLORS } from "../../constants";
import { formatCurrency } from "../../utils/helpers";

const CustomerItem = ({
  customer,
  onPress,
}: {
  customer: Customer;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.customerCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {customer.name.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <View style={styles.nameRow}>
        <Text style={styles.customerName}>{customer.name}</Text>
        <View style={styles.badges}>
          {customer.hasRunningOrder && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Running</Text>
            </View>
          )}
          {customer.totalDue > 0 && (
            <View style={[styles.badge, styles.dueBadge]}>
              <Text style={[styles.badgeText, { color: COLORS.danger }]}>
                Due
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.mobile}>{customer.mobile}</Text>
      <Text style={styles.area}>{customer.area || customer.address}</Text>
    </View>
    <View style={{ alignItems: "flex-end" }}>
      {customer.totalDue > 0 && (
        <Text style={styles.dueAmount}>
          {formatCurrency(customer.totalDue)}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </View>
  </TouchableOpacity>
);

export const CustomerListScreen = () => {
  const navigation = useNavigation<any>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCustomers = useCallback(
    async (reset = false) => {
      try {
        const currentPage = reset ? 1 : page;
        const res = await customerAPI.getAll({
          search,
          page: currentPage,
          limit: 20,
        });
        const data = res.data.data;
        if (reset) {
          setCustomers(data.data);
          setPage(2);
        } else {
          setCustomers((prev) => [...prev, ...data.data]);
          setPage((p) => p + 1);
        }
        setHasMore(data.page < data.totalPages);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, page],
  );

  useEffect(() => {
    fetchCustomers(true);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers(true);
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textMuted}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddEditCustomer")}
        >
          <Ionicons name="person-add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerItem
              customer={item}
              onPress={() =>
                navigation.navigate("CustomerDetails", { customerId: item.id })
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={() => hasMore && fetchCustomers()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="people-outline"
                size={60}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
          contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: { flexDirection: "row", padding: 12, gap: 10 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 10 },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  customerName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  badges: { flexDirection: "row", gap: 4 },
  badge: {
    backgroundColor: COLORS.successLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: COLORS.success },
  dueBadge: { backgroundColor: COLORS.dangerLight },
  mobile: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  area: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  dueAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.danger,
    marginBottom: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
});
