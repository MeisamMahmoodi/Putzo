import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/utils/auth";
import {
  MapPin,
  Clock,
  LogOut,
  Calendar,
  CheckCircle,
} from "lucide-react-native";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, signOut, authFetch } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["employee-today"],
    queryFn: () => authFetch("/api/employee/today"),
    enabled: !!authFetch,
  });

  const today = new Date().toISOString().split("T")[0];

  const checkinMutation = useMutation({
    mutationFn: () =>
      authFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          action: "checkin",
          employee_id: data?.employee?.id,
          object_id: data?.shift?.object_id,
          date: today,
        }),
      }),
    onSuccess: () => {
      setCheckedIn(true);
      queryClient.invalidateQueries(["employee-today"]);
    },
  });

  const handleLogout = useCallback(async () => {
    Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Abmelden",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }, [signOut, router]);

  const openMaps = (address) => {
    const encoded = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encoded}`);
  };

  if (isLoading) {
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

  const { employee, shift, isSick } = data || {};
  const firstName =
    user?.name?.split(" ")[0] || employee?.first_name || "Hallo";
  const dateLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F8FAFC", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#0F172A" }}>
            Guten Morgen, {firstName} 👋
          </Text>
          <Text style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            {dateLabel}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ padding: 8, marginTop: 4 }}
        >
          <LogOut size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sick notice */}
        {isSick && (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#EF4444" }}>
              Du hast dich krank gemeldet
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              Gute Besserung! Dein Chef wurde informiert. 🙏
            </Text>
          </View>
        )}

        {/* Shift card */}
        {!isSick && shift ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#22C55E",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              DEIN HEUTIGER EINSATZ
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: "#0F172A",
                marginBottom: 16,
              }}
            >
              {shift.object_name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <MapPin size={16} color="#22C55E" />
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748B",
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                {shift.address}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock size={16} color="#22C55E" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#0F172A",
                  marginLeft: 8,
                }}
              >
                {shift.start_time} – {shift.end_time} Uhr
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => openMaps(shift.address)}
              style={{
                marginTop: 16,
                backgroundColor: "#F1F5F9",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#0F172A" }}
              >
                📍 Route anzeigen
              </Text>
            </TouchableOpacity>
          </View>
        ) : !isSick ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Calendar size={48} color="#E2E8F0" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>
              Heute kein Einsatz
            </Text>
            <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
              Genieße deinen freien Tag!
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        {!isSick && (
          <View style={{ gap: 12 }}>
            {shift && (
              <TouchableOpacity
                onPress={() => checkinMutation.mutate()}
                disabled={
                  checkedIn ||
                  checkinMutation.isPending ||
                  shift.status === "present"
                }
                style={{
                  backgroundColor:
                    checkedIn || shift.status === "present"
                      ? "#DCFCE7"
                      : "#22C55E",
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: "#22C55E",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: checkedIn ? 0 : 0.3,
                  shadowRadius: 8,
                  elevation: checkedIn ? 0 : 4,
                }}
              >
                {checkedIn || shift.status === "present" ? (
                  <>
                    <CheckCircle size={22} color="#22C55E" />
                    <Text
                      style={{
                        color: "#22C55E",
                        fontSize: 16,
                        fontWeight: "700",
                        marginLeft: 8,
                      }}
                    >
                      Eingecheckt ✓
                    </Text>
                  </>
                ) : checkinMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}
                  >
                    ▶ Einchecken
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.push("/sick")}
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text
                style={{ fontSize: 14, color: "#64748B", fontWeight: "600" }}
              >
                Krank melden
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
