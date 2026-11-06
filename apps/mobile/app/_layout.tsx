import { useEffect } from "react";
import { AppState, Text } from "react-native";
import { Tabs } from "expo-router";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#071f5c",
        tabBarInactiveTintColor: "#8492a8",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginBottom: 5 },
        tabBarStyle: { height: 68, paddingTop: 7, borderTopColor: "#e5ebf4", backgroundColor: "#ffffff" }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⌂</Text> }} />
      <Tabs.Screen name="request" options={{ title: "طلب جديد", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>＋</Text> }} />
      <Tabs.Screen name="orders" options={{ title: "طلباتي", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>▤</Text> }} />
      <Tabs.Screen name="quotes" options={{ title: "العروض", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◇</Text> }} />
      <Tabs.Screen name="profile" options={{ title: "حسابي", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◉</Text> }} />
      <Tabs.Screen name="auth" options={{ href: null }} />
    </Tabs>
  );
}
