"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Bookmark,
  Archive,
  Sparkles,
  MapPin,
  ChevronDown,
  Search,
  Trash2,
  Filter,
  BookOpen,
  ArrowRight,
  CheckSquare,
  Square,
  PenSquare,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

interface PoliticalProfile {
  estado: string | null;
  municipio: string | null;
  cargo: string | null;
  interesses: string[] | null;
}

interface PautaIA {
  id: string;
  titulo: string;
  resumo: string;
  area: string;
  relevancia: "Alta" | "Média";
  sugestao_acao: string;
  tags: string[];
  salva?: boolean;
  arquivada?: boolean;
}

interface PautaSalva {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  relevancia: string | null;
  sugestao_acao: string | null;
  tags: string[] | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────

const ESTADOS = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia",
  "Ceará", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso",
  "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná",
  "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte",
  "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina",
  "São Paulo", "Sergipe", "Tocantins", "Distrito Federal",
];

const CARGOS = [
  "Vereador", "Deputado Estadual", "Deputado Federal", "Senador",
];

const AREAS = [
  "Infraestrutura e Obras",
  "Saúde Pública",
  "Educação",
  "Meio Ambiente",
  "Segurança Pública",
  "Habitação",
  "Emprego e Renda",
  "Transporte Público",
  "Agricultura",
  "Cultura e Esporte",
  "Assistência Social",
  "Tecnologia e Inovação",
];

const AREA_BADGE: Record<string, string> = {
  "Infraestrutura e Obras":  "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  "Saúde Pública":           "bg-red-500/20 text-red-400 border border-red-500/30",
  "Educação":                "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Meio Ambiente":           "bg-green-500/20 text-green-400 border border-green-500/30",
  "Segurança Pública":       "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  "Habitação":               "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  "Emprego e Renda":         "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  "Transporte Público":      "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  "Agricultura":             "bg-lime-500/20 text-lime-400 border border-lime-500/30",
  "Cultura e Esporte":       "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  "Assistência Social":      "bg-pink-500/20 text-pink-400 border border-pink-500/30",
  "Tecnologia e Inovação":   "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
};

function badgeForArea(area: string) {
  return AREA_BADGE[area] ?? "bg-slate-500/20 text-slate-400 border border-slate-500/30";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Skeleton Card ──────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-24 rounded-full bg-slate-700" />
        <div className="h-5 w-16 rounded-full bg-slate-700" />
      </div>
      <div className="h-6 w-3/4 rounded bg-slate-700" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-700" />
        <div className="h-4 w-5/6 rounded bg-slate-700" />
      </div>
      <div className="h-14 rounded-lg bg-slate-700" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-slate-700" />
        <div className="h-6 w-20 rounded-full bg-slate-700" />
        <div className="h-6 w-14 rounded-full bg-slate-700" />
      </div>
    </div>
  );
}

// ── Pauta Card ─────────────────────────────────────────────────────

interface PautaCardProps {
  pauta: PautaIA;
  onSalvar: () => void;
  onArquivar: () => void;
  onGerarConteudo: () => void;
}

