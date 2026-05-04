"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Copy,
  Check,
  LayoutGrid,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

type KanbanStatus = "rascunho" | "revisao" | "aprovado" | "publicado";

interface Conteudo {
  id: string;
  titulo: string;
  tipo: string;
  canal: string | null;
  formato: string | null;
  conteudo: string | null;
  status: KanbanStatus;
  created_at: string;
}

// ── Config ─────────────────────────────────────────────────────────

const STATUSES: KanbanStatus[] = ["rascunho", "revisao", "aprovado", "publicado"];

const COL = {
  rascunho: {
    label: "Rascunho",
    dot: "bg-slate-400",
    text: "text-slate-200",
    bg: "bg-slate-800/30",
    border: "border-slate-700/40",
    countBg: "bg-slate-700/60",
    countText: "text-slate-300",
  },
  revisao: {
    label: "Revisão",
    dot: "bg-yellow-400",
    text: "text-yellow-200",
    bg: "bg-yellow-950/20",
    border: "border-yellow-800/30",
    countBg: "bg-yellow-500/15",
    countText: "text-yellow-300",
  },
  aprovado: {
    label: "Aprovado",
    dot: "bg-blue-400",
    text: "text-blue-200",
    bg: "bg-blue-950/20",
    border: "border-blue-800/30",
    countBg: "bg-blue-500/15",
    countText: "text-blue-300",
  },
  publicado: {
    label: "Publicado",
    dot: "bg-emerald-400",
    text: "text-emerald-200",
    bg: "bg-emerald-950/20",
    border: "border-emerald-800/30",
    countBg: "bg-emerald-500/15",
    countText: "text-emerald-300",
  },
} satisfies Record<KanbanStatus, object>;

const TIPO: Record<string, { label: string; bg: string; text: string }> = {
  instagram:      { label: "Instagram",  bg: "bg-pink-500/15",   text: "text-pink-300"   },
  facebook:       { label: "Facebook",   bg: "bg-blue-600/15",   text: "text-blue-300"   },
  twitter:        { label: "Twitter/X",  bg: "bg-sky-500/15",    text: "text-sky-300"    },
  release:        { label: "Release",    bg: "bg-orange-500/15", text: "text-orange-300" },
  discurso:       { label: "Discurso",   bg: "bg-purple-500/15", text: "text-purple-300" },
  pronunciamento: { label: "Discurso",   bg: "bg-purple-500/15", text: "text-purple-300" },
  oficio:         { label: "Ofício",     bg: "bg-slate-500/15",  text: "text-slate-300"  },
  nota:           { label: "Nota",       bg: "bg-slate-500/15",  text: "text-slate-300"  },
  post:           { label: "Post",       bg: "bg-blue-500/15",   text: "text-blue-300"   },
};

const TIPO_FILTERS = [
  { value: "",           label: "Todos"     },
  { value: "instagram",  label: "Instagram" },
  { value: "facebook",   label: "Facebook"  },
  { value: "twitter",    label: "Twitter/X" },
  { value: "release",    label: "Release"   },
  { value: "discurso",   label: "Discurso"  },
  { value: "oficio",     label: "Ofício"    },
];

// ── Helpers ────────────────────────────────────────────────────────

