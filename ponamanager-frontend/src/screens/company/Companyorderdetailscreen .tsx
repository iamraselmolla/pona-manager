// src/screens/company/CompanyOrderDetailScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { companyOrderAPI } from "../../api/companyOrderAPI";
import { formatCurrency, formatDate } from "../../utils/helpers";

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9", surface: "#FFFFFF", border: "rgba(0,0,0,0.07)",
  textPrimary: "#111827", textSecondary: "#6B7280", textMuted: "#9CA3AF",
  accent: "#6C63FF", accentSoft: "rgba(108,99,255,0.10)",
  success: "#18B565", successSoft: "rgba(24,181,101,0.10)",
  danger: "#F03F5F", dangerSoft: "rgba(240,63,95,0.09)",
  warning: "#E09400", warningSoft: "rgba(224,148,0,0.10)",
  inputBg: "#F4F5F9", white: "#FFFFFF",
};
const DARK = {
  bg: "#0F1117", surface: "#1A1D27", border: "rgba(255,255,255,0.07)",
  textPrimary: "#F0F2FF", textSecondary: "#8A8FA8", textMuted: "#545872",
  accent: "#6C63FF", accentSoft: "rgba(108,99,255,0.15)",
  success: "#2ECC71", successSoft: "rgba(46,204,113,0.12)",
  danger: "#FF5E7E", dangerSoft: "rgba(255,94,126,0.12)",
  warning: "#F0A500", warningSoft: "rgba(240,165,0,0.12)",
  inputBg: "#0F1117", white: "#FFFFFF",
};
const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

