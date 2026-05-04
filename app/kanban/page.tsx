"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import {
  Plus, Search, ChevronRight, ChevronLeft, Trash2, Copy, Check,
  LayoutGrid, List, MoreVertical, Calendar, Paperclip,
  RefreshCw, X, ArrowRight, Eye, Clock,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

type KanbanStatus = "rascunho" | "revisao" | "aprovado" | "publicado";
type SortKey = "titulo" | "status" | "created_at" | "data_veiculacao";
type SortDir = "asc" | "desc";

interface HistoricoItem {
  acao: string;
  usuario: string;
  data: string;
}

interface Conteudo {
  id: string;
  titulo: string;
  tipo: string;
  canal: string | null;
  formato: string | null;
  conteudo: string | null;
  status: KanbanStatus;
  created_at: string;
  data_veiculacao: string | null;
  anexo_url: string | null;
  criado_por: string | null;
  historico: HistoricoItem[] | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUSES: KanbanStatus[] = ["rascunho", "revisao", "aprovado", "publicado"];

const COL: Record<KanbanStatus, {
  label: string; dot: string; text: string; bg: string;
  border: string; countBg: string; countText: string; dragOver: string;
}> = {
  rascunho: {
    label: "Rascunho",
    dot: "bg-slate-400",         text: "text-slate-200",
    bg: "bg-slate-800/30",       border: "border-slate-700/40",
    countBg: "bg-slate-700/60",  countText: "text-slate-300",
    dragOver: "bg-slate-700/20",
  },
  revisao: {
    label: "Revisão",
    dot: "bg-yellow-400",          text: "text-yellow-200",
    bg: "bg-yellow-950/20",        border: "border-yellow-800/30",
    countBg: "bg-yellow-500/15",   countText: "text-yellow-300",
    dragOver: "bg-yellow-900/20",
  },
  aprovado: {
    label: "Aprovado",
    dot: "bg-blue-400",          text: "text-blue-200",
    bg: "bg-blue-950/20",        border: "border-blue-800/30",
    countBg: "bg-blue-500/15",   countText: "text-blue-300",
    dragOver: "bg-blue-900/20",
  },
  publicado: {
    label: "Publicado",
    dot: "bg-emerald-400",          text: "text-emerald-200",
    bg: "bg-emerald-950/20",        border: "border-emerald-800/30",
    countBg: "bg-emerald-500/15",   countText: "text-emerald-300",
    dragOver: "bg-emerald-900/20",
  },
};

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

const AVATAR_COLORS = [
  "from-blue-600 to-indigo-700",
  "from-emerald-600 to-teal-700",
  "from-purple-600 to-violet-700",
  "from-amber-500 to-orange-600",
  "from-rose-600 to-pink-700",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getTipo(canal: string | null, tipo: string) {
  const key = canal ?? tipo;
  return TIPO[key] ?? { label: tipo, bg: "bg-slate-500/15", text: "text-slate-300" };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function matchesTipo(c: Conteudo, filter: string): boolean {
  if (!filter) return true;
  const key = c.canal ?? c.tipo;
  if (filter === "discurso") return key === "discurso" || c.tipo === "pronunciamento";
  if (filter === "oficio")   return key === "oficio"   || c.tipo === "nota";
  return key === filter || c.tipo === filter;
}

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ── CardModal ──────────────────────────────────────────────────────────────

interface CardModalProps {
  card: Conteudo | null;
  onClose: () => void;
  onSaved: (updated: Conteudo) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: KanbanStatus) => void;
  userName: string;
}

function CardModal({ card, onClose, onSaved, onDelete, onMove, userName }: CardModalProps) {
  const [titulo,    setTitulo]    = useState("");
  const [conteudo,  setConteudo]  = useState("");
  const [dataVeic,  setDataVeic]  = useState("");
  const [anexo,     setAnexo]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!card) return;
    setTitulo(card.titulo);
    setConteudo(card.conteudo ?? "");
    setDataVeic(card.data_veiculacao ?? "");
    setAnexo(card.anexo_url ?? "");
    setSaving(false);
    setCopied(false);
    setConfirmDel(false);
  }, [card]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (card) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  if (!card) return null;

