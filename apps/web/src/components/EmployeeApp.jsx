import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiFetch";
import {
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  LogOut,
} from "lucide-react";

export default function EmployeeApp({ user, onLogout }) {
  const queryClient = useQueryClient();
  const [showSickReport, setShowSickReport] = useState(false);
  const [sickReported, setSickReported] = useState(false);
  const [selectedDay, setSelectedDay] = useState("today");
  const [reason, setReason] = useState("");
  const [apiError, setApiError] = useState(null);

  // Track if we've ever loaded data so we don't flash spinner on refetch
  const hasLoadedOnce = useRef(false);

  const {
    data: todayData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["employee-today"],
    queryFn: () => apiFetch("/api/employee/today"),
    onSuccess: () => {
      hasLoadedOnce.current = true;
    },
  });

  // Mark loaded once data arrives
  if (todayData && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true;
  }

  const reportSickMutation = useMutation({
    mutationFn: (data) =>
      apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({ action: "report_sick", ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-today"]);
      setSickReported(true);
      setApiError(null);
    },
    onError: (err) => {
      setApiError(err.message || "Fehler beim Senden der Krankmeldung");
    },
  });

  // Only show spinner on the very first load, never during refetches
  if (isLoading && !hasLoadedOnce.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-[#22C55E] mx-auto mb-3"
            style={{
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="text-[#64748B] text-sm">Wird geladen…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (queryError && !todayData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm border border-red-100 w-full">
          <AlertCircle size={36} className="text-[#EF4444] mx-auto mb-3" />
          <p className="font-bold text-[#0F172A] mb-2">
            Daten konnten nicht geladen werden
          </p>
          <p className="text-sm text-[#64748B]">{queryError.message}</p>
        </div>
      </div>
    );
  }

  const { employee, shift, isSick } = todayData || {};
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const handleSickReport = () => {
    if (!employee) {
      setApiError(
        "Mitarbeiterprofil nicht gefunden. Bitte wende dich an deinen Chef.",
      );
      return;
    }
    const date = selectedDay === "today" ? today : tomorrow;
    setApiError(null);
    reportSickMutation.mutate({
      employee_id: employee.id,
      object_id: shift?.object_id || null,
      date,
    });
  };

  // ── Gemeldet Screen ──────────────────────────────────────────────────────
  if (sickReported) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-[#22C55E]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">✅ Gemeldet</h2>
        <p className="text-[#64748B] mb-8">
          Dein Chef wurde informiert.
          <br />
          Gute Besserung! 🙏
        </p>
        <button
          onClick={() => {
            setSickReported(false);
            setShowSickReport(false);
            setApiError(null);
          }}
          className="w-full bg-[#F1F5F9] text-[#0F172A] font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  // ── Krank melden Screen ──────────────────────────────────────────────────
  if (showSickReport) {
    const todayLabel = new Date().toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "long",
    });
    const tomorrowLabel = new Date(Date.now() + 86400000).toLocaleDateString(
      "de-DE",
      { weekday: "short", day: "2-digit", month: "long" },
    );

    return (
      <div className="min-h-screen bg-white p-6 max-w-md mx-auto">
        <button
          onClick={() => {
            setShowSickReport(false);
            setApiError(null);
          }}
          className="flex items-center text-[#64748B] font-bold mb-8"
        >
          <ArrowLeft size={20} className="mr-2" /> Zurück
        </button>
        <h2 className="text-2xl font-bold text-[#0F172A] mb-8">Krankmeldung</h2>
        <div className="space-y-3 mb-8">
          {["today", "tomorrow"].map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`w-full flex items-center p-4 rounded-xl border-2 transition-all text-left ${
                selectedDay === day
                  ? "border-[#EF4444] bg-[#FEF2F2]"
                  : "border-gray-100"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 mr-4 flex-shrink-0 ${
                  selectedDay === day
                    ? "border-[#EF4444] bg-[#EF4444]"
                    : "border-gray-300"
                }`}
              />
              <span className="font-bold">
                {i === 0
                  ? `Heute (${todayLabel})`
                  : `Morgen (${tomorrowLabel})`}
              </span>
            </button>
          ))}
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-[#64748B] uppercase mb-2">
            Grund (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-4 h-28 focus:outline-none text-sm resize-none"
            placeholder="z. B. Fieber, Grippe…"
          />
        </div>
        {apiError && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-sm text-[#EF4444]">
            {apiError}
          </div>
        )}
        <button
          onClick={handleSickReport}
          disabled={reportSickMutation.isPending}
          className="w-full bg-[#EF4444] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center"
        >
          {reportSickMutation.isPending ? (
            <>
              <span
                className="w-5 h-5 rounded-full border-2 border-white mr-2"
                style={{
                  borderTopColor: "transparent",
                  animation: "spin 0.6s linear infinite",
                }}
              />
              Wird gesendet…
            </>
          ) : (
            "Krankmeldung absenden"
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Homescreen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col max-w-md mx-auto">
      <header className="p-6 pb-0 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Guten Morgen,{" "}
            {user?.name?.split(" ")[0] || employee?.first_name || "Hallo"} 👋
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-[#64748B] hover:text-[#0F172A] mt-1"
          aria-label="Abmelden"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 flex-1">
        {isSick ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[16px] p-6 mb-8 flex items-start">
            <AlertCircle
              size={20}
              className="text-[#EF4444] mr-3 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="font-bold text-[#0F172A]">
                Du hast dich krank gemeldet
              </p>
              <p className="text-sm text-[#64748B] mt-1">
                Gute Besserung! Dein Chef wurde informiert.
              </p>
            </div>
          </div>
        ) : shift ? (
          <div className="bg-white rounded-[16px] shadow-sm p-6 border border-gray-100 mb-8">
            <p className="text-[11px] text-[#22C55E] font-bold uppercase tracking-wider mb-4">
              Dein heutiger Einsatz
            </p>
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">
              {shift.object_name}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center text-[#64748B]">
                <MapPin
                  size={18}
                  className="mr-3 text-[#22C55E] flex-shrink-0"
                />
                <span className="text-sm">{shift.address}</span>
              </div>
              <div className="flex items-center text-[#64748B]">
                <Clock
                  size={18}
                  className="mr-3 text-[#22C55E] flex-shrink-0"
                />
                <span className="text-sm font-bold text-[#0F172A]">
                  {shift.start_time} – {shift.end_time} Uhr
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[16px] shadow-sm p-8 border border-gray-100 mb-8 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="font-bold text-lg text-[#0F172A]">
              Heute kein Einsatz geplant
            </p>
            <p className="text-sm mt-1 text-[#64748B]">
              Genieße deinen freien Tag!
            </p>
          </div>
        )}

        {!isSick && (
          <div className="space-y-4">
            {shift && (
              <button
                onClick={() => {
                  if (!employee || !shift.object_id) return;
                  apiFetch("/api/attendance", {
                    method: "POST",
                    body: JSON.stringify({
                      action: "checkin",
                      employee_id: employee.id,
                      object_id: shift.object_id,
                      date: today,
                    }),
                  })
                    .then(() =>
                      queryClient.invalidateQueries(["employee-today"]),
                    )
                    .catch((err) =>
                      setApiError(err.message || "Einchecken fehlgeschlagen"),
                    );
                }}
                className="w-full bg-[#22C55E] text-white font-bold py-[18px] rounded-xl flex items-center justify-center shadow-lg text-lg hover:bg-[#16A34A] transition-colors"
              >
                <span className="mr-2">▶</span> Einchecken
              </button>
            )}
            <button
              onClick={() => {
                setShowSickReport(true);
                setApiError(null);
              }}
              className="w-full text-[#64748B] text-sm font-bold py-2 hover:text-[#EF4444] transition-colors"
            >
              Krank melden
            </button>
            {apiError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-sm text-[#EF4444] text-center">
                {apiError}
              </div>
            )}
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
