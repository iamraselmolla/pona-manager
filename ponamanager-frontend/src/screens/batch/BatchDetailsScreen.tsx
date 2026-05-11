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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { batchAPI } from "../../api/batchServices";
import { Batch, BatchOrder } from "../../types";
import { COLORS } from "../../constants";
import {
  formatCurrency,
  formatDate,
  getPonaTypeColor,
} from "../../utils/helpers";

// ── Status config ────────────────────────────────────────
const STATUS = {
  pending: {
    label: "পেন্ডিং",
    color: "#F5A623",
    bg: "#FFF8E1",
    icon: "time-outline" as const,
  },
  delivered: {
    label: "সম্পন্ন",
    color: "#43A047",
    bg: "#E8F5E9",
    icon: "checkmark-circle-outline" as const,
  },
  partial: {
    label: "আংশিক",
    color: "#1E88E5",
    bg: "#E3F2FD",
    icon: "git-branch-outline" as const,
  },
};

// ── Delivery Modal ───────────────────────────────────────
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

  const typeColor = getPonaTypeColor(batchOrder.order.ponaType);

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
        <View style={mStyles.container}>
          {/* Header */}
          <View style={mStyles.header}>
            <View>
              <Text style={mStyles.headerTitle}>ডেলিভারি এন্ট্রি</Text>
              <Text style={mStyles.headerSub}>
                {batchOrder.order.customerName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Order info */}
            <View style={[mStyles.infoCard, { borderTopColor: typeColor }]}>
              <View style={mStyles.infoRow}>
                <Text style={mStyles.infoLabel}>পোনার ধরন</Text>
                <View
                  style={[
                    mStyles.typePill,
                    { backgroundColor: typeColor + "20" },
                  ]}
                >
                  <Text style={[mStyles.typePillText, { color: typeColor }]}>
                    {batchOrder.order.ponaType}
                  </Text>
                </View>
              </View>
              <View style={mStyles.infoRow}>
                <Text style={mStyles.infoLabel}>অর্ডার পরিমাণ</Text>
                <Text style={mStyles.infoValue}>
                  {orderedQty.toLocaleString()} PL
                </Text>
              </View>
              <View style={mStyles.infoRow}>
                <Text style={mStyles.infoLabel}>আগাম জমা</Text>
                <Text style={[mStyles.infoValue, { color: COLORS.success }]}>
                  {formatCurrency(advance)}
                </Text>
              </View>
            </View>

            {/* Partial toggle */}
            <View style={mStyles.partialToggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={mStyles.partialToggleTitle}>আংশিক ডেলিভারি?</Text>
                <Text style={mStyles.partialToggleSub}>
                  পুরো পরিমাণ দিতে না পারলে
                </Text>
              </View>
              <TouchableOpacity
                style={[mStyles.toggleBtn, isPartial && mStyles.toggleBtnOn]}
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

            {/* Partial info banner */}
            {isActuallyPartial && (
              <View style={mStyles.partialBanner}>
                <Ionicons name="information-circle" size={16} color="#1E88E5" />
                <Text style={mStyles.partialBannerText}>
                  বাকি {remaining.toLocaleString()} PL স্বয়ংক্রিয়ভাবে নতুন
                  pending অর্ডার হিসেবে যোগ হবে
                </Text>
              </View>
            )}

            {/* Fields */}
            <View style={mStyles.fieldsCard}>
              {/* Delivered qty */}
              <View style={mStyles.field}>
                <Text style={mStyles.fieldLabel}>
                  ডেলিভারিকৃত পরিমাণ
                  {isPartial && (
                    <Text style={{ color: COLORS.info }}> (আংশিক)</Text>
                  )}
                </Text>
                <View style={mStyles.inputRow}>
                  <TextInput
                    style={mStyles.input}
                    value={deliveredQty}
                    onChangeText={setDeliveredQty}
                    keyboardType="numeric"
                    placeholder={`সর্বোচ্চ ${orderedQty.toLocaleString()}`}
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={mStyles.inputSuffix}>PL</Text>
                </View>
                {/* Progress bar */}
                {delivered > 0 && (
                  <View style={mStyles.qtyProgress}>
                    <View style={mStyles.qtyProgressBg}>
                      <View
                        style={[
                          mStyles.qtyProgressFill,
                          {
                            width: `${Math.min((delivered / orderedQty) * 100, 100)}%`,
                            backgroundColor: isActuallyPartial
                              ? "#1E88E5"
                              : COLORS.success,
                          },
                        ]}
                      />
                    </View>
                    <Text style={mStyles.qtyProgressText}>
                      {((delivered / orderedQty) * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Rate */}
              <View style={mStyles.field}>
                <Text style={mStyles.fieldLabel}>ডেলিভারি দর (প্রতি PL)</Text>
                <View style={mStyles.inputRow}>
                  <TextInput
                    style={mStyles.input}
                    value={deliveryRate}
                    onChangeText={setDeliveryRate}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={mStyles.inputSuffix}>৳</Text>
                </View>
              </View>

              {/* Payment */}
              <View style={mStyles.field}>
                <Text style={mStyles.fieldLabel}>আজকের পেমেন্ট</Text>
                <View style={mStyles.inputRow}>
                  <TextInput
                    style={mStyles.input}
                    value={payment}
                    onChangeText={setPayment}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={mStyles.inputSuffix}>৳</Text>
                </View>
              </View>
            </View>

            {/* Summary calc */}
            <View style={mStyles.calcCard}>
              <Text style={mStyles.calcTitle}>হিসাব সারসংক্ষেপ</Text>
              <View style={mStyles.calcRow}>
                <Text style={mStyles.calcLabel}>
                  মোট মূল্য ({delivered.toLocaleString()} × {rate})
                </Text>
                <Text style={mStyles.calcVal}>{formatCurrency(finalAmt)}</Text>
              </View>
              <View style={mStyles.calcRow}>
                <Text style={mStyles.calcLabel}>আগাম জমা</Text>
                <Text style={[mStyles.calcVal, { color: COLORS.success }]}>
                  - {formatCurrency(advance)}
                </Text>
              </View>
              <View style={mStyles.calcRow}>
                <Text style={mStyles.calcLabel}>আজকের পেমেন্ট</Text>
                <Text style={[mStyles.calcVal, { color: COLORS.success }]}>
                  - {formatCurrency(paid)}
                </Text>
              </View>
              <View
                style={[
                  mStyles.calcRow,
                  mStyles.calcRowTotal,
                  {
                    backgroundColor:
                      dueAmt > 0 ? COLORS.dangerLight : COLORS.successLight,
                  },
                ]}
              >
                <Text style={[mStyles.calcLabel, { fontWeight: "800" }]}>
                  বাকি
                </Text>
                <Text
                  style={[
                    mStyles.calcVal,
                    {
                      color: dueAmt > 0 ? COLORS.danger : COLORS.success,
                      fontSize: 17,
                      fontWeight: "900",
                    },
                  ]}
                >
                  {formatCurrency(dueAmt)}
                </Text>
              </View>

              {isActuallyPartial && (
                <View
                  style={[
                    mStyles.calcRow,
                    {
                      backgroundColor: "#E3F2FD",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      marginTop: 6,
                    },
                  ]}
                >
                  <Text style={[mStyles.calcLabel, { color: "#1E88E5" }]}>
                    নতুন অর্ডার (বাকি PL)
                  </Text>
                  <Text
                    style={[
                      mStyles.calcVal,
                      { color: "#1E88E5", fontWeight: "800" },
                    ]}
                  >
                    {remaining.toLocaleString()} PL
                  </Text>
                </View>
              )}
            </View>

            {/* Due date */}
            {dueAmt > 0 && (
              <View style={mStyles.dueDateCard}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={COLORS.danger}
                />
                <Text style={mStyles.dueDateLabel}>বাকি পরিশোধের তারিখ</Text>
                <TextInput
                  style={mStyles.dueDateInput}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            )}

            {/* Notes */}
            <View style={mStyles.notesCard}>
              <TextInput
                style={mStyles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="নোট (ঐচ্ছিক)..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Submit */}
          <View style={mStyles.footer}>
            <TouchableOpacity
              style={mStyles.submitBtn}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name={
                      isActuallyPartial
                        ? "git-branch-outline"
                        : "checkmark-circle"
                    }
                    size={20}
                    color={COLORS.white}
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

// ── Batch Order Row ──────────────────────────────────────
const BatchOrderRow = ({
  batchOrder,
  onDeliver,
  onUnbatch,
}: {
  batchOrder: BatchOrder;
  onDeliver: () => void;
  onUnbatch: () => void;
}) => {
  const typeColor = getPonaTypeColor(batchOrder.order.ponaType);
  const st =
    batchOrder.deliveryStatus === "delivered"
      ? STATUS.delivered
      : batchOrder.deliveryStatus === "partial"
        ? STATUS.partial
        : STATUS.pending;

  return (
    <View
      style={[
        rowStyles.card,
        batchOrder.deliveryStatus === "delivered" && rowStyles.cardDone,
      ]}
    >
      <View style={[rowStyles.typeBar, { backgroundColor: typeColor }]} />

      <View style={{ flex: 1, paddingLeft: 10 }}>
        {/* Top */}
        <View style={rowStyles.top}>
          <Text style={rowStyles.customerName}>
            {batchOrder.order.customerName}
          </Text>
          <View style={[rowStyles.statusPill, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={11} color={st.color} />
            <Text style={[rowStyles.statusText, { color: st.color }]}>
              {st.label}
            </Text>
          </View>
        </View>

        <Text style={rowStyles.mobile}>{batchOrder.order.customerMobile}</Text>

        {/* Type + Qty */}
        <View style={rowStyles.metaRow}>
          <View
            style={[rowStyles.typePill, { backgroundColor: typeColor + "20" }]}
          >
            <Text style={[rowStyles.typeText, { color: typeColor }]}>
              {batchOrder.order.ponaType}
            </Text>
          </View>
          <Text style={rowStyles.qty}>
            {batchOrder.deliveryStatus === "delivered" ||
            batchOrder.deliveryStatus === "partial"
              ? `${(batchOrder.deliveredQuantity || 0).toLocaleString()} / ${batchOrder.order.plQuantity.toLocaleString()} PL`
              : `${batchOrder.order.plQuantity.toLocaleString()} PL`}
          </Text>
          {batchOrder.deliveryStatus === "partial" && (
            <View style={rowStyles.partialBadge}>
              <Text style={rowStyles.partialBadgeText}>আংশিক</Text>
            </View>
          )}
        </View>

        {/* Financial info after delivery */}
        {(batchOrder.deliveryStatus === "delivered" ||
          batchOrder.deliveryStatus === "partial") && (
          <View style={rowStyles.deliveredInfo}>
            <Text style={rowStyles.deliveredInfoItem}>
              পেয়েছি:{" "}
              <Text style={rowStyles.greenText}>
                {formatCurrency(batchOrder.customerPayment || 0)}
              </Text>
            </Text>
            {(batchOrder.dueAmount || 0) > 0 && (
              <Text style={rowStyles.deliveredInfoItem}>
                বাকি:{" "}
                <Text style={rowStyles.redText}>
                  {formatCurrency(batchOrder.dueAmount || 0)}
                </Text>
                {batchOrder.duePaymentDate ? (
                  <Text style={rowStyles.greyText}>
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
            <TouchableOpacity style={rowStyles.deliverBtn} onPress={onDeliver}>
              <Ionicons name="boat" size={13} color={COLORS.white} />
              <Text style={rowStyles.deliverBtnText}>ডেলিভারি</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rowStyles.unbatchBtn} onPress={onUnbatch}>
              <Ionicons
                name="remove-circle-outline"
                size={13}
                color={COLORS.danger}
              />
              <Text style={rowStyles.unbatchBtnText}>আনব্যাচ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────
export const BatchDetailsScreen = () => {
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

  // ── Unbatch ────────────────────────────────────────────
  const handleUnbatch = (bo: BatchOrder) => {
    Alert.alert(
      "আনব্যাচ করুন",
      `"${bo.order.customerName}" এর অর্ডারটি ব্যাচ থেকে সরাতে চান?\n\nঅর্ডারটি pending হয়ে যাবে এবং পরবর্তী ব্যাচে যোগ করা যাবে।`,
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

  // ── Record Delivery ────────────────────────────────────
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!batch) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBatch();
            }}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ── */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.batchNum}>{batch.batchNumber}</Text>
              <Text style={styles.batchDate}>
                {formatDate(batch.batchDate)}
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNum}>
                {deliveredCount}/{totalOrders}
              </Text>
              <Text style={styles.progressLabel}>সম্পন্ন</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    totalOrders > 0
                      ? `${(deliveredCount / totalOrders) * 100}%`
                      : "0%",
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {pendingCount > 0
              ? `${pendingCount} টি বাকি আছে`
              : "সব ডেলিভারি সম্পন্ন ✓"}
          </Text>

          {/* Pona chips */}
          <View style={styles.ponaRow}>
            {batch.totalOrderedGolda > 0 && (
              <View
                style={[
                  styles.ponaChip,
                  { backgroundColor: "#F5A62318", borderColor: "#F5A623" },
                ]}
              >
                <Text style={[styles.ponaChipTitle, { color: "#F5A623" }]}>
                  গলদা
                </Text>
                <Text style={[styles.ponaChipSub, { color: "#F5A623" }]}>
                  {batch.totalDeliveredGolda}/{batch.totalOrderedGolda}
                </Text>
              </View>
            )}
            {batch.totalOrderedBagda > 0 && (
              <View
                style={[
                  styles.ponaChip,
                  { backgroundColor: "#1E88E518", borderColor: "#1E88E5" },
                ]}
              >
                <Text style={[styles.ponaChipTitle, { color: "#1E88E5" }]}>
                  বাগদা
                </Text>
                <Text style={[styles.ponaChipSub, { color: "#1E88E5" }]}>
                  {batch.totalDeliveredBagda}/{batch.totalOrderedBagda}
                </Text>
              </View>
            )}
            {batch.totalOrderedVannamei > 0 && (
              <View
                style={[
                  styles.ponaChip,
                  { backgroundColor: "#43A04718", borderColor: "#43A047" },
                ]}
              >
                <Text style={[styles.ponaChipTitle, { color: "#43A047" }]}>
                  ভেনামি
                </Text>
                <Text style={[styles.ponaChipSub, { color: "#43A047" }]}>
                  {batch.totalDeliveredVannamei}/{batch.totalOrderedVannamei}
                </Text>
              </View>
            )}
          </View>

          {/* Financial row */}
          <View style={styles.finRow}>
            <View style={styles.finItem}>
              <Text style={styles.finLabel}>প্রাপ্ত</Text>
              <Text style={[styles.finVal, { color: COLORS.success }]}>
                {formatCurrency(batch.totalCollected)}
              </Text>
            </View>
            {batch.totalDue > 0 && (
              <View style={[styles.finItem, styles.dueItem]}>
                <Text style={styles.finLabel}>বাকি</Text>
                <Text style={[styles.finVal, { color: COLORS.danger }]}>
                  {formatCurrency(batch.totalDue)}
                </Text>
                <View style={styles.duePeopleBadge}>
                  <Text style={styles.duePeopleText}>
                    {batch.duePendingCount} জন
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.finItem}>
              <Text style={styles.finLabel}>অর্ডার</Text>
              <Text style={styles.finVal}>{totalOrders} টি</Text>
            </View>
          </View>
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendRow}>
          {[
            { color: "#F5A623", label: "পেন্ডিং" },
            { color: "#1E88E5", label: "আংশিক" },
            { color: "#43A047", label: "সম্পন্ন" },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
          <View style={styles.legendSep} />
          <Ionicons
            name="remove-circle-outline"
            size={14}
            color={COLORS.danger}
          />
          <Text style={styles.legendText}>আনব্যাচ করা যাবে</Text>
        </View>

        {/* ── Order list ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
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
            <Text style={styles.sectionTitle}>খরচের বিবরণ</Text>
            <View style={styles.expenseCard}>
              {batch.expenses.map((e, i) => (
                <View key={i} style={styles.expenseRow}>
                  <Text style={styles.expenseLabel}>{e.label}</Text>
                  <Text style={styles.expenseAmt}>
                    {formatCurrency(e.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.expenseRow, styles.expenseTotal]}>
                <Text style={styles.expenseTotalLabel}>মোট খরচ</Text>
                <Text style={styles.expenseTotalAmt}>
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
        <View style={styles.bottomBar}>
          {!canComplete ? (
            <View style={styles.pendingWarn}>
              <Ionicons
                name="warning-outline"
                size={18}
                color={COLORS.warning}
              />
              <Text style={styles.pendingWarnText}>
                {pendingCount} টি ডেলিভারি বাকি। সব ডেলিভারি করলে ব্যাচ কমপ্লিট
                করা যাবে।
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() =>
                navigation.navigate("CompleteBatch", { batchId: batch.id })
              }
            >
              <Ionicons
                name="checkmark-done-circle"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.completeBtnText}>
                খরচ দিয়ে ব্যাচ কমপ্লিট করুন
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Delivery Modal ── */}
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

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerCard: { backgroundColor: COLORS.white, padding: 16, elevation: 2 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  batchNum: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  batchDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  progressNum: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  progressLabel: { fontSize: 9, color: COLORS.primary },
  progressBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  progressText: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 12 },
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
  finItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  dueItem: { backgroundColor: COLORS.dangerLight },
  finLabel: { fontSize: 11, color: COLORS.textSecondary },
  finVal: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginTop: 2 },
  duePeopleBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  duePeopleText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  legendSep: { flex: 1 },
  section: { paddingHorizontal: 12, paddingTop: 14 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  orderList: { gap: 8 },
  expenseCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12 },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "50",
  },
  expenseLabel: { fontSize: 13, color: COLORS.textSecondary },
  expenseAmt: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  expenseTotal: { borderBottomWidth: 0, marginTop: 4 },
  expenseTotalLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  expenseTotalAmt: { fontSize: 16, fontWeight: "900", color: COLORS.warning },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 10,
  },
  pendingWarn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    padding: 12,
  },
  pendingWarnText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "600",
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
  },
  completeBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
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
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  mobile: {
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingRight: 10,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingRight: 10,
  },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: "700" },
  qty: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  partialBadge: {
    backgroundColor: "#E3F2FD",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  partialBadgeText: { fontSize: 9, fontWeight: "700", color: "#1E88E5" },
  deliveredInfo: { paddingBottom: 10, paddingRight: 10, marginTop: 4, gap: 2 },
  deliveredInfoItem: { fontSize: 12, color: COLORS.textSecondary },
  greenText: { color: COLORS.success, fontWeight: "700" },
  redText: { color: COLORS.danger, fontWeight: "700" },
  greyText: { color: COLORS.textMuted },
  actionRow: { flexDirection: "row", gap: 8, padding: 10, paddingTop: 6 },
  deliverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deliverBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  unbatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unbatchBtnText: { color: COLORS.danger, fontSize: 11, fontWeight: "700" },
});

const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: COLORS.white,
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
    borderBottomColor: COLORS.border + "50",
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  partialToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  partialToggleTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  partialToggleSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleBtnOn: { backgroundColor: COLORS.info },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  partialBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#E3F2FD",
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 8,
    padding: 10,
  },
  partialBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#1E88E5",
    fontWeight: "500",
    lineHeight: 18,
  },
  fieldsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  input: { flex: 1, padding: 11, fontSize: 15, color: COLORS.text },
  inputSuffix: {
    paddingRight: 12,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  qtyProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  qtyProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  qtyProgressFill: { height: 6, borderRadius: 3 },
  qtyProgressText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    width: 36,
  },
  calcCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  calcTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "50",
  },
  calcRowTotal: {
    borderBottomWidth: 0,
    marginTop: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  calcLabel: { fontSize: 13, color: COLORS.textSecondary },
  calcVal: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  dueDateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
  },
  dueDateLabel: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
  dueDateInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 6,
    padding: 6,
  },
  notesCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 15,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});
