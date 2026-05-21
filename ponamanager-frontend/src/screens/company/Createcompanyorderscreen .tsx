// src/screens/company/CreateCompanyOrderScreen.tsx
import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { companyOrderAPI } from "../../api/companyOrderAPI";
import { formatCurrency } from "../../utils/helpers";

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9", surface: "#FFFFFF", border: "rgba(0,0,0,0.07)",
  textPrimary: "#111827", textSecondary: "#6B7280", textMuted: "#9CA3AF",
  accent: "#6C63FF", accentSoft: "rgba(108,99,255,0.10)",
  success: "#18B565", successSoft: "rgba(24,181,101,0.10)",
  danger: "#F03F5F", dangerSoft: "rgba(240,63,95,0.09)",
  warning: "#E09400", inputBg: "#F4F5F9", white: "#FFFFFF",
};
const DARK = {
  bg: "#0F1117", surface: "#1A1D27", border: "rgba(255,255,255,0.07)",
  textPrimary: "#F0F2FF", textSecondary: "#8A8FA8", textMuted: "#545872",
  accent: "#6C63FF", accentSoft: "rgba(108,99,255,0.15)",
  success: "#2ECC71", successSoft: "rgba(46,204,113,0.12)",
  danger: "#FF5E7E", dangerSoft: "rgba(255,94,126,0.12)",
  warning: "#F0A500", inputBg: "#0F1117", white: "#FFFFFF",
};
const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Pona types ───────────────────────────────────────────────────────────────
const PONA_TYPES = [
  { key: "Golda",    label: "গলদা",   color: "#F5A623" },
  { key: "Bagda",    label: "বাগদা",  color: "#1E88E5" },
  { key: "Vannamei", label: "ভেনামি", color: "#43A047" },
];

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({
  label, value, onChange, suffix, placeholder, T, keyboardType = "numeric", note,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; placeholder?: string; T: any;
  keyboardType?: any; note?: string;
}) => (
  <View style={fStyles.wrap}>
    <Text style={[fStyles.label, { color: T.textSecondary }]}>{label}</Text>
    {note && <Text style={[fStyles.note, { color: T.textMuted }]}>{note}</Text>}
    <View style={[fStyles.row, { borderColor: T.border, backgroundColor: T.inputBg }]}>
      <TextInput
        style={[fStyles.input, { color: T.textPrimary }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder ?? ""}
        placeholderTextColor={T.textMuted}
      />
      {suffix && <Text style={[fStyles.suffix, { color: T.textMuted }]}>{suffix}</Text>}
    </View>
  </View>
);

const fStyles = StyleSheet.create({
  wrap:   { marginBottom: 14 },
  label:  { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  note:   { fontSize: 11, marginBottom: 6 },
  row:    { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 10 },
  input:  { flex: 1, padding: 12, fontSize: 15 },
  suffix: { paddingRight: 12, fontSize: 13, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const CreateCompanyOrderScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();

  const [ponaType,     setPonaType]     = useState("Golda");
  const [paymentAmount,setPaymentAmount]= useState("");
  const [ratePerPL,    setRatePerPL]    = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes,        setNotes]        = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  // Live calc
  const payment = parseFloat(paymentAmount) || 0;
  const rate    = parseFloat(ratePerPL)     || 0;
  const expPL   = rate > 0 ? payment / rate : 0;

  const validate = () => {
    if (!ponaType)       { setError("পোনার ধরন বেছে নিন");           return false; }
    if (!payment)        { setError("পেমেন্ট পরিমাণ আবশ্যিক");       return false; }
    if (!rate)           { setError("প্রতি PL দর আবশ্যিক");           return false; }
    if (!expectedDate)   { setError("প্রত্যাশিত তারিখ আবশ্যিক");     return false; }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await companyOrderAPI.create({
        ponaType,
        paymentAmount: payment,
        ratePerPL:     rate,
        expectedDate,
        notes,
      });
      Toast.show({ type: "success", text1: "অর্ডার তৈরি হয়েছে", text2: `${ponaType} - ${formatCurrency(payment)}` });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "ত্রুটি", text2: e?.response?.data?.message || "সেভ ব্যর্থ" });
    } finally {
      setSaving(false);
    }
  };

  const selectedPona = PONA_TYPES.find(p => p.key === ponaType)!;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: T.bg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: selectedPona.color }]}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <Text style={styles.heroTitle}>নতুন কোম্পানি অর্ডার</Text>
          <Text style={styles.heroSub}>পেমেন্ট করে পোনার অর্ডার দিন</Text>
        </View>

        {/* ── Pona type selector ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.sectionTitle, { color: T.textMuted }]}>পোনার ধরন</Text>
          <View style={styles.ponaRow}>
            {PONA_TYPES.map((p) => {
              const active = ponaType === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.ponaBtn,
                    { borderColor: T.border, backgroundColor: T.bg },
                    active && { backgroundColor: p.color + "18", borderColor: p.color },
                  ]}
                  onPress={() => setPonaType(p.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ponaBtnText, { color: T.textMuted }, active && { color: p.color, fontWeight: "800" }]}>
                    {p.label}
                  </Text>
                  {active && (
                    <View style={[styles.ponaCheckDot, { backgroundColor: p.color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Payment info ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.sectionTitle, { color: T.textMuted }]}>পেমেন্ট তথ্য</Text>

          <Field
            label="পেমেন্ট পরিমাণ"
            value={paymentAmount}
            onChange={(v) => { setPaymentAmount(v); setError(""); }}
            suffix="৳"
            placeholder="যেমন: ২০০০০০"
            T={T}
            note="কোম্পানিকে কত টাকা দিচ্ছেন"
          />

          <Field
            label="প্রতি PL দর"
            value={ratePerPL}
            onChange={(v) => { setRatePerPL(v); setError(""); }}
            suffix="৳/PL"
            placeholder="যেমন: ৪"
            T={T}
            note="প্রতিটি PL এর দাম"
          />

          {/* Live preview */}
          {payment > 0 && rate > 0 && (
            <View style={[styles.previewBox, { backgroundColor: selectedPona.color + "12", borderColor: selectedPona.color + "33" }]}>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: selectedPona.color }]}>আনুমানিক PL</Text>
                <Text style={[styles.previewValue, { color: selectedPona.color }]}>
                  {formatCurrency(payment)} ÷ ৳{rate} ={" "}
                  <Text style={{ fontWeight: "900" }}>{expPL.toLocaleString()} PL</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Delivery date ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.sectionTitle, { color: T.textMuted }]}>প্রত্যাশিত ডেলিভারি</Text>
          <Field
            label="তারিখ"
            value={expectedDate}
            onChange={(v) => { setExpectedDate(v); setError(""); }}
            placeholder="YYYY-MM-DD"
            T={T}
            keyboardType="default"
            note="কোম্পানি কবে পোনা দেবে বলেছে"
          />
        </View>

        {/* ── Notes ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.fieldLabel, { color: T.textSecondary }]}>নোট (ঐচ্ছিক)</Text>
          <TextInput
            style={[styles.notesInput, { borderColor: T.border, color: T.textPrimary, backgroundColor: T.inputBg }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="অতিরিক্ত তথ্য..."
            placeholderTextColor={T.textMuted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* ── Error ── */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: T.dangerSoft }]}>
            <Ionicons name="alert-circle-outline" size={14} color={T.danger} />
            <Text style={[styles.errorText, { color: T.danger }]}>{error}</Text>
          </View>
        )}

        {/* ── Summary before save ── */}
        {payment > 0 && rate > 0 && (
          <View style={[styles.summaryBox, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Text style={[styles.summaryTitle, { color: T.textMuted }]}>সারসংক্ষেপ</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>পোনার ধরন</Text>
              <Text style={[styles.summaryValue, { color: selectedPona.color }]}>{selectedPona.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>পেমেন্ট</Text>
              <Text style={[styles.summaryValue, { color: T.textPrimary }]}>{formatCurrency(payment)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: T.textSecondary }]}>প্রতি PL</Text>
              <Text style={[styles.summaryValue, { color: T.textPrimary }]}>৳{rate}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast, { backgroundColor: selectedPona.color + "12" }]}>
              <Text style={[styles.summaryLabel, { color: selectedPona.color, fontWeight: "700" }]}>আনুমানিক PL</Text>
              <Text style={[styles.summaryValueBig, { color: selectedPona.color }]}>{expPL.toLocaleString()} PL</Text>
            </View>
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: saving ? selectedPona.color + "99" : selectedPona.color }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.submitBtnInner}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>অর্ডার সেভ করুন</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: { padding: 16 },

  hero:      { borderRadius: 16, padding: 20, marginBottom: 14, overflow: "hidden" },
  heroBlob1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -30 },
  heroBlob2: { position: "absolute", width: 100, height: 100, borderRadius: 50,  backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 20 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 4 },
  heroSub:   { fontSize: 13, color: "rgba(255,255,255,0.7)" },

  card:         { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 14, textTransform: "uppercase" },
  fieldLabel:   { fontSize: 13, fontWeight: "600", marginBottom: 6 },

  ponaRow: { flexDirection: "row", gap: 8 },
  ponaBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, position: "relative" },
  ponaBtnText: { fontSize: 13, fontWeight: "600" },
  ponaCheckDot:{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 4 },

  previewBox: { borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 4 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel:{ fontSize: 12, fontWeight: "600" },
  previewValue:{ fontSize: 12 },

  notesInput: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 70, textAlignVertical: "top" },

  errorBox:  { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },

  summaryBox:    { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  summaryTitle:  { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 12, textTransform: "uppercase" },
  summaryRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  summaryRowLast:{ borderRadius: 8, paddingHorizontal: 10, marginTop: 4 },
  summaryLabel:  { fontSize: 13 },
  summaryValue:  { fontSize: 13, fontWeight: "700" },
  summaryValueBig: { fontSize: 18, fontWeight: "900" },

  submitBtn:      { borderRadius: 14, padding: 16, alignItems: "center" },
  submitBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitBtnText:  { color: "#fff", fontWeight: "800", fontSize: 15 },
});