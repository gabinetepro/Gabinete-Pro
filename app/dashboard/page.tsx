"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  AlertCircle,
  BookOpen,
  LogOut,
  PenSquare,
  Calendar,
  Layout,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  BarChart3,
  UserPlus,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import EleitoresChart from "@/components/dashboard/EleitoresChart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────
interface MetricData {
  current: number;
  previous: number;
}
interface Eleitor {
  id: string;
  nome: string;
  telefone?: string;
  bairro?: string;
  created_at: string;
}
interface Conteudo {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  created_at: string;
}
interface ChartPoint {
  mes: string;
  total: number;
}
interface EventoHoje {
  id: string;
  titulo: string;
  tipo: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  local: string | null;
}
interface DashboardData {
  metrics: {
    eleitores: MetricData;
    conteudos: MetricData;
    demandas: MetricData;
    pautas: MetricData;
  };
  recentEleitores: Eleitor[];
  recentConteudos: Conteudo[];
  chartData: ChartPoint[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function variation(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function safeCount(
  q: PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  const { count } = await q;
  return count ?? 0;
}

async function safeList<T>(
  q: PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const { data } = await q;
  return data ?? [];
}

// ── Constants ──────────────────────────────────────────────────────────────
const PLAN_STYLE: Record<string, string> = {
  trial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  solo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  assessor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  gabinete: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};
const PLAN_LABEL: Record<string, string> = {
  trial: "Trial",
  solo: "Solo",
  assessor: "Assessor",
  gabinete: "Gabinete",
};
const TIPO_LABEL: Record<string, string> = {
  post: "Post",
  nota: "Nota",
  pronunciamento: "Pronunciamento",
  release: "Release",
};
const STATUS_COLOR: Record<string, string> = {
  rascunho: "text-slate-400",
  revisao: "text-amber-400",
  publicado: "text-emerald-400",
};

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skel({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-700/40 ${className}`} />
  );
}

function MetricSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <Skel className="h-3 w-28" />
        <Skel className="h-9 w-9 rounded-lg" />
      </div>
      <Skel className="h-10 w-16 mb-2" />
      <Skel className="h-3 w-36" />
    </div>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────
async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const startCurrent = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const startPrev = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();
  const endPrev = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  ).toISOString();

  const [
    elTotal,
    elPrev,
    conCurrent,
    conPrev,
    demOpen,
    pautasActive,
    recentEl,
    recentCon,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("eleitores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
    ),
    safeCount(
      supabase
        .from("eleitores")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startPrev)
        .lte("created_at", endPrev)
    ),
    safeCount(
      supabase
        .from("conteudos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startCurrent)
    ),
    safeCount(
      supabase
        .from("conteudos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startPrev)
        .lte("created_at", endPrev)
    ),
    safeCount(
      supabase
        .from("demandas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "aberta")
    ),
    safeCount(
      supabase
        .from("pautas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "ativa")
    ),
    safeList<Eleitor>(
      supabase
        .from("eleitores")
        .select("id,nome,telefone,bairro,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)
    ),
    safeList<Conteudo>(
      supabase
        .from("conteudos")
        .select("id,titulo,tipo,status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)
    ),
  ]);

  // Chart: últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { data: chartRaw } = await supabase
    .from("eleitores")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sixMonthsAgo.toISOString());

  const buckets: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
    buckets[key] = 0;
  }
  chartRaw?.forEach(({ created_at }) => {
    const key = new Date(created_at)
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
    if (key in buckets) buckets[key]++;
  });
  const chartData = Object.entries(buckets).map(([mes, total]) => ({
    mes,
    total,
  }));

  return {
    metrics: {
      eleitores: { current: elTotal, previous: elPrev },
      conteudos: { current: conCurrent, previous: conPrev },
      demandas: { current: demOpen, previous: 0 },
      pautas: { current: pautasActive, previous: 0 },
    },
    recentEleitores: recentEl,
    recentConteudos: recentCon,
    chartData,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function VariationLine({ current, previous }: { current: number; previous: number }) {
  const pct = variation(current, previous);
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span className="text-xs text-slate-500 flex items-center gap-1">
        <Minus size={11} /> Sem dados anteriores
      </span>
    );
  }
  const positive = pct >= 0;
  return (
    <span
      className={`text-xs flex items-center gap-1 ${
        positive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? "+" : ""}
      {pct}% vs. mês anterior
    </span>
  );
}

function MetricCard({
  title,
  icon: Icon,
  data,
  valueColor,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  data: MetricData;
  valueColor: string;
  loading: boolean;
}) {
  if (loading) return <MetricSkeleton />;
  return (
    <div className="group bg-surface border border-border rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-glow-blue">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600/20 to-emerald-500/20 border border-blue-500/20 flex items-center justify-center">
          <Icon size={16} className="text-emerald-400" />
        </div>
      </div>
      <p className={`text-4xl font-extrabold tracking-tight mb-1 ${valueColor}`}>
        {data.current.toLocaleString("pt-BR")}
      </p>
      <VariationLine current={data.current} previous={data.previous} />
    </div>
  );
}

// ── DashboardSugestaoCard ──────────────────────────────────────────
function DashboardSugestaoCard({
  icon, label, content, tipo, eventoTitulo, eventoData,
}: {
  icon: string;
  label: string;
  content: string;
  tipo: string;
  eventoTitulo: string;
  eventoData: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenStudio() {
    sessionStorage.setItem('conteudo_gerado', JSON.stringify({
      tipo,
      texto: content,
      evento: eventoTitulo,
      data: eventoData,
    }));
    router.push('/criar-conteudo');
  }

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-slate-800/40">
        <span>{icon}</span>
        <span className="text-xs font-semibold text-slate-300">{label}</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{content}</p>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-slate-400 hover:text-slate-200 hover:border-blue-500/40 transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
        <button
          onClick={handleOpenStudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:opacity-90 transition-opacity"
        >
          <Sparkles size={12} />
          Abrir no Estúdio
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"eleitores" | "conteudos">(
    "eleitores"
  );
  const [eventosHoje, setEventosHoje] = useState<EventoHoje[]>([]);
  const [eventosLoading, setEventosLoading] = useState(true);
  const [modalSugestao,     setModalSugestao]     = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoHoje | null>(null);
  const [sugestoes,         setSugestoes]         = useState<{ post: string; oficio: string; roteiro: string } | null>(null);
  const [loadingSugestao,   setLoadingSugestao]   = useState(false);
  const [sugestaoError,     setSugestaoError]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchDashboardData(user.id);
      setData(result);
    } catch (e) {
      setError("Erro ao carregar dados. Verifique sua conexão e tente novamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, loadData]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("eventos")
      .select("id, titulo, tipo, hora_inicio, hora_fim, local")
      .eq("user_id", user.id)
      .eq("data", today)
      .order("hora_inicio", { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setEventosHoje((data as EventoHoje[]) ?? []);
        setEventosLoading(false);
      });
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  async function handleSugerirDashboard(evento: EventoHoje) {
    setEventoSelecionado(evento);
    setSugestoes(null);
    setSugestaoError(null);
    setLoadingSugestao(true);
    setModalSugestao(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch('/api/agenda/sugerir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: evento.titulo,
          data: today,
          local: evento.local,
          descricao: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar sugestões');
      setSugestoes(data as { post: string; oficio: string; roteiro: string });
    } catch (e) {
      setSugestaoError(e instanceof Error ? e.message : 'Erro ao gerar sugestões. Tente novamente.');
    } finally {
      setLoadingSugestao(false);
    }
  }

  function closeModal() {
    setModalSugestao(false);
    setEventoSelecionado(null);
    setSugestoes(null);
    setSugestaoError(null);
  }

  const planKey = (profile?.plano ?? "trial") as string;
  const firstName = profile?.nome?.split(" ")[0] ?? "usuário";

  // Header right: greeting + plan badge + logout
  const headerRight = (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-sm text-slate-300 font-medium">
        {getGreeting()}, <span className="text-slate-100">{firstName}</span>
      </span>
      <span
        className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${PLAN_STYLE[planKey]}`}
      >
        {PLAN_LABEL[planKey]}
      </span>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors border border-transparent hover:border-border"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );

  if (error) {
    return (
      <AppShell
        title="Dashboard"
        subtitle="Visão geral do seu gabinete"
        headerRight={headerRight}
      >
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <p className="text-slate-300 font-medium">{error}</p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-emerald-400 transition-all"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <>
    <AppShell
      title="Dashboard"
      subtitle="Visão geral do seu gabinete"
      headerRight={headerRight}
    >
      <div className="space-y-6">

        {/* ── Métricas ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Eleitores cadastrados"
            icon={Users}
            data={data?.metrics.eleitores ?? { current: 0, previous: 0 }}
            valueColor="text-emerald-400"
            loading={loading}
          />
          <MetricCard
            title="Conteúdos este mês"
            icon={PenSquare}
            data={data?.metrics.conteudos ?? { current: 0, previous: 0 }}
            valueColor="text-blue-400"
            loading={loading}
          />
          <MetricCard
            title="Demandas abertas"
            icon={AlertCircle}
            data={data?.metrics.demandas ?? { current: 0, previous: 0 }}
            valueColor="text-amber-400"
            loading={loading}
          />
          <MetricCard
            title="Pautas monitoradas"
            icon={BookOpen}
            data={data?.metrics.pautas ?? { current: 0, previous: 0 }}
            valueColor="text-purple-400"
            loading={loading}
          />
        </div>

        {/* ── Agenda de hoje ── */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Agenda de hoje</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Link href="/agenda" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Ver agenda →
            </Link>
          </div>

          {eventosLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skel className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skel className="h-3 w-2/3" />
                    <Skel className="h-2.5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : eventosHoje.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Calendar size={22} className="text-slate-700" />
              <p className="text-sm text-slate-500">Nenhum evento hoje.</p>
              <Link href="/agenda" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                Adicionar na agenda →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eventosHoje.map((ev) => {
                const hora = ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : null;
                return (
                  <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-700/20 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                      <Calendar size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{ev.titulo}</p>
                      <p className="text-xs text-slate-500">
                        {hora && <span className="font-medium text-slate-400">{hora}</span>}
                        {hora && ev.local && " · "}
                        {ev.local}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSugerirDashboard(ev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600/20 to-emerald-500/20 border border-blue-500/30 text-blue-300 hover:from-blue-600/30 hover:to-emerald-500/30 transition-all whitespace-nowrap shrink-0"
                    >
                      <Sparkles size={11} />
                      Sugerir conteúdo
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Linha principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna esquerda: gráfico + atividade */}
          <div className="lg:col-span-2 space-y-6">

            {/* Gráfico */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Eleitores cadastrados
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Últimos 6 meses</p>
                </div>
                <BarChart3 size={16} className="text-slate-600" />
              </div>
              {loading ? (
                <Skel className="h-44 w-full" />
              ) : (
                <EleitoresChart data={data?.chartData ?? []} />
              )}
            </div>

            {/* Atividade recente */}
            <div className="bg-surface border border-border rounded-xl">
              {/* Tabs */}
              <div className="flex border-b border-border">
                {(
                  [
                    { key: "eleitores", label: "Últimos eleitores", icon: Users },
                    { key: "conteudos", label: "Últimos conteúdos", icon: FileText },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === key
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skel className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skel className="h-3 w-3/4" />
                          <Skel className="h-2.5 w-1/2" />
                        </div>
                        <Skel className="h-2.5 w-14" />
                      </div>
                    ))}
                  </div>
                ) : activeTab === "eleitores" ? (
                  data?.recentEleitores.length ? (
                    <ul className="space-y-1">
                      {data.recentEleitores.map((el) => (
                        <li
                          key={el.id}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/30 to-emerald-500/30 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-blue-300">
                              {el.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {el.nome}
                            </p>
                            <p className="text-xs text-slate-500">
                              {el.bairro ?? el.telefone ?? "Sem localização"}
                            </p>
                          </div>
                          <span className="text-xs text-slate-600 shrink-0">
                            {timeAgo(el.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={UserPlus}
                      text="Nenhum eleitor cadastrado ainda."
                      href="/eleitores"
                      action="Cadastrar eleitor"
                    />
                  )
                ) : data?.recentConteudos.length ? (
                  <ul className="space-y-1">
                    {data.recentConteudos.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <FileText size={12} className="text-purple-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {c.titulo}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {TIPO_LABEL[c.tipo] ?? c.tipo}
                            </span>
                            <span className={`text-xs font-medium ${STATUS_COLOR[c.status] ?? "text-slate-400"}`}>
                              {c.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-600 shrink-0">
                          {timeAgo(c.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={PenSquare}
                    text="Nenhum conteúdo gerado ainda."
                    href="/criar-conteudo"
                    action="Gerar conteúdo"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Coluna direita: ações rápidas */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Ações rápidas
              </h3>
              <div className="space-y-2">
                {[
                  {
                    href: "/eleitores",
                    icon: UserPlus,
                    label: "Novo eleitor",
                    color: "from-blue-600 to-blue-500",
                  },
                  {
                    href: "/criar-conteudo",
                    icon: PenSquare,
                    label: "Gerar conteúdo",
                    color: "from-purple-600 to-purple-500",
                  },
                  {
                    href: "/agenda",
                    icon: Calendar,
                    label: "Ver agenda",
                    color: "from-emerald-600 to-emerald-500",
                  },
                  {
                    href: "/kanban",
                    icon: Layout,
                    label: "Central de Conteúdo",
                    color: "from-amber-600 to-amber-500",
                  },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-blue-500/30 hover:bg-slate-700/30 transition-all duration-150 group"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Status do plano */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Seu plano
              </h3>
              {authLoading ? (
                <div className="space-y-2">
                  <Skel className="h-7 w-24" />
                  <Skel className="h-3 w-40" />
                  <Skel className="h-8 w-full mt-3 rounded-lg" />
                </div>
              ) : (
                <>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border mb-2 ${PLAN_STYLE[planKey]}`}
                  >
                    {PLAN_LABEL[planKey]}
                  </span>
                  <p className="text-xs text-slate-500 mb-4">
                    {planKey === "trial"
                      ? "Período de avaliação ativo."
                      : `Plano ${PLAN_LABEL[planKey]} ativo.`}
                  </p>
                  {planKey === "trial" || planKey === "solo" ? (
                    <Link
                      href="/#planos"
                      className="block w-full text-center py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
                    >
                      Fazer upgrade
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </AppShell>

      {/* Dashboard AI Suggestion Modal — rendered outside AppShell to avoid stacking issues */}
      {modalSugestao && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          onClick={closeModal}
        >
          <div
            className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-[#0f172a] z-10">
              <div>
                <h3 className="text-base font-bold text-white">
                  ✨ Sugestões para: {eventoSelecionado?.titulo}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Gerado com IA</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              {loadingSugestao && (
                <div className="flex items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className="text-slate-400 text-sm">Gerando sugestões com IA...</span>
                </div>
              )}
              {sugestaoError && (
                <p className="text-red-400 text-sm text-center py-8">{sugestaoError}</p>
              )}
              {sugestoes && !loadingSugestao && (
                <div className="space-y-4">
                  {([
                    { key: "post"    as const, label: "📱 Post para Instagram" },
                    { key: "oficio"  as const, label: "📄 Ofício sugerido"     },
                    { key: "roteiro" as const, label: "🎤 Roteiro de fala"     },
                  ] as const).map(({ key, label }) => (
                    <DashboardSugestaoCard
                      key={key}
                      icon={label.slice(0, 2)}
                      label={label}
                      content={sugestoes[key]}
                      tipo={key}
                      eventoTitulo={eventoSelecionado?.titulo ?? ""}
                      eventoData={new Date().toISOString().split("T")[0]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Empty state helper ─────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  text,
  href,
  action,
}: {
  icon: React.ElementType;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-700/40 flex items-center justify-center">
        <Icon size={18} className="text-slate-500" />
      </div>
      <p className="text-sm text-slate-500">{text}</p>
      <Link
        href={href}
        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
      >
        {action} →
      </Link>
    </div>
  );
}
