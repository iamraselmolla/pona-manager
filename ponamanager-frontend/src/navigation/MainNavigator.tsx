// src/navigation/MainNavigator.tsx
import React from "react";
import { useColorScheme } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { CustomerListScreen } from "../screens/customers/CustomerListScreen";
import { OrderListScreen } from "../screens/orders/OrderListScreen";
import { BatchListScreen } from "../screens/batch/BatchListScreen";
import { ReportsDashboardScreen } from "../screens/reports/ReportsDashboardScreen";
import { COLORS } from "../constants";

const Tab = createBottomTabNavigator();

const LIGHT = {
  bg: "#FFFFFF",
  border: "rgba(0,0,0,0.08)",
  active: "#6C63FF",
  inactive: "#9CA3AF",
  headerBg: "#FFFFFF",
  headerText: "#111827",
};

const DARK = {
  bg: "#1A1D27",
  border: "rgba(255,255,255,0.07)",
  active: "#6C63FF",
  inactive: "#545872",
  headerBg: "#0F1117",
  headerText: "#F0F2FF",
};

export const MainNavigator = () => {
  const scheme = useColorScheme();
  const T = scheme === "dark" ? DARK : LIGHT;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ["home", "home-outline"],
            Customers: ["people", "people-outline"],
            Orders: ["receipt", "receipt-outline"],
            Batches: ["boat", "boat-outline"],
            Reports: ["bar-chart", "bar-chart-outline"],
          };
          const [active, inactive] = icons[route.name] || [
            "ellipse",
            "ellipse-outline",
          ];
          return (
            <Ionicons
              name={(focused ? active : inactive) as any}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: T.active,
        tabBarInactiveTintColor: T.inactive,
        tabBarStyle: {
          backgroundColor: T.bg,
          borderTopColor: T.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        headerStyle: {
          backgroundColor: T.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: T.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: T.headerText,
        headerTitleStyle: { fontWeight: "800", fontSize: 17 },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "ponamanager", tabBarLabel: "হোম" }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomerListScreen}
        options={{ title: "কাস্টমার", tabBarLabel: "কাস্টমার" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderListScreen}
        options={{ title: "অর্ডার", tabBarLabel: "অর্ডার" }}
      />
      <Tab.Screen
        name="Batches"
        component={BatchListScreen}
        options={{ title: "ব্যাচ", tabBarLabel: "ব্যাচ" }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsDashboardScreen}
        options={{ title: "রিপোর্ট", tabBarLabel: "রিপোর্ট" }}
      />
    </Tab.Navigator>
  );
};
