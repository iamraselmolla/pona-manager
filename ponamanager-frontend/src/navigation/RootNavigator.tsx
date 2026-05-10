// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { CustomerDetailsScreen } from '../screens/customers/CustomerDetailsScreen';
import { AddEditCustomerScreen } from '../screens/customers/AddEditCustomerScreen';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
import { CreateOrderScreen } from '../screens/orders/CreateOrderScreen';
import { BatchListScreen } from '../screens/batch/BatchListScreen';
import { CreateBatchScreen } from '../screens/batch/CreateBatchScreen';
import { BatchDetailsScreen } from '../screens/batch/BatchDetailsScreen';
import { BatchDeliveryModal } from '../screens/batch/BatchDeliveryModal';
import { CompleteBatchScreen } from '../screens/batch/CompleteBatchScreen';
import { MonthlyBatchReportScreen } from '../screens/monthly/MonthlyBatchReportScreen';
import { DeliveryEntryScreen } from '../screens/delivery/DeliveryEntryScreen';
import { DeliveryDetailsScreen } from '../screens/delivery/DeliveryDetailsScreen';
import { AddExpenseScreen } from '../screens/expenses/AddExpenseScreen';
import { DailyClosingScreen } from '../screens/closing/DailyClosingScreen';
import { DailyClosingHistoryScreen } from '../screens/closing/DailyClosingHistoryScreen';
import { DailyReportScreen } from '../screens/reports/DailyReportScreen';
import { MonthlyReportScreen } from '../screens/reports/MonthlyReportScreen';
import { CustomerDueReportScreen } from '../screens/reports/CustomerDueReportScreen';
import { ExpenseReportScreen, ProfitLossReportScreen } from '../screens/reports/CustomerDueReportScreen';
import { NotificationScreen } from '../screens/notifications/NotificationScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { AppSettingsScreen } from '../screens/settings/AppSettingsScreen';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <SplashScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={AuthNavigator} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} options={{ title: 'কাস্টমার বিবরণ' }} />
          <Stack.Screen name="AddEditCustomer" component={AddEditCustomerScreen} options={{ title: 'কাস্টমার' }} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'অর্ডার বিবরণ' }} />
          <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: 'নতুন অর্ডার' }} />
          <Stack.Screen name="BatchList" component={BatchListScreen} options={{ title: 'ব্যাচ তালিকা' }} />
          <Stack.Screen name="CreateBatch" component={CreateBatchScreen} options={{ title: 'নতুন ব্যাচ তৈরি' }} />
          <Stack.Screen name="BatchDetails" component={BatchDetailsScreen} options={{ title: 'ব্যাচ বিবরণ' }} />
          <Stack.Screen name="BatchDeliveryModal" component={BatchDeliveryModal} options={{ title: 'ডেলিভারি নিশ্চিত করুন' }} />
          <Stack.Screen name="CompleteBatch" component={CompleteBatchScreen} options={{ title: 'ব্যাচ কমপ্লিট করুন' }} />
          <Stack.Screen name="MonthlyBatchReport" component={MonthlyBatchReportScreen} options={{ title: 'মাসিক ব্যাচ রিপোর্ট' }} />
          <Stack.Screen name="DeliveryEntry" component={DeliveryEntryScreen} options={{ title: 'ডেলিভারি এন্ট্রি' }} />
          <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} options={{ title: 'ডেলিভারি বিবরণ' }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'খরচ যোগ করুন' }} />
          <Stack.Screen name="DailyClosing" component={DailyClosingScreen} options={{ title: 'দৈনিক হিসাব বন্ধ' }} />
          <Stack.Screen name="DailyClosingHistory" component={DailyClosingHistoryScreen} options={{ title: 'বন্ধের ইতিহাস' }} />
          <Stack.Screen name="DailyReport" component={DailyReportScreen} options={{ title: 'দৈনিক রিপোর্ট' }} />
          <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} options={{ title: 'মাসিক রিপোর্ট' }} />
          <Stack.Screen name="CustomerDueReport" component={CustomerDueReportScreen} options={{ title: 'বাকি রিপোর্ট' }} />
          <Stack.Screen name="ExpenseReport" component={ExpenseReportScreen} options={{ title: 'খরচ রিপোর্ট' }} />
          <Stack.Screen name="ProfitLossReport" component={ProfitLossReportScreen} options={{ title: 'লাভ/ক্ষতি রিপোর্ট' }} />
          <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ title: 'নোটিফিকেশন' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'প্রোফাইল' }} />
          <Stack.Screen name="AppSettings" component={AppSettingsScreen} options={{ title: 'সেটিংস' }} />
        </>
      )}
    </Stack.Navigator>
  );
};
