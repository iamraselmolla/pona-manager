// src/screens/expenses/ExpenseListScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { expenseAPI } from "../../api/services";
import { Expense, ExpenseCategory } from "../../types";
import { COLORS, EXPENSE_CATEGORIES } from "../../constants";
import { formatCurrency, formatDate } from "../../utils/helpers";

const CATEGORY_ICONS: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> =
  {
    Transport: "car-outline",
    Labor: "people-outline",
    Oxygen: "water-outline",
    Packaging: "cube-outline",
    Food: "restaurant-outline",
    Others: "ellipsis-horizontal-circle-outline",
  };

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Transport: COLORS.info,
  Labor: COLORS.warning,
  Oxygen: "#00ACC1",
  Packaging: "#8E24AA",
  Food: COLORS.danger,
  Others: COLORS.textSecondary,
};

export const ExpenseListScreen = () => {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await expenseAPI.getAll({
        category: categoryFilter || undefined,
      });
      setExpenses(res.data.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await expenseAPI.delete(id);
          setExpenses((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header with total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={["", ...EXPENSE_CATEGORIES]}
        keyExtractor={(item) => item || "all"}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: 8,
          gap: 8,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterBtn,
              categoryFilter === item && styles.filterBtnActive,
            ]}
            onPress={() => setCategoryFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                categoryFilter === item && styles.filterTextActive,
              ]}
            >
              {item || "All"}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchExpenses();
              }}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => {
            const color =
              CATEGORY_COLORS[item.category] || COLORS.textSecondary;
            const icon =
              CATEGORY_ICONS[item.category] ||
              "ellipsis-horizontal-circle-outline";
            return (
              <View style={styles.expenseCard}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: color + "20" },
                  ]}
                >
                  <Ionicons name={icon} size={22} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.expenseDate}>
                    {formatDate(item.date)}
                  </Text>
                  {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={styles.amount}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("AddExpense", {
                          expenseId: item.id,
                        })
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={COLORS.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="wallet-outline"
                size={60}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          }
          contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddExpense")}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  totalCard: {
    backgroundColor: COLORS.primary,
    margin: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  totalLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  totalValue: { fontSize: 28, fontWeight: "900", color: COLORS.white },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  expenseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  category: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  expenseDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  notes: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  amount: { fontSize: 16, fontWeight: "800", color: COLORS.danger },
  actionBtns: { flexDirection: "row", gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
