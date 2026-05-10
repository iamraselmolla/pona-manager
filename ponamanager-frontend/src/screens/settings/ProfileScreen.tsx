// src/screens/settings/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/services';
import { COLORS } from '../../constants';

export const ProfileScreen = () => {
  const { user, updateUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile({ name });
      updateUser({ name });
      Alert.alert('সফল', 'প্রোফাইল আপডেট হয়েছে');
    } catch {
      Alert.alert('ত্রুটি', 'আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>প্রোফাইল সম্পাদনা</Text>
        <View style={styles.field}>
          <Text style={styles.label}>নাম</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="আপনার নাম"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>ইমেইল</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email}
            editable={false}
          />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : (
            <Text style={styles.saveBtnText}>সংরক্ষণ করুন</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert('লগআউট', 'নিশ্চিতভাবে লগআউট করবেন?', [
          { text: 'না', style: 'cancel' },
          { text: 'হ্যাঁ', onPress: () => logout() },
        ])}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={styles.logoutBtnText}>লগআউট</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center', gap: 6 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  roleText: { color: COLORS.white, fontWeight: '700', fontSize: 11 },
  card: { backgroundColor: COLORS.white, margin: 16, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background,
  },
  inputDisabled: { backgroundColor: COLORS.border + '40', color: COLORS.textMuted },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.danger, borderRadius: 12, margin: 16, padding: 14,
  },
  logoutBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
