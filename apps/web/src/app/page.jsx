"use client";

import React, { useState } from "react";
import { useAuth } from "@/utils/useAuth";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import EmployeeList from "@/components/EmployeeList";
import ObjectList from "@/components/ObjectList";
import Settings from "@/components/Settings";
import EmployeeApp from "@/components/EmployeeApp";
import Login from "@/components/Login";

export default function Page() {
  const { user, loading, signIn, signOut, error } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginError, setLoginError] = useState(null);

  const handleLogin = async (email, password) => {
    setLoginError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setActiveTab("dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] text-sm">Putzo wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  // Owner View — full desktop dashboard
  if (user.role === "owner") {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 ml-[240px]">
          {activeTab === "dashboard" && <Dashboard user={user} />}
          {activeTab === "employees" && <EmployeeList />}
          {activeTab === "objects" && <ObjectList />}
          {activeTab === "settings" && <Settings user={user} />}
        </main>
      </div>
    );
  }

  // Employee View — mobile-style UI
  return <EmployeeApp user={user} onLogout={handleLogout} />;
}
