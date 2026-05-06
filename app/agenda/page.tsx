"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  MapPin,
  Users,
  FileText,
  Trash2,
  Pencil,
  Calendar,
  CalendarDays,
  LayoutGrid,
  RefreshCw,
  Link2,
  Link2Off,
  Check,
  AlertCircle,
  Sparkles,
  Copy,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

type EventoTipo =
  | "reuniao"
  | "audiencia_publica"
  | "visita"
  | "sessao"
  | "evento"
  | "outro";

interface Evento {
  id: string;
  titulo: string;
  tipo: EventoTipo;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  local: string | null;
  descricao: string | null;
  participantes: string | null;
  google_event_id: string | null;
  created_at: string;
}

interface EventoForm {
  titulo: string;
  tipo: EventoTipo;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  descricao: string;
  participantes: string;
}

// ── Config ─────────────────────────────────────────────────────────

const TIPO_CFG: Record<
  EventoTipo,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  reuniao:           { label: "Reunião",          bg: "bg-blue-500/15",    text: "text-blue-300",    dot: "bg-blue-400",    border: "border-blue-500/25"    },
  audiencia_publica: { label: "Audiência Pública", bg: "bg-purple-500/15",  text: "text-purple-300",  dot: "bg-purple-400",  border: "border-purple-500/25"  },
  visita:            { label: "Visita",            bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400", border: "border-emerald-500/25" },
  sessao:            { label: "Sessão",            bg: "bg-orange-500/15",  text: "text-orange-300",  dot: "bg-orange-400",  border: "border-orange-500/25"  },
  evento:            { label: "Evento",            bg: "bg-pink-500/15",    text: "text-pink-300",    dot: "bg-pink-400",    border: "border-pink-500/25"    },
  outro:             { label: "Outro",             bg: "bg-slate-500/15",   text: "text-slate-400",   dot: "bg-slate-500",   border: "border-slate-500/25"   },
};

