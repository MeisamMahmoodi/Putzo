import React from "react";

export default function Settings({ user }) {
  return (
    <div className="flex-1 p-8 bg-[#F8FAFC]">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A]">Einstellungen</h2>
      </header>
      <div className="bg-white rounded-[12px] shadow-sm p-8 border border-gray-100 max-w-2xl">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">
                Firmenname
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[#22C55E]/20 focus:outline-none"
                defaultValue="Putzo Reinigungsservice"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">
                Inhaber Name
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[#22C55E]/20 focus:outline-none"
                defaultValue={user?.name || "Max Mustermann"}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">
              E-Mail
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-[#F8FAFC]"
              defaultValue={user?.email || ""}
              disabled
            />
          </div>
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              className="bg-[#22C55E] text-white px-8 py-2.5 rounded-lg font-bold hover:bg-[#16A34A] transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
