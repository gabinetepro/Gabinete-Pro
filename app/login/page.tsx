"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Digite seu e-mail acima para redefinir a senha.");
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    setResetSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              Gabinete Pro
            </span>
          </Link>
          <p className="text-slate-400 text-sm mt-2">Acesse sua conta</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          {resetSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">
                E-mail enviado!
              </h3>
              <p className="text-sm text-slate-400">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <button
                onClick={() => setResetSent(false)}
                className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  E-mail
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com.br"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Entrar
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Criar conta grátis
          </Link>
        </p>

      </div>
    </div>
  );
}
