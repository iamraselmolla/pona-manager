// src/components/SalesReportGenerator.tsx
// Drop this component anywhere in OrderListScreen
// Usage: <SalesReportGenerator orders={deliveredOrders} />

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { orderAPI } from '../../api/services';
import * as FileSystem from 'expo-file-system';

// ─── Theme ──────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F4F5F9',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.10)',
  success: '#18B565',
  successSoft: 'rgba(24,181,101,0.10)',
  inputBg: '#F4F5F9',
  overlay: 'rgba(0,0,0,0.45)',
};
const DARK = {
  bg: '#0F1117',
  surface: '#1A1D27',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F0F2FF',
  textSecondary: '#8A8FA8',
  textMuted: '#545872',
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.15)',
  success: '#2ECC71',
  successSoft: 'rgba(46,204,113,0.12)',
  inputBg: '#0F1117',
  overlay: 'rgba(0,0,0,0.65)',
};
const useTheme = () => (useColorScheme() === 'dark' ? DARK : LIGHT);

// ─── HTML Report Template ────────────────────────────────────────────────────────

const buildHTML = (orders: any[], fromDate: string, toDate: string) => {
  const totalPL = orders.reduce((sum, o) => sum + (o.deliveredQuantity ?? o.plQuantity ?? 0), 0);

  const rows = orders
    .map(
      (o, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${o.customerName || '-'}</td>
        <td>${o.customerAddress || '-'}</td>
        <td>${o.customerMobile || '-'}</td>
        <td>${o.deliveryDate || '-'}</td>
        <td>${(o.deliveredQuantity ?? o.plQuantity ?? 0).toLocaleString()}</td>
      </tr>
    `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<style>

  body{
    font-family: Arial, sans-serif;
    padding: 24px;
    color:#111;
    font-size:11px;
  }

  .top{
    text-align:center;
    margin-bottom:14px;
  }

  .title{
    font-size:18px;
    font-weight:bold;
    margin-bottom:4px;
  }

  .company{
    font-size:15px;
    font-weight:bold;
  }

  .address{
    font-size:11px;
    margin-top:2px;
  }

  .meta{
    margin-top:8px;
    font-size:11px;
    display:flex;
    justify-content:space-between;
  }

  table{
    width:100%;
    border-collapse:collapse;
    margin-top:14px;
  }

  th{
    border:1px solid #000;
    padding:7px 4px;
    text-align:center;
    background:#f1f1f1;
    font-weight:bold;
    font-size:11px;
  }

  td{
    border:1px solid #000;
    padding:6px 4px;
    font-size:10px;
  }

  .center{
    text-align:center;
  }

  .right{
    text-align:right;
  }

  .total-row td{
    font-weight:bold;
    background:#f5f5f5;
  }

  .footer{
    margin-top:50px;
    display:flex;
    justify-content:space-between;
    font-size:11px;
  }

  .sign{
    text-align:center;
    width:200px;
  }

  .sign-line{
    border-top:1px solid #000;
    margin-top:40px;
    padding-top:4px;
  }

</style>
</head>

<body>

  <div class="top">
    <div class="title">
      অল মেল (SPF) পি.এল বিক্রয়ের হিসাব
    </div>

    <div class="company">
      ওয়েসিস একুয়া কালচার
    </div>

    <div class="address">
      শিয়ালীডাঙ্গা, রামপাল, বাগেরহাট
    </div>
  </div>

  <div class="meta">
    <div>
      <b>ডিস্ট্রিবিউটর আইডি:</b> RMPL602
    </div>

    <div>
      <b>তারিখ:</b> ${fromDate} → ${toDate}
    </div>
  </div>

  <table>

    <thead>
      <tr>
        <th style="width:6%">ক্রঃ</th>
        <th style="width:22%">গ্রাহকের নাম</th>
        <th style="width:28%">ঠিকানা</th>
        <th style="width:18%">মোবাইল</th>
        <th style="width:14%">তারিখ</th>
        <th style="width:12%">পরিমাণ</th>
      </tr>
    </thead>

    <tbody>

      ${rows}

      <tr class="total-row">
        <td colspan="5" class="right">
          সর্বমোট
        </td>

        <td class="center">
          ${totalPL.toLocaleString()} PL
        </td>
      </tr>

    </tbody>

  </table>

  <div class="footer">

    <div class="sign">
      <div class="sign-line">
        ডিস্ট্রিবিউটরের স্বাক্ষর
      </div>
    </div>

    <div class="sign">
      <div class="sign-line">
        কর্তৃপক্ষের স্বাক্ষর
      </div>
    </div>

  </div>

</body>
</html>
`;
};

// ─── Component ───────────────────────────────────────────────────────────────────

type Props = { fetchDeliveredOrders: (from: string, to: string) => Promise<any[]> };
export const SalesReportGenerator: React.FC<Props> = ({ fetchDeliveredOrders }) => {
  const T = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = () => new Date().toISOString().split('T')[0];

  const openModal = () => {
    const t = today();
    setFromDate(t);
    setToDate(t);
    setError('');
    setShowModal(true);
  };

  const validateDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');

      // validate
      if (!validateDate(fromDate)) {
        setError('Invalid from date');
        return;
      }

      if (!validateDate(toDate)) {
        setError('Invalid to date');
        return;
      }

      // fetch delivered orders
      const orders = await fetchDeliveredOrders(fromDate, toDate);

      if (!orders?.length) {
        setError('No delivered orders found');
        return;
      }

      // build html
      const html = buildHTML(orders, fromDate, toDate);

      // create pdf silently
      const pdf = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // filename
      const fileName = `Delivered-Orders-${fromDate}-to-${toDate}.pdf`;

      // save path
      const pdfPath = FileSystem.documentDirectory + fileName;

      // move pdf
      await FileSystem.moveAsync({
        from: pdf.uri,
        to: pdfPath,
      });

      console.log('PDF SAVED => ', pdfPath);

      setShowModal(false);

      alert('PDF downloaded successfully');
    } catch (err) {
      console.log(err);

      setError('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button — put this in your OrderListScreen header/filter area */}
      <TouchableOpacity
        style={[btn.trigger, { backgroundColor: T.accentSoft, borderColor: T.accent }]}
        onPress={openModal}
        activeOpacity={0.8}
      >
        <Ionicons name="document-text-outline" size={15} color={T.accent} />
        <Text style={[btn.triggerText, { color: T.accent }]}>রিপোর্ট</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade" statusBarTranslucent>
        <View style={[modal.overlay, { backgroundColor: T.overlay }]}>
          <View style={[modal.box, { backgroundColor: T.surface, borderColor: T.border }]}>
            {/* Header */}
            <View style={modal.header}>
              <View style={[modal.iconWrap, { backgroundColor: T.accentSoft }]}>
                <Ionicons name="document-text-outline" size={22} color={T.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[modal.title, { color: T.textPrimary }]}>বিক্রয় রিপোর্ট</Text>
                <Text style={[modal.sub, { color: T.textMuted }]}>তারিখ পরিসর বেছে নিন</Text>
              </View>
              <TouchableOpacity
                onPress={() => !loading && setShowModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[modal.divider, { backgroundColor: T.border }]} />

            {/* Date inputs */}
            <View style={modal.row}>
              <View style={{ flex: 1 }}>
                <Text style={[modal.label, { color: T.textMuted }]}>শুরুর তারিখ</Text>
                <View
                  style={[modal.inputWrap, { borderColor: T.border, backgroundColor: T.inputBg }]}
                >
                  <Ionicons name="calendar-outline" size={14} color={T.textMuted} />
                  <TextInput
                    style={[modal.input, { color: T.textPrimary }]}
                    value={fromDate}
                    onChangeText={setFromDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={T.textMuted}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
              <Text style={[modal.arrow, { color: T.textMuted }]}>→</Text>
              <View style={{ flex: 1 }}>
                <Text style={[modal.label, { color: T.textMuted }]}>শেষের তারিখ</Text>
                <View
                  style={[modal.inputWrap, { borderColor: T.border, backgroundColor: T.inputBg }]}
                >
                  <Ionicons name="calendar-outline" size={14} color={T.textMuted} />
                  <TextInput
                    style={[modal.input, { color: T.textPrimary }]}
                    value={toDate}
                    onChangeText={setToDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={T.textMuted}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            </View>

            {/* Quick selectors */}
            <View style={modal.quickRow}>
              {[
                { label: 'আজ', from: today(), to: today() },
                {
                  label: 'এই সপ্তাহ',
                  from: (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - d.getDay());
                    return d.toISOString().split('T')[0];
                  })(),
                  to: today(),
                },
                {
                  label: 'এই মাস',
                  from: (() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                  })(),
                  to: today(),
                },
              ].map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={[modal.quickBtn, { borderColor: T.border, backgroundColor: T.inputBg }]}
                  onPress={() => {
                    setFromDate(q.from);
                    setToDate(q.to);
                    setError('');
                  }}
                >
                  <Text style={[modal.quickBtnText, { color: T.textSecondary }]}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error */}
            {!!error && (
              <View style={[modal.errorBox, { backgroundColor: 'rgba(240,63,95,0.09)' }]}>
                <Ionicons name="alert-circle-outline" size={13} color="#F03F5F" />
                <Text style={[modal.errorText, { color: '#F03F5F' }]}>{error}</Text>
              </View>
            )}

            {/* Generate button */}
            <TouchableOpacity
              style={[modal.generateBtn, { backgroundColor: loading ? T.accent + '80' : T.accent }]}
              onPress={handleGenerate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={17} color="#fff" />
                  <Text style={modal.generateBtnText}>PDF তৈরি করুন</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────────
const btn = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  triggerText: { fontSize: 12, fontWeight: '700' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  box: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 12 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 13 },
  arrow: { fontSize: 18, fontWeight: '300', marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  quickBtn: { flex: 1, borderRadius: 9, borderWidth: 1, paddingVertical: 8, alignItems: 'center' },
  quickBtnText: { fontSize: 11, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { fontSize: 12, fontWeight: '500', flex: 1 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  generateBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
