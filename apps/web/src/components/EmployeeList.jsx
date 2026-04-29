import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiFetch";
import {
  Search,
  UserPlus,
  MoreVertical,
  X,
  Users,
  AlertCircle,
} from "lucide-react";

export default function EmployeeList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [apiError, setApiError] = useState(null);

  const {
    data: employees,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/api/employees"),
  });

  const { data: objects } = useQuery({
    queryKey: ["objects"],
    queryFn: () => apiFetch("/api/objects"),
  });

  const saveEmployeeMutation = useMutation({
    mutationFn: (data) =>
      apiFetch("/api/employees", {
        method: data.id ? "PATCH" : "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      setShowAddModal(false);
      setEditingEmployee(null);
      setApiError(null);
    },
    onError: (err) => {
      setApiError(err.message || "Fehler beim Speichern des Mitarbeiters");
    },
  });

  const openModal = (emp = null) => {
    setEditingEmployee(emp);
    setShowAddModal(true);
    setApiError(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    setApiError(null);
  };

  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch =
      `${emp.first_name} ${emp.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (emp.phone || "").includes(searchTerm);
    if (filter === "All") return matchesSearch;
    if (filter === "Aktiv") return matchesSearch && emp.status === "active";
    if (filter === "Krank") return matchesSearch && emp.status === "sick";
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-[#F8FAFC] flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-[#22C55E] mx-auto mb-3"
            style={{
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="text-[#64748B] text-sm">Mitarbeiter werden geladen…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex-1 p-8 bg-[#F8FAFC] flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm border border-red-100">
          <AlertCircle size={40} className="text-[#EF4444] mx-auto mb-4" />
          <p className="font-bold text-[#0F172A] mb-2">Fehler beim Laden</p>
          <p className="text-sm text-[#64748B]">{queryError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#F8FAFC]">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A]">Mitarbeiter</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#22C55E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors flex items-center shadow-sm"
        >
          <UserPlus size={18} className="mr-2" />
          Mitarbeiter hinzufügen
        </button>
      </header>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            size={18}
          />
          <input
            type="text"
            placeholder="Name oder Telefon suchen..."
            className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2 flex-wrap gap-y-2">
          {["All", "Aktiv", "Krank"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f
                  ? "bg-[#0F172A] text-white"
                  : "bg-white text-[#64748B] border border-gray-200 hover:border-[#64748B]"
              }`}
            >
              {f === "All" ? `Alle ${employees?.length ?? ""}` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state — no employees */}
      {employees?.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-16 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-bold text-[#0F172A] mb-2">
            👥 Noch keine Mitarbeiter
          </p>
          <p className="text-sm text-[#64748B] mb-6">
            Füge deinen ersten Mitarbeiter hinzu um loszulegen.
          </p>
          <button
            onClick={() => openModal()}
            className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors inline-flex items-center"
          >
            <UserPlus size={16} className="mr-2" />
            Ersten Mitarbeiter hinzufügen
          </button>
        </div>
      ) : filteredEmployees?.length === 0 ? (
        <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-12 text-center">
          <Search size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-[#64748B] font-medium">
            Keine Mitarbeiter für „{searchTerm || filter}" gefunden
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Bekannte Objekte
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees?.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm flex-shrink-0"
                        style={{
                          backgroundColor: emp.avatar_color || "#64748B",
                        }}
                      >
                        {emp.first_name?.[0]}
                        {emp.last_name?.[0]}
                      </div>
                      <div className="text-sm font-bold text-[#0F172A]">
                        {emp.first_name} {emp.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {emp.phone || (
                      <span className="text-gray-300 italic text-xs">
                        Nicht angegeben
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        emp.status === "active"
                          ? "bg-[#DCFCE7] text-[#22C55E]"
                          : "bg-[#FEE2E2] text-[#EF4444]"
                      }`}
                    >
                      {emp.status === "active" ? "🟢 Aktiv" : "🔴 Krank"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {emp.known_objects?.length > 0 ? (
                        emp.known_objects.map((o) => (
                          <span
                            key={o.id}
                            className="bg-gray-100 text-[#64748B] text-[10px] font-medium px-2 py-0.5 rounded"
                          >
                            {o.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300 text-xs italic">
                          Keine
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openModal(emp)}
                      className="p-1 text-[#64748B] hover:text-[#0F172A]"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-[16px] w-full max-w-[480px] shadow-2xl">
            <header className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">
                {editingEmployee
                  ? "Mitarbeiter bearbeiten"
                  : "Neuer Mitarbeiter"}
              </h3>
              <button
                onClick={closeModal}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={24} />
              </button>
            </header>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                saveEmployeeMutation.mutate({
                  id: editingEmployee?.id,
                  first_name: fd.get("first_name"),
                  last_name: fd.get("last_name"),
                  phone: fd.get("phone") || null,
                  known_object_ids: Array.from(fd.getAll("known_objects")).map(
                    Number,
                  ),
                });
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                    Vorname *
                  </label>
                  <input
                    name="first_name"
                    defaultValue={editingEmployee?.first_name}
                    required
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                    Nachname *
                  </label>
                  <input
                    name="last_name"
                    defaultValue={editingEmployee?.last_name}
                    required
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                  Telefon{" "}
                  <span className="normal-case font-normal text-[#94A3B8]">
                    (für WhatsApp &amp; SMS)
                  </span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={editingEmployee?.phone}
                  placeholder="+49 171 1234567"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                  Bekannte Objekte
                </label>
                <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1">
                  {objects?.length > 0 ? (
                    objects.map((obj) => (
                      <label
                        key={obj.id}
                        className="flex items-center text-sm cursor-pointer py-1 hover:bg-gray-50 px-2 rounded"
                      >
                        <input
                          type="checkbox"
                          name="known_objects"
                          value={obj.id}
                          defaultChecked={editingEmployee?.known_objects?.some(
                            (ko) => ko.id === obj.id,
                          )}
                          className="mr-2 accent-[#22C55E]"
                        />
                        {obj.name}
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] italic p-2">
                      Noch keine Objekte angelegt
                    </p>
                  )}
                </div>
              </div>

              {apiError && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-sm text-[#EF4444] flex items-start">
                  <AlertCircle
                    size={14}
                    className="mr-2 mt-0.5 flex-shrink-0"
                  />
                  {apiError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saveEmployeeMutation.isPending}
                  className="px-6 py-2 text-[#64748B] font-medium hover:text-[#0F172A] disabled:opacity-40"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saveEmployeeMutation.isPending}
                  className="bg-[#22C55E] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors disabled:opacity-50 flex items-center"
                >
                  {saveEmployeeMutation.isPending ? (
                    <>
                      <span
                        className="w-4 h-4 rounded-full border-2 border-white mr-2 inline-block"
                        style={{
                          borderTopColor: "transparent",
                          animation: "spin 0.6s linear infinite",
                        }}
                      />
                      Speichern…
                    </>
                  ) : (
                    "Speichern"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