const TIPO_OPTIONS: { value: EventoTipo; label: string }[] = [
  { value: "reuniao",           label: "Reunião"           },
  { value: "audiencia_publica", label: "Audiência Pública" },
  { value: "visita",            label: "Visita"            },
  { value: "sessao",            label: "Sessão"            },
  { value: "evento",            label: "Evento"            },
  { value: "outro",             label: "Outro"             },
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type ViewMode = "month" | "week";
const VIEW_OPTIONS: { value: ViewMode; label: string; Icon: React.ElementType }[] = [
  { value: "month", label: "Mês",    Icon: LayoutGrid   },
  { value: "week",  label: "Semana", Icon: CalendarDays },
];

// ── Helpers ────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtTime(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const days  = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const grid: (number | null)[][] = [];
  let week: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const EMPTY_FORM: EventoForm = {
  titulo: "", tipo: "reuniao", data: "",
  hora_inicio: "09:00", hora_fim: "10:00",
  local: "", descricao: "", participantes: "",
};

// ── EventDetail ────────────────────────────────────────────────────

interface EventDetailProps {
  evento: Evento;
  deleteConfirm: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onSugerir: () => void;
}

function EventDetail({
  evento,
  deleteConfirm,
  onClose,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
  onSugerir,
}: EventDetailProps) {
  const cfg = TIPO_CFG[evento.tipo];
  const d   = parseDate(evento.data);

  return (
    <div>
      <div className={`-mx-6 -mt-6 px-6 py-5 mb-5 rounded-t-2xl border-b ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${cfg.text}`}>
              {cfg.label}
            </span>
            <h3 className="text-base font-bold text-slate-100 leading-snug">{evento.titulo}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Calendar size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-slate-300">
            {`${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`}
            {fmtTime(evento.hora_inicio) && (
              <span className="text-slate-500">
                {` · ${fmtTime(evento.hora_inicio)}`}
                {fmtTime(evento.hora_fim) && `–${fmtTime(evento.hora_fim)}`}
              </span>
            )}
          </span>
        </div>

        {evento.local && (
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-300">{evento.local}</span>
          </div>
        )}

        {evento.participantes && (
          <div className="flex items-start gap-2.5">
            <Users size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-300">{evento.participantes}</span>
          </div>
        )}

        {evento.descricao && (
          <div className="flex items-start gap-2.5">
            <FileText size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{evento.descricao}</span>
          </div>
        )}

        {evento.google_event_id && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Check size={12} />
            <span>Sincronizado com Google Agenda</span>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        {!deleteConfirm && (
          <button
            onClick={() => { onClose(); onSugerir(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-emerald-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold hover:from-blue-600/30 hover:to-emerald-500/30 transition-all"
          >
            <Sparkles size={14} />
            Sugerir conteúdo com IA
          </button>
        )}
        <div className="flex items-center gap-2">
          {deleteConfirm ? (
            <>
              <span className="text-xs text-red-400 mr-auto">Confirmar exclusão?</span>
              <Button variant="secondary" size="sm" onClick={onDeleteCancel}>Cancelar</Button>
              <Button size="sm" onClick={onDelete} className="bg-red-600 hover:bg-red-700 border-red-600">Excluir</Button>
            </>
          ) : (
            <>
              <button
                onClick={onDeleteConfirm}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Excluir evento"
              >
                <Trash2 size={15} />
              </button>
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
                <Button size="sm" onClick={onEdit}>
                  <Pencil size={13} />
                  Editar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Google Status Card ─────────────────────────────────────────────

interface GoogleCardProps {
  connected: boolean;
  syncing: boolean;
  syncCount: number | null;
  syncError: string | null;
  needsReconnect: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}

function GoogleCard({
  connected, syncing, syncCount, syncError, needsReconnect, onSync, onDisconnect,
}: GoogleCardProps) {
  if (!connected) {
    return (
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-200">Google Agenda</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Conecte para sincronizar seus eventos e exportar para o Google Calendar.
          </p>
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Link2 size={13} />
            Conectar Google Agenda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-slate-200">Google Agenda</p>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Conectado
          </span>
        </div>
        <button
          onClick={onDisconnect}
          title="Desconectar"
          className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Link2Off size={13} />
        </button>
      </div>
      <div className="p-3 space-y-2">
        {needsReconnect && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span>Sessão expirada.</span>
            <a href="/api/auth/google" className="underline ml-auto flex-shrink-0">Reconectar</a>
          </div>
        )}

        {syncError && !needsReconnect && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span className="flex-1">{syncError}</span>
          </div>
        )}

        {syncCount !== null && !syncError && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <Check size={12} className="flex-shrink-0" />
            <span>
              {syncCount === 0
                ? "Agenda já atualizada."
                : `${syncCount} evento${syncCount !== 1 ? "s" : ""} importado${syncCount !== 1 ? "s" : ""}.`}
            </span>
          </div>
        )}

        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600/40 text-slate-300 text-xs font-medium hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando..." : "Sincronizar com Google"}
        </button>
      </div>
    </div>
  );
}

// ── AiSuggestionCard ───────────────────────────────────────────────

function AiSuggestionCard({
  icon, label, content, tipo, eventoTitulo, eventoData, eventoLocal,
}: {
  icon: string;
  label: string;
  content: string;
  tipo: string;
  eventoTitulo: string;
  eventoData: string;
  eventoLocal: string | null;
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

// ── Page ───────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { user } = useAuth();
  const todayStr = toDateStr(new Date());

  // Calendar state
  const [view,          setView]          = useState<ViewMode>("month");
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [selectedDate,  setSelectedDate]  = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [editingEvent,  setEditingEvent]  = useState<Evento | null>(null);
  const [form,          setForm]          = useState<EventoForm>({ ...EMPTY_FORM, data: todayStr });
  const [formError,     setFormError]     = useState("");
  const [formSaving,    setFormSaving]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [eventos,       setEventos]       = useState<Evento[]>([]);
  const [loading,       setLoading]       = useState(true);

  // AI suggestion state
  const [aiEvento,   setAiEvento]   = useState<Evento | null>(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiContent,  setAiContent]  = useState<{ post: string; oficio: string; roteiro: string } | null>(null);
  const [aiError,    setAiError]    = useState<string | null>(null);

  // Google integration state
  const [googleConnected,  setGoogleConnected]  = useState(false);
  const [syncing,          setSyncing]          = useState(false);
  const [syncCount,        setSyncCount]        = useState<number | null>(null);
  const [syncError,        setSyncError]        = useState<string | null>(null);
  const [needsReconnect,   setNeedsReconnect]   = useState(false);
  const [addToGoogle,      setAddToGoogle]      = useState(false);
  const [googleNotice,     setGoogleNotice]     = useState<string | null>(null);
  const [autoSync,         setAutoSync]         = useState(false);

  // ── Check URL params after OAuth redirect ──────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setGoogleConnected(true);
      setAutoSync(true);
      setGoogleNotice("Google Agenda conectado com sucesso!");
      window.history.replaceState({}, "", "/agenda");
      setTimeout(() => setGoogleNotice(null), 4000);
    }
    const gErr = params.get("google_error");
    if (gErr) {
      setGoogleNotice(
        gErr === "cancelled"      ? "Conexão cancelada."
        : gErr === "token_failed" ? "Falha na troca de tokens. Tente novamente."
        : gErr === "save_failed"  ? "Erro ao salvar tokens. Tente novamente."
        : "Erro ao conectar o Google Agenda."
      );
      window.history.replaceState({}, "", "/agenda");
      setTimeout(() => setGoogleNotice(null), 5000);
    }
  }, []);

  // ── Load Google connection status ─────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("google_connected")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.google_connected) setGoogleConnected(true);
      });
  }, [user]);

  // ── Load eventos ──────────────────────────────────────────

  const loadEventos = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .eq("user_id", user.id)
      .order("data")
      .order("hora_inicio");
    setEventos((data as Evento[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEventos(); }, [loadEventos]);

  // ── Computed ──────────────────────────────────────────────

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekDays  = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    for (const e of eventos) (map[e.data] ??= []).push(e);
    return map;
  }, [eventos]);

  const proximosEventos = useMemo(
    () => eventos.filter(e => e.data >= todayStr).slice(0, 5),
    [eventos, todayStr]
  );

  const dayEventos = useMemo(
    () => selectedDate ? (eventsByDate[selectedDate] ?? []) : [],
    [selectedDate, eventsByDate]
  );

  const periodLabel = view === "month"
    ? `${MONTHS_PT[month]} ${year}`
    : weekDays[0].getMonth() === weekDays[6].getMonth()
      ? `${MONTHS_PT[weekDays[0].getMonth()]} ${year}`
      : `${MONTHS_PT[weekDays[0].getMonth()].slice(0, 3)}–${MONTHS_PT[weekDays[6].getMonth()].slice(0, 3)} ${weekDays[6].getFullYear()}`;

  // ── Navigation ────────────────────────────────────────────

  function navigate(dir: 1 | -1) {
    setCurrentDate(d => {
      const n = new Date(d);
      if (view === "month") n.setMonth(d.getMonth() + dir);
      else n.setDate(d.getDate() + dir * 7);
      return n;
    });
  }

  // ── Form helpers ──────────────────────────────────────────

  function openCreate(date?: string) {
    setForm({ ...EMPTY_FORM, data: date ?? todayStr });
    setEditingEvent(null);
    setFormError("");
    setAddToGoogle(false);
    setShowForm(true);
  }

  function openEdit(e: Evento) {
    setForm({
      titulo: e.titulo, tipo: e.tipo, data: e.data,
      hora_inicio: e.hora_inicio ?? "", hora_fim: e.hora_fim ?? "",
      local: e.local ?? "", descricao: e.descricao ?? "",
      participantes: e.participantes ?? "",
    });
    setEditingEvent(e);
    setFormError("");
    setSelectedEvent(null);
    setAddToGoogle(false);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.titulo.trim()) { setFormError("O título é obrigatório."); return; }
    if (!form.data)          { setFormError("A data é obrigatória.");   return; }
    if (!user) return;

    setFormSaving(true);
    const payload = {
      user_id:       user.id,
      titulo:        form.titulo,
      tipo:          form.tipo,
      data:          form.data,
      hora_inicio:   form.hora_inicio   || null,
      hora_fim:      form.hora_fim      || null,
      local:         form.local         || null,
      descricao:     form.descricao     || null,
      participantes: form.participantes || null,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("eventos")
        .update(payload)
        .eq("id", editingEvent.id);
      setFormSaving(false);
      if (!error) { setShowForm(false); loadEventos(); }
      else setFormError("Erro ao salvar. Tente novamente.");
      return;
    }

    // New event
    const { data: newEvento, error } = await supabase
      .from("eventos")
      .insert(payload)
      .select("id")
      .single();

    if (error || !newEvento) {
      setFormError("Erro ao salvar. Tente novamente.");
      setFormSaving(false);
      return;
    }

    // Optionally export to Google Calendar
    if (addToGoogle && googleConnected) {
      try {
        const res = await fetch("/api/google-calendar/export", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ eventoId: newEvento.id }),
        });
        if (res.ok) {
          const { googleEventId } = await res.json() as { googleEventId: string };
          await supabase
            .from("eventos")
            .update({ google_event_id: googleEventId })
            .eq("id", newEvento.id);
        }
      } catch {
        // Non-fatal: event was saved locally
      }
    }

    setFormSaving(false);
    setShowForm(false);
    loadEventos();
  }

  async function handleDelete(id: string) {
    await supabase.from("eventos").delete().eq("id", id);
    setSelectedEvent(null);
    setDeleteConfirm(false);
    loadEventos();
  }

  // ── AI suggestion handler ─────────────────────────────────

  async function handleSugerir(evento: Evento) {
    setAiEvento(evento);
    setAiContent(null);
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/agenda/sugerir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: evento.titulo,
          data: evento.data,
          local: evento.local,
          descricao: evento.descricao,
        }),
      });
      const json = await res.json() as { post?: string; oficio?: string; roteiro?: string; error?: string };
      if (!res.ok) { setAiError(json.error ?? "Erro ao gerar sugestões."); }
      else { setAiContent({ post: json.post ?? "", oficio: json.oficio ?? "", roteiro: json.roteiro ?? "" }); }
    } catch {
      setAiError("Erro de conexão. Tente novamente.");
    }
    setAiLoading(false);
  }

  // ── Google handlers ───────────────────────────────────────

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncCount(null);
    setNeedsReconnect(false);

    const res = await fetch("/api/google-calendar/sync", { method: "POST" });
    const data = await res.json() as { count?: number; error?: string; needsReconnect?: boolean };

    if (res.ok) {
      setSyncCount(data.count ?? 0);
      loadEventos();
    } else {
      setSyncError(data.error ?? "Erro ao sincronizar.");
      if (data.needsReconnect) setNeedsReconnect(true);
    }
    setSyncing(false);
  }

  // Auto-sync after OAuth redirect
  useEffect(() => {
    if (autoSync) {
      setAutoSync(false);
      handleSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  async function handleDisconnect() {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        google_access_token:  null,
        google_refresh_token: null,
        google_token_expiry:  null,
        google_connected:     false,
      })
      .eq("id", user.id);
    setGoogleConnected(false);
    setSyncCount(null);
    setSyncError(null);
    setNeedsReconnect(false);
  }

  // ── Shared styles ─────────────────────────────────────────

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  // ── Event pill ────────────────────────────────────────────

  function EventPill({ e, onClick }: { e: Evento; onClick: (ev: React.MouseEvent) => void }) {
    const cfg = TIPO_CFG[e.tipo];
    return (
      <div
        onClick={onClick}
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:brightness-125 transition-all leading-snug ${cfg.bg} ${cfg.text}`}
        title={e.titulo}
      >
        {fmtTime(e.hora_inicio) && <span className="opacity-60 mr-0.5">{fmtTime(e.hora_inicio)}</span>}
        {e.titulo}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <AppShell
      title="Agenda"
      subtitle="Compromissos e eventos do gabinete"
      headerRight={
        <Button size="sm" onClick={() => openCreate()}>
          <Plus size={14} />
          Novo evento
        </Button>
      }
    >
      {/* Google notice toast */}
      {googleNotice && (
        <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
          googleNotice.includes("sucesso")
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-amber-500/10 border-amber-500/20 text-amber-300"
        }`}>
          {googleNotice.includes("sucesso") ? <Check size={15} /> : <AlertCircle size={15} />}
          {googleNotice}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-bold text-slate-100 min-w-[160px] text-center">
            {periodLabel}
          </h3>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-1 px-3 py-1.5 text-xs font-medium text-slate-400 border border-border rounded-lg hover:text-slate-100 hover:border-blue-500/40 transition-colors"
          >
            Hoje
          </button>
        </div>

        <div className="flex bg-background border border-border rounded-lg p-0.5 gap-0.5">
          {VIEW_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === value
                  ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 items-start">

        {/* Calendar */}
        <div className="flex-1 min-w-0 bg-surface border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {loading && (
            <div className="p-4 space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map(r => (
                <div key={r} className="grid grid-cols-7 gap-1">
                  {Array(7).fill(0).map((_, c) => (
                    <div key={c} className="h-16 bg-slate-700/30 rounded" />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!loading && view === "month" && (
            <div>
              {monthGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-border/40 last:border-b-0">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="min-h-[88px] bg-background/30" />;
                    const dateStr    = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday    = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayEvs     = eventsByDate[dateStr] ?? [];
                    return (
                      <div
                        key={di}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        className={`min-h-[88px] p-1.5 border-r border-border/30 last:border-r-0 cursor-pointer transition-colors hover:bg-slate-700/20 ${
                          isSelected ? "bg-blue-500/5 ring-1 ring-inset ring-blue-500/20" : ""
                        }`}
                      >
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1.5 ${
                          isToday ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvs.slice(0, 2).map(e => (
                            <EventPill
                              key={e.id}
                              e={e}
                              onClick={ev => { ev.stopPropagation(); setSelectedEvent(e); }}
                            />
                          ))}
                          {dayEvs.length > 2 && (
                            <p className="text-[10px] text-slate-600 px-1">+{dayEvs.length - 2} mais</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {!loading && view === "week" && (
            <div className="grid grid-cols-7 min-h-[360px]">
              {weekDays.map((d, i) => {
                const dateStr    = toDateStr(d);
                const isToday    = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvs     = eventsByDate[dateStr] ?? [];
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`border-r border-border/30 last:border-r-0 p-2 cursor-pointer hover:bg-slate-700/20 transition-colors ${
                      isSelected ? "bg-blue-500/5 ring-1 ring-inset ring-blue-500/20" : ""
                    }`}
                  >
                    <div className={`text-center mb-2 w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                      isToday ? "bg-blue-600 text-white" : "text-slate-400"
                    }`}>
                      {d.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvs.map(e => (
                        <EventPill
                          key={e.id}
                          e={e}
                          onClick={ev => { ev.stopPropagation(); setSelectedEvent(e); }}
                        />
                      ))}
                    </div>
                    {dayEvs.length === 0 && (
                      <div className="text-center text-[10px] text-slate-700 mt-6">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">

          {/* Google Agenda card */}
          <GoogleCard
            connected={googleConnected}
            syncing={syncing}
            syncCount={syncCount}
            syncError={syncError}
            needsReconnect={needsReconnect}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
          />

          {/* Day events panel */}
          {selectedDate && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-slate-200">
                  {`${parseDate(selectedDate).getDate()} de ${MONTHS_PT[parseDate(selectedDate).getMonth()]}`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openCreate(selectedDate)}
                    title="Criar evento neste dia"
                    className="p-1 rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                {dayEventos.length === 0 ? (
                  <div className="text-center py-5">
                    <Calendar size={22} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Sem eventos neste dia.</p>
                    <button
                      onClick={() => openCreate(selectedDate)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + Criar evento
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {dayEventos.map(e => {
                      const cfg = TIPO_CFG[e.tipo];
                      return (
                        <div
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors"
                        >
                          <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 truncate">{e.titulo}</p>
                            <p className="text-[10px] text-slate-500">
                              {fmtTime(e.hora_inicio)
                                ? `${fmtTime(e.hora_inicio)}${e.hora_fim ? `–${fmtTime(e.hora_fim)}` : ""} · ${cfg.label}`
                                : cfg.label}
                            </p>
                          </div>
                          {e.google_event_id && (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1" title="No Google Agenda" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Próximos eventos */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-slate-200">Próximos Eventos</p>
            </div>
            <div className="p-3">
              {loading && (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-700/40 rounded-lg" />)}
                </div>
              )}
              {!loading && proximosEventos.length === 0 && (
                <div className="text-center py-6">
                  <Calendar size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhum evento próximo.</p>
                  <button
                    onClick={() => openCreate()}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + Criar primeiro evento
                  </button>
                </div>
              )}
              {!loading && proximosEventos.map(e => {
                const cfg = TIPO_CFG[e.tipo];
                const d   = parseDate(e.data);
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors mb-1 last:mb-0"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center ${cfg.bg}`}>
                      <span className={`text-[9px] font-bold uppercase leading-none ${cfg.text}`}>
                        {MONTHS_PT[d.getMonth()].slice(0, 3)}
                      </span>
                      <span className={`text-base font-extrabold leading-tight ${cfg.text}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{e.titulo}</p>
                      <p className="text-[10px] text-slate-500">
                        {fmtTime(e.hora_inicio)
                          ? `${fmtTime(e.hora_inicio)} · ${cfg.label}`
                          : cfg.label}
                      </p>
                    </div>
                    {e.google_event_id && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="No Google Agenda" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating "+" button */}
      <button
        onClick={() => openCreate()}
        title="Novo evento"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
      >
        <Plus size={22} />
      </button>

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingEvent ? "Editar Evento" : "Novo Evento"}
        size="md"
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label className={labelCls}>
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Reunião com a Secretaria de Educação"
              className={inputCls}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as EventoTipo }))}
                className={inputCls}
              >
                {TIPO_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Data <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Hora início</label>
              <input
                type="time"
                value={form.hora_inicio}
                onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Hora fim</label>
              <input
                type="time"
                value={form.hora_fim}
                onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Local</label>
            <input
              type="text"
              value={form.local}
              onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
              placeholder="Ex: Câmara Municipal, Sala 12"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Participantes</label>
            <input
              type="text"
              value={form.participantes}
              onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))}
              placeholder="Ex: Vereadora Ana Lima, Assessor Carlos"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Pauta, detalhes ou observações do evento..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Add to Google Agenda checkbox — only for new events when connected */}
          {googleConnected && !editingEvent && (
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-blue-500/40 transition-colors group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  addToGoogle
                    ? "bg-blue-600 border-blue-600"
                    : "border-slate-600 group-hover:border-blue-500/60"
                }`}
                onClick={() => setAddToGoogle(v => !v)}
              >
                {addToGoogle && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={addToGoogle}
                onChange={e => setAddToGoogle(e.target.checked)}
              />
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-xs text-slate-300">Adicionar ao Google Agenda</span>
              </div>
            </label>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="md" onClick={() => setShowForm(false)} className="flex-1 justify-center">
              Cancelar
            </Button>
            <Button size="md" onClick={handleSave} loading={formSaving} className="flex-1 justify-center">
              {editingEvent ? "Salvar alterações" : "Criar evento"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        open={!!selectedEvent}
        onClose={() => { setSelectedEvent(null); setDeleteConfirm(false); }}
        size="md"
      >
        {selectedEvent && (
          <EventDetail
            evento={selectedEvent}
            deleteConfirm={deleteConfirm}
            onClose={() => { setSelectedEvent(null); setDeleteConfirm(false); }}
            onEdit={() => openEdit(selectedEvent)}
            onDelete={() => handleDelete(selectedEvent.id)}
            onDeleteConfirm={() => setDeleteConfirm(true)}
            onDeleteCancel={() => setDeleteConfirm(false)}
            onSugerir={() => handleSugerir(selectedEvent)}
          />
        )}
      </Modal>

      {/* AI Suggestion Modal */}
      {!!aiEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-[#0f172a] z-10">
              <h3 className="text-base font-semibold text-slate-100">Sugestões de Conteúdo IA</h3>
              <button
                onClick={() => { setAiEvento(null); setAiContent(null); setAiError(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-400">
                Com base no evento <span className="text-slate-200 font-semibold">{aiEvento.titulo}</span> em{" "}
                {parseDate(aiEvento.data).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </p>

              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
                  <p className="text-sm text-slate-400">Gerando sugestões com IA...</p>
                </div>
              )}

              {aiError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                  {aiError}
                </div>
              )}

              {aiContent && !aiLoading && (
                <div className="space-y-4">
                  <AiSuggestionCard
                    icon="📱"
                    label="Post para Instagram"
                    content={aiContent.post}
                    tipo="post"
                    eventoTitulo={aiEvento.titulo}
                    eventoData={aiEvento.data}
                    eventoLocal={aiEvento.local}
                  />
                  <AiSuggestionCard
                    icon="📄"
                    label="Ofício sugerido"
                    content={aiContent.oficio}
                    tipo="oficio"
                    eventoTitulo={aiEvento.titulo}
                    eventoData={aiEvento.data}
                    eventoLocal={aiEvento.local}
                  />
                  <AiSuggestionCard
                    icon="🎤"
                    label="Roteiro de fala"
                    content={aiContent.roteiro}
                    tipo="roteiro"
                    eventoTitulo={aiEvento.titulo}
                    eventoData={aiEvento.data}
                    eventoLocal={aiEvento.local}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
