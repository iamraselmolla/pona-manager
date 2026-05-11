// src/screens/customers/AddEditCustomerScreen.tsx
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { customerAPI } from "../../api/services";
import { COLORS } from "../../constants";

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
}: any) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={{ color: COLORS.danger }}> *</Text>}
    </Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType || "default"}
      placeholderTextColor={COLORS.textMuted}
    />
  </View>
);

export const AddEditCustomerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { customerId } = route.params || {};
  const isEdit = !!customerId;

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Edit Customer" : "Add Customer" });
    if (isEdit) {
      customerAPI
        .getById(customerId)
        .then((res) => {
          const c = res.data.data;
          setName(c.name);
          setMobile(c.mobile);
          setAddress(c.address || "");
          setArea(c.area || "");
          setFetchLoading(false);
        })
        .catch(() => {
          Alert.alert("Error", "Failed to load customer");
          navigation.goBack();
        });
    }
  }, []);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required");
      return false;
    }
    if (!mobile.trim() || !/^01[3-9]\d{8}$/.test(mobile)) {
      Alert.alert("Validation", "Enter valid mobile (e.g. 01XXXXXXXXX)");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        area: area.trim(),
      };
      if (isEdit) {
        await customerAPI.update(customerId, payload);
        Alert.alert("Success", "Customer updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await customerAPI.create(payload);
        Alert.alert("Success", "Customer added successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to save customer",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Customer full name"
            required
          />
          <Field
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            required
          />
          <Field
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Full address"
          />
          <Field
            label="Area"
            value={area}
            onChangeText={setArea}
            placeholder="Area / Upazila"
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? "Update Customer" : "Add Customer"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 4,
    marginBottom: 16,
  },
  field: { marginBottom: 16 },
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
});
