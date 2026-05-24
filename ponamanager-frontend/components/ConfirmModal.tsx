// src/components/ConfirmModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  useColorScheme,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Theme ─────────────────────────────────────────────────────────────────────
const LIGHT = {
  overlay: 'rgba(0,0,0,0.50)',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  textPrimary: '#0D1117',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  cancelBg: '#F4F5F9',
  cancelText: '#4B5563',
};
const DARK = {
  overlay: 'rgba(0,0,0,0.72)',
  surface: '#161C2D',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#EEF0FF',
  textSecondary: '#8892B0',
  textMuted: '#4A5568',
  cancelBg: '#1E2538',
  cancelText: '#8892B0',
};

// ─── Variant config ─────────────────────────────────────────────────────────────
type Variant = 'danger' | 'warning' | 'success' | 'info';

const VARIANT_CONFIG: Record<Variant, { color: string; soft: string; icon: string }> = {
  danger: { color: '#EF4444', soft: 'rgba(239,68,68,0.12)', icon: 'warning-outline' },
  warning: { color: '#F59E0B', soft: 'rgba(245,158,11,0.12)', icon: 'alert-circle-outline' },
  success: { color: '#10B981', soft: 'rgba(16,185,129,0.12)', icon: 'checkmark-circle-outline' },
  info: { color: '#3B82F6', soft: 'rgba(59,130,246,0.12)', icon: 'information-circle-outline' },
};

// ─── Props ──────────────────────────────────────────────────────────────────────
export interface ConfirmModalProps {
  visible: boolean;
  variant?: Variant;
  icon?: string; // override icon
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Extra note below message
  note?: string;
  noteColor?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────────
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  variant = 'danger',
  icon,
  title,
  message,
  confirmText = 'নিশ্চিত করুন',
  cancelText = 'বাতিল',
  loading = false,
  onConfirm,
  onCancel,
  note,
  noteColor,
}) => {
  const scheme = useColorScheme();
  const T = scheme === 'dark' ? DARK : LIGHT;
  const V = VARIANT_CONFIG[variant];

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 260,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { backgroundColor: T.overlay, opacity: opacityAnim }]}>
        {/* Dismiss on backdrop tap only if not loading */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !loading && onCancel()} />

        <Animated.View
          style={[
            styles.box,
            { backgroundColor: T.surface, borderColor: T.border },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: V.soft }]}>
            <Ionicons name={(icon ?? V.icon) as any} size={26} color={V.color} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: T.textPrimary }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, { color: T.textSecondary }]}>{message}</Text>

          {/* Note */}
          {!!note && (
            <View style={[styles.noteBox, { backgroundColor: V.soft }]}>
              <Ionicons name="information-circle" size={13} color={noteColor ?? V.color} />
              <Text style={[styles.noteText, { color: noteColor ?? V.color }]}>{note}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {/* Buttons */}
          <View style={styles.btnRow}>
            {/* Cancel */}
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: T.cancelBg }]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={[styles.cancelText, { color: T.cancelText }]}>{cancelText}</Text>
            </TouchableOpacity>

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: V.color }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  box: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },

  // Icon
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  // Text
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },

  // Note
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    width: '100%',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Divider
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelBtn: {},
  confirmBtn: {},
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
