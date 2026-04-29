import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiFetch";
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Clock,
  MoreVertical,
  X,
} from "lucide-react";

export default function ObjectList() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingObject, setEditingObject] = useState(null);

  const { data: objects, isLoading } = useQuery({
    queryKey: ["objects"],
    queryFn: () => apiFetch("/api/objects"),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => apiFetch("/api/employees"),
  });

  const saveObjectMutation = useMutation({
    mutationFn: (data) =>
      apiFetch("/api/objects", {
        method: data.id ? "PATCH" : "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["objects"]);
      setShowAddModal(false);
      setEditingObject(null);
    },
  });

  if (isLoading) return <div className="p-8">Lade Objekte...</div>;

  return (
    <div className="flex-1 p-8 bg-[#F8FAFC]">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A]">Objekte</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#22C55E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Objekt hinzufügen
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {objects?.map((obj) => (
          <div
            key={obj.id}
            className="bg-white rounded-[12px] shadow-sm p-6 border border-gray-100 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="bg-[#F1F5F9] p-2.5 rounded-lg mr-4">
                    <Building2 size={24} className="text-[#0F172A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      {obj.name}
                    </h3>
                    <div className="flex items-center text-[#64748B] text-xs mt-1">
                      <Clock size={12} className="mr-1" />
                      {obj.cleaning_days?.join(", ")} · {obj.start_time}–
                      {obj.end_time} Uhr
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingObject(obj);
                    setShowAddModal(true);
                  }}
                  className="p-1 text-[#64748B] hover:text-[#0F172A]"
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-[#64748B] text-sm">
                  <MapPin size={14} className="mr-2" />
                  {obj.address}
                </div>
                <div className="flex items-start text-[#64748B] text-sm">
                  <Users size={14} className="mr-2 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {obj.assigned_employees?.map((e) => (
                      <span
                        key={e.id}
                        className="bg-[#F1F5F9] text-[#0F172A] px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {e.first_name} {e.last_name[0]}.
                      </span>
                    ))}
                    {obj.assigned_employees?.length === 0 && (
                      <span className="text-gray-400 italic text-xs">
                        Keine Mitarbeiter zugewiesen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] w-full max-w-[540px] shadow-2xl">
            <header className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A]">
                {editingObject ? "Objekt bearbeiten" : "Neues Objekt"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingObject(null);
                }}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={24} />
              </button>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  id: editingObject?.id,
                  name: formData.get("name"),
                  address: formData.get("address"),
                  type: formData.get("type"),
                  cleaning_days: Array.from(formData.getAll("cleaning_days")),
                  start_time: formData.get("start_time"),
                  end_time: formData.get("end_time"),
                  employee_ids: Array.from(formData.getAll("employees")).map(
                    Number,
                  ),
                };
                saveObjectMutation.mutate(data);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                  Objektname
                </label>
                <input
                  name="name"
                  defaultValue={editingObject?.name}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-[#22C55E]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                  Adresse
                </label>
                <input
                  name="address"
                  defaultValue={editingObject?.address}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-[#22C55E]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                    Uhrzeit von
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    defaultValue={editingObject?.start_time || "08:00"}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-[#22C55E]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                    Uhrzeit bis
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    defaultValue={editingObject?.end_time || "12:00"}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-[#22C55E]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                  Reinigungstage
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        name="cleaning_days"
                        value={day}
                        defaultChecked={editingObject?.cleaning_days?.includes(
                          day,
                        )}
                        className="hidden peer"
                      />
                      <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-xs font-bold cursor-pointer peer-checked:bg-[#0F172A] peer-checked:text-white peer-checked:border-[#0F172A] hover:border-[#64748B]">
                        {day}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                  Zugewiesene Mitarbeiter
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1 mt-1">
                  {employees?.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center text-sm cursor-pointer py-1 hover:bg-gray-50 px-2 rounded"
                    >
                      <input
                        type="checkbox"
                        name="employees"
                        value={emp.id}
                        defaultChecked={editingObject?.assigned_employees?.some(
                          (ae) => ae.id === emp.id,
                        )}
                        className="mr-2 accent-[#22C55E]"
                      />
                      {emp.first_name} {emp.last_name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingObject(null);
                  }}
                  className="px-6 py-2 text-[#64748B] font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-[#22C55E] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