  const tipoCfg = getTipo(card.canal, card.tipo);
  const colCfg  = COL[card.status];
  const curIdx  = STATUSES.indexOf(card.status);
  const nextSt  = curIdx < STATUSES.length - 1 ? STATUSES[curIdx + 1] : null;
  const hasChanges = titulo !== card.titulo
    || conteudo !== (card.conteudo ?? "")
    || dataVeic !== (card.data_veiculacao ?? "")
    || anexo    !== (card.anexo_url ?? "");

  async function save() {
    if (!card) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("conteudos")
      .update({
        titulo:          titulo.trim(),
        conteudo,
        data_veiculacao: dataVeic || null,
        anexo_url:       anexo.trim() || null,
      })
      .eq("id", card.id)
      .select()
      .single();
    if (!error && data) onSaved(data as Conteudo);
    setSaving(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(conteudo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const historico = card.historico ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-700">
          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent text-base font-semibold text-white placeholder:text-slate-500 focus:outline-none"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do conteúdo…"
            />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoCfg.bg} ${tipoCfg.text}`}>
                {tipoCfg.label}{card.formato ? ` · ${card.formato}` : ""}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colCfg.countBg} ${colCfg.countText}`}>
                {colCfg.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conteúdo</label>
              <span className="text-xs text-slate-600">{conteudo.length} caracteres</span>
            </div>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500 resize-none transition-colors"
              rows={8}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </div>

          {/* Date + Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Calendar size={11} className="inline mr-1" />Data de veiculação
              </label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={dataVeic}
                onChange={(e) => setDataVeic(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Paperclip size={11} className="inline mr-1" />Anexo (URL)
              </label>
              <input
                type="url"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://…"
                value={anexo}
                onChange={(e) => setAnexo(e.target.value)}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/40 rounded-xl p-3">
            <div>
              <span className="block text-slate-600 mb-0.5">Criado por</span>
              <span className="text-slate-400">{card.criado_por ?? userName}</span>
            </div>
            <div>
              <span className="block text-slate-600 mb-0.5">Criado em</span>
              <span className="text-slate-400">{fmtDate(card.created_at)}</span>
            </div>
          </div>

          {/* History */}
          {historico.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Clock size={11} className="inline mr-1" />Histórico
              </label>
              <div className="space-y-1.5">
                {[...historico].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                    <span className="text-slate-500">
                      <span className="text-slate-400">{h.acao}</span>
                      {" · "}{h.usuario}
                      {" · "}{fmtDateShort(h.data)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-5 border-t border-slate-700 flex-wrap">
          {/* Delete */}
          {confirmDel ? (
            <>
              <button
                onClick={() => { onDelete(card.id); onClose(); }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Confirmar exclusão
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-800 hover:text-white transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>

            {/* Move to next */}
            {nextSt && (
              <button
                onClick={() => { onMove(card.id, nextSt); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-400 text-xs font-medium hover:bg-blue-500/10 transition-colors"
              >
                <ArrowRight size={13} />
                Mover para {COL[nextSt].label}
              </button>
            )}

            {/* Save */}
            {hasChanges && (
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {saving && <RefreshCw size={12} className="animate-spin" />}
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KanbanCardComp ─────────────────────────────────────────────────────────

interface KanbanCardProps {
  card: Conteudo;
  isDragging: boolean;
  onOpen: () => void;
  onMove: (id: string, status: KanbanStatus) => void;
  onDelete: (id: string) => void;
  curIdx: number;
}

function KanbanCardComp({ card, isDragging, onOpen, onMove, onDelete, curIdx }: KanbanCardProps) {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const tipoCfg   = getTipo(card.canal, card.tipo);
  const charCount = card.conteudo?.length ?? 0;

  return (
    <div
      className={`bg-slate-800 border rounded-xl p-3.5 cursor-pointer select-none transition-all ${
        isDragging
          ? "border-blue-500/60 shadow-2xl shadow-blue-500/20 rotate-1 scale-105"
          : "border-slate-700/50 hover:border-slate-600"
      }`}
      onClick={onOpen}
    >
      {/* Platform badge + attachment */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tipoCfg.bg} ${tipoCfg.text}`}>
          {tipoCfg.label}{card.formato ? ` · ${card.formato}` : ""}
        </span>
        {card.anexo_url && <Paperclip size={11} className="text-slate-500 ml-auto" />}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2 mb-3">
        {card.titulo}
      </p>

      {/* Footer row */}
      <div
        className="flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {card.criado_por && <Avatar name={card.criado_por} />}
          {charCount > 0 && (
            <span className="text-[10px] text-slate-600 font-mono">{charCount}c</span>
          )}
          {card.data_veiculacao && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Calendar size={9} />
              {fmtDateShort(card.data_veiculacao)}
            </span>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MoreVertical size={13} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 bottom-7 z-10 bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-44 py-1 text-xs"
              onMouseLeave={() => { setMenuOpen(false); setConfirmDel(false); }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Eye size={12} /> Ver / Editar
              </button>
              {curIdx < STATUSES.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(card.id, STATUSES[curIdx + 1]); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ArrowRight size={12} /> Para {COL[STATUSES[curIdx + 1]].label}
                </button>
              )}
              {curIdx > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(card.id, STATUSES[curIdx - 1]); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft size={12} /> Voltar para {COL[STATUSES[curIdx - 1]].label}
                </button>
              )}
              <div className="border-t border-slate-700 my-1" />
              {confirmDel ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
                >
                  <Trash2 size={12} /> Confirmar exclusão
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ListView ────────────────────────────────────────────────────────────────

interface ListViewProps {
  cards: Conteudo[];
  onOpen: (c: Conteudo) => void;
  onMove: (id: string, status: KanbanStatus) => void;
  onDelete: (id: string) => void;
}

function ListView({ cards, onOpen, onMove, onDelete }: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...cards].sort((a, b) => {
    const va = String(a[sortKey] ?? "");
    const vb = String(b[sortKey] ?? "");
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const COL_HEADERS: { key: SortKey; label: string }[] = [
    { key: "titulo",         label: "Título"      },
    { key: "status",         label: "Status"      },
    { key: "created_at",     label: "Criado em"   },
    { key: "data_veiculacao",label: "Veiculação"  },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/60">
          <tr>
            {COL_HEADERS.map(({ key, label }) => (
              <th
                key={key}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors select-none"
                onClick={() => toggleSort(key)}
              >
                <span className="flex items-center gap-1">
                  {label}
                  {sortKey === key && (
                    <ChevronRight
                      size={12}
                      className={`text-blue-400 transition-transform ${sortDir === "asc" ? "-rotate-90" : "rotate-90"}`}
                    />
                  )}
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Plataforma
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {sorted.map((card) => {
            const tipoCfg = getTipo(card.canal, card.tipo);
            const colCfg  = COL[card.status];
            const idx     = STATUSES.indexOf(card.status);
            return (
              <tr key={card.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p
                    className="text-slate-200 font-medium truncate cursor-pointer hover:text-blue-400 transition-colors"
                    onClick={() => onOpen(card)}
                  >
                    {card.titulo}
                  </p>
                  {card.criado_por && (
                    <p className="text-xs text-slate-600 mt-0.5">{card.criado_por}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colCfg.countBg} ${colCfg.countText}`}>
                    {colCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {fmtDateShort(card.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {card.data_veiculacao
                    ? fmtDateShort(card.data_veiculacao)
                    : <span className="text-slate-700">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoCfg.bg} ${tipoCfg.text}`}>
                    {tipoCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpen(card)}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Eye size={13} />
                    </button>
                    {idx < STATUSES.length - 1 && (
                      <button
                        onClick={() => onMove(card.id, STATUSES[idx + 1])}
                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <ArrowRight size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(card.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-600">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const { user, profile } = useAuth();
  const userName = profile?.nome ?? user?.email ?? "Usuário";

  const [conteudos,    setConteudos]    = useState<Conteudo[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterTipo,   setFilterTipo]   = useState("");
  const [viewMode,     setViewMode]     = useState<"kanban" | "lista">("kanban");
  const [selectedCard, setSelectedCard] = useState<Conteudo | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("conteudos")
      .select("id, titulo, tipo, canal, formato, conteudo, status, created_at, data_veiculacao, anexo_url, criado_por, historico")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setConteudos((data as Conteudo[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Realtime ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`kanban-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conteudos" }, (p) => {
        const item = p.new as Conteudo;
        setConteudos((prev) => prev.find((c) => c.id === item.id) ? prev : [item, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conteudos" }, (p) => {
        const item = p.new as Conteudo;
        setConteudos((prev) => prev.map((c) => c.id === item.id ? item : c));
        setSelectedCard((prev) => prev?.id === item.id ? item : prev);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "conteudos" }, (p) => {
        const old = p.old as { id: string };
        setConteudos((prev) => prev.filter((c) => c.id !== old.id));
        setSelectedCard((prev) => prev?.id === old.id ? null : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function moveCard(id: string, newStatus: KanbanStatus) {
    const card = conteudos.find((c) => c.id === id);
    if (!card || card.status === newStatus) return;

    const histItem: HistoricoItem = {
      acao:    `Movido para ${COL[newStatus].label}`,
      usuario: userName,
      data:    new Date().toISOString(),
    };
    const newHistorico = [...(card.historico ?? []), histItem];

    setConteudos((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: newStatus, historico: newHistorico } : c)
    );
    setSelectedCard((prev) =>
      prev?.id === id ? { ...prev, status: newStatus, historico: newHistorico } : prev
    );

    await supabase
      .from("conteudos")
      .update({ status: newStatus, historico: newHistorico })
      .eq("id", id);
  }

  async function deleteCard(id: string) {
    setConteudos((prev) => prev.filter((c) => c.id !== id));
    if (selectedCard?.id === id) setSelectedCard(null);
    await supabase.from("conteudos").delete().eq("id", id);
  }

  function handleCardSaved(updated: Conteudo) {
    setConteudos((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setSelectedCard(updated);
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    moveCard(draggableId, destination.droppableId as KanbanStatus);
  }

  // ── Filtered ──────────────────────────────────────────────────────────────

  const filtered = conteudos.filter((c) => {
    if (search && !c.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    return matchesTipo(c, filterTipo);
  });

  const hasAny = conteudos.length > 0;

  return (
    <AppShell
      title="Central de Conteúdo"
      subtitle="Gerencie seus textos por etapa de publicação"
      headerRight={
        <Link
          href="/criar-conteudo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all"
        >
          <Plus size={15} />
          Novo conteúdo
        </Link>
      }
    >
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Platform filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {TIPO_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterTipo(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterTipo === f.value
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white"
                  : "border-slate-700 text-slate-400 hover:border-blue-500/40 hover:text-slate-200 bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "kanban" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid size={13} /> Kanban
          </button>
          <button
            onClick={() => setViewMode("lista")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "lista" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <List size={13} /> Lista
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <div key={s} className="w-72 flex-shrink-0">
              <div className="h-10 bg-slate-700/40 rounded-lg mb-3 animate-pulse" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-slate-700/30 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasAny && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <LayoutGrid size={36} className="text-slate-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-300">Nenhum conteúdo ainda</p>
            <p className="text-sm text-slate-500 mt-1">
              Crie textos com IA e eles aparecerão aqui para gerenciar.
            </p>
          </div>
          <Link
            href="/criar-conteudo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus size={14} /> Criar primeiro conteúdo
          </Link>
        </div>
      )}

      {/* Kanban board */}
      {!loading && hasAny && viewMode === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
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
                        <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.countBg} ${cfg.countText}`}>
                        {cards.length}
                      </span>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-3 space-y-3 min-h-[140px] transition-colors rounded-b-xl ${
                            snapshot.isDraggingOver ? cfg.dragOver : ""
                          }`}
                        >
                          {cards.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-16 text-xs text-slate-700 border-2 border-dashed border-slate-800 rounded-lg">
                              Arraste cards aqui
                            </div>
                          )}
                          {cards.map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                >
                                  <KanbanCardComp
                                    card={card}
                                    isDragging={snap.isDragging}
                                    onOpen={() => setSelectedCard(card)}
                                    onMove={moveCard}
                                    onDelete={deleteCard}
                                    curIdx={STATUSES.indexOf(card.status)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* List view */}
      {!loading && hasAny && viewMode === "lista" && (
        <ListView
          cards={filtered}
          onOpen={setSelectedCard}
          onMove={moveCard}
          onDelete={deleteCard}
        />
      )}

      {/* Card detail modal */}
      <CardModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onSaved={handleCardSaved}
        onDelete={deleteCard}
        onMove={moveCard}
        userName={userName}
      />
    </AppShell>
  );
}
