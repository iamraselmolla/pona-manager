// src/screens/batch/BatchDetailsScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { batchAPI } from "../../api/batchServices";
import { Batch, BatchOrder } from "../../types";
import {
  formatCurrency,
  formatDate,
  getPonaTypeColor,
} from "../../utils/helpers";

// ─── Palettes ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F4F5F9",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  borderStrong: "rgba(0,0,0,0.12)",
  textPrimary: "#111827",
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
  inputBg: "#F4F5F9",
  shadow: "#000",
};

const DARK = {
  bg: "#0F1117",
  surface: "#1A1D27",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
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
  inputBg: "#0F1117",
  shadow: "#000",
};

const useTheme = () => (useColorScheme() === "dark" ? DARK : LIGHT);

// ─── Status config ─────────────────────────────────────────────────────────────
const getStatusConfig = (T: typeof LIGHT) => ({
  pending: {
    label: "পেন্ডিং",
    color: T.warning,
    bg: T.warningSoft,
    icon: "time-outline" as const,
  },
  delivered: {
    label: "সম্পন্ন",
    color: T.success,
    bg: T.successSoft,
    icon: "checkmark-circle-outline" as const,
  },
  partial: {
    label: "আংশিক",
    color: T.info,
    bg: T.infoSoft,
    icon: "git-branch-outline" as const,
  },
});

