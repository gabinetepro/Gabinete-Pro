"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

type Plataforma = "instagram" | "facebook" | "twitter" | "imprensa" | "discurso" | "oficio";
type Tom = "formal" | "informal" | "emotivo" | "tecnico";

interface ConteudoSalvo {
  id: string;
  titulo: string;
  tipo: string;
  canal: string | null;
  formato: string | null;
  conteudo: string;
  created_at: string;
}

interface FormState {
  plataforma: Plataforma;
  formato: string;
  tema: string;
  tom: Tom;
  nomePolitico: string;
  partidoCargo: string;
}

interface GeracaoResult {
  conteudo: string;
  hashtags: string;
}

// ── Config ─────────────────────────────────────────────────────────

const PLATAFORMA_OPTIONS: { value: Plataforma; label: string; emoji: string }[] = [
  { value: "instagram", label: "Instagram",  emoji: "📸" },
  { value: "facebook",  label: "Facebook",   emoji: "📘" },
  { value: "twitter",   label: "Twitter/X",  emoji: "🐦" },
  { value: "imprensa",  label: "Imprensa",   emoji: "📰" },
  { value: "discurso",  label: "Discurso",   emoji: "🎤" },
  { value: "oficio",    label: "Ofício",     emoji: "📄" },
];

const FORMATO_MAP: Record<Plataforma, string[]> = {
  instagram: ["Reels", "Sequência de Stories", "Carrossel", "Foto Avulsa"],
  facebook:  ["Reels", "Carrossel", "Foto Avulsa"],
  imprensa:  ["Nota de Imprensa", "Release"],
  discurso:  [],
  twitter:   [],
  oficio:    [],
};

const TOM_OPTIONS: { value: Tom; label: string; desc: string }[] = [
  { value: "formal",   label: "Formal",   desc: "Institucional" },
  { value: "informal", label: "Informal", desc: "Próximo"       },
  { value: "emotivo",  label: "Emotivo",  desc: "Inspirador"    },
  { value: "tecnico",  label: "Técnico",  desc: "Informativo"   },
];

// ── Helpers ────────────────────────────────────────────────────────

function getDbTipo(plataforma: string, formato: string): string {
  if (plataforma === "discurso") return "pronunciamento";
  if (plataforma === "imprensa") return formato === "Release" ? "release" : "nota";
  if (plataforma === "oficio")   return "nota";
  return "post";
}

function historyLabel(canal: string | null, formato: string | null, tipo: string): string {
  const parts = [canal, formato].filter(Boolean) as string[];
  if (parts.length === 0) return tipo;
  return parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
}

// ── Page ───────────────────────────────────────────────────────────

