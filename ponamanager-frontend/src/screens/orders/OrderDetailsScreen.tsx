// src/screens/orders/OrderDetailsScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { orderAPI } from "../../api/services";
import { Order } from "../../types";
import { ORDER_STATUS } from "../../constants";
import {
  formatCurrency,
  formatDate,
  getPonaTypeColor,
} from "../../utils/helpers";

// ─── Theme ────────────────────────────────────────────────────────────────────
const lightTheme = {
  bg: "#F5F4F0",
  surface: "#FFFFFF",
  surface2: "#F0EEE9",
  text: "#1A1916",
  text2: "#6B6A65",
  text3: "#A8A7A2",
  border: "rgba(26,25,22,0.09)",
  border2: "rgba(26,25,22,0.16)",
  accent: "#1E5FCC",
  accentBg: "#EAF1FC",
  success: "#15803D",
  successBg: "#F0FBF4",
  danger: "#B91C1C",
  dangerBg: "#FEF2F2",
  warning: "#B45309",
  warningBg: "#FEF9EE",
};

const darkTheme = {
  bg: "#111110",
  surface: "#1C1C1B",
  surface2: "#252523",
  text: "#F0EDE8",
  text2: "#9A9892",
  text3: "#5C5B57",
  border: "rgba(240,237,232,0.08)",
  border2: "rgba(240,237,232,0.15)",
  accent: "#6096F0",
  accentBg: "#0F1F3A",
  success: "#4ADE80",
  successBg: "#052010",
  danger: "#F87171",
  dangerBg: "#200A0A",
  warning: "#FBD073",
  warningBg: "#1C1000",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEFAULT_STATUS = { label: "Unknown", bg: "#F3F4F6", color: "#6B7280" };
const getSafeStatus = (s: string) =>
  (
    ORDER_STATUS as Record<string, { label: string; bg: string; color: string }>
  )[s] ?? DEFAULT_STATUS;

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader = ({
  label,
  theme,
}: {
  label: string;
  theme: typeof lightTheme;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
      gap: 10,
    }}
  >
    <Text
      style={{
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: theme.text3,
      }}
    >
      {label}
    </Text>
    <View
      style={{
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border2,
      }}
    />
  </View>
);

