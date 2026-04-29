import React, { useState } from "react";

export default function Login({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F172A] rounded-2xl mb-4 shadow-lg">
            <span className="text-[#22C55E] font-black text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F172A]">Putzo</h1>
          <p className="text-[#64748B] text-sm mt-1">Reinigungsmanagement</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6">Anmelden</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                required
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition-all"
              />
            </div>
            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-sm text-[#EF4444] font-medium">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Wird angemeldet..." : "Anmelden"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
