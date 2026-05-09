// src/navigation/MainNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { CustomerListScreen } from "../screens/customers/CustomerListScreen";
import { OrderListScreen } from "../screens/orders/OrderListScreen";
import { ExpenseListScreen } from "../screens/expenses/ExpenseListScreen";
import { ReportsDashboardScreen } from "../screens/reports/ReportsDashboardScreen";
import { COLORS } from "../constants";
import { useAppStore } from "../store/appStore";

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { unreadNotifications } = useAppStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          switch (route.name) {
            case "Dashboard":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Customers":
              iconName = focused ? "people" : "people-outline";
              break;
            case "Orders":
              iconName = focused ? "receipt" : "receipt-outline";
              break;
            case "Expenses":
              iconName = focused ? "wallet" : "wallet-outline";
              break;
            case "Reports":
              iconName = focused ? "bar-chart" : "bar-chart-outline";
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "PonaTrack" }}
      />
      <Tab.Screen name="Customers" component={CustomerListScreen} />
      <Tab.Screen name="Orders" component={OrderListScreen} />
      <Tab.Screen name="Expenses" component={ExpenseListScreen} />
      <Tab.Screen name="Reports" component={ReportsDashboardScreen} />
    </Tab.Navigator>
  );
};
