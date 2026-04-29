import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/utils/auth";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/home");
    } catch (err) {
      setLocalError(err.message || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View
          style={{
            width: 72,
            height: 72,
            backgroundColor: "#0F172A",
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ color: "#22C55E", fontSize: 32, fontWeight: "900" }}>
            P
          </Text>
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: "#0F172A",
            marginBottom: 6,
          }}
        >
          Putzo
        </Text>
        <Text style={{ fontSize: 14, color: "#64748B", marginBottom: 48 }}>
          Mitarbeiter-App
        </Text>

        {/* Form */}
        <View style={{ width: "100%" }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#64748B",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            E-MAIL
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@beispiel.de"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: "#0F172A",
              marginBottom: 16,
            }}
          />

          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#64748B",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            PASSWORT
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: "#0F172A",
              marginBottom: displayError ? 12 : 24,
            }}
          />

          {displayError ? (
            <View
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#FECACA",
              }}
            >
              <Text
                style={{ color: "#EF4444", fontSize: 13, fontWeight: "500" }}
              >
                {displayError}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: "#22C55E",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
              shadowColor: "#22C55E",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Anmelden
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
