import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/utils/auth";
import { ArrowLeft, CheckCircle } from "lucide-react-native";

export default function SickScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { authFetch } = useAuth();

  const [selectedDay, setSelectedDay] = useState("today");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const { data } = useQuery({
    queryKey: ["employee-today"],
    queryFn: () => authFetch("/api/employee/today"),
    enabled: !!authFetch,
  });

  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);

  const fmt = (d) =>
    d.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "long",
    });

  const reportSickMutation = useMutation({
    mutationFn: () => {
      const date =
        selectedDay === "today"
          ? today.toISOString().split("T")[0]
          : tomorrow.toISOString().split("T")[0];
      return authFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          action: "report_sick",
          employee_id: data?.employee?.id,
          object_id: data?.shift?.object_id || null,
          date,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-today"]);
      setDone(true);
    },
  });

  if (done) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <StatusBar style="dark" />
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: "#DCFCE7",
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <CheckCircle size={40} color="#22C55E" />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "900",
            color: "#0F172A",
            marginBottom: 8,
          }}
        >
          ✅ Gemeldet
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#64748B",
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 40,
          }}
        >
          Dein Chef wurde informiert.{"\n"}Gute Besserung! 🙏
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={{
            backgroundColor: "#F1F5F9",
            borderRadius: 14,
            paddingVertical: 16,
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
            Zurück zur Übersicht
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={22} color="#64748B" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#0F172A" }}>
          Krankmeldung
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Day selection */}
        <View style={{ gap: 12, marginBottom: 28 }}>
          {[
            { key: "today", label: `Heute (${fmt(today)})` },
            { key: "tomorrow", label: `Morgen (${fmt(tomorrow)})` },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedDay(key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 18,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: selectedDay === key ? "#EF4444" : "#F1F5F9",
                backgroundColor: selectedDay === key ? "#FEF2F2" : "#F8FAFC",
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selectedDay === key ? "#EF4444" : "#CBD5E1",
                  backgroundColor:
                    selectedDay === key ? "#EF4444" : "transparent",
                  marginRight: 14,
                }}
              />
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reason */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: "#64748B",
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          GRUND (OPTIONAL)
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="z. B. Fieber, Erkältung..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          style={{
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 14,
            color: "#0F172A",
            height: 110,
            textAlignVertical: "top",
            marginBottom: 32,
          }}
        />

        {/* Submit */}
        <TouchableOpacity
          onPress={() => reportSickMutation.mutate()}
          disabled={reportSickMutation.isPending || !data?.employee}
          style={{
            backgroundColor: "#EF4444",
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: "center",
            opacity: reportSickMutation.isPending || !data?.employee ? 0.5 : 1,
            shadowColor: "#EF4444",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {reportSickMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
              Krankmeldung absenden
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