const PONA_COLORS: Record<string, string> = {
  Golda: "#F5A623", Bagda: "#1E88E5", Vannamei: "#43A047",
};

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, valueColor, T, last }: any) => (
  <View style={[iStyles.row, { borderBottomColor: T.border }, last && { borderBottomWidth: 0 }]}>
    <Text style={[iStyles.label, { color: T.textSecondary }]}>{label}</Text>
    <Text style={[iStyles.value, { color: valueColor ?? T.textPrimary }]}>{value}</Text>
  </View>
);
const iStyles = StyleSheet.create({
  row:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderBottomWidth: 1 },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: "600" },
});

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, suffix, placeholder, T, note }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 13, fontWeight: "600", color: T.textSecondary, marginBottom: 4 }}>{label}</Text>
    {note && <Text style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>{note}</Text>}
    <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: T.border, borderRadius: 10, backgroundColor: T.inputBg }}>
      <TextInput
        style={{ flex: 1, padding: 12, fontSize: 15, color: T.textPrimary }}
        value={value} onChangeText={onChange}
        keyboardType="numeric" placeholder={placeholder ?? "0"}
        placeholderTextColor={T.textMuted}
      />
      {suffix && <Text style={{ paddingRight: 12, fontSize: 13, fontWeight: "700", color: T.textMuted }}>{suffix}</Text>}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const CompanyOrderDetailScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  // Receive form
  const [mirValue,      setMirValue]      = useState("");
  const [totalPoly,     setTotalPoly]     = useState("");
  const [paidToCompany, setPaidToCompany] = useState("");
  const [batchId,       setBatchId]       = useState("");
  const [receiveNotes,  setReceiveNotes]  = useState("");
  const [showReceiveForm, setShowReceiveForm] = useState(false);

  useEffect(() => {
    companyOrderAPI.getById(orderId)
      .then((res) => { setOrder(res.data.data); setLoading(false); })
      .catch(() => { navigation.goBack(); });
  }, [orderId]);

  if (loading || !order) return (
    <View style={[styles.center, { backgroundColor: T.bg }]}>
      <ActivityIndicator size="large" color={T.accent} />
    </View>
  );

  const ponaColor  = PONA_COLORS[order.ponaType] ?? T.accent;
  const isDelivered = order.status === "delivered";

  // Live calc for receive form
  const mir     = parseFloat(mirValue)      || 0;
  const poly    = parseFloat(totalPoly)     || 0;
  const extraPay = parseFloat(paidToCompany) || 0;

  const totalPL      = mir * poly;
  const actualAmount = totalPL * order.ratePerPL;
  const totalPaid    = order.paymentAmount + extraPay;
  const prevDue      = order.prevDue     ?? 0;
  const prevAdvance  = order.prevAdvance ?? 0;
  const totalOwed    = prevDue + actualAmount;
  const totalPaidAll = prevAdvance + totalPaid;
  const net          = totalOwed - totalPaidAll;
  const netDue       = net > 0 ? net       : 0;
  const netAdvance   = net < 0 ? Math.abs(net) : 0;

  const handleReceive = async () => {
    if (!mir || !poly) {
      setError("মীর এবং পলি আবশ্যিক");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await companyOrderAPI.receive(orderId, {
        mirValue:     mir,
        totalPoly:    poly,
        paidToCompany: extraPay || undefined,
        batchId:      batchId || undefined,
        notes:        receiveNotes || undefined,
      });
      setOrder(res.data.data);
      setShowReceiveForm(false);
      Toast.show({ type: "success", text1: "পোনা প্রাপ্তি রেকর্ড হয়েছে", text2: `${totalPL.toLocaleString()} PL রেকর্ড করা হয়েছে` });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "ত্রুটি", text2: e?.response?.data?.message || "ব্যর্থ" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: T.bg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: ponaColor }]}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          <View style={styles.heroTop}>
            <View style={[styles.statusPill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons
                name={isDelivered ? "checkmark-circle-outline" : "time-outline"}
                size={12} color="#fff"
              />
              <Text style={styles.statusPillText}>
                {isDelivered ? "পোনা পাওয়া গেছে" : "অপেক্ষায়"}
              </Text>
            </View>
            <Text style={styles.heroDate}>{formatDate(order.expectedDate)}</Text>
          </View>

          <Text style={styles.heroPonaType}>{order.ponaType} পোনা</Text>
          <Text style={styles.heroAmount}>{formatCurrency(order.paymentAmount)}</Text>
          <Text style={styles.heroSub}>পেমেন্ট · {order.expectedPL?.toLocaleString()} PL আনুমানিক</Text>

          {/* Carry forward */}
          {(prevDue > 0 || prevAdvance > 0) && (
            <View style={styles.carryChip}>
              <Ionicons name="swap-horizontal" size={12} color="#fff" />
              <Text style={styles.carryText}>
                {prevDue > 0 ? `আগের বাকি: ${formatCurrency(prevDue)}` : `আগের অগ্রীম: ${formatCurrency(prevAdvance)}`}
              </Text>
            </View>
          )}
        </View>

        {/* ── Order details ── */}
        <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
          <Text style={[styles.sectionTitle, { color: T.textMuted }]}>অর্ডার তথ্য</Text>
          <InfoRow label="পোনার ধরন"     value={order.ponaType}              valueColor={ponaColor}  T={T} />
          <InfoRow label="পেমেন্ট"       value={formatCurrency(order.paymentAmount)}                 T={T} />
          <InfoRow label="প্রতি PL দর"   value={`৳${order.ratePerPL}`}                              T={T} />
          <InfoRow label="আনুমানিক PL"   value={`${(order.expectedPL ?? 0).toLocaleString()} PL`}  valueColor={T.accent} T={T} />
          <InfoRow label="প্রত্যাশিত তারিখ" value={formatDate(order.expectedDate)}                  T={T} last />
        </View>

        {/* ── Delivered data (if received) ── */}
        {isDelivered && (
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Text style={[styles.sectionTitle, { color: T.textMuted }]}>প্রাপ্ত পোনার তথ্য</Text>

            {/* Mir × Poly = Total PL visual */}
            <View style={[styles.calcVisual, { backgroundColor: ponaColor + "12", borderColor: ponaColor + "33" }]}>
              <View style={styles.calcVisualItem}>
                <Text style={[styles.calcVisualNum, { color: ponaColor }]}>{order.mirValue}</Text>
                <Text style={[styles.calcVisualLabel, { color: T.textMuted }]}>মীর</Text>
              </View>
              <Text style={[styles.calcVisualOp, { color: T.textMuted }]}>×</Text>
              <View style={styles.calcVisualItem}>
                <Text style={[styles.calcVisualNum, { color: ponaColor }]}>{order.totalPoly}</Text>
                <Text style={[styles.calcVisualLabel, { color: T.textMuted }]}>পলি</Text>
              </View>
              <Text style={[styles.calcVisualOp, { color: T.textMuted }]}>=</Text>
              <View style={styles.calcVisualItem}>
                <Text style={[styles.calcVisualNumBig, { color: ponaColor }]}>
                  {(order.totalPL ?? 0).toLocaleString()}
                </Text>
                <Text style={[styles.calcVisualLabel, { color: T.textMuted }]}>মোট PL</Text>
              </View>
            </View>

            <InfoRow label="প্রকৃত দাম"     value={formatCurrency(order.actualAmount)}                          T={T} />
            <InfoRow label="আগের পেমেন্ট"   value={formatCurrency(order.paymentAmount)}  valueColor={T.success} T={T} />
            {(order.paidToCompany ?? 0) > 0 && (
              <InfoRow label="অতিরিক্ত পেমেন্ট" value={formatCurrency(order.paidToCompany)} valueColor={T.success} T={T} />
            )}

            {/* Net position */}
            <View style={[styles.netBox, { backgroundColor: (order.netDue ?? 0) > 0 ? T.dangerSoft : T.successSoft }]}>
              <Text style={[styles.netLabel, { color: (order.netDue ?? 0) > 0 ? T.danger : T.success }]}>
                {(order.netDue ?? 0) > 0 ? "কোম্পানিকে আরও দিতে হবে" : "কোম্পানি আমাদের ফেরত দেবে"}
              </Text>
              <Text style={[styles.netValue, { color: (order.netDue ?? 0) > 0 ? T.danger : T.success }]}>
                {formatCurrency((order.netDue ?? 0) > 0 ? order.netDue : order.netAdvance)}
              </Text>
            </View>

            {/* Batch link */}
            {order.batch && (
              <TouchableOpacity
                style={[styles.batchLinkBtn, { backgroundColor: T.accentSoft, borderColor: T.accent + "33" }]}
                onPress={() => navigation.navigate("BatchDetails", { batchId: order.batchId })}
              >
                <Ionicons name="boat-outline" size={14} color={T.accent} />
                <Text style={[styles.batchLinkText, { color: T.accent }]}>
                  ব্যাচ: {order.batch.batchNumber} → দেখুন
                </Text>
                <Ionicons name="chevron-forward" size={13} color={T.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Receive form (pending only) ── */}
        {!isDelivered && (
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
            <TouchableOpacity
              style={styles.receiveToggle}
              onPress={() => setShowReceiveForm(!showReceiveForm)}
            >
              <View style={styles.receiveToggleLeft}>
                <View style={[styles.receiveToggleIcon, { backgroundColor: T.successSoft }]}>
                  <Ionicons name="checkmark-done-outline" size={16} color={T.success} />
                </View>
                <View>
                  <Text style={[styles.receiveToggleTitle, { color: T.textPrimary }]}>পোনা পাওয়া গেছে</Text>
                  <Text style={[styles.receiveToggleSub, { color: T.textMuted }]}>মীর ও পলি এন্ট্রি দিন</Text>
                </View>
              </View>
              <Ionicons name={showReceiveForm ? "chevron-up" : "chevron-down"} size={18} color={T.textMuted} />
            </TouchableOpacity>

            {showReceiveForm && (
              <View style={{ marginTop: 16 }}>
                <Field
                  label="কোম্পানি মীর"
                  value={mirValue}
                  onChange={(v: string) => { setMirValue(v); setError(""); }}
                  placeholder="যেমন: ১১৫০"
                  T={T}
                  note="কোম্পানি প্রতি পলিতে কত পোনা দিয়েছে"
                />
                <Field
                  label="মোট পলি সংখ্যা"
                  value={totalPoly}
                  onChange={(v: string) => { setTotalPoly(v); setError(""); }}
                  suffix="পলি"
                  placeholder="যেমন: ৪০"
                  T={T}
                />

                {/* Live calc */}
                {mir > 0 && poly > 0 && (
                  <View style={[styles.liveCalc, { backgroundColor: ponaColor + "12", borderColor: ponaColor + "33" }]}>
                    <Text style={[styles.liveCalcText, { color: ponaColor }]}>
                      {mir} × {poly} = <Text style={{ fontWeight: "900" }}>{totalPL.toLocaleString()} PL</Text>
                    </Text>
                    <Text style={[styles.liveCalcSub, { color: ponaColor }]}>
                      দাম: {formatCurrency(actualAmount)}
                    </Text>
                  </View>
                )}

                <Field
                  label="অতিরিক্ত পেমেন্ট (যদি থাকে)"
                  value={paidToCompany}
                  onChange={setPaidToCompany}
                  suffix="৳"
                  placeholder="০"
                  T={T}
                  note="আগের পেমেন্টের বাইরে আরও দিলে"
                />

                {/* Batch ID */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: T.textSecondary, marginBottom: 4 }}>
                    ডেলিভারি ব্যাচ ID (ঐচ্ছিক)
                  </Text>
                  <Text style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>
                    কোন ব্যাচে এই পোনা যাবে সেটা লিঙ্ক করুন
                  </Text>
                  <View style={{ borderWidth: 1.5, borderColor: T.border, borderRadius: 10, backgroundColor: T.inputBg }}>
                    <TextInput
                      style={{ padding: 12, fontSize: 14, color: T.textPrimary }}
                      value={batchId}
                      onChangeText={setBatchId}
                      placeholder="Batch ID (ঐচ্ছিক)"
                      placeholderTextColor={T.textMuted}
                      keyboardType="default"
                    />
                  </View>
                </View>

                {/* Net preview */}
                {mir > 0 && poly > 0 && (
                  <View style={[styles.netPreview, { backgroundColor: netDue > 0 ? T.dangerSoft : T.successSoft }]}>
                    <Text style={[styles.netPreviewLabel, { color: netDue > 0 ? T.danger : T.success }]}>
                      {netDue > 0 ? "কোম্পানিকে দিতে হবে" : "কোম্পানি দেবে"}
                    </Text>
                    <Text style={[styles.netPreviewValue, { color: netDue > 0 ? T.danger : T.success }]}>
                      {formatCurrency(netDue > 0 ? netDue : netAdvance)}
                    </Text>
                  </View>
                )}

                {!!error && (
                  <View style={[styles.errorBox, { backgroundColor: T.dangerSoft }]}>
                    <Ionicons name="alert-circle-outline" size={14} color={T.danger} />
                    <Text style={[styles.errorText, { color: T.danger }]}>{error}</Text>
                  </View>
                )}

                {/* Notes */}
                <Text style={{ fontSize: 13, fontWeight: "600", color: T.textSecondary, marginBottom: 6 }}>নোট</Text>
                <TextInput
                  style={{ borderWidth: 1.5, borderColor: T.border, borderRadius: 10, padding: 12, fontSize: 14, color: T.textPrimary, backgroundColor: T.inputBg, minHeight: 60, textAlignVertical: "top", marginBottom: 14 }}
                  value={receiveNotes}
                  onChangeText={setReceiveNotes}
                  placeholder="অতিরিক্ত তথ্য..."
                  placeholderTextColor={T.textMuted}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.receiveBtn, { backgroundColor: saving ? T.success + "80" : T.success }]}
                  onPress={handleReceive}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.receiveBtnText}>পোনা প্রাপ্তি নিশ্চিত করুন</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {order.notes && (
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}>
            <Text style={[styles.sectionTitle, { color: T.textMuted }]}>নোট</Text>
            <Text style={[styles.noteText, { color: T.textSecondary }]}>{order.notes}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: { padding: 16 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  hero:       { borderRadius: 16, padding: 20, marginBottom: 14, overflow: "hidden" },
  heroBlob1:  { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.07)", top: -70, right: -40 },
  heroBlob2:  { position: "absolute", width: 120, height: 120, borderRadius: 60,  backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: 10 },
  heroTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  heroDate:   { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  heroPonaType: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  heroAmount: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -1, marginBottom: 4 },
  heroSub:    { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 10 },
  carryChip:  { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  carryText:  { fontSize: 11, color: "#fff", fontWeight: "600" },

  card:         { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 14, textTransform: "uppercase" },

  calcVisual:      { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 14, gap: 8 },
  calcVisualItem:  { alignItems: "center" },
  calcVisualNum:   { fontSize: 22, fontWeight: "800" },
  calcVisualNumBig:{ fontSize: 28, fontWeight: "900" },
  calcVisualLabel: { fontSize: 10, marginTop: 3 },
  calcVisualOp:    { fontSize: 20, fontWeight: "300" },

  netBox:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 10 },
  netLabel: { fontSize: 13, fontWeight: "700" },
  netValue: { fontSize: 18, fontWeight: "900" },

  batchLinkBtn:  { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 10 },
  batchLinkText: { flex: 1, fontSize: 13, fontWeight: "600" },

  receiveToggle:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  receiveToggleLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  receiveToggleIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  receiveToggleTitle: { fontSize: 14, fontWeight: "700" },
  receiveToggleSub:   { fontSize: 11, marginTop: 2 },

  liveCalc:    { borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 14, alignItems: "center" },
  liveCalcText:{ fontSize: 15, fontWeight: "700" },
  liveCalcSub: { fontSize: 12, marginTop: 4 },

  netPreview:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  netPreviewLabel: { fontSize: 13, fontWeight: "700" },
  netPreviewValue: { fontSize: 16, fontWeight: "900" },

  errorBox:  { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, fontWeight: "600", flex: 1 },

  receiveBtn:     { borderRadius: 12, padding: 14, alignItems: "center" },
  receiveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  noteText: { fontSize: 13, lineHeight: 20 },
});