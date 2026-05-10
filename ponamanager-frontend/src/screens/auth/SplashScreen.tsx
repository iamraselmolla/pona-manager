// src/screens/auth/SplashScreen.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants";

const { width, height } = Dimensions.get("window");

export const SplashScreen = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bg} />
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <View style={styles.iconBg}>
          <Ionicons name="fish" size={60} color={COLORS.white} />
        </View>
        <Text style={styles.appName}>ponamanager</Text>
        <Text style={styles.tagline}>পোনা ব্যবসা ম্যানেজমেন্ট</Text>
      </Animated.View>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.primary },
  logoContainer: { alignItems: "center", gap: 16 },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  appName: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1,
  },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  version: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
});