function getTipo(canal: string | null, tipo: string) {
  const key = canal ?? tipo;
  return TIPO[key] ?? { label: tipo, bg: "bg-slate-500/15", text: "text-slate-300" };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function matchesTipo(c: Conteudo, filter: string): boolean {
  if (!filter) return true;
  const key = c.canal ?? c.tipo;
  if (filter === "discurso") return key === "discurso" || c.tipo === "pronunciamento";
  if (filter === "oficio")   return key === "oficio"   || c.tipo === "nota";
  return key === filter || c.tipo === filter;
}

// ── Main Page ──────────────────────────────────────────────────────

export default function KanbanPage() {
  const { user } = useAuth();

  const [conteudos,       setConteudos]       = useState<Conteudo[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [filterTipo,      setFilterTipo]      = useState("");
  const [selectedCard,    setSelectedCard]    = useState<Conteudo | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [movingId,        setMovingId]        = useState<string | null>(null);
  const [copied,          setCopied]          = useState(false);

  // ── Load ──────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("conteudos")
      .select("id, titulo, tipo, canal, formato, conteudo, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setConteudos((data as Conteudo[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Realtime ──────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`kanban-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conteudos" },
        (p) => {
          const item = p.new as Conteudo;
          setConteudos((prev) =>
            prev.find((c) => c.id === item.id) ? prev : [item, ...prev]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conteudos" },
        (p) => {
          const item = p.new as Conteudo;
          setConteudos((prev) => prev.map((c) => (c.id === item.id ? item : c)));
          setSelectedCard((prev) => (prev?.id === item.id ? item : prev));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "conteudos" },
        (p) => {
          const old = p.old as { id: string };
          setConteudos((prev) => prev.filter((c) => c.id !== old.id));
          setSelectedCard((prev) => (prev?.id === old.id ? null : prev));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Actions ───────────────────────────────────────────────────

  async function moveCard(id: string, direction: "next" | "prev") {
    const card = conteudos.find((c) => c.id === id);
    if (!card) return;

    const idx    = STATUSES.indexOf(card.status);
    const newIdx = direction === "next" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STATUSES.length) return;

    const newStatus = STATUSES[newIdx];
    setMovingId(id);
    setConteudos((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    if (selectedCard?.id === id) setSelectedCard((prev) => prev && { ...prev, status: newStatus });

    const { error } = await supabase
      .from("conteudos")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      setConteudos((prev) => prev.map((c) => (c.id === id ? { ...c, status: card.status } : c)));
      if (selectedCard?.id === id) setSelectedCard((prev) => prev && { ...prev, status: card.status });
    }
    setMovingId(null);
  }

  async function deleteCard(id: string) {
    setConteudos((prev) => prev.filter((c) => c.id !== id));
    if (selectedCard?.id === id) setSelectedCard(null);
    await supabase.from("conteudos").delete().eq("id", id);
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId === id) {
      deleteCard(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Filtered view ─────────────────────────────────────────────

  const filtered = conteudos.filter((c) => {
    const matchSearch = !search || c.titulo.toLowerCase().includes(search.toLowerCase());
    return matchSearch && matchesTipo(c, filterTipo);
  });

  const hasAny = conteudos.length > 0;

  // ── Header right: "Novo Conteúdo" button ──────────────────────

  const headerRight = (
    <Link href="/criar-conteudo">
      <Button size="sm">
        <Plus size={14} />
        Novo conteúdo
      </Button>
    </Link>
  );

  // ── Render ────────────────────────────────────────────────────

  return (
    <AppShell
      title="Central de Conteúdo"
      subtitle="Gerencie seus textos por etapa de publicação"
      headerRight={headerRight}
    >
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-border rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Tipo filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TIPO_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterTipo(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterTipo === f.value
                  ? "bg-gradient-to-r from-blue-600 to-emerald-500 border-transparent text-white"
                  : "border-border text-slate-400 hover:border-blue-500/40 hover:text-slate-200 bg-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state (zero conteudos in DB) */}
      {!loading && !hasAny && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-700/40 flex items-center justify-center">
            <LayoutGrid size={36} className="text-slate-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-300">
              Nenhum conteúdo ainda
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Crie textos com IA e eles aparecerão aqui para gerenciar.
            </p>
          </div>
          <Link href="/criar-conteudo">
            <Button>
              <Plus size={14} />
              Criar primeiro conteúdo
            </Button>
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <div key={s} className="w-72 flex-shrink-0">
              <div className="h-10 bg-slate-700/40 rounded-lg mb-3 animate-pulse" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-700/30 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban board */}
      {!loading && hasAny && (
        <div className="overflow-x-auto pb-4 -mx-1 px-1">
          <div className="flex gap-4 min-w-max">
            {STATUSES.map((status) => {
              const cfg   = COL[status];
              const cards = filtered.filter((c) => c.status === status);

              return (
                <div
                  key={status}
                  className={`w-72 flex-shrink-0 rounded-xl border ${cfg.border} ${cfg.bg} flex flex-col`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-sm font-semibold ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.countBg} ${cfg.countText}`}
                    >
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards list */}
                  <div className="flex-1 p-3 space-y-3 min-h-[120px]">
                    {cards.length === 0 && (
                      <div className="flex items-center justify-center h-16 text-xs text-slate-600">
                        Sem conteúdos aqui
                      </div>
                    )}

                    {cards.map((card) => {
                      const tipoCfg   = getTipo(card.canal, card.tipo);
                      const idx       = STATUSES.indexOf(card.status);
                      const isMoving  = movingId === card.id;
                      const isConfirm = confirmDeleteId === card.id;

                      return (
                        <div
                          key={card.id}
                          className="bg-surface border border-border rounded-xl p-3 hover:border-blue-500/30 transition-colors group cursor-pointer"
                          onClick={() => setSelectedCard(card)}
                        >
                          {/* Tipo badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${tipoCfg.bg} ${tipoCfg.text} mb-2`}
                          >
                            {tipoCfg.label}{card.formato ? ` · ${card.formato}` : ""}
                          </span>

                          {/* Title */}
                          <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2 mb-2">
                            {card.titulo}
                          </p>

                          {/* Date */}
                          <p className="text-[11px] text-slate-600 mb-3">
                            {fmtDate(card.created_at)}
                          </p>

                          {/* Actions */}
                          <div
                            className="flex items-center justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteClick(card.id)}
                              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                isConfirm
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              {isConfirm ? (
                                "Confirmar?"
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>

                            {/* Move next */}
                            {idx < STATUSES.length - 1 && (
                              <button
                                onClick={() => moveCard(card.id, "next")}
                                disabled={isMoving}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-blue-300 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                              >
                                {COL[STATUSES[idx + 1]].label}
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content modal */}
      <Modal
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={selectedCard?.titulo ?? ""}
        size="lg"
      >
        {selectedCard && (
          <div className="space-y-4">
            {/* Badges row */}
            <div className="flex items-center gap-2">
              {(() => {
                const tipoCfg = getTipo(selectedCard.canal, selectedCard.tipo);
                return (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tipoCfg.bg} ${tipoCfg.text}`}>
                    {tipoCfg.label}{selectedCard.formato ? ` · ${selectedCard.formato}` : ""}
                  </span>
                );
              })()}
              {(() => {
                const cfg = COL[selectedCard.status];
                return (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.countBg} ${cfg.countText}`}>
                    {cfg.label}
                  </span>
                );
              })()}
              <span className="ml-auto text-xs text-slate-600">
                {fmtDate(selectedCard.created_at)}
              </span>
            </div>

            {/* Content textarea */}
            <textarea
              readOnly
              value={selectedCard.conteudo ?? ""}
              rows={10}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-slate-200 leading-relaxed focus:outline-none resize-none font-mono"
            />

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Move backward */}
              {STATUSES.indexOf(selectedCard.status) > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={movingId === selectedCard.id}
                  onClick={() => moveCard(selectedCard.id, "prev")}
                >
                  <ChevronLeft size={14} />
                  {COL[STATUSES[STATUSES.indexOf(selectedCard.status) - 1]].label}
                </Button>
              )}

              {/* Move forward */}
              {STATUSES.indexOf(selectedCard.status) < STATUSES.length - 1 && (
                <Button
                  size="sm"
                  disabled={movingId === selectedCard.id}
                  onClick={() => moveCard(selectedCard.id, "next")}
                >
                  {COL[STATUSES[STATUSES.indexOf(selectedCard.status) + 1]].label}
                  <ChevronRight size={14} />
                </Button>
              )}

              {/* Copy */}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => handleCopy(selectedCard.conteudo ?? "")}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
