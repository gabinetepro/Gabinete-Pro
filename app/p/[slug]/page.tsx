"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Send, CheckCircle2, RefreshCw, ChevronDown, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface PoliticoProfile {
  id: string;
  nome: string;
  nome_politico: string | null;
  cargo: string | null;
  partido: string | null;
  municipio: string | null;
  estado: string | null;
  avatar_url: string | null;
  nome_gabinete: string | null;
}

interface FormState {
  nome: string;
  email: string;
  telefone: string;
  bairro: string;
  tipo: string;
  categoria: string;
  mensagem: string;
  lgpd: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TIPO_OPTIONS = [
  { value: "recado",   emoji: "💬", label: "Recado"   },
  { value: "duvida",   emoji: "❓", label: "Dúvida"   },
  { value: "sugestao", emoji: "💡", label: "Sugestão" },
  { value: "demanda",  emoji: "🔧", label: "Demanda"  },
];

const CATEGORIAS = [
  "Obras e Infraestrutura", "Saúde", "Educação", "Cultura", "Esporte",
  "Segurança", "Meio Ambiente", "Emprego", "Transporte",
  "Assistência Social", "Outros",
];

const EMPTY_FORM: FormState = {
  nome: "", email: "", telefone: "", bairro: "",
  tipo: "", categoria: "", mensagem: "", lgpd: false,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function generateProtocolo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEM-${ts}-${rand}`;
}

function initials(nome: string) {
  return nome.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function PoliticianAvatar({ profile }: { profile: PoliticoProfile }) {
  const nome = profile.nome_politico ?? profile.nome;
  if (profile.avatar_url) {
    return (
      <div
        className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden flex-shrink-0"
        style={{ backgroundImage: `url(${profile.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
    );
  }
  return (
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
      {initials(nome)}
    </div>
  );
}

// ── ConfirmationScreen ─────────────────────────────────────────────────────

function ConfirmationScreen({
  protocolo,
  nomeEnviou,
  onNovaMensagem,
}: {
  protocolo: string;
  nomeEnviou: string;
  onNovaMensagem: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 size={32} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Mensagem recebida!</h2>
      <p className="text-slate-600 mb-6 max-w-sm">
        Obrigado, <strong>{nomeEnviou}</strong>! Sua mensagem foi recebida com sucesso.
        Em breve nossa equipe entrará em contato.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 mb-8">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Número do protocolo</p>
        <p className="font-mono font-bold text-blue-700 text-lg">{protocolo}</p>
        <p className="text-xs text-slate-400 mt-1">Guarde este número para acompanhar sua solicitação</p>
      </div>
      <button
        onClick={onNovaMensagem}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
      >
        <RefreshCw size={15} />
        Enviar outra mensagem
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PublicDemandasPage() {
  const { slug } = useParams<{ slug: string }>();

  const [profile,   setProfile]   = useState<PoliticoProfile | null>(null);
  const [notFound,  setNotFound]  = useState(false);
  const [loading,   setLoading]   = useState(true);

  const [form,      setForm]      = useState<FormState>(EMPTY_FORM);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, nome_politico, cargo, partido, municipio, estado, avatar_url, nome_gabinete")
        .eq("slug", slug)
        .single();

      if (!data) { setNotFound(true); }
      else        { setProfile(data as PoliticoProfile); }
      setLoading(false);
    }
    if (slug) load();
  }, [slug]);