export default function CriarConteudoPage() {
  const { user, profile } = useAuth();

  const [form, setForm] = useState<FormState>({
    plataforma: "instagram",
    formato:    "Foto Avulsa",
    tema:       "",
    tom:        "formal",
    nomePolitico: "",
    partidoCargo: "",
  });

  const [result,         setResult]         = useState<GeracaoResult | null>(null);
  const [editedConteudo, setEditedConteudo] = useState("");
  const [generating,     setGenerating]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [saveSuccess,    setSaveSuccess]    = useState(false);
  const [history,        setHistory]        = useState<ConteudoSalvo[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (profile?.nome) setForm((f) => ({ ...f, nomePolitico: profile.nome }));
  }, [profile]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("conteudos")
      .select("id, titulo, tipo, canal, formato, conteudo, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data ?? []);
    setHistoryLoading(false);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  function updatePlataforma(p: Plataforma) {
    const formatos = FORMATO_MAP[p];
    setForm((f) => ({ ...f, plataforma: p, formato: formatos[0] ?? "" }));
    setError(null);
  }

  function updateForm(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  async function handleGenerate() {
    if (!form.tema.trim()) {
      setError("Preencha o tema/assunto antes de gerar.");
      return;
    }
    if (!form.nomePolitico.trim()) {
      setError("Informe o nome do político.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/gerar-conteudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");

      setResult(data);
      setEditedConteudo(data.conteudo + (data.hashtags ? `\n\n${data.hashtags}` : ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(editedConteudo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!user || !editedConteudo.trim()) return;
    setSaving(true);

    const plataformaLabel = form.plataforma.charAt(0).toUpperCase() + form.plataforma.slice(1);
    const formatoPart     = form.formato ? ` · ${form.formato}` : "";
    const titulo = `${plataformaLabel}${formatoPart} — ${form.tema.slice(0, 50)}${form.tema.length > 50 ? "…" : ""}`;

    const { error: saveErr } = await supabase.from("conteudos").insert({
      user_id:  user.id,
      titulo,
      tipo:     getDbTipo(form.plataforma, form.formato),
      conteudo: editedConteudo,
      canal:    form.plataforma,
      formato:  form.formato || null,
      status:   "rascunho",
    });

    setSaving(false);

    if (!saveErr) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadHistory();
    } else {
      setError("Erro ao salvar. Tente novamente.");
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("conteudos").delete().eq("id", id);
    setHistory((h) => h.filter((item) => item.id !== id));
  }

  function handleView(item: ConteudoSalvo) {
    setEditedConteudo(item.conteudo ?? "");
    setResult({ conteudo: item.conteudo ?? "", hashtags: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const charCount   = editedConteudo.length;
  const isTwitter   = form.plataforma === "twitter";
  const charWarning = isTwitter && charCount > 280;
  const formatos    = FORMATO_MAP[form.plataforma];

  return (
    <AppShell
      title="Estúdio de Conteúdo"
      subtitle="Gere textos políticos com inteligência artificial"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── FORMULÁRIO ──────────────────────────────────────── */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              <h2 className="text-base font-semibold text-slate-100">
                Estúdio de Conteúdo com IA
              </h2>
            </div>

            {/* Nível 1 — Plataforma */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Plataforma
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PLATAFORMA_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updatePlataforma(p.value)}
                    className={`py-3 px-2 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
                      form.plataforma === p.value
                        ? "bg-gradient-to-br from-blue-600 to-emerald-500 border-transparent text-white shadow-glow-blue"
                        : "border-border text-slate-400 hover:border-blue-500/40 hover:text-slate-200 bg-background"
                    }`}
                  >
                    <span className="text-xl leading-none">{p.emoji}</span>
                    <span className="text-[10px] font-semibold">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nível 2 — Formato (condicional) */}
            {formatos.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Formato
                </label>
                <div className="flex flex-wrap gap-2">
                  {formatos.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => updateForm("formato", f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.formato === f
                          ? "bg-gradient-to-r from-blue-600 to-emerald-500 border-transparent text-white"
                          : "border-border text-slate-400 hover:border-blue-500/40 hover:text-slate-200 bg-background"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tema */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Tema / Assunto <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.tema}
                onChange={(e) => updateForm("tema", e.target.value)}
                placeholder="Descreva o que o político quer comunicar. Ex: inauguração de creche no bairro Jardim das Flores..."
                rows={3}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Tom */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Tom
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TOM_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => updateForm("tom", o.value)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                      form.tom === o.value
                        ? "bg-gradient-to-r from-blue-600 to-emerald-500 border-transparent text-white"
                        : "border-border text-slate-400 hover:border-blue-500/40 hover:text-slate-200 bg-background"
                    }`}
                  >
                    <span className="block font-semibold">{o.label}</span>
                    <span className="block opacity-70 text-[10px]">{o.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nome do político */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Nome do político <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nomePolitico}
                onChange={(e) => updateForm("nomePolitico", e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Partido e cargo */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Partido e cargo{" "}
                <span className="text-slate-600">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.partidoCargo}
                onChange={(e) => updateForm("partidoCargo", e.target.value)}
                placeholder="Ex: PT — Vereador em São Paulo"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              loading={generating}
              disabled={generating}
              size="lg"
              className="w-full justify-center"
            >
              {!generating && <Sparkles size={16} />}
              {generating ? "Gerando com IA..." : "Gerar com IA"}
            </Button>
          </div>

          {/* ── RESULTADO ───────────────────────────────────────── */}
          <div className="bg-surface border border-border rounded-xl p-6 flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                  <FileText size={15} className="text-slate-400" />
                </div>
                <h2 className="text-base font-semibold text-slate-100">
                  Conteúdo Gerado
                </h2>
              </div>

              {result && (
                <span className={`text-xs font-mono tabular-nums ${charWarning ? "text-red-400" : "text-slate-500"}`}>
                  {charCount}
                  {isTwitter && <span className="text-slate-600"> / 280</span>}
                </span>
              )}
            </div>

            {/* Skeleton */}
            {generating && (
              <div className="flex-1 space-y-3 animate-pulse pt-2">
                {[100, 85, 70, 100, 60, 90, 75, 55, 80].map((w, i) => (
                  <div key={i} className="h-3.5 bg-slate-700/60 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!generating && !result && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-700/40 flex items-center justify-center">
                  <Sparkles size={28} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">O conteúdo gerado aparecerá aqui.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Configure o formulário e clique em &quot;Gerar com IA&quot;.
                  </p>
                </div>
              </div>
            )}

            {/* Resultado */}
            {!generating && result && (
              <div className="flex-1 flex flex-col gap-3">
                <textarea
                  value={editedConteudo}
                  onChange={(e) => setEditedConteudo(e.target.value)}
                  className={`flex-1 min-h-[280px] bg-background border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none ${
                    charWarning ? "border-red-500/50" : "border-border"
                  }`}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "#e2e8f0",
                  }}
                />

                {charWarning && (
                  <p className="text-xs text-red-400">
                    Atenção: o texto excede 280 caracteres (limite do Twitter/X).
                  </p>
                )}

                {saveSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 text-sm text-emerald-400 flex items-center gap-2">
                    <Check size={14} />
                    Conteúdo salvo com sucesso!
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCopy} className="justify-center">
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSave} loading={saving} className="justify-center">
                    {!saving && <Save size={13} />}
                    {saving ? "Salvando…" : "Salvar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={generating} className="justify-center">
                    <RefreshCw size={13} />
                    Refazer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── HISTÓRICO ───────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-100 mb-4">
            Últimos Conteúdos Salvos
          </h2>

          {historyLoading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-700/40 rounded-lg" />
              ))}
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <FileText size={32} className="text-slate-700" />
              <p className="text-sm text-slate-500">Nenhum conteúdo salvo ainda.</p>
              <p className="text-xs text-slate-600">Os conteúdos que você salvar aparecerão aqui.</p>
            </div>
          )}

          {!historyLoading && history.length > 0 && (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-border hover:border-blue-500/30 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-700/50 flex items-center justify-center">
                    <FileText size={13} className="text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{item.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-600">
                        {historyLabel(item.canal, item.formato, item.tipo)}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-600">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleView(item)}
                      title="Ver conteúdo"
                      className="p-1.5 rounded-md text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Deletar"
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
