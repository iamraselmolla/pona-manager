// src/navigation/RootNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { SplashScreen } from "../screens/auth/SplashScreen";
import { CustomerDetailsScreen } from "../screens/customers/CustomerDetailsScreen";
import { AddEditCustomerScreen } from "../screens/customers/AddEditCustomerScreen";
import { OrderDetailsScreen } from "../screens/orders/OrderDetailsScreen";
import { CreateOrderScreen } from "../screens/orders/CreateOrderScreen";
import { DeliveryEntryScreen } from "../screens/delivery/DeliveryEntryScreen";
import { DeliveryDetailsScreen } from "../screens/delivery/DeliveryDetailsScreen";
import { AddExpenseScreen } from "../screens/expenses/AddExpenseScreen";
import { DailyClosingScreen } from "../screens/closing/DailyClosingScreen";
import { DailyClosingHistoryScreen } from "../screens/closing/DailyClosingHistoryScreen";
import { DailyReportScreen } from "../screens/reports/DailyReportScreen";
import { MonthlyReportScreen } from "../screens/reports/MonthlyReportScreen";
import { CustomerDueReportScreen } from "../screens/reports/CustomerDueReportScreen";
import { ExpenseReportScreen } from "../screens/reports/ExpenseReportScreen";
import { ProfitLossReportScreen } from "../screens/reports/ProfitLossReportScreen";
import { NotificationScreen } from "../screens/notifications/NotificationScreen";
import { ProfileScreen } from "../screens/settings/ProfileScreen";
import { AppSettingsScreen } from "../screens/settings/AppSettingsScreen";
import { RootStackParamList } from "../types";
import { COLORS } from "../constants";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CustomerDetails"
            component={CustomerDetailsScreen}
            options={{ title: "Customer Details" }}
          />
          <Stack.Screen
            name="AddEditCustomer"
            component={AddEditCustomerScreen}
            options={{ title: "Customer" }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ title: "Order Details" }}
          />
          <Stack.Screen
            name="CreateOrder"
            component={CreateOrderScreen}
            options={{ title: "New Order" }}
          />
          <Stack.Screen
            name="DeliveryEntry"
            component={DeliveryEntryScreen}
            options={{ title: "Delivery Entry" }}
          />
          <Stack.Screen
            name="DeliveryDetails"
            component={DeliveryDetailsScreen}
            options={{ title: "Delivery Details" }}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{ title: "Add Expense" }}
          />
          <Stack.Screen
            name="DailyClosing"
            component={DailyClosingScreen}
            options={{ title: "Daily Closing" }}
          />
          <Stack.Screen
            name="DailyClosingHistory"
            component={DailyClosingHistoryScreen}
            options={{ title: "Closing History" }}
          />
          <Stack.Screen
            name="DailyReport"
            component={DailyReportScreen}
            options={{ title: "Daily Report" }}
          />
          <Stack.Screen
            name="MonthlyReport"
            component={MonthlyReportScreen}
            options={{ title: "Monthly Report" }}
          />
          <Stack.Screen
            name="CustomerDueReport"
            component={CustomerDueReportScreen}
            options={{ title: "Customer Due Report" }}
          />
          <Stack.Screen
            name="ExpenseReport"
            component={ExpenseReportScreen}
            options={{ title: "Expense Report" }}
          />
          <Stack.Screen
            name="ProfitLossReport"
            component={ProfitLossReportScreen}
            options={{ title: "Profit/Loss Report" }}
          />
          <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
            options={{ title: "Notifications" }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: "Profile" }}
          />
          <Stack.Screen
            name="AppSettings"
            component={AppSettingsScreen}
            options={{ title: "Settings" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
