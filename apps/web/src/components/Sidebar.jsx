import React from "react";
import { Home, Users, Building2, Settings, LogOut } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "employees", label: "Mitarbeiter", icon: Users },
    { id: "objects", label: "Objekte", icon: Building2 },
    { id: "settings", label: "Einstellungen", icon: Settings },
  ];

  return (
    <div className="w-[240px] bg-[#0F172A] h-screen fixed left-0 top-0 flex flex-col text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Putzo</h1>
        <p className="text-[#64748B] text-xs mt-1 uppercase tracking-wider">
          Reinigungsservice
        </p>
      </div>

      <nav className="flex-1 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-4 transition-colors relative ${
                isActive
                  ? "bg-[#1E293B] text-white"
                  : "text-[#64748B] hover:text-white hover:bg-[#1E293B]"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#22C55E]" />
              )}
              <Icon size={20} className="mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-xs font-bold">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "IN"}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold truncate w-24">
              {user?.name || "Inhaber"}
            </span>
            <span className="text-[10px] text-[#64748B]">Admin</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-[#64748B] hover:text-white transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
