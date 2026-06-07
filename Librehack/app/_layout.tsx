import { Stack } from "expo-router";
export default function RootLayout() {

  return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="../../(tabs)/map" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="index-1" options={{ headerShown: false }} />
      </Stack>
  );
}
