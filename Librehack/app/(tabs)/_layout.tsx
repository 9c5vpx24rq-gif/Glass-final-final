import { Text, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        height: 80,
        paddingBottom: 0,
        paddingTop: 0,
      },
      tabBarIconStyle: {
        height: 50,
        width: 50,
      },
    }}>
      <Tabs.Screen name="map" options={{
        title: '',
        tabBarIcon: ({ color }) => (
          <Ionicons name="map" size={40} color={color} />
        ),
      }} />
      <Tabs.Screen name="announcements" options={{
        title: '',
        tabBarIcon: ({ color }) => (
          <Ionicons name="megaphone-outline" size={40} color={color} />
        ),
      }} />
      <Tabs.Screen name="account" options={{
        title: '',
        tabBarIcon: ({ color }) => (
          <Ionicons name="person-circle-outline" size={40} color={color} />
        ),
      }} />
    </Tabs>
  );
}