  function setF<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!form.nome.trim())     { setError("Nome é obrigatório.");              return; }
    if (!form.email.trim())    { setError("Email é obrigatório.");             return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Email inválido."); return; }
    if (!form.tipo)            { setError("Selecione o tipo de mensagem.");    return; }
    if (!form.categoria)       { setError("Selecione a categoria.");           return; }
    if (!form.mensagem.trim()) { setError("Escreva sua mensagem.");            return; }
    if (!form.lgpd)            { setError("Aceite os termos para continuar."); return; }

    setSending(true);
    setError(null);

    const prot = generateProtocolo();

    const { error: insertErr } = await supabase.from("demandas_publicas").insert({
      politico_user_id: profile.id,
      protocolo:  prot,
      nome:       form.nome.trim(),
      email:      form.email.trim().toLowerCase(),
      telefone:   form.telefone || null,
      bairro:     form.bairro.trim() || null,
      tipo:       form.tipo,
      categoria:  form.categoria,
      mensagem:   form.mensagem.trim(),
      status:     "nova",
    });

    setSending(false);

    if (insertErr) {
      setError("Ocorreu um erro ao enviar. Por favor, tente novamente.");
      return;
    }

    setProtocolo(prot);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle size={40} className="text-slate-400" />
        <h1 className="text-xl font-bold text-slate-700">Página não encontrada</h1>
        <p className="text-slate-500 max-w-xs">
          Esta página não existe ou o link pode estar incorreto.
        </p>
      </div>
    );
  }

  const nomePolitico = profile.nome_politico ?? profile.nome;
  const localidade   = [profile.municipio, profile.estado].filter(Boolean).join(" — ");

  const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-sm";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3">
          <p className="text-xs text-slate-400 text-center">Gabinete Pro · Canal oficial de atendimento</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Politician card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 flex items-center gap-4">
          <PoliticianAvatar profile={profile} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">{nomePolitico}</h1>
            {profile.cargo && (
              <p className="text-sm font-medium text-blue-600 mt-0.5">{profile.cargo}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile.partido && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {profile.partido}
                </span>
              )}
              {localidade && (
                <span className="text-xs text-slate-500">{localidade}</span>
              )}
            </div>
          </div>
        </div>

        {/* Form or confirmation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-white font-semibold text-base">Envie uma mensagem</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {profile.nome_gabinete ?? `${nomePolitico} responde pessoalmente.`}
            </p>
          </div>

          {protocolo ? (
            <ConfirmationScreen
              protocolo={protocolo}
              nomeEnviou={form.nome}
              onNovaMensagem={() => { setForm(EMPTY_FORM); setProtocolo(null); }}
            />
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Nome + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nome completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={inputCls}
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={(e) => setF("nome", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setF("email", e.target.value)}
                  />
                </div>
              </div>

              {/* Telefone + Bairro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefone</label>
                  <input
                    className={inputCls}
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => setF("telefone", maskPhone(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bairro</label>
                  <input
                    className={inputCls}
                    placeholder="Seu bairro"
                    value={form.bairro}
                    onChange={(e) => setF("bairro", e.target.value)}
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Tipo de mensagem <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIPO_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setF("tipo", t.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        form.tipo === t.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className="text-xs">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Categoria <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    className={selectCls}
                    value={form.categoria}
                    onChange={(e) => setF("categoria", e.target.value)}
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Mensagem <span className="text-red-400">*</span>
                  </label>
                  <span className={`text-xs ${form.mensagem.length > 480 ? "text-red-500" : "text-slate-400"}`}>
                    {form.mensagem.length}/500
                  </span>
                </div>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={5}
                  maxLength={500}
                  placeholder="Descreva sua mensagem, dúvida ou demanda com o máximo de detalhes possível…"
                  value={form.mensagem}
                  onChange={(e) => setF("mensagem", e.target.value)}
                />
              </div>

              {/* LGPD */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.lgpd}
                  onChange={(e) => setF("lgpd", e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Li e aceito que meus dados sejam utilizados para responder à minha mensagem, conforme a{" "}
                  <strong className="text-slate-700">Lei Geral de Proteção de Dados (LGPD)</strong>.
                  Os dados não serão compartilhados com terceiros.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
              >
                {sending
                  ? <><RefreshCw size={16} className="animate-spin" /> Enviando…</>
                  : <><Send size={16} /> Enviar mensagem</>
                }
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Página oficial do gabinete · Desenvolvido com{" "}
          <span className="text-blue-500 font-medium">Gabinete Pro</span>
        </p>
      </div>
    </div>
  );
}
