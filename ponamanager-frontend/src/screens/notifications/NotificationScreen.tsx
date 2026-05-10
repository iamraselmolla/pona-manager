// src/screens/notifications/NotificationScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { notificationAPI } from "../../api/services";
import { Notification } from "../../types";
import { COLORS } from "../../constants";
import { formatDateTime } from "../../utils/helpers";

const notificationIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  due_reminder: "alert-circle-outline",
  upcoming_delivery: "boat-outline",
  running_order: "hourglass-outline",
  daily_closing: "lock-closed-outline",
};

const notificationColors: Record<string, string> = {
  due_reminder: COLORS.danger,
  upcoming_delivery: COLORS.info,
  running_order: COLORS.warning,
  daily_closing: COLORS.primary,
};

export const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationAPI
      .getAll()
      .then((res) => {
        setNotifications(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const color = notificationColors[item.type] || COLORS.textSecondary;
        const icon = notificationIcons[item.type] || "notifications-outline";
        return (
          <TouchableOpacity
            style={[styles.notificationCard, !item.isRead && styles.unread]}
            onPress={() => handleMarkRead(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.icon, { backgroundColor: color + "20" }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons
            name="notifications-off-outline"
            size={60}
            color={COLORS.textMuted}
          />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      }
      contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
      style={styles.container}
    />
  );
};

// src/screens/settings/ProfileScreen.tsx
export const ProfileScreen = () => {
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color={COLORS.white} />
        </View>
        <Text style={styles.profileName}>Admin User</Text>
        <Text style={styles.profileEmail}>admin@ponamanager.com</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.menuText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// src/screens/settings/AppSettingsScreen.tsx
export const AppSettingsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="moon-outline" size={18} color={COLORS.primary} />
          <Text style={styles.menuText}>Dark Mode</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleOff} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="language-outline" size={18} color={COLORS.primary} />
          <Text style={styles.menuText}>Bengali</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleOn} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons
            name="cloud-download-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.menuText}>Backup & Restore</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>ponamanager v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  unread: { backgroundColor: COLORS.successLight + "40" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  message: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
  profileCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  profileEmail: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    borderRadius: 12,
    marginTop: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "60",
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.text },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
  },
  toggleOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.danger,
    padding: 14,
    margin: 16,
    borderRadius: 10,
  },
  logoutText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  version: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 12,
    paddingBottom: 20,
  },
});