const InfoRow = ({
  icon,
  label,
  value,
  valueColor,
  valueFontSize = 13,
  last = false,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  valueFontSize?: number;
  last?: boolean;
  theme: typeof lightTheme;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon} size={15} color={theme.text3} />
      <Text style={{ fontSize: 13, color: theme.text2 }}>{label}</Text>
    </View>
    <Text
      style={{
        fontSize: valueFontSize,
        fontWeight: valueFontSize > 13 ? "700" : "600",
        color: valueColor ?? theme.text,
        maxWidth: 190,
        textAlign: "right",
      }}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const OrderDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    orderAPI
      .getById(orderId)
      .then((res) => {
        setOrder(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert("Error", "Failed to load order");
        navigation.goBack();
      });
  }, [orderId]);

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await orderAPI.cancel(orderId);
            setOrder((prev) =>
              prev ? { ...prev, status: "cancelled" } : null,
            );
          } catch {
            Alert.alert("Error", "Failed to cancel order");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!order) return null;

  const status = getSafeStatus(order.status);
  const typeColor = getPonaTypeColor(order.ponaType) ?? theme.accent;
  const isDue = (order.dueAmount ?? 0) > 0;
  const canAct = order.status !== "cancelled" && order.status !== "delivered";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* ── Top Bar ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: theme.text2,
            letterSpacing: 0.3,
          }}
        >
          Order Details
        </Text>
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 14,
            backgroundColor: theme.surface,
            borderRadius: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          {/* Type color stripe */}
          <View style={{ height: 5, backgroundColor: typeColor }} />

          <View style={{ padding: 20 }}>
            {/* Badges row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: typeColor + "18",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: typeColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: typeColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  {order.ponaType}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: status.bg,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: status.color,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: status.color,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  {status.label}
                </Text>
              </View>
            </View>

            {/* Quantity — hero number */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 52,
                  fontWeight: "900",
                  color: theme.text,
                  letterSpacing: -2,
                  lineHeight: 56,
                }}
              >
                {(order.plQuantity ?? 0).toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "500",
                  color: theme.text2,
                  marginBottom: 4,
                }}
              >
                PL
              </Text>
            </View>

            {/* Customer */}
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: theme.text,
                marginBottom: 3,
              }}
            >
              {order.customerName}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <Ionicons name="call-outline" size={13} color={theme.text3} />
              <Text style={{ fontSize: 13, color: theme.text3 }}>
                {order.customerMobile}
              </Text>
            </View>

            {/* Divider */}
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: theme.border,
                marginVertical: 16,
              }}
            />

            {/* Quick meta */}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: theme.text3,
                    marginBottom: 3,
                  }}
                >
                  Delivery
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
                >
                  {formatDate(order.deliveryDate)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: theme.text3,
                    marginBottom: 3,
                  }}
                >
                  Unit Rate
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
                >
                  {formatCurrency(order.unitRate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Order Information ── */}
        <SectionHeader label="Order Info" theme={theme} />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: theme.surface,
            borderRadius: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <InfoRow
            icon="location-outline"
            label="Address"
            value={order.customerAddress || "—"}
            theme={theme}
          />
          {order.notes ? (
            <InfoRow
              icon="document-text-outline"
              label="Notes"
              value={order.notes}
              valueColor={theme.text2}
              theme={theme}
            />
          ) : null}
          <InfoRow
            icon="receipt-outline"
            label="Total Price"
            value={formatCurrency(order.totalPrice)}
            valueColor={theme.accent}
            valueFontSize={15}
            last
            theme={theme}
          />
        </View>

        {/* ── Payment ── */}
        <SectionHeader label="Payment" theme={theme} />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: theme.surface,
            borderRadius: 16,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row" }}>
            {/* Advance */}
            <View
              style={{
                flex: 1,
                padding: 18,
                borderRightWidth: StyleSheet.hairlineWidth,
                borderRightColor: theme.border,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: theme.text3,
                  marginBottom: 6,
                }}
              >
                Advance Paid
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: theme.success,
                }}
              >
                {formatCurrency(order.advanceAmount)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.text3, marginTop: 2 }}>
                Received
              </Text>
            </View>
            {/* Due */}
            <View style={{ flex: 1, padding: 18 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: theme.text3,
                  marginBottom: 6,
                }}
              >
                Due Amount
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: isDue ? theme.danger : theme.success,
                }}
              >
                {formatCurrency(order.dueAmount)}
              </Text>
              <Text style={{ fontSize: 11, color: theme.text3, marginTop: 2 }}>
                {isDue ? "Outstanding" : "Cleared"}
              </Text>
            </View>
          </View>

          {/* Due warning banner */}
          {isDue && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: theme.dangerBg,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.border,
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color={theme.danger}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: theme.danger,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {formatCurrency(order.dueAmount)} due before delivery
              </Text>
            </View>
          )}
        </View>

        {/* ── Actions ── */}
        {canAct && (
          <>
            <SectionHeader label="Actions" theme={theme} />
            <View style={{ marginHorizontal: 16, gap: 10 }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("DeliveryEntry", { orderId })
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: theme.accent,
                  borderRadius: 16,
                  paddingVertical: 16,
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="boat-outline" size={18} color="#FFFFFF" />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}
                >
                  Record Delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderWidth: 1.5,
                  borderColor: theme.danger,
                  borderRadius: 16,
                  paddingVertical: 14,
                  backgroundColor: "transparent",
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={theme.danger}
                />
                <Text
                  style={{
                    color: theme.danger,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Cancel Order
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Footer meta ── */}
        <View style={{ alignItems: "center", paddingTop: 24, gap: 3 }}>
          <Text style={{ fontSize: 11, color: theme.text3 }}>
            Order ID: {order.id}
          </Text>
          <Text style={{ fontSize: 11, color: theme.text3 }}>
            Created: {formatDate(order.createdAt)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
