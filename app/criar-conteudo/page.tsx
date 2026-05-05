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
  ChevronRight,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

type Plataforma = "instagram" | "facebook" | "twitter" | "imprensa" | "discurso" | "oficio" | "projeto-lei";
type Tom = "formal" | "informal" | "emotivo" | "tecnico";
type AiPhase = "idle" | "questions" | "done";

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
  { value: "instagram",   label: "Instagram",       emoji: "📸" },
  { value: "facebook",    label: "Facebook",        emoji: "📘" },
  { value: "twitter",     label: "Twitter/X",       emoji: "🐦" },
  { value: "imprensa",    label: "Imprensa",        emoji: "📰" },
  { value: "discurso",    label: "Discurso",        emoji: "🎤" },
  { value: "oficio",      label: "Ofício",          emoji: "📄" },
  { value: "projeto-lei", label: "Projeto de Lei",  emoji: "⚖️" },
];

const FORMATO_MAP: Record<Plataforma, string[]> = {
  instagram:    ["Reels", "Sequência de Stories", "Carrossel", "Foto Avulsa"],
  facebook:     ["Reels", "Carrossel", "Foto Avulsa"],
  imprensa:     ["Nota de Imprensa", "Release"],
  discurso:     [],
  twitter:      [],
  oficio:       [],
  "projeto-lei": [],
};

const TOM_OPTIONS: { value: Tom; label: string; desc: string }[] = [
  { value: "formal",   label: "Formal",   desc: "Institucional" },
  { value: "informal", label: "Informal", desc: "Próximo"       },
  { value: "emotivo",  label: "Emotivo",  desc: "Inspirador"    },
  { value: "tecnico",  label: "Técnico",  desc: "Informativo"   },
];

// ── AI Questions ───────────────────────────────────────────────────

function getQuestions(plataforma: string, formato: string): string[] {
  if (plataforma === "projeto-lei") {
    return [
      "Qual é o problema social ou jurídico que esta lei visa resolver?",
      "Há dispositivos legais existentes que serão revogados ou modificados?",
      "Qual o impacto financeiro estimado para o município (se houver)?",
    ];
  }
  if (plataforma === "discurso") {
    return [
      "Qual é a ocasião e o público presente?",
      "Quanto tempo de duração aproximado?",
      "Há algum tema sensível que deve ser evitado?",
    ];
  }
  if (plataforma === "twitter") {
    return [
      "Prefere tom informativo, opinativo ou de engajamento?",
      "Deseja incluir hashtags? Se sim, quais?",
    ];
  }
  if (plataforma === "imprensa" && formato === "Release") {
    return [
      "Deseja incluir aspas de alguma autoridade ou do próprio político?",
      "Qual o principal benefício para a população?",
      "Há números ou dados que devem ser destacados?",
    ];
  }
  if (plataforma === "imprensa") {
    return [
      "Qual o principal benefício para a população?",
      "Há números ou dados que devem ser destacados?",
    ];
  }
  if (formato === "Reels") {
    return [
      "Qual será o gancho de abertura (primeiros 3 segundos)?",
      "Prefere com ou sem emojis no texto?",
      "Deseja incluir chamada para ação no final?",
    ];
  }
  if (formato === "Carrossel") {
    return [
      "Quantos slides deseja? (sugerido: 5-8)",
      "Qual a mensagem principal do primeiro slide?",
      "Prefere linguagem mais formal ou descontraída?",
    ];
  }
  if (formato === "Sequência de Stories") {
    return [
      "Qual o gancho do primeiro slide?",
      "Prefere com ou sem emojis nos slides?",
      "Deseja incluir chamada para ação no último slide?",
    ];
  }
  return [
    "Qual a data e horário do evento (se aplicável)?",
    "Este post será publicado antes, durante ou após o evento?",
    "Deseja incluir alguma frase de destaque ou citação?",
  ];
}

// ── Helpers ────────────────────────────────────────────────────────

