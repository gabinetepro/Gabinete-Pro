"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit2, Trash2, Plus, Clock, Phone, Mail,
  MapPin, User, Tag, MessageSquare, CheckCircle, XCircle,
  Briefcase, GraduationCap, Heart, ThumbsUp, RefreshCw,
  AlertCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface Eleitor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  data_nascimento: string | null;
  genero: string | null;
  profissao: string | null;
  escolaridade: string | null;
  faixa_renda: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  como_conheceu: string | null;
  ja_votou: string | null;
  intencao_voto: string | null;
  engajamento: string | null;
  temas_interesse: string[] | null;
  aceita_comunicados: boolean;
  preferencia_contato: string | null;
  observacao: string | null;
  tags: string[] | null;
  status: string;
  created_at: string;
}

interface Interacao {
  id: string;
  descricao: string;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcAge(dn: string | null) {
  if (!dn) return null;
  return Math.floor((Date.now() - new Date(dn).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

const ENGAJAMENTO_BADGE: Record<string, string> = {
  "Apoiador passivo": "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  "Ativo":            "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Multiplicador":    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  "Liderança":        "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

const INTENCAO_BADGE: Record<string, string> = {
  "Certo":    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  "Provável": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Indeciso": "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-700/40 last:border-0">
      {Icon && <Icon size={14} className="text-slate-500 mt-0.5 shrink-0" />}
      <span className="text-xs text-slate-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 flex-1">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function EleitorPerfilPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [eleitor, setEleitor]         = useState<Eleitor | null>(null);
  const [interacoes, setInteracoes]   = useState<Interacao[]>([]);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [newNote, setNewNote]         = useState("");
  const [addingNote, setAddingNote]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]       = useState(false);

  // ── Load ───────────────────────────────────────────────────────

  const loadEleitor = useCallback(async () => {
    if (!user || !params.id) return;
    const { data, error } = await supabase
      .from("eleitores")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setEleitor(data as Eleitor);
  }, [user, params.id]);

  const loadInteracoes = useCallback(async () => {
    if (!user || !params.id) return;
    const { data } = await supabase
      .from("interacoes_eleitor")
      .select("id, descricao, created_at")
      .eq("eleitor_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setInteracoes((data as Interacao[]) ?? []);
  }, [user, params.id]);

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      Promise.all([loadEleitor(), loadInteracoes()]).finally(() => setLoading(false));
    }
  }, [authLoading, user, loadEleitor, loadInteracoes]);

  // ── Add note ───────────────────────────────────────────────────

  async function handleAddNote() {
    if (!newNote.trim() || !user || !eleitor) return;
    setAddingNote(true);
    await supabase.from("interacoes_eleitor").insert({
      eleitor_id: eleitor.id,
      user_id:    user.id,
      descricao:  newNote.trim(),
    });
    setNewNote("");
    await loadInteracoes();
    setAddingNote(false);
  }

  // ── Delete ─────────────────────────────────────────────────────

  async function handleDelete() {
    if (!eleitor) return;
    setDeleting(true);
    await supabase.from("eleitores").delete().eq("id", eleitor.id);
    router.push("/eleitores");
  }

  // ── Delete interaction ─────────────────────────────────────────

  async function handleDeleteNote(id: string) {
    await supabase.from("interacoes_eleitor").delete().eq("id", id);
    setInteracoes(prev => prev.filter(i => i.id !== id));
  }

  // ── Loading / not found ────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <AppShell title="Perfil do Eleitor">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !eleitor) {
    return (
      <AppShell title="Perfil do Eleitor">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle size={32} className="text-slate-500" />
          <p className="text-slate-400">Eleitor não encontrado.</p>
          <Link href="/eleitores" className="text-blue-400 text-sm hover:underline">Voltar para a lista</Link>
        </div>
      </AppShell>
    );
  }

  const age = calcAge(eleitor.data_nascimento);
  const address = [eleitor.rua, eleitor.numero, eleitor.complemento, eleitor.bairro, eleitor.cidade, eleitor.uf].filter(Boolean).join(", ");

  return (
    <AppShell
      title={eleitor.nome}
      subtitle={[eleitor.profissao, eleitor.cidade, eleitor.uf].filter(Boolean).join(" · ") || "Perfil completo"}
      headerRight={
        <div className="flex items-center gap-2">
          <Link href="/eleitores" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
            <ArrowLeft size={13} />Voltar
          </Link>
          <Link
            href={`/eleitores?editId=${eleitor.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Edit2 size={13} />Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />Excluir
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: profile data */}
        <div className="lg:col-span-2 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {eleitor.engajamento && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${ENGAJAMENTO_BADGE[eleitor.engajamento] ?? "bg-slate-500/20 text-slate-400"}`}>
                {eleitor.engajamento}
              </span>
            )}
            {eleitor.intencao_voto && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${INTENCAO_BADGE[eleitor.intencao_voto] ?? "bg-slate-500/20 text-slate-400"}`}>
                Voto: {eleitor.intencao_voto}
              </span>
            )}
            {eleitor.aceita_comunicados && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle size={11} />Aceita comunicados
              </span>
            )}
          </div>

          {/* Dados pessoais */}
          <Section title="Dados pessoais">
            <InfoRow icon={User} label="Nome completo" value={eleitor.nome} />
            <InfoRow icon={Mail} label="Email" value={eleitor.email} />
            <InfoRow icon={Phone} label="Telefone" value={eleitor.telefone} />
            <InfoRow icon={Phone} label="WhatsApp" value={eleitor.whatsapp} />
            <InfoRow icon={User} label="Data de nascimento" value={eleitor.data_nascimento ? `${fmtDate(eleitor.data_nascimento)}${age ? ` (${age} anos)` : ""}` : null} />
            <InfoRow icon={User} label="Gênero" value={eleitor.genero} />
            <InfoRow icon={Briefcase} label="Profissão" value={eleitor.profissao} />
            <InfoRow icon={GraduationCap} label="Escolaridade" value={eleitor.escolaridade} />
            <InfoRow icon={User} label="Faixa de renda" value={eleitor.faixa_renda} />
          </Section>

          {/* Endereço */}
          {address && (
            <Section title="Endereço">
              <InfoRow icon={MapPin} label="CEP" value={eleitor.cep} />
              <InfoRow icon={MapPin} label="Endereço" value={address} />
            </Section>
          )}

          {/* Perfil político */}
          <Section title="Perfil político">
            <InfoRow icon={Heart} label="Como conheceu" value={eleitor.como_conheceu} />
            <InfoRow icon={ThumbsUp} label="Já votou" value={eleitor.ja_votou} />
            <InfoRow icon={ThumbsUp} label="Intenção de voto" value={eleitor.intencao_voto} />
            <InfoRow icon={User} label="Engajamento" value={eleitor.engajamento} />
            <InfoRow icon={MessageSquare} label="Pref. contato" value={eleitor.preferencia_contato} />
            <InfoRow
              icon={Heart}
              label="Temas de interesse"
              value={eleitor.temas_interesse?.length ? (
                <div className="flex flex-wrap gap-1">
                  {eleitor.temas_interesse.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{t}</span>
                  ))}
                </div>
              ) : null}
            />
            <InfoRow
              icon={User}
              label="Aceita comunicados"
              value={eleitor.aceita_comunicados
                ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={12} />Sim</span>
                : <span className="flex items-center gap-1 text-slate-500"><XCircle size={12} />Não</span>}
            />
          </Section>

          {/* Tags */}
          {(eleitor.tags ?? []).length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-2">
                {eleitor.tags!.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                    <Tag size={10} />#{t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Observações */}
          {eleitor.observacao && (
            <Section title="Observações">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{eleitor.observacao}</p>
            </Section>
          )}

          <p className="text-xs text-slate-600 px-1">Cadastrado em {fmtDate(eleitor.created_at)}</p>
        </div>

        {/* Right column: timeline */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Histórico de interações</h3>

            {/* Add note */}
            <div className="mb-5">
              <textarea
                rows={3}
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Registrar nova anotação..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {addingNote ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                Adicionar anotação
              </button>
            </div>

            {/* Timeline */}
            {interacoes.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={20} className="mx-auto text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">Nenhuma anotação ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interacoes.map((int, idx) => (
                  <div key={int.id} className="relative pl-5">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${idx === 0 ? "bg-blue-400" : "bg-slate-600"}`} />
                    {/* Timeline line */}
                    {idx < interacoes.length - 1 && (
                      <div className="absolute left-[3px] top-4 bottom-0 w-px bg-slate-700" />
                    )}
                    <div className="bg-slate-700/40 border border-slate-700/40 rounded-lg p-3 group">
                      <p className="text-xs text-slate-500 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />{fmtDateTime(int.created_at)}
                        </span>
                        <button
                          onClick={() => handleDeleteNote(int.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{int.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir eleitor" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Tem certeza que deseja excluir <strong className="text-white">{eleitor.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
