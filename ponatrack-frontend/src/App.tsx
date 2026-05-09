import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { RootNavigator } from "./navigation/RootNavigator";
import { useAuthStore } from "./store";
import { initDatabase } from "./utils/database";

export default function App() {
  const { loadToken } = useAuthStore();

  useEffect(() => {
    initDatabase();
    loadToken();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
