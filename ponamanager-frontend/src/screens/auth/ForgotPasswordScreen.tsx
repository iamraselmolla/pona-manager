// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../../api/services';
import { COLORS } from '../../constants';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      Alert.alert('Success', 'Password reset link sent to your email', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBg}>
          <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.desc}>Enter your email address and we'll send you a reset link</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={{ paddingLeft: 12 }} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  backBtn: { marginTop: 50, marginBottom: 20, width: 40 },
  content: { alignItems: 'center', gap: 16 },
  iconBg: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  desc: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.white,
  },
  input: { flex: 1, padding: 12, fontSize: 15, color: COLORS.text },
  btn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, width: '100%', alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
