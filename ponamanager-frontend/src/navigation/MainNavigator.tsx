// src/navigation/MainNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { CustomerListScreen } from "../screens/customers/CustomerListScreen";
import { OrderListScreen } from "../screens/orders/OrderListScreen";
import { BatchListScreen } from "../screens/batch/BatchListScreen";
import { ReportsDashboardScreen } from "../screens/reports/ReportsDashboardScreen";
import { COLORS } from "../constants";

const Tab = createBottomTabNavigator();

export const MainNavigator = () => (
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
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.border,
        height: 62,
        paddingBottom: 8,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
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