function PautaCard({ pauta, onSalvar, onArquivar, onGerarConteudo }: PautaCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-600/60 transition-colors">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeForArea(pauta.area)}`}>
          {pauta.area}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          pauta.relevancia === "Alta"
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
        }`}>
          {pauta.relevancia === "Alta" ? "● Alta relevância" : "◐ Média relevância"}
        </span>
        {pauta.salva && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Salva
          </span>
        )}
      </div>

      <h3 className="text-white font-semibold text-base leading-snug">{pauta.titulo}</h3>

      <p className="text-slate-400 text-sm leading-relaxed">{pauta.resumo}</p>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wide">
          Sugestão de ação
        </p>
        <p className="text-sm text-blue-200 leading-relaxed">{pauta.sugestao_acao}</p>
      </div>

      {pauta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pauta.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-400 border border-slate-600/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-700/50">
        <button
          onClick={onGerarConteudo}
          className="flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-500/10"
        >
          <PenSquare size={13} />
          Gerar conteúdo
        </button>
        <button
          onClick={onSalvar}
          disabled={pauta.salva}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Bookmark size={13} />
          {pauta.salva ? "Salva" : "Salvar pauta"}
        </button>
        <button
          onClick={onArquivar}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700/50 ml-auto"
        >
          <Archive size={13} />
          Arquivar
        </button>
      </div>
    </div>
  );
}

// ── Saved Pauta Card ───────────────────────────────────────────────

interface PautaSalvaCardProps {
  pauta: PautaSalva;
  onDelete: () => void;
  onGerarConteudo: () => void;
}

function PautaSalvaCard({ pauta, onDelete, onGerarConteudo }: PautaSalvaCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {pauta.categoria && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeForArea(pauta.categoria)}`}>
            {pauta.categoria}
          </span>
        )}
        {pauta.relevancia && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            pauta.relevancia === "Alta"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          }`}>
            {pauta.relevancia === "Alta" ? "● Alta" : "◐ Média"}
          </span>
        )}
        <span className="text-xs text-slate-500 ml-auto">
          Salva em {formatDate(pauta.created_at)}
        </span>
      </div>

      <h3 className="text-white font-semibold text-base leading-snug">{pauta.titulo}</h3>

      {pauta.descricao && (
        <p className="text-slate-400 text-sm leading-relaxed">{pauta.descricao}</p>
      )}

      {pauta.sugestao_acao && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wide">
            Sugestão de ação
          </p>
          <p className="text-sm text-blue-200 leading-relaxed">{pauta.sugestao_acao}</p>
        </div>
      )}

      {pauta.tags && pauta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pauta.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-400 border border-slate-600/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-slate-700/50">
        <button
          onClick={onGerarConteudo}
          className="flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-500/10"
        >
          <PenSquare size={13} />
          Gerar conteúdo
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 ml-auto"
        >
          <Trash2 size={13} />
          Deletar
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function PautasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Profile state
  const [politicalProfile, setPoliticalProfile] = useState<PoliticalProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  // Onboarding form
  const [formEstado, setFormEstado]       = useState("");
  const [formMunicipio, setFormMunicipio] = useState("");
  const [formCargo, setFormCargo]         = useState("");
  const [formInteresses, setFormInteresses] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Pautas IA
  const [pautasIA, setPautasIA] = useState<PautaIA[]>([]);
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState<string | null>(null);

  // Pautas salvas
  const [pautasSalvas, setPautasSalvas] = useState<PautaSalva[]>([]);
  const [loadingSalvas, setLoadingSalvas] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState<"geradas" | "salvas">("geradas");
  const [filtroArea, setFiltroArea]             = useState("");
  const [filtroRelevancia, setFiltroRelevancia] = useState("");
  const [busca, setBusca]                       = useState("");

  // ── Load political profile ──────────────────────────────────────

  const loadPoliticalProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("estado, municipio, cargo, interesses")
      .eq("id", user.id)
      .single();

    if (data) {
      const p: PoliticalProfile = {
        estado:     data.estado     ?? null,
        municipio:  data.municipio  ?? null,
        cargo:      data.cargo      ?? null,
        interesses: data.interesses ?? null,
      };
      setPoliticalProfile(p);
      const configured = !!(p.estado && p.municipio && p.cargo && p.interesses?.length);
      setShowOnboarding(!configured);
      if (configured) {
        setFormEstado(p.estado!);
        setFormMunicipio(p.municipio!);
        setFormCargo(p.cargo!);
        setFormInteresses(p.interesses!);
      }
    } else {
      setShowOnboarding(true);
    }
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadPoliticalProfile();
  }, [authLoading, user, loadPoliticalProfile]);

  // ── Load saved pautas ───────────────────────────────────────────

  const loadPautasSalvas = useCallback(async () => {
    if (!user) return;
    setLoadingSalvas(true);
    const { data } = await supabase
      .from("pautas")
      .select("id, titulo, descricao, categoria, relevancia, sugestao_acao, tags, created_at")
      .eq("user_id", user.id)
      .eq("status", "ativa")
      .order("created_at", { ascending: false });
    setPautasSalvas(data ?? []);
    setLoadingSalvas(false);
  }, [user]);

  useEffect(() => {
    if (activeTab === "salvas" && user) loadPautasSalvas();
  }, [activeTab, user, loadPautasSalvas]);

  // ── Save profile ────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!user) return;
    if (!formEstado || !formMunicipio.trim() || !formCargo || formInteresses.length === 0) return;

    setSavingProfile(true);
    await supabase
      .from("profiles")
      .update({
        estado:     formEstado,
        municipio:  formMunicipio.trim(),
        cargo:      formCargo,
        interesses: formInteresses,
      })
      .eq("id", user.id);

    const p: PoliticalProfile = {
      estado:     formEstado,
      municipio:  formMunicipio.trim(),
      cargo:      formCargo,
      interesses: formInteresses,
    };
    setPoliticalProfile(p);
    setShowOnboarding(false);
    setEditingProfile(false);
    setSavingProfile(false);
  }

  function toggleInteresse(area: string) {
    setFormInteresses((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  // ── Generate pautas ─────────────────────────────────────────────

  async function handleGenerate() {
    if (!politicalProfile) return;
    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/pautas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipio:  politicalProfile.municipio,
          estado:     politicalProfile.estado,
          cargo:      politicalProfile.cargo,
          interesses: politicalProfile.interesses,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");

      const pautas: PautaIA[] = (data.pautas as PautaIA[]).map((p, i) => ({
        ...p,
        id: `${Date.now()}-${i}`,
        salva: false,
        arquivada: false,
      }));
      setPautasIA(pautas);
      setActiveTab("geradas");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Erro ao gerar pautas.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Save pauta to DB ────────────────────────────────────────────

  async function handleSalvarPauta(pauta: PautaIA) {
    if (!user) return;
    await supabase.from("pautas").insert({
      user_id:       user.id,
      titulo:        pauta.titulo,
      descricao:     pauta.resumo,
      categoria:     pauta.area,
      relevancia:    pauta.relevancia,
      sugestao_acao: pauta.sugestao_acao,
      tags:          pauta.tags,
      status:        "ativa",
    });
    setPautasIA((prev) =>
      prev.map((p) => (p.id === pauta.id ? { ...p, salva: true } : p))
    );
  }

  // ── Archive pauta (in-memory) ───────────────────────────────────

  function handleArquivarPauta(id: string) {
    setPautasIA((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Delete saved pauta ──────────────────────────────────────────

  async function handleDeleteSalva(id: string) {
    await supabase.from("pautas").delete().eq("id", id);
    setPautasSalvas((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Navigate to criar-conteudo with tema ────────────────────────

  function handleGerarConteudo(titulo: string) {
    router.push(`/criar-conteudo?tema=${encodeURIComponent(titulo)}`);
  }

  // ── Filter pautas ───────────────────────────────────────────────

  const pautasFiltradas = pautasIA.filter((p) => {
    if (filtroArea && p.area !== filtroArea) return false;
    if (filtroRelevancia && p.relevancia !== filtroRelevancia) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        p.titulo.toLowerCase().includes(q) ||
        p.resumo.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const salvasFiltradas = pautasSalvas.filter((p) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      p.titulo.toLowerCase().includes(q) ||
      (p.descricao ?? "").toLowerCase().includes(q)
    );
  });

  // ── Loading state ───────────────────────────────────────────────

  if (authLoading || profileLoading) {
    return (
      <AppShell title="Monitor de Pautas" subtitle="Acompanhe as pautas relevantes para seu mandato">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Carregando perfil...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Onboarding / Edit Profile ───────────────────────────────────

  if (showOnboarding || editingProfile) {
    const isEdit = editingProfile && !showOnboarding;
    const formReady =
      formEstado && formMunicipio.trim() && formCargo && formInteresses.length > 0;

    return (
      <AppShell
        title="Monitor de Pautas"
        subtitle={isEdit ? "Editar perfil político" : "Configure seu perfil político"}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border border-blue-500/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MapPin size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">
                  {isEdit ? "Editar perfil político" : "Configure seu perfil político"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isEdit
                    ? "Atualize suas informações para refinar as pautas geradas."
                    : "Informe seu município, cargo e áreas de interesse para receber pautas personalizadas."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Estado *
              </label>
              <div className="relative">
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Município */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Município *
              </label>
              <input
                type="text"
                value={formMunicipio}
                onChange={(e) => setFormMunicipio(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Cargo *
              </label>
              <div className="relative">
                <select
                  value={formCargo}
                  onChange={(e) => setFormCargo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione o cargo</option>
                  {CARGOS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Áreas de interesse */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Áreas de interesse *{" "}
                <span className="text-slate-500 font-normal">
                  ({formInteresses.length} selecionada{formInteresses.length !== 1 ? "s" : ""})
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AREAS.map((area) => {
                  const selected = formInteresses.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleInteresse(area)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                        selected
                          ? "bg-blue-600/20 border border-blue-500/50 text-blue-300"
                          : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                      }`}
                    >
                      {selected ? (
                        <CheckSquare size={15} className="text-blue-400 flex-shrink-0" />
                      ) : (
                        <Square size={15} className="text-slate-500 flex-shrink-0" />
                      )}
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {isEdit && (
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={!formReady || savingProfile}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    {isEdit ? "Salvar alterações" : "Salvar e começar a monitorar"}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Main panel ─────────────────────────────────────────────────

  const p = politicalProfile!;

  return (
    <AppShell
      title="Monitor de Pautas"
      subtitle="Acompanhe as pautas relevantes para seu mandato"
      headerRight={
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {generating ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Atualizar pautas
        </button>
      }
    >
      <div className="space-y-6">
        {/* Profile header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-4 py-2">
            <MapPin size={14} className="text-blue-400" />
            <span className="text-sm text-slate-300 font-medium">
              Monitorando:{" "}
              <span className="text-white">
                {p.municipio} — {p.estado}
              </span>
            </span>
            <span className="text-slate-600 mx-1">·</span>
            <span className="text-sm text-slate-400">{p.cargo}</span>
          </div>
          <button
            onClick={() => setEditingProfile(true)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Editar perfil
          </button>
        </div>

        {/* Interest chips */}
        {p.interesses && p.interesses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.interesses.map((area) => (
              <span
                key={area}
                className={`text-xs font-medium px-3 py-1 rounded-full ${badgeForArea(area)}`}
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("geradas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "geradas"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <Sparkles size={14} />
            Geradas pela IA
            {pautasIA.length > 0 && (
              <span className="bg-blue-500/30 text-blue-300 text-xs px-1.5 py-0.5 rounded-full">
                {pautasIA.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("salvas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "salvas"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <BookOpen size={14} />
            Pautas salvas
            {pautasSalvas.length > 0 && (
              <span className="bg-emerald-500/30 text-emerald-300 text-xs px-1.5 py-0.5 rounded-full">
                {pautasSalvas.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por palavra-chave..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {activeTab === "geradas" && (
            <>
              <div className="relative">
                <select
                  value={filtroArea}
                  onChange={(e) => setFiltroArea(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-300 appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Todas as áreas</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <Filter
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  value={filtroRelevancia}
                  onChange={(e) => setFiltroRelevancia(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-300 appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Toda relevância</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {activeTab === "geradas" && (
          <>
            {/* Generating skeleton */}
            {generating && (
              <div>
                <div className="mb-4 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
                  <RefreshCw size={16} className="text-blue-400 animate-spin flex-shrink-0" />
                  <p className="text-sm text-blue-300">
                    Analisando o cenário político de{" "}
                    <strong>{p.municipio}</strong>... Isso pode levar alguns segundos.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {genError && !generating && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-sm text-red-400">{genError}</p>
              </div>
            )}

            {/* Empty state */}
            {!generating && pautasIA.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-slate-500" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Nenhuma pauta gerada ainda
                </h3>
                <p className="text-slate-400 text-sm max-w-sm mb-6">
                  Clique em &ldquo;Atualizar pautas&rdquo; para receber sugestões personalizadas
                  para {p.municipio} com base nas suas áreas de interesse.
                </p>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={15} />
                  Gerar pautas agora
                </button>
              </div>
            )}

            {/* Pautas grid */}
            {!generating && pautasFiltradas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pautasFiltradas.map((pauta) => (
                  <PautaCard
                    key={pauta.id}
                    pauta={pauta}
                    onSalvar={() => handleSalvarPauta(pauta)}
                    onArquivar={() => handleArquivarPauta(pauta.id)}
                    onGerarConteudo={() => handleGerarConteudo(pauta.titulo)}
                  />
                ))}
              </div>
            )}

            {/* No results after filter */}
            {!generating && pautasIA.length > 0 && pautasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">
                  Nenhuma pauta encontrada com os filtros selecionados.
                </p>
                <button
                  onClick={() => { setFiltroArea(""); setFiltroRelevancia(""); setBusca(""); }}
                  className="text-blue-400 text-sm mt-2 hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "salvas" && (
          <>
            {loadingSalvas && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loadingSalvas && salvasFiltradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                  <BookOpen size={28} className="text-slate-500" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Nenhuma pauta salva
                </h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Gere pautas com a IA e clique em &ldquo;Salvar pauta&rdquo; nas que forem
                  relevantes para você.
                </p>
              </div>
            )}

            {!loadingSalvas && salvasFiltradas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salvasFiltradas.map((pauta) => (
                  <PautaSalvaCard
                    key={pauta.id}
                    pauta={pauta}
                    onDelete={() => handleDeleteSalva(pauta.id)}
                    onGerarConteudo={() => handleGerarConteudo(pauta.titulo)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
