"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, X, RefreshCw, MessageSquare,
  ChevronDown, Mail, Phone, MapPin, Send,
  CheckCircle2, Clock, Archive, Eye, Copy, Check,
  AlertCircle, Link2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

type StatusDemanda = "nova" | "em_analise" | "respondida" | "arquivada";

interface Demanda {
  id: string;
  politico_user_id: string;
  protocolo: string;
  nome: string;
  email: string;
  telefone: string | null;
  bairro: string | null;
  tipo: string;
  categoria: string;
  mensagem: string;
  status: StatusDemanda;
  resposta: string | null;
  respondido_em: string | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  recado:   { emoji: "💬", label: "Recado",   bg: "bg-slate-500/15",   text: "text-slate-300"   },
  duvida:   { emoji: "❓", label: "Dúvida",   bg: "bg-amber-500/15",   text: "text-amber-300"   },
  sugestao: { emoji: "💡", label: "Sugestão", bg: "bg-blue-500/15",    text: "text-blue-300"    },
  demanda:  { emoji: "🔧", label: "Demanda",  bg: "bg-purple-500/15",  text: "text-purple-300"  },
};

const STATUS_CFG: Record<StatusDemanda, { label: string; icon: React.ElementType; bg: string; text: string; dot: string }> = {
  nova:        { label: "Nova",        icon: AlertCircle,   bg: "bg-red-500/15",     text: "text-red-400",     dot: "bg-red-400"     },
  em_analise:  { label: "Em análise",  icon: Clock,         bg: "bg-amber-500/15",   text: "text-amber-400",   dot: "bg-amber-400"   },
  respondida:  { label: "Respondida",  icon: CheckCircle2,  bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  arquivada:   { label: "Arquivada",   icon: Archive,       bg: "bg-slate-500/15",   text: "text-slate-500",   dot: "bg-slate-600"   },
};

const CATEGORIAS = [
  "Obras e Infraestrutura", "Saúde", "Educação", "Cultura", "Esporte",
  "Segurança", "Meio Ambiente", "Emprego", "Transporte",
  "Assistência Social", "Outros",
];

const STATUS_FLOW: Record<StatusDemanda, StatusDemanda | null> = {
  nova:       "em_analise",
  em_analise: "respondida",
  respondida: "arquivada",
  arquivada:  null,
};

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── DemandaModal ───────────────────────────────────────────────────────────

interface DemandaModalProps {
  demanda: Demanda | null;
  onClose: () => void;
  onUpdated: (d: Demanda) => void;
  nomePolitico: string;
  cargo: string | null;
}

function DemandaModal({ demanda, onClose, onUpdated, nomePolitico, cargo }: DemandaModalProps) {
  const [resposta,    setResposta]    = useState("");
  const [sending,     setSending]     = useState(false);
  const [advancing,   setAdvancing]   = useState(false);
  const [emailSent,   setEmailSent]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [copiedProt,  setCopiedProt]  = useState(false);

  useEffect(() => {
    if (!demanda) return;
    setResposta(demanda.resposta ?? "");
    setEmailSent(false);
    setError(null);
  }, [demanda]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (demanda) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [demanda, onClose]);

  if (!demanda) return null;

  const tipo     = TIPO_LABEL[demanda.tipo] ?? { emoji: "💬", label: demanda.tipo, bg: "bg-slate-500/15", text: "text-slate-400" };
  const statusCfg = STATUS_CFG[demanda.status];
  const nextStatus = STATUS_FLOW[demanda.status];

  async function handleSendEmail() {
    if (!demanda)         { return; }
    if (!resposta.trim()) { setError("Escreva uma resposta antes de enviar."); return; }
    setSending(true);
    setError(null);

    // Save response to DB first
    const now = new Date().toISOString();
    const { data: updated, error: dbErr } = await supabase
      .from("demandas_publicas")
      .update({ resposta, respondido_em: now, status: "respondida" })
      .eq("id", demanda.id)
      .select()
      .single();

    if (dbErr) { setError(dbErr.message); setSending(false); return; }

    // Send email via API route
    await fetch("/api/enviar-resposta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailTo:          demanda.email,
        nome:             demanda.nome,
        protocolo:        demanda.protocolo,
        mensagemOriginal: demanda.mensagem,
        resposta,
        nomePolitico,
        cargo,
      }),
    });

    setSending(false);
    setEmailSent(true);
    if (updated) onUpdated(updated as Demanda);
  }

  async function handleAdvanceStatus() {
    if (!demanda || !nextStatus) return;
    setAdvancing(true);
    const { data: updated } = await supabase
      .from("demandas_publicas")
      .update({ status: nextStatus })
      .eq("id", demanda.id)
      .select()
      .single();
    setAdvancing(false);
    if (updated) onUpdated(updated as Demanda);
  }

  async function copyProtocolo() {
    if (!demanda) return;
    await navigator.clipboard.writeText(demanda.protocolo);
    setCopiedProt(true);
    setTimeout(() => setCopiedProt(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipo.bg} ${tipo.text}`}>
                  {tipo.emoji} {tipo.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{demanda.categoria}</span>
              </div>
              <button
                onClick={copyProtocolo}
                className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono"
              >
                {copiedProt ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {demanda.protocolo}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Citizen data */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Cidadão</h3>
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white">{demanda.nome}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail size={12} className="flex-shrink-0" />
                  <span className="truncate">{demanda.email}</span>
                </div>
                {demanda.telefone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Phone size={12} className="flex-shrink-0" />
                    {demanda.telefone}
                  </div>
                )}
                {demanda.bairro && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} className="flex-shrink-0" />
                    {demanda.bairro}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600">Recebido em {fmtDateTime(demanda.created_at)}</p>
            </div>
          </section>

          {/* Message */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Mensagem</h3>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{demanda.mensagem}</p>
            </div>
          </section>

          {/* Response */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {demanda.status === "respondida" ? "Resposta enviada" : "Responder"}
            </h3>
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{error}</p>
            )}
            {emailSent && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-3">
                ✓ Resposta enviada para {demanda.email}
              </p>
            )}
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              placeholder="Escreva sua resposta aqui…"
              value={resposta}
              onChange={(e) => { setResposta(e.target.value); setError(null); }}
            />
            {demanda.respondido_em && (
              <p className="text-xs text-slate-600 mt-1">
                Respondido em {fmtDateTime(demanda.respondido_em)}
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-5 border-t border-slate-700 flex-wrap">
          {nextStatus && (() => {
            const AdvIcon = STATUS_CFG[nextStatus].icon;
            return (
              <button
                onClick={handleAdvanceStatus}
                disabled={advancing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-colors"
              >
                {advancing ? <RefreshCw size={12} className="animate-spin" /> : <AdvIcon size={12} />}
                Marcar como {STATUS_CFG[nextStatus].label}
              </button>
            );
          })()}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSendEmail}
              disabled={sending || !resposta.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {sending
                ? <RefreshCw size={13} className="animate-spin" />
                : <Send size={13} />
              }
              {sending ? "Enviando…" : "Enviar resposta por email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DemandaCard ────────────────────────────────────────────────────────────

function DemandaCard({ demanda, onClick }: { demanda: Demanda; onClick: () => void }) {
  const tipo      = TIPO_LABEL[demanda.tipo] ?? { emoji: "💬", label: demanda.tipo, bg: "bg-slate-500/15", text: "text-slate-400" };
  const statusCfg = STATUS_CFG[demanda.status];

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tipo.bg} ${tipo.text}`}>
              {tipo.emoji} {tipo.label}
            </span>
            <span className="text-[11px] text-slate-500">{demanda.categoria}</span>
          </div>
          <p className="text-sm font-semibold text-white">{demanda.nome}</p>
          {demanda.bairro && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin size={10} />{demanda.bairro}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {demanda.mensagem}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <span className="text-[11px] text-slate-600">{fmtDate(demanda.created_at)}</span>
          <Eye size={13} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DemandasPage() {
  const { user, profile } = useAuth();
  const nomePolitico = profile?.nome ?? "Político";

  const [demandas,   setDemandas]   = useState<Demanda[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Demanda | null>(null);
  const [search,     setSearch]     = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCat,  setFilterCat]  = useState("");
  const [filterSt,   setFilterSt]   = useState<StatusDemanda | "">("");
  const [slug,       setSlug]       = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: dem }, { data: prof }] = await Promise.all([
      supabase
        .from("demandas_publicas")
        .select("*")
        .eq("politico_user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("slug, cargo, nome_politico, nome")
        .eq("id", user.id)
        .single(),
    ]);

    setDemandas((dem as Demanda[]) ?? []);

    if (prof?.slug) {
      setSlug(prof.slug);
    } else if (user && prof) {
      const p = prof as { slug?: string | null; nome_politico?: string | null; nome?: string | null };
      const baseName = p.nome_politico || p.nome || "";
      if (baseName) {
        const normalized = baseName.toLowerCase().normalize("NFD");
        let generated = "";
        for (const ch of normalized) {
          const code = ch.charCodeAt(0);
          if (code >= 0x0300 && code <= 0x036f) continue; // strip diacritics
          generated += (/[a-z0-9]/).test(ch) ? ch : "-";
        }
        generated = generated.replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
        await supabase.from("profiles").update({ slug: generated }).eq("id", user.id);
        setSlug(generated);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = demandas.filter((d) => {
    const q = search.toLowerCase();
    if (q && !d.nome.toLowerCase().includes(q) && !(d.bairro ?? "").toLowerCase().includes(q)) return false;
    if (filterTipo && d.tipo     !== filterTipo) return false;
    if (filterCat  && d.categoria !== filterCat) return false;
    if (filterSt   && d.status   !== filterSt)   return false;
    return true;
  });

  const counts = {
    nova:       demandas.filter((d) => d.status === "nova").length,
    em_analise: demandas.filter((d) => d.status === "em_analise").length,
    respondida: demandas.filter((d) => d.status === "respondida").length,
    arquivada:  demandas.filter((d) => d.status === "arquivada").length,
  };

  const profileNome = profile?.nome ?? nomePolitico;

  function handleUpdated(updated: Demanda) {
    setDemandas((prev) => prev.map((d) => d.id === updated.id ? updated : d));
    setSelected(updated);
  }

  async function copyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  const hasFilters = !!(search || filterTipo || filterCat || filterSt);

  return (
    <AppShell
      title="Demandas"
      subtitle="Mensagens recebidas pela sua página pública"
      headerRight={
        slug ? (
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}
            {copiedLink ? "Link copiado!" : "Copiar link público"}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Status counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(STATUS_CFG) as [StatusDemanda, typeof STATUS_CFG[StatusDemanda]][]).map(([st, cfg]) => {
            const CfgIcon = cfg.icon;
            return (
              <button
                key={st}
                onClick={() => setFilterSt(filterSt === st ? "" : st)}
                className={`text-left bg-slate-800/50 border rounded-xl p-4 transition-all ${
                  filterSt === st ? "border-blue-500/50 bg-blue-500/5" : "border-slate-700/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">{cfg.label}</span>
                  <CfgIcon size={14} className={cfg.text} />
                </div>
                <p className="text-2xl font-bold text-white">{counts[st]}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Buscar por nome ou bairro…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {[
            {
              value: filterTipo, setter: setFilterTipo, ph: "Tipo",
              options: Object.entries(TIPO_LABEL).map(([v, c]) => ({ value: v, label: `${c.emoji} ${c.label}` })),
            },
            {
              value: filterCat, setter: setFilterCat, ph: "Categoria",
              options: CATEGORIAS.map((c) => ({ value: c, label: c })),
            },
          ].map(({ value, setter, ph, options }) => (
            <div key={ph} className="relative">
              <select
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                value={value}
                onChange={(e) => setter(e.target.value)}
              >
                <option value="">{ph}: Todos</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          ))}
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterTipo(""); setFilterCat(""); setFilterSt(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 border border-slate-700 text-xs hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X size={13} /> Limpar filtros
            </button>
          )}
        </div>

        {/* Slug link hint */}
        {!slug && !loading && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-xs">
              Configure um <strong>slug</strong> no perfil para ativar sua página pública de demandas.
              Acesse <a href="/configuracoes" className="underline">Configurações → Perfil</a>.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={22} className="text-slate-500 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <MessageSquare size={22} className="text-slate-600" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">
                {demandas.length === 0 ? "Nenhuma demanda recebida ainda" : "Nenhum resultado encontrado"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {demandas.length === 0
                  ? "Compartilhe o link da sua página pública para começar a receber mensagens."
                  : "Tente ajustar os filtros."}
              </p>
            </div>
          </div>
        )}

        {/* Cards grid */}
        {!loading && filtered.length > 0 && (
          <>
            <p className="text-xs text-slate-500">
              {filtered.length} demanda{filtered.length !== 1 ? "s" : ""}
              {hasFilters ? " encontrada" : " no total"}
              {filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((d) => (
                <DemandaCard key={d.id} demanda={d} onClick={() => setSelected(d)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <DemandaModal
        demanda={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
        nomePolitico={profileNome}
        cargo={profile ? null : null}
      />
    </AppShell>
  );
}