// ─── Delivery Modal ────────────────────────────────────────────────────────────
const DeliveryModal = ({
  visible,
  batchOrder,
  onClose,
  onSubmit,
  saving,
}: {
  visible: boolean;
  batchOrder: BatchOrder | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
  saving: boolean;
}) => {
  const T = useTheme();
  const [deliveredQty, setDeliveredQty] = useState("");
  const [deliveryRate, setDeliveryRate] = useState("");
  const [payment, setPayment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isPartial, setIsPartial] = useState(false);

  useEffect(() => {
    if (batchOrder) {
      setDeliveredQty(batchOrder.order.plQuantity.toString());
      setDeliveryRate(batchOrder.order.unitRate.toString());
      setPayment("");
      setDueDate("");
      setNotes("");
      setIsPartial(false);
    }
  }, [batchOrder]);

  if (!batchOrder) return null;

  const orderedQty = batchOrder.order.plQuantity;
  const advance = batchOrder.order.advanceAmount || 0;
  const delivered = parseFloat(deliveredQty) || 0;
  const rate = parseFloat(deliveryRate) || 0;
  const paid = parseFloat(payment) || 0;
  const remaining = orderedQty - delivered;
  const finalAmt = delivered * rate;
  const totalPaid = advance + paid;
  const dueAmt = Math.max(0, finalAmt - totalPaid);
  const isActuallyPartial = delivered < orderedQty && delivered > 0;
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType) ?? T.accent;

  const handleSubmit = () => {
    if (!deliveredQty || delivered <= 0) {
      Alert.alert("সতর্কতা", "ডেলিভারি পরিমাণ দিন");
      return;
    }
    if (!deliveryRate || rate <= 0) {
      Alert.alert("সতর্কতা", "দর দিন");
      return;
    }
    if (delivered > orderedQty) {
      Alert.alert("সতর্কতা", `সর্বোচ্চ ${orderedQty} PL`);
      return;
    }
    Alert.alert(
      isActuallyPartial ? "আংশিক ডেলিভারি" : "ডেলিভারি নিশ্চিত",
      isActuallyPartial
        ? `${delivered.toLocaleString()} PL ডেলিভারি হবে।\nবাকি ${remaining.toLocaleString()} PL নতুন অর্ডার হিসেবে যোগ হবে।\n\nনিশ্চিত করুন?`
        : `${delivered.toLocaleString()} PL ডেলিভারি নিশ্চিত করুন?`,
      [
        { text: "না", style: "cancel" },
        {
          text: "হ্যাঁ",
          onPress: () =>
            onSubmit({
              deliveredQuantity: delivered,
              deliveryRate: rate,
              customerPayment: paid,
              dueAmount: dueAmt,
              duePaymentDate: dueAmt > 0 ? dueDate : undefined,
              isPartial: isActuallyPartial,
              remainingQuantity: isActuallyPartial ? remaining : 0,
              notes,
            }),
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[mStyles.container, { backgroundColor: T.bg }]}>
          {/* Header */}
          <View
            style={[
              mStyles.header,
              { backgroundColor: T.surface, borderBottomColor: T.border },
            ]}
          >
            <View>
              <Text style={[mStyles.headerTitle, { color: T.textPrimary }]}>
                ডেলিভারি এন্ট্রি
              </Text>
              <Text style={[mStyles.headerSub, { color: T.textSecondary }]}>
                {batchOrder.order.customerName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[mStyles.closeBtn, { backgroundColor: T.bg }]}
            >
              <Ionicons name="close" size={22} color={T.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Order info */}
            <View
              style={[
                mStyles.infoCard,
                { backgroundColor: T.surface, borderTopColor: typeColor },
              ]}
            >
              {[
                {
                  label: "পোনার ধরন",
                  value: null,
                  pill: batchOrder.order.ponaType,
                },
                {
                  label: "অর্ডার পরিমাণ",
                  value: `${orderedQty.toLocaleString()} PL`,
                  pill: null,
                },
                {
                  label: "আগাম জমা",
                  value: formatCurrency(advance),
                  pill: null,
                  valueColor: T.success,
                },
              ].map((row, i) => (
                <View
                  key={i}
                  style={[mStyles.infoRow, { borderBottomColor: T.border }]}
                >
                  <Text style={[mStyles.infoLabel, { color: T.textSecondary }]}>
                    {row.label}
                  </Text>
                  {row.pill ? (
                    <View
                      style={[
                        mStyles.typePill,
                        { backgroundColor: typeColor + "20" },
                      ]}
                    >
                      <Text
                        style={[mStyles.typePillText, { color: typeColor }]}
                      >
                        {row.pill}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        mStyles.infoValue,
                        { color: row.valueColor ?? T.textPrimary },
                      ]}
                    >
                      {row.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Partial toggle */}
            <View
              style={[
                mStyles.partialToggleCard,
                { backgroundColor: T.surface },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[mStyles.partialToggleTitle, { color: T.textPrimary }]}
                >
                  আংশিক ডেলিভারি?
                </Text>
                <Text
                  style={[mStyles.partialToggleSub, { color: T.textSecondary }]}
                >
                  পুরো পরিমাণ দিতে না পারলে
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  mStyles.toggleBtn,
                  { backgroundColor: T.border },
                  isPartial && { backgroundColor: T.info },
                ]}
                onPress={() => {
                  setIsPartial(!isPartial);
                  if (!isPartial) setDeliveredQty("");
                  else setDeliveredQty(orderedQty.toString());
                }}
              >
                <View
                  style={[
                    mStyles.toggleThumb,
                    isPartial && mStyles.toggleThumbOn,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Partial banner */}
            {isActuallyPartial && (
              <View
                style={[mStyles.partialBanner, { backgroundColor: T.infoSoft }]}
              >
                <Ionicons name="information-circle" size={16} color={T.info} />
                <Text style={[mStyles.partialBannerText, { color: T.info }]}>
                  বাকি {remaining.toLocaleString()} PL স্বয়ংক্রিয়ভাবে নতুন
                  pending অর্ডার হিসেবে যোগ হবে
                </Text>
              </View>
            )}

            {/* Fields */}
            <View style={[mStyles.fieldsCard, { backgroundColor: T.surface }]}>
              {/* Delivered qty */}
              <View style={mStyles.field}>
                <Text style={[mStyles.fieldLabel, { color: T.textSecondary }]}>
                  ডেলিভারিকৃত পরিমাণ
                  {isPartial ? (
                    <Text style={{ color: T.info }}> (আংশিক)</Text>
                  ) : (
                    ""
                  )}
                </Text>
                <View
                  style={[
                    mStyles.inputRow,
                    { borderColor: T.border, backgroundColor: T.inputBg },
                  ]}
                >
                  <TextInput
                    style={[mStyles.input, { color: T.textPrimary }]}
                    value={deliveredQty}
                    onChangeText={setDeliveredQty}
                    keyboardType="numeric"
                    placeholder={`সর্বোচ্চ ${orderedQty.toLocaleString()}`}
                    placeholderTextColor={T.textMuted}
                  />
                  <Text style={[mStyles.inputSuffix, { color: T.textMuted }]}>
                    PL
                  </Text>
                </View>
                {delivered > 0 && (
                  <View style={mStyles.qtyProgress}>
                    <View
                      style={[
                        mStyles.qtyProgressBg,
                        { backgroundColor: T.border },
                      ]}
                    >
                      <View
                        style={[
                          mStyles.qtyProgressFill,
                          {
                            width: `${Math.min((delivered / orderedQty) * 100, 100)}%`,
                            backgroundColor: isActuallyPartial
                              ? T.info
                              : T.success,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        mStyles.qtyProgressText,
                        { color: T.textSecondary },
                      ]}
                    >
                      {((delivered / orderedQty) * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Rate */}
              <View style={mStyles.field}>
                <Text style={[mStyles.fieldLabel, { color: T.textSecondary }]}>
                  ডেলিভারি দর (প্রতি PL)
                </Text>
                <View
                  style={[
                    mStyles.inputRow,
                    { borderColor: T.border, backgroundColor: T.inputBg },
                  ]}
                >
                  <TextInput
                    style={[mStyles.input, { color: T.textPrimary }]}
                    value={deliveryRate}
                    onChangeText={setDeliveryRate}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={T.textMuted}
                  />
                  <Text style={[mStyles.inputSuffix, { color: T.textMuted }]}>
                    ৳
                  </Text>
                </View>
              </View>

              {/* Payment */}
              <View style={mStyles.field}>
                <Text style={[mStyles.fieldLabel, { color: T.textSecondary }]}>
                  আজকের পেমেন্ট
                </Text>
                <View
                  style={[
                    mStyles.inputRow,
                    { borderColor: T.border, backgroundColor: T.inputBg },
                  ]}
                >
                  <TextInput
                    style={[mStyles.input, { color: T.textPrimary }]}
                    value={payment}
                    onChangeText={setPayment}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={T.textMuted}
                  />
                  <Text style={[mStyles.inputSuffix, { color: T.textMuted }]}>
                    ৳
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary calc */}
            <View style={[mStyles.calcCard, { backgroundColor: T.surface }]}>
              <Text style={[mStyles.calcTitle, { color: T.textSecondary }]}>
                হিসাব সারসংক্ষেপ
              </Text>
              {[
                {
                  label: `মোট মূল্য (${delivered.toLocaleString()} × ${rate})`,
                  val: formatCurrency(finalAmt),
                  color: T.textPrimary,
                },
                {
                  label: "আগাম জমা",
                  val: `- ${formatCurrency(advance)}`,
                  color: T.success,
                },
                {
                  label: "আজকের পেমেন্ট",
                  val: `- ${formatCurrency(paid)}`,
                  color: T.success,
                },
              ].map((r, i) => (
                <View
                  key={i}
                  style={[mStyles.calcRow, { borderBottomColor: T.border }]}
                >
                  <Text style={[mStyles.calcLabel, { color: T.textSecondary }]}>
                    {r.label}
                  </Text>
                  <Text style={[mStyles.calcVal, { color: r.color }]}>
                    {r.val}
                  </Text>
                </View>
              ))}
              <View
                style={[
                  mStyles.calcRow,
                  mStyles.calcRowTotal,
                  {
                    backgroundColor: dueAmt > 0 ? T.dangerSoft : T.successSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    mStyles.calcLabel,
                    { fontWeight: "800", color: T.textPrimary },
                  ]}
                >
                  বাকি
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "900",
                    color: dueAmt > 0 ? T.danger : T.success,
                  }}
                >
                  {formatCurrency(dueAmt)}
                </Text>
              </View>
              {isActuallyPartial && (
                <View
                  style={[
                    mStyles.calcRow,
                    {
                      backgroundColor: T.infoSoft,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      marginTop: 6,
                    },
                  ]}
                >
                  <Text style={[mStyles.calcLabel, { color: T.info }]}>
                    নতুন অর্ডার (বাকি PL)
                  </Text>
                  <Text
                    style={[
                      mStyles.calcVal,
                      { color: T.info, fontWeight: "800" },
                    ]}
                  >
                    {remaining.toLocaleString()} PL
                  </Text>
                </View>
              )}
            </View>

            {/* Due date */}
            {dueAmt > 0 && (
              <View
                style={[mStyles.dueDateCard, { backgroundColor: T.dangerSoft }]}
              >
                <Ionicons name="calendar-outline" size={16} color={T.danger} />
                <Text style={[mStyles.dueDateLabel, { color: T.danger }]}>
                  বাকি পরিশোধের তারিখ
                </Text>
                <TextInput
                  style={[
                    mStyles.dueDateInput,
                    { color: T.danger, borderColor: T.danger },
                  ]}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={T.danger + "80"}
                />
              </View>
            )}

            {/* Notes */}
            <View style={[mStyles.notesCard, { backgroundColor: T.surface }]}>
              <TextInput
                style={[
                  mStyles.notesInput,
                  { borderColor: T.border, color: T.textPrimary },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="নোট (ঐচ্ছিক)..."
                placeholderTextColor={T.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Submit */}
          <View
            style={[
              mStyles.footer,
              { backgroundColor: T.surface, borderTopColor: T.border },
            ]}
          >
            <TouchableOpacity
              style={[mStyles.submitBtn, { backgroundColor: T.success }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={
                      isActuallyPartial
                        ? "git-branch-outline"
                        : "checkmark-circle"
                    }
                    size={20}
                    color="#fff"
                  />
                  <Text style={mStyles.submitBtnText}>
                    {isActuallyPartial
                      ? "আংশিক ডেলিভারি নিশ্চিত"
                      : "ডেলিভারি নিশ্চিত করুন"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Batch Order Row ───────────────────────────────────────────────────────────
const BatchOrderRow = ({
  batchOrder,
  onDeliver,
  onUnbatch,
}: {
  batchOrder: BatchOrder;
  onDeliver: () => void;
  onUnbatch: () => void;
}) => {
  const T = useTheme();
  const STATUS = getStatusConfig(T);
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType) ?? T.accent;
  const st =
    STATUS[batchOrder.deliveryStatus as keyof typeof STATUS] ?? STATUS.pending;

  return (
    <View
      style={[
        rowStyles.card,
        { backgroundColor: T.surface },
        batchOrder.deliveryStatus === "delivered" && rowStyles.cardDone,
      ]}
    >
      <View style={[rowStyles.typeBar, { backgroundColor: typeColor }]} />
      <View style={{ flex: 1, paddingLeft: 10 }}>
        {/* Top */}
        <View style={rowStyles.top}>
          <Text style={[rowStyles.customerName, { color: T.textPrimary }]}>
            {batchOrder.order.customerName}
          </Text>
          <View style={[rowStyles.statusPill, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={11} color={st.color} />
            <Text style={[rowStyles.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>
        </View>

        <Text style={[rowStyles.mobile, { color: T.textSecondary }]}>
          {batchOrder.order.customerMobile}
        </Text>

        {/* Type + Qty */}
        <View style={rowStyles.metaRow}>
          <View
            style={[rowStyles.typePill, { backgroundColor: typeColor + "20" }]}
          >
            <Text style={[rowStyles.typeText, { color: typeColor }]}>
              {batchOrder.order.ponaType}
            </Text>
          </View>
          <Text style={[rowStyles.qty, { color: T.textPrimary }]}>
            {batchOrder.deliveryStatus !== "pending"
              ? `${(batchOrder.deliveredQuantity || 0).toLocaleString()} / ${batchOrder.order.plQuantity.toLocaleString()} PL`
              : `${batchOrder.order.plQuantity.toLocaleString()} PL`}
          </Text>
          {batchOrder.deliveryStatus === "partial" && (
            <View
              style={[rowStyles.partialBadge, { backgroundColor: T.infoSoft }]}
            >
              <Text style={[rowStyles.partialBadgeText, { color: T.info }]}>
                আংশিক
              </Text>
            </View>
          )}
        </View>

        {/* Financial info after delivery */}
        {batchOrder.deliveryStatus !== "pending" && (
          <View style={rowStyles.deliveredInfo}>
            <Text
              style={[rowStyles.deliveredInfoItem, { color: T.textSecondary }]}
            >
              পেয়েছি:{" "}
              <Text style={{ color: T.success, fontWeight: "700" }}>
                {formatCurrency(batchOrder.customerPayment || 0)}
              </Text>
            </Text>
            {(batchOrder.dueAmount || 0) > 0 && (
              <Text
                style={[
                  rowStyles.deliveredInfoItem,
                  { color: T.textSecondary },
                ]}
              >
                বাকি:{" "}
                <Text style={{ color: T.danger, fontWeight: "700" }}>
                  {formatCurrency(batchOrder.dueAmount || 0)}
                </Text>
                {batchOrder.duePaymentDate ? (
                  <Text style={{ color: T.textMuted }}>
                    {" "}
                    ({formatDate(batchOrder.duePaymentDate)} এর মধ্যে)
                  </Text>
                ) : null}
              </Text>
            )}
          </View>
        )}

        {/* Action buttons */}
        {batchOrder.deliveryStatus === "pending" && (
          <View style={rowStyles.actionRow}>
            <TouchableOpacity
              style={[rowStyles.deliverBtn, { backgroundColor: T.accent }]}
              onPress={onDeliver}
            >
              <Ionicons name="boat" size={13} color="#fff" />
              <Text style={rowStyles.deliverBtnText}>ডেলিভারি</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rowStyles.unbatchBtn, { borderColor: T.danger }]}
              onPress={onUnbatch}
            >
              <Ionicons
                name="remove-circle-outline"
                size={13}
                color={T.danger}
              />
              <Text style={[rowStyles.unbatchBtnText, { color: T.danger }]}>
                আনব্যাচ
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const BatchDetailsScreen = () => {
  const T = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { batchId } = route.params;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBO, setSelectedBO] = useState<BatchOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBatch = useCallback(async () => {
    try {
      const res = await batchAPI.getById(batchId);
      setBatch(res.data.data);
    } catch {
      Alert.alert("ত্রুটি", "ব্যাচ লোড হয়নি");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
  }, []);

  const handleUnbatch = (bo: BatchOrder) => {
    Alert.alert(
      "আনব্যাচ করুন",
      `"${bo.order.customerName}" এর অর্ডারটি ব্যাচ থেকে সরাতে চান?\n\nঅর্ডারটি pending হয়ে যাবে।`,
      [
        { text: "না", style: "cancel" },
        {
          text: "হ্যাঁ, সরাও",
          style: "destructive",
          onPress: async () => {
            try {
              await batchAPI.removeOrder(batchId, bo.id);
              fetchBatch();
            } catch {
              Alert.alert("ত্রুটি", "আনব্যাচ ব্যর্থ হয়েছে");
            }
          },
        },
      ],
    );
  };

  const handleDeliverySubmit = async (data: any) => {
    if (!selectedBO) return;
    setSaving(true);
    try {
      await batchAPI.recordDelivery(batchId, selectedBO.id, data);
      setModalVisible(false);
      setSelectedBO(null);
      await fetchBatch();
      Alert.alert(
        "সফল!",
        data.isPartial
          ? `আংশিক ডেলিভারি সম্পন্ন। বাকি ${data.remainingQuantity.toLocaleString()} PL নতুন অর্ডার হিসেবে যোগ হয়েছে।`
          : "ডেলিভারি সম্পন্ন হয়েছে!",
      );
    } catch (err: any) {
      Alert.alert(
        "ত্রুটি",
        err.response?.data?.message || "ডেলিভারি রেকর্ড ব্যর্থ",
      );
    } finally {
      setSaving(false);
    }
  };

  const pendingCount =
    batch?.batchOrders?.filter((o) => o.deliveryStatus === "pending").length ||
    0;
  const deliveredCount =
    batch?.batchOrders?.filter((o) => o.deliveryStatus !== "pending").length ||
    0;
  const totalOrders = batch?.batchOrders?.length || 0;
  const canComplete =
    batch?.status !== "completed" && pendingCount === 0 && totalOrders > 0;

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  if (!batch) return null;

  const PONA_CHIPS = [
    { key: "Golda", label: "গলদা", color: "#F5A623" },
    { key: "Bagda", label: "বাগদা", color: "#1E88E5" },
    { key: "Vannamei", label: "ভেনামি", color: "#43A047" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBatch();
            }}
            colors={[T.accent]}
            tintColor={T.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ── */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: T.surface, borderBottomColor: T.border },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.batchNum, { color: T.textPrimary }]}>
                {batch.batchNumber}
              </Text>
              <Text style={[styles.batchDate, { color: T.textSecondary }]}>
                {formatDate(batch.batchDate)}
              </Text>
            </View>
            <View
              style={[
                styles.progressCircle,
                { backgroundColor: T.accentSoft, borderColor: T.accent },
              ]}
            >
              <Text style={[styles.progressNum, { color: T.accent }]}>
                {deliveredCount}/{totalOrders}
              </Text>
              <Text style={[styles.progressLabel, { color: T.accent }]}>
                সম্পন্ন
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressBg, { backgroundColor: T.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    totalOrders > 0
                      ? `${(deliveredCount / totalOrders) * 100}%`
                      : "0%",
                  backgroundColor: T.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: T.textSecondary }]}>
            {pendingCount > 0
              ? `${pendingCount} টি বাকি আছে`
              : "সব ডেলিভারি সম্পন্ন ✓"}
          </Text>

          {/* Pona chips */}
          <View style={styles.ponaRow}>
            {PONA_CHIPS.map(({ key, label, color }) => {
              const ordered = (batch as any)[`totalOrdered${key}`] ?? 0;
              const delivered = (batch as any)[`totalDelivered${key}`] ?? 0;
              if (ordered === 0) return null;
              return (
                <View
                  key={key}
                  style={[
                    styles.ponaChip,
                    { backgroundColor: color + "18", borderColor: color },
                  ]}
                >
                  <Text style={[styles.ponaChipTitle, { color }]}>{label}</Text>
                  <Text style={[styles.ponaChipSub, { color }]}>
                    {delivered}/{ordered}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Financial row */}
          <View style={styles.finRow}>
            <View style={[styles.finItem, { backgroundColor: T.successSoft }]}>
              <Text style={[styles.finLabel, { color: T.textSecondary }]}>
                প্রাপ্ত
              </Text>
              <Text style={[styles.finVal, { color: T.success }]}>
                {formatCurrency(batch.totalCollected)}
              </Text>
            </View>
            {(batch.totalDue ?? 0) > 0 && (
              <View
                style={[
                  styles.finItem,
                  styles.dueItem,
                  { backgroundColor: T.dangerSoft },
                ]}
              >
                <Text style={[styles.finLabel, { color: T.textSecondary }]}>
                  বাকি
                </Text>
                <Text style={[styles.finVal, { color: T.danger }]}>
                  {formatCurrency(batch.totalDue)}
                </Text>
                {(batch.duePendingCount ?? 0) > 0 && (
                  <View
                    style={[
                      styles.duePeopleBadge,
                      { backgroundColor: T.danger },
                    ]}
                  >
                    <Text style={styles.duePeopleText}>
                      {batch.duePendingCount} জন
                    </Text>
                  </View>
                )}
              </View>
            )}
            <View style={[styles.finItem, { backgroundColor: T.accentSoft }]}>
              <Text style={[styles.finLabel, { color: T.textSecondary }]}>
                অর্ডার
              </Text>
              <Text style={[styles.finVal, { color: T.accent }]}>
                {totalOrders} টি
              </Text>
            </View>
          </View>
        </View>

        {/* ── Legend ── */}
        <View
          style={[
            styles.legendRow,
            { backgroundColor: T.surface, borderTopColor: T.border },
          ]}
        >
          {[
            { color: "#F5A623", label: "পেন্ডিং" },
            { color: "#1E88E5", label: "আংশিক" },
            { color: "#43A047", label: "সম্পন্ন" },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={[styles.legendText, { color: T.textSecondary }]}>
                {l.label}
              </Text>
            </View>
          ))}
          <View style={styles.legendSep} />
          <Ionicons name="remove-circle-outline" size={14} color={T.danger} />
          <Text style={[styles.legendText, { color: T.textSecondary }]}>
            আনব্যাচ
          </Text>
        </View>

        {/* ── Order list ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>
            অর্ডার তালিকা ({totalOrders} টি)
          </Text>
          <View style={styles.orderList}>
            {batch.batchOrders?.map((bo) => (
              <BatchOrderRow
                key={bo.id}
                batchOrder={bo}
                onDeliver={() => {
                  setSelectedBO(bo);
                  setModalVisible(true);
                }}
                onUnbatch={() => handleUnbatch(bo)}
              />
            ))}
          </View>
        </View>

        {/* ── Expenses ── */}
        {batch.expenses && batch.expenses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>
              খরচের বিবরণ
            </Text>
            <View style={[styles.expenseCard, { backgroundColor: T.surface }]}>
              {batch.expenses.map((e: any, i: number) => (
                <View
                  key={i}
                  style={[styles.expenseRow, { borderBottomColor: T.border }]}
                >
                  <Text
                    style={[styles.expenseLabel, { color: T.textSecondary }]}
                  >
                    {e.label}
                  </Text>
                  <Text style={[styles.expenseAmt, { color: T.textPrimary }]}>
                    {formatCurrency(e.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.expenseRow, styles.expenseTotal]}>
                <Text
                  style={[styles.expenseTotalLabel, { color: T.textPrimary }]}
                >
                  মোট খরচ
                </Text>
                <Text style={[styles.expenseTotalAmt, { color: T.warning }]}>
                  {formatCurrency(batch.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom bar ── */}
      {batch.status !== "completed" && (
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: T.surface, borderTopColor: T.border },
          ]}
        >
          {!canComplete ? (
            <View
              style={[styles.pendingWarn, { backgroundColor: T.warningSoft }]}
            >
              <Ionicons name="warning-outline" size={18} color={T.warning} />
              <Text style={[styles.pendingWarnText, { color: T.warning }]}>
                {pendingCount} টি ডেলিভারি বাকি। সব ডেলিভারি করলে ব্যাচ কমপ্লিট
                করা যাবে।
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: T.success }]}
              onPress={() =>
                navigation.navigate("CompleteBatch", { batchId: batch.id })
              }
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>
                খরচ দিয়ে ব্যাচ কমপ্লিট করুন
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <DeliveryModal
        visible={modalVisible}
        batchOrder={selectedBO}
        onClose={() => {
          setModalVisible(false);
          setSelectedBO(null);
        }}
        onSubmit={handleDeliverySubmit}
        saving={saving}
      />
    </View>
  );
};

// ─── Styles (color-neutral) ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerCard: { padding: 16, borderBottomWidth: 1 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  batchNum: { fontSize: 20, fontWeight: "900" },
  batchDate: { fontSize: 13, marginTop: 2 },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  progressNum: { fontSize: 14, fontWeight: "800" },
  progressLabel: { fontSize: 9 },
  progressBg: { height: 8, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 11, marginBottom: 12 },
  ponaRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  ponaChip: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  ponaChipTitle: { fontSize: 11, fontWeight: "800" },
  ponaChipSub: { fontSize: 11, fontWeight: "600" },
  finRow: { flexDirection: "row", gap: 8 },
  finItem: { flex: 1, alignItems: "center", padding: 8, borderRadius: 8 },
  dueItem: {},
  finLabel: { fontSize: 11 },
  finVal: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  duePeopleBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  duePeopleText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  legendSep: { flex: 1 },
  section: { paddingHorizontal: 12, paddingTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  orderList: { gap: 8 },
  expenseCard: { borderRadius: 10, padding: 12 },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  expenseLabel: { fontSize: 13 },
  expenseAmt: { fontSize: 13, fontWeight: "700" },
  expenseTotal: { borderBottomWidth: 0, marginTop: 4 },
  expenseTotalLabel: { fontSize: 14, fontWeight: "800" },
  expenseTotalAmt: { fontSize: 16, fontWeight: "900" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    borderTopWidth: 1,
    elevation: 10,
  },
  pendingWarn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  pendingWarnText: { flex: 1, fontSize: 12, fontWeight: "600" },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  completeBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
  },
  cardDone: { opacity: 0.85 },
  typeBar: { width: 5, alignSelf: "stretch" },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingRight: 10,
  },
  customerName: { fontSize: 14, fontWeight: "700", flex: 1 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  mobile: { fontSize: 12, paddingRight: 10, marginTop: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingRight: 10,
  },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: "700" },
  qty: { fontSize: 12, fontWeight: "600" },
  partialBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  partialBadgeText: { fontSize: 9, fontWeight: "700" },
  deliveredInfo: { paddingBottom: 10, paddingRight: 10, marginTop: 4, gap: 2 },
  deliveredInfoItem: { fontSize: 12 },
  actionRow: { flexDirection: "row", gap: 8, padding: 10, paddingTop: 6 },
  deliverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deliverBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  unbatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unbatchBtnText: { fontSize: 11, fontWeight: "700" },
});

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  headerSub: { fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "700" },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  partialToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  partialToggleTitle: { fontSize: 14, fontWeight: "700" },
  partialToggleSub: { fontSize: 11, marginTop: 2 },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  partialBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 8,
    padding: 10,
  },
  partialBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  fieldsCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
  },
  input: { flex: 1, padding: 11, fontSize: 15 },
  inputSuffix: { paddingRight: 12, fontSize: 13, fontWeight: "700" },
  qtyProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  qtyProgressBg: { flex: 1, height: 6, borderRadius: 3 },
  qtyProgressFill: { height: 6, borderRadius: 3 },
  qtyProgressText: { fontSize: 11, fontWeight: "700", width: 36 },
  calcCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  calcTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  calcRowTotal: {
    borderBottomWidth: 0,
    marginTop: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  calcLabel: { fontSize: 13 },
  calcVal: { fontSize: 14, fontWeight: "700" },
  dueDateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
  },
  dueDateLabel: { fontSize: 12, fontWeight: "600" },
  dueDateInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
  },
  notesCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  footer: { padding: 14, borderTopWidth: 1 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 15,
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
