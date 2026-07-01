"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const res = await signIn("credentials", { email, senha, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setErro("Email ou senha inválidos");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — identidade visual */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #8B0000 0%, #c0392b 50%, #e74c3c 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        <div className="relative z-10 text-center px-8">
          {/* Brasão */}
          <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" fill="#c0392b" stroke="#d4a017" strokeWidth="3"/>
              <text x="50" y="40" textAnchor="middle" fill="#d4a017" fontSize="12" fontWeight="bold">CÂMARA</text>
              <text x="50" y="55" textAnchor="middle" fill="white" fontSize="10">MUNICIPAL</text>
              <text x="50" y="68" textAnchor="middle" fill="#d4a017" fontSize="9">NOVA LIMA</text>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Legislativo</h1>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#f0c040" }}>Nova Lima</h2>
          <div className="w-16 h-1 mx-auto mt-4 mb-6 rounded" style={{ background: "#d4a017" }} />
          <p className="text-lg opacity-90">Sistema de Gestão de Pautas</p>
          <p className="text-sm opacity-70 mt-2">Em compromisso com o cidadão</p>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #8B0000, #c0392b)" }}>
              <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none">
                <text x="50" y="45" textAnchor="middle" fill="#d4a017" fontSize="14" fontWeight="bold">CM</text>
                <text x="50" y="65" textAnchor="middle" fill="white" fontSize="11">NL</text>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Legislativo Nova Lima</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Entrar</h2>
            <p className="text-gray-500 text-sm mb-6">Sistema de Gestão de Pautas</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "#c0392b" } as any}
                  onFocus={e => e.target.style.borderColor = "#c0392b"}
                  onBlur={e => e.target.style.borderColor = "#d1d5db"}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  onFocus={e => e.target.style.borderColor = "#c0392b"}
                  onBlur={e => e.target.style.borderColor = "#d1d5db"}
                  placeholder="••••••••"
                  required
                />
              </div>
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-red-600 text-sm">{erro}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60 transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8B0000, #c0392b)" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Legislativo Nova Lima
          </p>
        </div>
      </div>
    </div>
  );
}
