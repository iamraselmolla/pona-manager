// src/screens/settings/AppSettingsScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../../store/appStore";
import { COLORS } from "../../constants";

const SettingRow = ({
  icon,
  label,
  value,
  onToggle,
  onPress,
  iconColor,
}: any) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onToggle ? 1 : 0.7}
  >
    <View
      style={[
        styles.rowIcon,
        { backgroundColor: (iconColor || COLORS.primary) + "20" },
      ]}
    >
      <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    {onToggle ? (
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    ) : (
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    )}
  </TouchableOpacity>
);

export const AppSettingsScreen = () => {
  const { isDarkMode, isBengali, toggleDarkMode, toggleBengali } =
    useAppStore();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.section}>সাধারণ সেটিংস</Text>
        <SettingRow
          icon="moon-outline"
          label="ডার্ক মোড"
          value={isDarkMode}
          onToggle={toggleDarkMode}
        />
        <SettingRow
          icon="language-outline"
          label="বাংলা ভাষা"
          value={isBengali}
          onToggle={toggleBengali}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>ডেটা ব্যবস্থাপনা</Text>
        <SettingRow
          icon="cloud-download-outline"
          label="ব্যাকআপ ও রিস্টোর"
          iconColor={COLORS.info}
          onPress={() =>
            Alert.alert("শীঘ্রই আসছে", "ব্যাকআপ ফিচার শীঘ্রই যুক্ত হবে")
          }
        />
        <SettingRow
          icon="sync-outline"
          label="ডেটা সিঙ্ক করুন"
          iconColor={COLORS.success}
          onPress={() => Alert.alert("সিঙ্ক", "ডেটা সিঙ্ক করা হচ্ছে...")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>অ্যাকাউন্ট</Text>
        <SettingRow
          icon="person-outline"
          label="প্রোফাইল"
          iconColor={COLORS.primary}
          onPress={() => navigation.navigate("Profile")}
        />
        <SettingRow
          icon="notifications-outline"
          label="নোটিফিকেশন সেটিংস"
          iconColor={COLORS.warning}
          onPress={() => Alert.alert("শীঘ্রই আসছে")}
        />
      </View>

      <View style={styles.versionCard}>
        <Ionicons name="fish" size={24} color={COLORS.primary} />
        <Text style={styles.appName}>ponamanager</Text>
        <Text style={styles.version}>v1.0.0 — পোনা ব্যবসা ম্যানেজমেন্ট</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  section: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "60",
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.text },
  versionCard: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  appName: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  version: { fontSize: 12, color: COLORS.textMuted },
});
