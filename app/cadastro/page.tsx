"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, User, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message === "User already registered"
          ? "Este e-mail já está cadastrado. Faça login."
          : error.message
      );
      setLoading(false);
      return;
    }

    // Se email de confirmação não for necessário, session já existe
    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }

    // Email de confirmação necessário
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mb-3">Conta criada!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Enviamos um e-mail de confirmação para <strong className="text-slate-200">{email}</strong>.
            Clique no link do e-mail para ativar sua conta e acessar o Gabinete Pro.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
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
          <p className="text-slate-400 text-sm mt-2">Crie sua conta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nome completo
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Vereador Rafael Mendes"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita a senha"
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
              Criar conta grátis
            </button>

            <p className="text-center text-xs text-slate-600 leading-relaxed">
              Ao criar sua conta você concorda com os{" "}
              <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Termos de Uso</a>{" "}
              e a{" "}
              <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">Política de Privacidade</a>.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Entrar
          </Link>
        </p>

      </div>
    </div>
  );
}