function getDbTipo(plataforma: string, formato: string): string {
  if (plataforma === "discurso")    return "pronunciamento";
  if (plataforma === "imprensa")    return formato === "Release" ? "release" : "nota";
  if (plataforma === "oficio")      return "nota";
  if (plataforma === "projeto-lei") return "projeto-lei";
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

// ── AI Questions Card ──────────────────────────────────────────────

interface AiQuestionsCardProps {
  questions: string[];
  currentQ: number;
  currentAnswer: string;
  onAnswerChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

function AiQuestionsCard({
  questions,
  currentQ,
  currentAnswer,
  onAnswerChange,
  onNext,
  onSkip,
  onCancel,
}: AiQuestionsCardProps) {
  const total = questions.length;
  const isLast = currentQ === total - 1;

  return (
    <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-slate-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Sparkles size={13} className="text-blue-400 animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
            IA Contextual
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Cancelar perguntas"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Pergunta {currentQ + 1} de {total}</span>
          <span>{Math.round(((currentQ + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentQ + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-200 leading-relaxed mb-3">
          {questions[currentQ]}
        </p>
        <textarea
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={currentAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Digite sua resposta (ou clique em Pular)..."
          rows={2}
          className="w-full bg-slate-900/60 border border-blue-500/20 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onNext();
            }
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all"
        >
          Pular esta
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all"
        >
          {isLast ? (
            <>
              <Sparkles size={12} />
              Confirmar e gerar
            </>
          ) : (
            <>
              Próxima pergunta
              <ChevronRight size={12} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function CriarConteudoPage() {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    plataforma:   "instagram",
    formato:      "Foto Avulsa",
    tema:         "",
    tom:          "formal",
    nomePolitico: "",
    partidoCargo: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tema = params.get("tema");
    if (tema) setForm((f) => ({ ...f, tema }));
  }, []);

  const [tomVoz,         setTomVoz]   = useState("");
  const [textoReferencia, setTextoRef] = useState("");
  const [ementa,         setEmenta]   = useState("");
  const [justificativa,  setJustif]   = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nome, nome_politico, cargo, partido, tom_voz, texto_referencia")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const d = data as Record<string, string | null>;
        const nomePol  = (d.nome_politico || d.nome || "") as string;
        const cargo    = d.cargo   as string | null;
        const partido  = d.partido as string | null;
        const partCargo = [partido, cargo].filter(Boolean).join(" — ");
        setForm((f) => ({
          ...f,
          nomePolitico: nomePol    || f.nomePolitico,
          partidoCargo: partCargo  || f.partidoCargo,
        }));
        if (d.tom_voz)          setTomVoz(d.tom_voz as string);
        if (d.texto_referencia) setTextoRef(d.texto_referencia as string);
      });
  }, [user]);

  const [result,         setResult]         = useState<GeracaoResult | null>(null);
  const [editedConteudo, setEditedConteudo] = useState("");
  const [generating,     setGenerating]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [saveSuccess,    setSaveSuccess]    = useState(false);
  const [history,        setHistory]        = useState<ConteudoSalvo[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── AI Questions ────────────────────────────────────────────
  const [aiPhase,       setAiPhase]       = useState<AiPhase>("idle");
  const [aiAnswers,     setAiAnswers]     = useState<string[]>([]);
  const [currentQ,      setCurrentQ]      = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");

  const questions = getQuestions(form.plataforma, form.formato);

  function resetAi() {
    setAiPhase("idle");
    setAiAnswers([]);
    setCurrentQ(0);
    setCurrentAnswer("");
  }

  function startAiQuestions() {
    setAiPhase("questions");
    setCurrentQ(0);
    setAiAnswers([]);
    setCurrentAnswer("");
  }

  function advanceQuestion(answer: string) {
    const newAnswers = [...aiAnswers];
    newAnswers[currentQ] = answer;
    setAiAnswers(newAnswers);
    setCurrentAnswer("");
    if (currentQ + 1 >= questions.length) {
      setAiPhase("done");
    } else {
      setCurrentQ(currentQ + 1);
    }
  }

  // ── History ──────────────────────────────────────────────────
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
    resetAi();
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
        body: JSON.stringify({
          ...form,
          respostas: aiAnswers.filter(Boolean),
          tomVoz,
          textoReferencia,
          ementa,
          justificativa,
        }),
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

  const charCount    = editedConteudo.length;
  const isTwitter    = form.plataforma === "twitter";
  const charWarning  = isTwitter && charCount > 280;
  const formatos     = FORMATO_MAP[form.plataforma];
  const temaFilled   = form.tema.trim().length > 5;
  const answeredCount = aiAnswers.filter(Boolean).length;

  return (
    <AppShell
      title="Estúdio de Conteúdo"
      subtitle="Gere textos políticos com inteligência artificial"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── FORMULÁRIO + AI QUESTIONS ──────────────────────── */}
          <div className="space-y-3">
            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={15} className="text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-100">
                  Estúdio de Conteúdo com IA
                </h2>
              </div>

              {/* Plataforma */}
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

              {/* Formato */}
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
                        onClick={() => { updateForm("formato", f); resetAi(); }}
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
                  {form.plataforma === "projeto-lei" ? "Assunto / Tema da lei" : "Tema / Assunto"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.tema}
                  onChange={(e) => updateForm("tema", e.target.value)}
                  placeholder={
                    form.plataforma === "projeto-lei"
                      ? "Ex: Proibição de queima de fogos em áreas urbanas, proteção de animais domésticos..."
                      : "Descreva o que o político quer comunicar. Ex: inauguração de creche no bairro Jardim das Flores..."
                  }
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* PL-specific fields */}
              {form.plataforma === "projeto-lei" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Ementa <span className="text-slate-600">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={ementa}
                      onChange={(e) => setEmenta(e.target.value)}
                      placeholder="Ex: Dispõe sobre a proibição de queima de fogos de artifício com estampido no município..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Base para justificativa <span className="text-slate-600">(opcional)</span>
                    </label>
                    <textarea
                      value={justificativa}
                      onChange={(e) => setJustif(e.target.value)}
                      placeholder="Descreva os principais argumentos para justificar esta lei. Ex: dados sobre incidência, legislações similares em outros municípios, demanda da população..."
                      rows={3}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </>
              )}

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

            {/* ── AI QUESTIONS TRIGGER / STATUS ─────────────────── */}
            {aiPhase === "idle" && temaFilled && (
              <button
                type="button"
                onClick={startAiQuestions}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-400 text-sm font-medium hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
              >
                <Sparkles size={15} className="flex-shrink-0 group-hover:animate-pulse" />
                <span className="flex-1 text-left">✨ Melhorar com perguntas da IA</span>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            )}

            {aiPhase === "done" && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <Check size={14} className="flex-shrink-0" />
                <span className="flex-1 text-xs">
                  {answeredCount > 0
                    ? `${answeredCount} resposta${answeredCount > 1 ? "s" : ""} adicionada${answeredCount > 1 ? "s" : ""} ao contexto da IA`
                    : "Perguntas puladas — gerando sem contexto adicional"}
                </span>
                <button
                  onClick={resetAi}
                  className="text-emerald-600 hover:text-emerald-400 transition-colors flex-shrink-0"
                  aria-label="Remover respostas"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {aiPhase === "questions" && (
              <AiQuestionsCard
                questions={questions}
                currentQ={currentQ}
                currentAnswer={currentAnswer}
                onAnswerChange={setCurrentAnswer}
                onNext={() => advanceQuestion(currentAnswer)}
                onSkip={() => advanceQuestion("")}
                onCancel={resetAi}
              />
            )}
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

            {generating && (
              <div className="flex-1 space-y-3 animate-pulse pt-2">
                {[100, 85, 70, 100, 60, 90, 75, 55, 80].map((w, i) => (
                  <div key={i} className="h-3.5 bg-slate-700/60 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

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
