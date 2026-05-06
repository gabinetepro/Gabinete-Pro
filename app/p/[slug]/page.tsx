"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Send, CheckCircle2, RefreshCw, AlertCircle, MapPin, ExternalLink,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────

interface PoliticoProfile {
  id: string;
  nome: string;
  nome_politico: string | null;
  cargo: string | null;
  partido: string | null;
  municipio: string | null;
  estado: string | null;
  foto_url: string | null;
  avatar_url: string | null;
  nome_gabinete: string | null;
}

interface Demanda {
  id: string;
  titulo: string | null;
  mensagem: string;
  status: string;
  categoria: string | null;
  created_at: string;
}

interface FormState {
  nome: string;
  telefone: string;
  mensagem: string;
}

const EMPTY_FORM: FormState = { nome: "", telefone: "", mensagem: "" };

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  nova:           { label: "Nova",          cls: "bg-amber-100 text-amber-700 border-amber-200" },
  aberta:         { label: "Aberta",        cls: "bg-amber-100 text-amber-700 border-amber-200" },
  "em andamento": { label: "Em andamento",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
  resolvida:      { label: "Resolvida",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function generateProtocolo() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEM-${ts}-${rand}`;
}

function initials(nome: string) {
  return nome.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function PoliticianPhoto({ profile }: { profile: PoliticoProfile }) {
  const nome     = profile.nome_politico ?? profile.nome;
  const photoUrl = profile.foto_url ?? profile.avatar_url;

  if (photoUrl) {
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg overflow-hidden flex-shrink-0 ring-4 ring-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={nome} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0 ring-4 ring-white">
      {initials(nome)}
    </div>
  );
}

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
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5 shadow-sm">
        <CheckCircle2 size={32} className="text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Mensagem recebida!</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
        Obrigado, <strong className="text-slate-700">{nomeEnviou}</strong>!
        Em breve nossa equipe entrará em contato.
      </p>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-6 py-4 mb-8 w-full max-w-xs">
        <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-2">Protocolo</p>
        <p className="font-mono font-bold text-blue-700 text-lg tracking-wide">{protocolo}</p>
        <p className="text-xs text-slate-400 mt-1.5">Guarde este número para acompanhar</p>
      </div>
      <button
        onClick={onNovaMensagem}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
      >
        <RefreshCw size={14} />
        Enviar outra mensagem
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PublicDemandasPage() {
  const { slug } = useParams<{ slug: string }>();

  const [profile,  setProfile]  = useState<PoliticoProfile | null>(null);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading,  setLoading]  = useState(true);

  const [form,      setForm]      = useState<FormState>(EMPTY_FORM);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, nome, nome_politico, cargo, partido, municipio, estado, foto_url, avatar_url, nome_gabinete")
        .eq("slug", slug)
        .single();

      if (!prof) { setNotFound(true); setLoading(false); return; }
      setProfile(prof as PoliticoProfile);

      const { data: dem } = await supabase
        .from("demandas_publicas")
        .select("id, titulo, mensagem, status, categoria, created_at")
        .eq("politico_user_id", (prof as PoliticoProfile).id)
        .order("created_at", { ascending: false })
        .limit(10);

      setDemandas((dem ?? []) as Demanda[]);
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

    if (!form.nome.trim())     { setError("Nome é obrigatório.");        return; }
    if (!form.mensagem.trim()) { setError("Escreva sua mensagem.");      return; }

    setSending(true);
    setError(null);

    const prot = generateProtocolo();

    const { error: insertErr } = await supabase.from("demandas_publicas").insert({
      politico_user_id: profile.id,
      protocolo:  prot,
      nome:       form.nome.trim(),
      telefone:   form.telefone || null,
      mensagem:   form.mensagem.trim(),
      tipo:       "demanda",
      status:     "nova",
    });

    setSending(false);

    if (insertErr) {
      setError("Ocorreu um erro ao enviar. Por favor, tente novamente.");
      return;
    }

    setProtocolo(prot);
  }

  const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw size={28} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
            <div className="text-5xl mb-3">🏛️</div>
            <h1 className="text-xl font-black text-white leading-tight">Perfil não encontrado</h1>
          </div>
          <div className="px-6 py-6 text-center space-y-4">
            <p className="text-slate-500 text-sm leading-relaxed">
              O link pode estar incorreto ou o perfil ainda não foi configurado.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-left">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Se você é o político:</strong> acesse as configurações do Gabinete Pro para ativar sua página pública.
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-slate-400">
              Powered by <span className="text-blue-500 font-semibold">Gabinete Pro</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nomePolitico = profile.nome_politico ?? profile.nome;
  const localidade   = [profile.municipio, profile.estado].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pb-16 pt-10 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-md mx-auto relative">
          <p className="text-blue-200/80 text-xs font-semibold tracking-widest uppercase text-center mb-8">
            🏛️ Gabinete Pro · Atendimento ao Cidadão
          </p>
          <div className="flex flex-col items-center text-center gap-4">
            <PoliticianPhoto profile={profile} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{nomePolitico}</h1>
              {profile.cargo && (
                <p className="text-blue-200 font-semibold text-sm mt-1">{profile.cargo}</p>
              )}
              <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
                {profile.partido && (
                  <span className="text-xs bg-white/15 text-white px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
                    {profile.partido}
                  </span>
                )}
                {localidade && (
                  <span className="flex items-center gap-1 text-xs bg-white/10 text-blue-100 px-3 py-1 rounded-full backdrop-blur-sm">
                    <MapPin size={10} />
                    {localidade}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 pb-12 relative z-10 space-y-5">

        {/* ── Contact Form ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-slate-800 font-bold text-lg">
              {profile.nome_gabinete ?? "Fale com o gabinete"}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Sua mensagem será respondida em breve pela equipe.
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
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Nome completo <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={(e) => setF("nome", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Telefone</label>
                <input
                  className={inputCls}
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={(e) => setF("telefone", maskPhone(e.target.value))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Mensagem <span className="text-red-400 normal-case">*</span>
                  </label>
                  <span className={`text-xs ${form.mensagem.length > 480 ? "text-red-500" : "text-slate-300"}`}>
                    {form.mensagem.length}/500
                  </span>
                </div>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={5}
                  maxLength={500}
                  placeholder="Descreva sua mensagem, solicitação ou demanda…"
                  value={form.mensagem}
                  onChange={(e) => setF("mensagem", e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              >
                {sending
                  ? <><RefreshCw size={16} className="animate-spin" /> Enviando…</>
                  : <><Send size={16} /> Enviar mensagem</>
                }
              </button>
            </form>
          )}
        </div>

        {/* ── Demandas públicas ─────────────────────────────────────── */}
        {demandas.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-slate-700 font-bold text-sm">Acompanhe demandas recentes</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {demandas.map((d) => {
                const st = STATUS_STYLE[d.status?.toLowerCase()] ?? STATUS_STYLE["aberta"];
                const title = d.titulo || d.mensagem.slice(0, 60) + (d.mensagem.length > 60 ? "…" : "");
                return (
                  <div key={d.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 leading-snug truncate">{title}</p>
                        {d.categoria && (
                          <p className="text-xs text-slate-400 mt-0.5">{d.categoria}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pt-2">
          Powered by{" "}
          <a
            href="https://gabinete-pro.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 font-semibold inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            Gabinete Pro
            <ExternalLink size={10} />
          </a>
        </p>
      </div>
    </div>
  );
}
