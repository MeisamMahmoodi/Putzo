import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiFetch";
import {
  Bell,
  MapPin,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
} from "lucide-react";

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-6 right-6 z-[100] bg-[#22C55E] text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg flex items-center">
      <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
      {message}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const queryClient = useQueryClient();
  const [selectedSickLeave, setSelectedSickLeave] = useState(null);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSubstitute, setSelectedSubstitute] = useState(null);
  const [sendChannel, setSendChannel] = useState("whatsapp");
  const [toastMessage, setToastMessage] = useState(null);
  const [apiError, setApiError] = useState(null);
  const messageRef = useRef(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    data: dashboardData,
    isLoading,
    error: dashError,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/api/dashboard"),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/api/employees"),
  });

  // ── Close modal helper ────────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setShowSubstituteModal(false);
    setStep(1);
    setSelectedSubstitute(null);
    setSelectedSickLeave(null);
    setSendChannel("whatsapp");
    setApiError(null);
  }, []);

  // ── Escape key closes modal ───────────────────────────────────────────────
  useEffect(() => {
    if (!showSubstituteModal) return;
    const handler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSubstituteModal, closeModal]);

  // ── Assign substitute ─────────────────────────────────────────────────────
  const assignSubstituteMutation = useMutation({
    mutationFn: (data) =>
      apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({ action: "assign_substitute", ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboard"]);

      // WhatsApp / SMS link
      const message = messageRef.current?.value || "";
      const rawPhone = selectedSubstitute?.phone || "";
      const phone = rawPhone.replace(/\s+/g, "").replace(/^\+/, "");

      if (sendChannel === "whatsapp" && phone) {
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
          "_blank",
        );
      } else if (sendChannel === "sms" && phone) {
        window.open(
          `sms:+${phone}?body=${encodeURIComponent(message)}`,
          "_self",
        );
      }

      const name = `${selectedSubstitute?.first_name} ${selectedSubstitute?.last_name}`;
      setToastMessage(`✓ ${name} wurde benachrichtigt`);
      closeModal();
    },
    onError: (err) => {
      setApiError(err.message || "Fehler beim Zuweisen des Ersatzes");
    },
  });

  // ── Open modal from alarm banner or shift card ────────────────────────────
  const openModal = (sick) => {
    setSelectedSickLeave(sick);
    setShowSubstituteModal(true);
    setStep(1);
    setApiError(null);
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-[#F8FAFC] flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-[#22C55E] mx-auto mb-3"
            style={{
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="text-[#64748B] text-sm">Dashboard wird geladen…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (dashError) {
    return (
      <div className="flex-1 p-8 bg-[#F8FAFC] flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm border border-red-100">
          <AlertCircle size={40} className="text-[#EF4444] mx-auto mb-4" />
          <p className="font-bold text-[#0F172A] mb-2">
            Dashboard konnte nicht geladen werden
          </p>
          <p className="text-sm text-[#64748B]">{dashError.message}</p>
        </div>
      </div>
    );
  }

  const { stats, sickLeaves, objectsToday } = dashboardData;

  // ── Stat: objects coverage ────────────────────────────────────────────────
  const objectsWithoutCover = objectsToday.filter((obj) => {
    const assignedEmployees = obj.assigned_employees ?? [];
    const activeWorkers = assignedEmployees.filter((e) =>
      ["scheduled", "present", "active"].includes(e.status),
    );
    return activeWorkers.length === 0;
  });
  const allObjectsCovered = objectsWithoutCover.length === 0;

  // ── Sorted substitute list ────────────────────────────────────────────────
  const substituteCandidates =
    employees
      ?.filter(
        (e) => e.id !== selectedSickLeave?.employee_id && e.status === "active",
      )
      .map((emp) => ({
        ...emp,
        knowsObject:
          emp.known_objects?.some(
            (o) => o.id === selectedSickLeave?.object_id,
          ) ?? false,
      }))
      .sort((a, b) => (b.knowsObject ? 1 : 0) - (a.knowsObject ? 1 : 0)) ?? [];

  // ── Default message ───────────────────────────────────────────────────────
  const defaultMessage =
    selectedSubstitute && selectedSickLeave
      ? `Hallo ${selectedSubstitute.first_name}, kannst du heute von ${selectedSickLeave.start_time}–${selectedSickLeave.end_time} Uhr das ${selectedSickLeave.object_name} übernehmen? ${selectedSickLeave.first_name} ist krank. Bitte melde dich kurz zurück.`
      : "";

  return (
    <div className="flex-1 p-8 bg-[#F8FAFC]">
      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">
            Guten Morgen, {user?.name || "Inhaber"}
          </h2>
          <p className="text-[#64748B] text-sm mt-1">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="relative">
          <button className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
            <Bell size={20} className="text-[#64748B]" />
            {sickLeaves.length > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[#EF4444] rounded-full border-2 border-white" />
            )}
          </button>
        </div>
      </header>

      {/* Alarm Banners */}
      {sickLeaves.map((sick) => (
        <div
          key={sick.attendance_id}
          className="mb-4 bg-[#FEF2F2] border-l-4 border-[#EF4444] p-4 flex items-center justify-between rounded-r-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-[#FEE2E2] p-2 rounded-full mr-4 flex-shrink-0">
              <AlertCircle size={20} className="text-[#EF4444]" />
            </div>
            <div>
              <div className="font-bold text-[#0F172A] text-sm uppercase tracking-wider">
                Krankmeldung —{" "}
                <span className="normal-case">
                  {sick.first_name} {sick.last_name}
                </span>
              </div>
              <p className="text-[#64748B] text-sm mt-0.5">
                {sick.object_name
                  ? `${sick.object_name} · ${sick.start_time || ""}–${sick.end_time || ""} Uhr`
                  : "Kein Einsatz heute"}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openModal({
                attendance_id: sick.attendance_id,
                employee_id: sick.employee_id,
                first_name: sick.first_name,
                last_name: sick.last_name,
                object_name: sick.object_name || "Kein Einsatz heute",
                object_id: sick.object_id,
                start_time: sick.start_time || "",
                end_time: sick.end_time || "",
              })
            }
            className="bg-[#EF4444] text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center flex-shrink-0 ml-4"
          >
            Ersatz finden <ArrowRight size={16} className="ml-2" />
          </button>
        </div>
      ))}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[12px] shadow-sm">
          <p className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider mb-2">
            Mitarbeiter heute
          </p>
          <div className="text-3xl font-bold text-[#0F172A]">
            {stats.active} / {stats.total}
          </div>
          <div
            className={`text-xs mt-2 flex items-center ${stats.sick > 0 ? "text-[#F97316]" : "text-[#22C55E]"}`}
          >
            {stats.sick > 0 ? (
              <>
                <AlertCircle size={14} className="mr-1" /> {stats.sick} krank ⚠️
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="mr-1" /> Alle gesund ✓
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[12px] shadow-sm">
          <p className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider mb-2">
            Objekte heute
          </p>
          <div className="text-3xl font-bold text-[#0F172A]">
            {objectsToday.length}
          </div>
          {objectsToday.length === 0 ? (
            <div className="text-xs text-[#64748B] mt-2">
              Keine Einsätze heute
            </div>
          ) : allObjectsCovered ? (
            <div className="text-xs text-[#22C55E] mt-2 flex items-center">
              <CheckCircle2 size={14} className="mr-1" /> Alle besetzt ✓
            </div>
          ) : (
            <div className="text-xs text-[#F97316] mt-2 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              {objectsWithoutCover.length} Objekt
              {objectsWithoutCover.length > 1 ? "e" : ""} ohne Ersatz
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[12px] shadow-sm">
          <p className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider mb-2">
            Offen
          </p>
          <div className="text-3xl font-bold text-[#0F172A]">
            {stats.openSickLeaves}
          </div>
          <div
            className={`text-xs mt-2 ${stats.openSickLeaves > 0 ? "text-[#F97316]" : "text-[#64748B]"}`}
          >
            {stats.openSickLeaves > 0
              ? "⚠️ Ersatz fehlt noch"
              : "Krankmeldungen ohne Ersatz"}
          </div>
        </div>
      </div>

      {/* Shifts Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#0F172A]">Heutige Einsätze</h3>
          <span className="text-[#64748B] text-sm">
            {new Date().toLocaleDateString("de-DE")}
          </span>
        </div>

        {objectsToday.length === 0 ? (
          <div className="bg-white rounded-[12px] shadow-sm p-12 border border-gray-100 text-center">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[#64748B] font-medium">
              Keine Einsätze heute geplant
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {objectsToday.map((obj) => {
              const hasSick = obj.assigned_employees.some(
                (e) => e.status === "sick",
              );
              const hasActiveWorker = obj.assigned_employees.some(
                (e) => ["scheduled", "present", "active"].includes(e.status),
              );
              const needsSubstitute = hasSick && !hasActiveWorker;

              return (
                <div
                  key={obj.id}
                  className="bg-white rounded-[12px] shadow-sm p-5 border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${needsSubstitute ? "bg-[#EF4444]" : "bg-[#22C55E]"}`}
                      />
                      <h4 className="text-base font-bold text-[#0F172A]">
                        {obj.name}
                      </h4>
                    </div>
                    <span className="text-[#0F172A] font-bold text-sm whitespace-nowrap ml-4">
                      {obj.start_time} – {obj.end_time} Uhr
                    </span>
                  </div>
                  <div className="space-y-2 ml-6">
                    <div className="flex items-center text-[#64748B] text-sm">
                      <MapPin size={14} className="mr-2 flex-shrink-0" />
                      {obj.address}
                    </div>
                    <div className="flex items-start text-[#64748B] text-sm">
                      <User size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        {obj.assigned_employees.map((e, idx) => (
                          <span key={e.id}>
                            {e.status === "sick" ? "⚠️ " : ""}
                            {e.first_name} {e.last_name}
                            {idx < obj.assigned_employees.length - 1
                              ? ", "
                              : ""}
                          </span>
                        ))}
                        {needsSubstitute && (
                          <span className="text-[#EF4444] font-medium ml-1">
                            · Ersatz fehlt noch
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {needsSubstitute && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          const sickEmp = obj.assigned_employees.find(
                            (e) => e.status === "sick",
                          );
                          openModal({
                            attendance_id: sickEmp?.attendance_id,
                            employee_id: sickEmp?.id,
                            first_name: sickEmp?.first_name,
                            last_name: sickEmp?.last_name,
                            object_name: obj.name,
                            object_id: obj.id,
                            start_time: obj.start_time,
                            end_time: obj.end_time,
                          });
                        }}
                        className="text-[#EF4444] font-medium hover:underline text-sm flex items-center"
                      >
                        Ersatz finden <ArrowRight size={14} className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Substitute Modal */}
      {showSubstituteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-[16px] w-full max-w-[520px] overflow-hidden shadow-2xl">
            <header className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center">
                  <AlertCircle size={20} className="text-[#F97316] mr-2" />
                  Krankmeldung — Ersatz finden
                </h3>
                {selectedSickLeave && (
                  <p className="text-[#64748B] text-sm mt-1">
                    {selectedSickLeave.first_name} {selectedSickLeave.last_name}{" "}
                    · {selectedSickLeave.object_name || "Kein Einsatz heute"}
                    {selectedSickLeave.start_time
                      ? ` · ${selectedSickLeave.start_time}–${selectedSickLeave.end_time} Uhr`
                      : ""}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-[#64748B] hover:text-[#0F172A] ml-4 flex-shrink-0"
              >
                <X size={24} />
              </button>
            </header>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {apiError && (
                <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-sm text-[#EF4444]">
                  {apiError}
                </div>
              )}

              {step === 1 ? (
                <>
                  <p className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider mb-4">
                    Verfügbare Mitarbeiter
                  </p>
                  {substituteCandidates.length === 0 ? (
                    <div className="text-center py-8 text-[#64748B]">
                      <User size={36} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">
                        Keine aktiven Mitarbeiter verfügbar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {substituteCandidates.map((emp) => (
                        <div
                          key={emp.id}
                          className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 text-sm"
                              style={{
                                backgroundColor: emp.avatar_color || "#64748B",
                              }}
                            >
                              {emp.first_name[0]}
                              {emp.last_name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center flex-wrap gap-1">
                                <span className="font-bold text-[#0F172A] text-sm">
                                  {emp.first_name} {emp.last_name}
                                </span>
                                {emp.knowsObject && (
                                  <span className="bg-[#DCFCE7] text-[#22C55E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                    Beste Wahl
                                  </span>
                                )}
                              </div>
                              <p className="text-[#64748B] text-xs mt-0.5">
                                {emp.knowsObject
                                  ? "Kennt das Objekt ✓"
                                  : "Objekt unbekannt"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSubstitute(emp);
                              setStep(2);
                              setSendChannel("whatsapp");
                            }}
                            className="text-[#22C55E] border border-[#22C55E] hover:bg-[#22C55E] hover:text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all ml-3 flex-shrink-0"
                          >
                            Zuweisen
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center text-[#22C55E] font-bold text-base">
                    <CheckCircle2 size={22} className="mr-2" />
                    {selectedSubstitute.first_name}{" "}
                    {selectedSubstitute.last_name} zuweisen
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-2">
                      Nachricht an {selectedSubstitute.first_name}:
                    </label>
                    <textarea
                      ref={messageRef}
                      defaultValue={defaultMessage}
                      className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] resize-none"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#0F172A] mb-3">
                      Senden via:
                    </p>
                    <div className="flex space-x-6">
                      {[
                        { val: "whatsapp", label: "WhatsApp" },
                        { val: "sms", label: "SMS" },
                        { val: "none", label: "Nur speichern" },
                      ].map(({ val, label }) => (
                        <label
                          key={val}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="channel"
                            checked={sendChannel === val}
                            onChange={() => setSendChannel(val)}
                            className="mr-2 accent-[#22C55E]"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                    {(sendChannel === "whatsapp" || sendChannel === "sms") &&
                      !selectedSubstitute.phone && (
                        <p className="text-xs text-[#F97316] mt-2 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          Keine Telefonnummer hinterlegt für{" "}
                          {selectedSubstitute.first_name}{" "}
                          {selectedSubstitute.last_name}
                        </p>
                      )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setStep(1)}
                      disabled={assignSubstituteMutation.isPending}
                      className="px-6 py-2 text-[#64748B] font-medium hover:text-[#0F172A] disabled:opacity-40"
                    >
                      Abbrechen
                    </button>
                    <button
                      disabled={assignSubstituteMutation.isPending}
                      onClick={() =>
                        assignSubstituteMutation.mutate({
                          employee_id: selectedSickLeave.employee_id,
                          object_id: selectedSickLeave.object_id,
                          date: new Date().toISOString().split("T")[0],
                          substitute_id: selectedSubstitute.id,
                        })
                      }
                      className="bg-[#22C55E] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors disabled:opacity-50 flex items-center"
                    >
                      {assignSubstituteMutation.isPending ? (
                        <>
                          <span
                            className="w-4 h-4 rounded-full border-2 border-white mr-2 inline-block"
                            style={{
                              borderTopColor: "transparent",
                              animation: "spin 0.6s linear infinite",
                            }}
                          />
                          Wird gespeichert…
                        </>
                      ) : (
                        "Jetzt senden →"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
