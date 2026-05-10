// src/constants/index.ts

export const COLORS = {
  primary: "#0A6640",
  primaryLight: "#1a8a56",
  primaryDark: "#064d2e",
  secondary: "#F5A623",
  secondaryLight: "#f7bc57",
  danger: "#E53935",
  dangerLight: "#FFEBEE",
  success: "#43A047",
  successLight: "#E8F5E9",
  warning: "#FB8C00",
  warningLight: "#FFF3E0",
  info: "#1E88E5",
  infoLight: "#E3F2FD",
  background: "#F0F4F0",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E0E8E0",
  text: "#1A2E1A",
  textSecondary: "#4A6A4A",
  textMuted: "#8A9A8A",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.5)",
};

export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
  },
};

export const PONA_TYPES = ["Golda PL", "Bagda PL", "Vannamei PL"] as const;

export const EXPENSE_CATEGORIES = [
  "Transport",
  "Labor",
  "Oxygen",
  "Packaging",
  "Food",
  "Others",
] as const;

export const ORDER_STATUS = {
  pending: { label: "Pending", color: "#FB8C00", bg: "#FFF3E0" },
  partial: { label: "Partial", color: "#1E88E5", bg: "#E3F2FD" },
  delivered: { label: "Delivered", color: "#43A047", bg: "#E8F5E9" },
  cancelled: { label: "Cancelled", color: "#E53935", bg: "#FFEBEE" },
};

export const API_BASE_URL = "http://localhost:5000/api";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "@ponamanager_auth_token",
  USER_DATA: "@ponamanager_user_data",
  SETTINGS: "@ponamanager_settings",
};
