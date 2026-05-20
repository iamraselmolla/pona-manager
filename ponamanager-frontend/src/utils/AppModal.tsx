// src/components/AppModal.tsx
// Global modal — mount once in your root (App.tsx / RootLayout).
// Use anywhere via: import { showModal } from "../components/AppModal"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ModalType = "error" | "success" | "warning" | "info";

interface ModalAction {
  label: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface ModalOptions {
  type?: ModalType;
  title?: string;
  message: string;
  actions?: ModalAction[];
  /** ms before auto-dismiss. omit = stays until dismissed */
  autoDismiss?: number;
}

interface ModalState extends ModalOptions {
  visible: boolean;
}

type ShowModalFn = (opts: ModalOptions) => void;

// ─── Singleton ref (callable outside React) ────────────────────────────────────
let _showModal: ShowModalFn | null = null;

export const showModal = (opts: ModalOptions) => {
  if (_showModal) {
    _showModal(opts);
  } else {
    // Fallback if called before provider mounts
    console.warn("[AppModal] showModal called before provider mounted");
  }
};

// Convenience shorthands
export const showError = (message: string, title = "ত্রুটি") =>
  showModal({ type: "error", title, message });

export const showSuccess = (message: string, title = "সফল!") =>
  showModal({ type: "success", title, message });

export const showWarning = (message: string, title = "সতর্কতা") =>
  showModal({ type: "warning", title, message });

export const showInfo = (message: string, title = "তথ্য") =>
  showModal({ type: "info", title, message });

// ─── Palettes ──────────────────────────────────────────────────────────────────
const LIGHT = {
  overlay: "rgba(0,0,0,0.45)",
  card: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "rgba(0,0,0,0.08)",
  btnDefault: "#F3F4F6",
  btnDefaultText: "#374151",
  btnDestructiveText: "#EF4444",
};

const DARK = {
  overlay: "rgba(0,0,0,0.65)",
  card: "#1E2130",
  textPrimary: "#F0F2FF",
  textSecondary: "#8A8FA8",
  border: "rgba(255,255,255,0.08)",
  btnDefault: "#2A2D3E",
  btnDefaultText: "#D1D5DB",
  btnDestructiveText: "#FF6B6B",
};

const TYPE_CONFIG = {
  error: {
    icon: "alert-circle" as const,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.10)",
    defaultTitle: "ত্রুটি",
  },
  success: {
    icon: "checkmark-circle" as const,
    color: "#10B981",
    bg: "rgba(16,185,129,0.10)",
    defaultTitle: "সফল!",
  },
  warning: {
    icon: "warning" as const,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    defaultTitle: "সতর্কতা",
  },
  info: {
    icon: "information-circle" as const,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.10)",
    defaultTitle: "তথ্য",
  },
};

// ─── Context ───────────────────────────────────────────────────────────────────
const AppModalContext = createContext<ShowModalFn>(() => {});

export const useAppModal = () => useContext(AppModalContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AppModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isDark = useColorScheme() === "dark";
  const T = isDark ? DARK : LIGHT;

  const [state, setState] = useState<ModalState>({
    visible: false,
    message: "",
    type: "error",
  });

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setState((s) => ({ ...s, visible: false })));
  }, []);

  const show: ShowModalFn = useCallback(
    (opts) => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
      setState({ ...opts, visible: true, type: opts.type ?? "error" });
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 280,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (opts.autoDismiss) {
        autoDismissTimer.current = setTimeout(dismiss, opts.autoDismiss);
      }
    },
    [dismiss],
  );

  // Register singleton
  useEffect(() => {
    _showModal = show;
    return () => {
      _showModal = null;
    };
  }, [show]);

  const cfg = TYPE_CONFIG[state.type ?? "error"];
  const title = state.title ?? cfg.defaultTitle;
  const actions: ModalAction[] =
    state.actions && state.actions.length > 0
      ? state.actions
      : [{ label: "ঠিক আছে", style: "cancel" }];

  return (
    <AppModalContext.Provider value={show}>
      {children}
      <Modal
        visible={state.visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <View style={[styles.overlay, { backgroundColor: T.overlay }]}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: T.card,
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Icon header */}
            <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={32} color={cfg.color} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: T.textPrimary }]}>{title}</Text>

            {/* Message */}
            <Text style={[styles.message, { color: T.textSecondary }]}>
              {state.message}
            </Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: T.border }]} />

            {/* Actions */}
            <View
              style={[
                styles.actionsRow,
                actions.length === 1 && styles.actionsRowSingle,
              ]}
            >
              {actions.map((action, i) => {
                const isDestructive = action.style === "destructive";
                const isCancel = action.style === "cancel";
                const isLast = i === actions.length - 1;

                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <View
                        style={[styles.actionDividerV, { backgroundColor: T.border }]}
                      />
                    )}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        actions.length === 1 && styles.actionBtnFull,
                        isDestructive && { backgroundColor: cfg.color },
                      ]}
                      onPress={() => {
                        dismiss();
                        action.onPress?.();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: isDestructive
                              ? "#fff"
                              : isCancel
                              ? T.textSecondary
                              : cfg.color,
                            fontWeight: isLast ? "700" : "500",
                          },
                        ]}
                      >
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AppModalContext.Provider>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    paddingTop: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  divider: { height: 1, width: "100%" },
  actionsRow: {
    flexDirection: "row",
    minHeight: 52,
  },
  actionsRowSingle: {},
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  actionBtnFull: { flex: 1 },
  actionDividerV: { width: 1, alignSelf: "stretch" },
  actionText: {
    fontSize: 15,
    textAlign: "center",
  },
});