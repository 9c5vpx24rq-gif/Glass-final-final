import { TouchableOpacity, TextInput, DeviceEventEmitter } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { height: 80, paddingBottom: 0, paddingTop: 0 },
      tabBarIconStyle: { height: 50, width: 50 },
    }}>
      <Tabs.Screen name="map" options={{
        title: '',
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16 }}
            onPress={() => DeviceEventEmitter.emit('openDrawer')}
          >
            <Ionicons name="menu" size={30} color="#000" />
          </TouchableOpacity>
        ),
        headerTitle: () => (
          <TextInput
            placeholder="Търси..."
            placeholderTextColor="#888"
            onChangeText={(text) => DeviceEventEmitter.emit('search', text)}
            style={{
              backgroundColor: "#f0f0f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              height: 38,
              width: 220,
              fontSize: 15,
            }}
          />
        ),
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