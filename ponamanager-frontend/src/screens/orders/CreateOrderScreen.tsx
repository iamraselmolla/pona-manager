// src/screens/orders/CreateOrderScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { customerAPI, orderAPI } from "../../api/services";
import { Customer, PonaType } from "../../types";
import { COLORS, PONA_TYPES } from "../../constants";
import { formatCurrency, formatDate } from "../../utils/helpers";
import dayjs from "dayjs";

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
  editable = true,
}: any) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={{ color: COLORS.danger }}> *</Text>}
    </Text>
    <TextInput
      style={[styles.input, !editable && styles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType || "default"}
      placeholderTextColor={COLORS.textMuted}
      editable={editable}
    />
  </View>
);

export const CreateOrderScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customerId: prefillCustomerId } = route.params || {};

  const [mobile, setMobile] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [ponaType, setPonaType] = useState<PonaType>("Golda PL");
  const [plQuantity, setPlQuantity] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    dayjs().add(1, "day").format("YYYY-MM-DD"),
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPrice =
    (parseFloat(plQuantity) || 0) * (parseFloat(unitRate) || 0);
  const dueAmount = Math.max(0, totalPrice - (parseFloat(advanceAmount) || 0));

  // Prefill if customerId provided
  useEffect(() => {
    if (prefillCustomerId) {
      customerAPI.getById(prefillCustomerId).then((res) => {
        const c = res.data.data;
        setCustomer(c);
        setMobile(c.mobile);
        setName(c.name);
        setAddress(c.address || "");
      });
    }
  }, []);

  const lookupMobile = async (mob: string) => {
    if (mob.length !== 11) return;
    setCustomerLoading(true);
    try {
      const res = await customerAPI.getByMobile(mob);
      const c = res.data.data;
      setCustomer(c);
      setName(c.name);
      setAddress(c.address || "");
      if (c.hasRunningOrder) {
        Alert.alert(
          "Warning",
          `${c.name} has a running order. Do you want to continue?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setMobile("");
                setCustomer(null);
                setName("");
                setAddress("");
              },
            },
            { text: "Continue", style: "default" },
          ],
        );
      }
    } catch {
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleMobileChange = (val: string) => {
    setMobile(val);
    if (val.length === 11) lookupMobile(val);
    if (val.length < 11) {
      setCustomer(null);
      setName("");
      setAddress("");
    }
  };

  const handleSubmit = async () => {
    if (!mobile || !name || !plQuantity || !unitRate || !deliveryDate) {
      Alert.alert("Validation", "Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customerId: customer?.id,
        customerName: name,
        customerMobile: mobile,
        customerAddress: address,
        ponaType,
        plQuantity: parseFloat(plQuantity),
        unitRate: parseFloat(unitRate),
        totalPrice,
        advanceAmount: parseFloat(advanceAmount) || 0,
        dueAmount,
        deliveryDate,
        notes,
      };
      await orderAPI.create(payload);
      Alert.alert("Success", "Order created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      navigation.navigate("OrdersList");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to create order",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Customer Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>
              Mobile Number <Text style={{ color: COLORS.danger }}>*</Text>
            </Text>
            <View style={styles.mobileRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={mobile}
                onChangeText={handleMobileChange}
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textMuted}
                maxLength={11}
              />
              {customerLoading && (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ position: "absolute", right: 12 }}
                />
              )}
              {customer && !customerLoading && (
                <View style={styles.foundBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={styles.foundText}>Found</Text>
                </View>
              )}
            </View>
          </View>

          {customer && (
            <TouchableOpacity
              style={styles.customerInfo}
              onPress={() => setShowHistory(true)}
            >
              <Ionicons name="person-circle" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.customerInfoName}>{customer.name}</Text>
                <Text style={styles.customerInfoSub}>
                  Orders: {customer.totalOrders} | Due:{" "}
                  {formatCurrency(customer.totalDue)}
                </Text>
              </View>
              <Text style={styles.viewHistory}>History →</Text>
            </TouchableOpacity>
          )}

          <InputField
            label="Customer Name"
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            required
            editable={!customer}
          />
          <InputField
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            editable={!customer}
          />
        </View>

        {/* Order Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          {/* Pona Type */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Pona Type <Text style={{ color: COLORS.danger }}>*</Text>
            </Text>
            <View style={styles.typeRow}>
              {PONA_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    ponaType === t && styles.typeBtnActive,
                  ]}
                  onPress={() => setPonaType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      ponaType === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <InputField
            label="PL Quantity"
            value={plQuantity}
            onChangeText={setPlQuantity}
            placeholder="0"
            keyboardType="numeric"
            required
          />
          <InputField
            label="Unit Rate (৳)"
            value={unitRate}
            onChangeText={setUnitRate}
            placeholder="0.00"
            keyboardType="numeric"
            required
          />

          {/* Total Price */}
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Total Price</Text>
            <Text style={styles.calcValue}>{formatCurrency(totalPrice)}</Text>
          </View>

          <InputField
            label="Advance Amount (৳)"
            value={advanceAmount}
            onChangeText={setAdvanceAmount}
            placeholder="0"
            keyboardType="numeric"
          />

          <View
            style={[
              styles.calcRow,
              {
                backgroundColor: COLORS.dangerLight,
                borderRadius: 8,
                padding: 10,
              },
            ]}
          >
            <Text style={[styles.calcLabel, { color: COLORS.danger }]}>
              Due Amount
            </Text>
            <Text style={[styles.calcValue, { color: COLORS.danger }]}>
              {formatCurrency(dueAmount)}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Delivery Date <Text style={{ color: COLORS.danger }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={COLORS.textMuted}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.submitBtnText}>Create Order</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputDisabled: {
    backgroundColor: COLORS.border + "40",
    color: COLORS.textSecondary,
  },
  mobileRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  foundBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  foundText: { fontSize: 12, color: COLORS.success, fontWeight: "700" },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.successLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  customerInfoName: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  customerInfoSub: { fontSize: 11, color: COLORS.textSecondary },
  viewHistory: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.successLight,
  },
  typeBtnText: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary },
  typeBtnTextActive: { color: COLORS.primary },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  calcLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  calcValue: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
});
