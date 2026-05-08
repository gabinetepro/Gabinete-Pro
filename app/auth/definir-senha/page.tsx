"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro("Erro ao definir senha. Tente novamente.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  const inputCls =
    "w-full border border-border rounded-lg px-4 py-3 bg-surface text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-white">Convite aceito!</h1>
            <p className="text-gray-400 text-sm mt-2">
              Defina sua senha para acessar o Gabinete Pro
            </p>
          </div>

          {sucesso ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-green-400 font-semibold">Senha definida!</p>
              <p className="text-gray-400 text-sm mt-1">Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
                  {erro}
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Nova senha
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setErro(null); }}
                  required
                  minLength={8}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={(e) => { setConfirmar(e.target.value); setErro(null); }}
                  required
                  minLength={8}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm mt-2"
              >
                {salvando ? "Salvando..." : "Entrar no Gabinete Pro →"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Powered by{" "}
          <a href="https://gabinete-pro.vercel.app" className="text-blue-500 hover:underline">
            Gabinete Pro
          </a>
        </p>
      </div>
    </div>
  );
}
