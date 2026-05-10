// src/screens/reports/ReportsDashboardScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import dayjs from 'dayjs';

const ReportCard = ({ icon, title, description, onPress, color }: any) => (
  <TouchableOpacity style={[styles.reportCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.reportIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.reportTitle}>{title}</Text>
      <Text style={styles.reportDesc}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

export const ReportsDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reports</Text>

        <View style={styles.dateInputRow}>
          <TextInput
            style={styles.dateInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('DailyReport', { date: selectedDate })}
          >
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <ReportCard
          icon="calendar-outline"
          title="Daily Sales Report"
          description="View sales for a specific day"
          color={COLORS.primary}
          onPress={() => navigation.navigate('DailyReport', { date: selectedDate })}
        />

        <ReportCard
          icon="people-outline"
          title="Customer Due Report"
          description="Track all pending customer payments"
          color={COLORS.danger}
          onPress={() => navigation.navigate('CustomerDueReport')}
        />

        <ReportCard
          icon="card-outline"
          title="Expense Report"
          description="View expenses by category"
          color={COLORS.warning}
          onPress={() => navigation.navigate('ExpenseReport')}
        />
      </View>

      {/* Monthly Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Reports</Text>

        <View style={styles.dateInputRow}>
          <TextInput
            style={styles.dateInput}
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            placeholder="YYYY-MM"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('MonthlyReport', { month: selectedMonth })}
          >
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <ReportCard
          icon="bar-chart-outline"
          title="Monthly Summary"
          description="Complete month overview with all details"
          color={COLORS.info}
          onPress={() => navigation.navigate('MonthlyReport', { month: selectedMonth })}
        />

        <ReportCard
          icon="trending-up-outline"
          title="Profit/Loss Report"
          description="Monthly profit and loss analysis"
          color={COLORS.success}
          onPress={() => navigation.navigate('ProfitLossReport')}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  dateInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dateInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  quickBtn: { backgroundColor: COLORS.primary, borderRadius: 10, width: 48, alignItems: 'center', justifyContent: 'center' },
  reportCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    borderTopWidth: 3, marginBottom: 10, elevation: 1,
  },
  reportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  reportDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
