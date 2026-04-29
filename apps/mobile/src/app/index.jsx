import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      try {
        const token = await SecureStore.getItemAsync("putzo_token");
        const user = await SecureStore.getItemAsync("putzo_user");
        if (token && user) {
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }
    check();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
      }}
    >
      <ActivityIndicator size="large" color="#22C55E" />
    </View>
  );
}
