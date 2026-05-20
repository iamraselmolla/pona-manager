import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/store/authStore";
import { initDatabase } from "./src/utils/database";
import { AppModalProvider } from "./src/utils/AppModal";

export default function App() {
  const { loadToken } = useAuthStore();

  useEffect(() => {
    try {
      initDatabase();
    } catch (e) {
      console.log("DB init error:", e);
    }
    loadToken();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppModalProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
            <Toast />
          </NavigationContainer>
        </AppModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
