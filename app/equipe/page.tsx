"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus, Search, X, Shield, Phone, Mail,
  MoreVertical, CheckCircle2, XCircle, Trash2,
  Edit2, RefreshCw, AlertCircle, Users, Crown,
  ChevronDown,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface Permissoes {
  ver_dashboard: boolean;
  gerenciar_eleitores: boolean;
  criar_conteudo: boolean;
  ver_agenda: boolean;
  ver_pautas: boolean;
}

interface Membro {
  id: string;
  gabinete_user_id: string;
  membro_user_id: string | null;
  nome: string;
  email: string;
  cargo: string;
  telefone: string | null;
  permissoes: Permissoes;
  status: "ativo" | "inativo" | "pendente";
  created_at: string;
}

interface InviteForm {
  nome: string;
  email: string;
  cargo: string;
  telefone: string;
  permissoes: Permissoes;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CARGOS = ["Assessor", "Chefe de Gabinete", "Secretário", "Estagiário", "Voluntário"];

const PERM_LABELS: Record<keyof Permissoes, string> = {
  ver_dashboard:       "Ver Dashboard",
  gerenciar_eleitores: "Gerenciar Eleitores",
  criar_conteudo:      "Criar Conteúdo",
  ver_agenda:          "Ver Agenda",
  ver_pautas:          "Ver Pautas",
};

const DEFAULT_PERMS: Permissoes = {
  ver_dashboard:       true,
  gerenciar_eleitores: false,
  criar_conteudo:      false,
  ver_agenda:          true,
  ver_pautas:          true,
};

const EMPTY_FORM: InviteForm = {
  nome: "",
  email: "",
  cargo: "Assessor",
  telefone: "",
  permissoes: { ...DEFAULT_PERMS },
};

const CARGO_BADGE: Record<string, string> = {
  "Chefe de Gabinete": "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  "Secretário":        "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Assessor":          "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  "Estagiário":        "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  "Voluntário":        "bg-slate-500/20 text-slate-300 border border-slate-500/30",
};

const STATUS_BADGE: Record<Membro["status"], string> = {
  ativo:    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  inativo:  "bg-red-500/20 text-red-400 border border-red-500/30",
  pendente: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

const inputCls =
  "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors";
const selectCls = `${inputCls} appearance-none`;

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

const AVATAR_COLORS = [
  "from-blue-600 to-indigo-700",
  "from-emerald-600 to-teal-700",
  "from-purple-600 to-violet-700",
  "from-amber-500 to-orange-600",
  "from-rose-600 to-pink-700",
];

function avatarColor(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── InviteModal ────────────────────────────────────────────────────────────

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSaved: () => void;
  editing: Membro | null;
}

function InviteModal({ open, onClose, userId, onSaved, editing }: InviteModalProps) {
  const [form, setForm] = useState<InviteForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        nome: editing.nome,
        email: editing.email,
        cargo: editing.cargo,
        telefone: editing.telefone ?? "",
        permissoes: { ...editing.permissoes },
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
    setSuccess(null);
  }, [open, editing]);

  function setF<K extends keyof InviteForm>(k: K, v: InviteForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function togglePerm(k: keyof Permissoes) {
    setForm((p) => ({ ...p, permissoes: { ...p.permissoes, [k]: !p.permissoes[k] } }));
  }

  async function handleSave() {
    if (!form.nome.trim())  { setError("Nome é obrigatório."); return; }
    if (!form.email.trim()) { setError("Email é obrigatório."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Email inválido."); return; }

    setSaving(true);
    setError(null);

    if (editing) {
      const { error: err } = await supabase
        .from("membros_equipe")
        .update({
          nome:       form.nome.trim(),
          cargo:      form.cargo,
          telefone:   form.telefone || null,
          permissoes: form.permissoes,
        })
        .eq("id", editing.id);

      if (err) { setError(err.message); setSaving(false); return; }
      setSuccess("Membro atualizado com sucesso.");
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } else {
      const { error: insertErr } = await supabase.from("membros_equipe").insert({
        gabinete_user_id: userId,
        nome:             form.nome.trim(),
        email:            form.email.trim().toLowerCase(),
        cargo:            form.cargo,
        telefone:         form.telefone || null,
        permissoes:       form.permissoes,
        status:           "pendente",
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          setError("Este email já foi convidado para sua equipe.");
        } else {
          setError(insertErr.message);
        }
        setSaving(false);
        return;
      }

      // Send invite email using "Invite user" template (not magic link)
      const inviteRes = await fetch("/api/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
      const inviteData = await inviteRes.json() as { ok?: boolean; error?: string; alreadyExists?: boolean };

      if (!inviteRes.ok && !inviteData.alreadyExists) {
        setSuccess("Membro cadastrado. Não foi possível enviar o email de convite automaticamente — compartilhe o link de acesso manualmente.");
      } else {
        setSuccess("Convite enviado! O membro receberá um email para criar sua senha.");
      }

      setTimeout(() => { onSaved(); onClose(); }, 2000);
    }

    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-white">
              {editing ? "Editar Membro" : "Convidar Membro"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {editing ? "Atualize cargo e permissões" : "Preencha os dados e defina as permissões"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error   && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{success}</p>}

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome completo *</label>
            <input
              className={inputCls}
              placeholder="Ex: Ana Paula Souza"
              value={form.nome}
              onChange={(e) => setF("nome", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
            <input
              type="email"
              className={`${inputCls} ${editing ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="email@exemplo.com"
              value={form.email}
              disabled={!!editing}
              onChange={(e) => setF("email", e.target.value)}
            />
            {editing && <p className="text-xs text-slate-500 mt-1">Email não pode ser alterado após o convite.</p>}
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Cargo</label>
            <div className="relative">
              <select
                className={selectCls}
                value={form.cargo}
                onChange={(e) => setF("cargo", e.target.value)}
              >
                {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefone</label>
            <input
              className={inputCls}
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => setF("telefone", maskPhone(e.target.value))}
            />
          </div>

          {/* Permissões */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Permissões de acesso</label>
            <div className="space-y-2 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              {(Object.keys(PERM_LABELS) as (keyof Permissoes)[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => togglePerm(k)}
                  className="w-full flex items-center gap-3 py-1.5 text-left"
                >
                  <div className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.permissoes[k] ? "bg-blue-600" : "bg-slate-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.permissoes[k] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-slate-300">{PERM_LABELS[k]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
          >
            {saving ? "Salvando…" : editing ? "Salvar alterações" : "Convidar membro"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MemberCard ─────────────────────────────────────────────────────────────

interface MemberCardProps {
  membro: Membro;
  isOwner: boolean;
  onEdit: (m: Membro) => void;
  onToggleStatus: (m: Membro) => void;
  onDelete: (m: Membro) => void;
  onViewProfile: (m: Membro) => void;
}

function MemberCard({ membro, isOwner, onEdit, onToggleStatus, onDelete, onViewProfile }: MemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const permCount = Object.values(membro.permissoes).filter(Boolean).length;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors relative">
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(membro.nome)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {initials(membro.nome)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">{membro.nome}</h3>
            {isOwner && <Crown size={13} className="text-amber-400 flex-shrink-0" aria-label="Dono do gabinete" />}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CARGO_BADGE[membro.cargo] ?? CARGO_BADGE["Assessor"]}`}>
              {membro.cargo}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[membro.status]}`}>
              {membro.status === "pendente" ? "Convite pendente" : membro.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>

        {/* Menu */}
        {!isOwner && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-10 bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-44 py-1 text-sm"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button onClick={() => { onViewProfile(membro); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <Shield size={14} /> Ver perfil
                </button>
                <button onClick={() => { onEdit(membro); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <Edit2 size={14} /> Editar
                </button>
                <button onClick={() => { onToggleStatus(membro); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  {membro.status === "ativo" ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  {membro.status === "ativo" ? "Desativar" : "Reativar"}
                </button>
                <div className="border-t border-slate-700 my-1" />
                <button onClick={() => { onDelete(membro); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Mail size={12} className="flex-shrink-0" />
          <span className="truncate">{membro.email}</span>
        </div>
        {membro.telefone && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone size={12} className="flex-shrink-0" />
            <span>{membro.telefone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <span className="text-xs text-slate-500">
          {permCount} permiss{permCount === 1 ? "ão" : "ões"}
        </span>
        <span className="text-xs text-slate-500">Desde {fmtDate(membro.created_at)}</span>
      </div>
    </div>
  );
}

// ── ProfileDrawer ──────────────────────────────────────────────────────────

interface ProfileDrawerProps {
  membro: Membro | null;
  onClose: () => void;
  onEdit: (m: Membro) => void;
  onToggleStatus: (m: Membro) => void;
  onDelete: (m: Membro) => void;
}

function ProfileDrawer({ membro, onClose, onEdit, onToggleStatus, onDelete }: ProfileDrawerProps) {
  if (!membro) return null;

  const permCount = Object.values(membro.permissoes).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-sm bg-slate-900 border-l border-slate-700 h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Perfil do Membro</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="p-6 flex flex-col items-center gap-3 border-b border-slate-700">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarColor(membro.nome)} flex items-center justify-center text-white font-bold text-2xl`}>
            {initials(membro.nome)}
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-white">{membro.nome}</p>
            <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CARGO_BADGE[membro.cargo] ?? CARGO_BADGE["Assessor"]}`}>
                {membro.cargo}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[membro.status]}`}>
                {membro.status === "pendente" ? "Convite pendente" : membro.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4 flex-1">
          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail size={14} className="text-slate-500 flex-shrink-0" />
                <span className="break-all">{membro.email}</span>
              </div>
              {membro.telefone && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone size={14} className="text-slate-500 flex-shrink-0" />
                  <span>{membro.telefone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Info */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Informações</h3>
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Membro desde</span>
                <span className="text-slate-300">{fmtDate(membro.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Permissões ativas</span>
                <span className="text-slate-300">{permCount} de {Object.keys(membro.permissoes).length}</span>
              </div>
            </div>
          </section>

          {/* Permissions */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Permissões</h3>
            <div className="space-y-2">
              {(Object.keys(PERM_LABELS) as (keyof Permissoes)[]).map((k) => (
                <div key={k} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300">{PERM_LABELS[k]}</span>
                  {membro.permissoes[k]
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <XCircle size={16} className="text-slate-600" />
                  }
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-slate-700 space-y-2">
          <button
            onClick={() => onEdit(membro)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Edit2 size={14} /> Editar permissões
          </button>
          <button
            onClick={() => onToggleStatus(membro)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              membro.status === "ativo"
                ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                : "border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            {membro.status === "ativo" ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
            {membro.status === "ativo" ? "Desativar membro" : "Reativar membro"}
          </button>
          <button
            onClick={() => onDelete(membro)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} /> Remover do gabinete
          </button>
        </div>
      </aside>
    </div>
  );
}

// ── ConfirmDialog ──────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, description, confirmLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PlanLimitBanner ────────────────────────────────────────────────────────

function PlanLimitBanner({ plano, count }: { plano: string; count: number }) {
  const limits: Record<string, number> = { solo: 1, assessor: 3, gabinete: 8, trial: 1 };
  const max = limits[plano] ?? 1;
  const canAdd = count < max;
  if (canAdd) return null;

  return (
    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm">
      <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
      <p className="text-amber-300">
        Seu plano <strong>{plano}</strong> permite até <strong>{max}</strong> membro{max > 1 ? "s" : ""}.
        <a href="/configuracoes" className="underline ml-1 hover:text-amber-200">Fazer upgrade</a>.
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EquipePage() {
  const { user, profile } = useAuth();

  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCargo, setFilterCargo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [inviteOpen, setInviteOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState<Membro | null>(null);
  const [profileTarget, setProfileTarget] = useState<Membro | null>(null);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    danger: boolean;
    action: () => void;
  }>({ open: false, title: "", description: "", confirmLabel: "", danger: false, action: () => {} });

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadMembros = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("membros_equipe")
      .select("*")
      .eq("gabinete_user_id", user.id)
      .order("created_at", { ascending: true });
    setMembros((data as Membro[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadMembros(); }, [loadMembros]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = membros.filter((m) => {
    if (search && !m.nome.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCargo  && m.cargo  !== filterCargo)  return false;
    if (filterStatus && m.status !== filterStatus) return false;
    return true;
  });

  const plano = profile?.plano ?? "solo";
  const limits: Record<string, number> = { solo: 1, assessor: 3, gabinete: 8, trial: 1 };
  const maxMembros = limits[plano] ?? 1;
  const canAddMore = membros.length < maxMembros;

  // ── Actions ────────────────────────────────────────────────────────────────

  function openEdit(m: Membro) {
    setEditTarget(m);
    setInviteOpen(true);
  }

  function openProfile(m: Membro) {
    setProfileTarget(m);
  }

  function requestToggleStatus(m: Membro) {
    setProfileTarget(null);
    const next = m.status === "ativo" ? "inativo" : "ativo";
    setConfirm({
      open: true,
      title: next === "inativo" ? "Desativar membro?" : "Reativar membro?",
      description: next === "inativo"
        ? `${m.nome} perderá o acesso ao gabinete imediatamente.`
        : `${m.nome} voltará a ter acesso ao gabinete.`,
      confirmLabel: next === "inativo" ? "Desativar" : "Reativar",
      danger: next === "inativo",
      action: () => toggleStatus(m, next),
    });
  }

  async function toggleStatus(m: Membro, next: "ativo" | "inativo") {
    await supabase.from("membros_equipe").update({ status: next }).eq("id", m.id);
    loadMembros();
  }

  function requestDelete(m: Membro) {
    setProfileTarget(null);
    setConfirm({
      open: true,
      title: "Remover membro?",
      description: `${m.nome} será removido do gabinete. Esta ação não pode ser desfeita.`,
      confirmLabel: "Remover",
      danger: true,
      action: () => deleteMembro(m.id),
    });
  }

  async function deleteMembro(id: string) {
    await supabase.from("membros_equipe").delete().eq("id", id);
    loadMembros();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const ativoCount   = membros.filter((m) => m.status === "ativo").length;
  const pendenteCount = membros.filter((m) => m.status === "pendente").length;

  return (
    <AppShell
      title="Equipe"
      subtitle="Gerencie os membros e permissões do seu gabinete"
      headerRight={
        <button
          onClick={() => {
            if (!canAddMore) return;
            setEditTarget(null);
            setInviteOpen(true);
          }}
          disabled={!canAddMore}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow"
          title={!canAddMore ? `Limite do plano ${plano} atingido` : "Convidar membro"}
        >
          <UserPlus size={16} />
          Convidar membro
        </button>
      }
    >
      <div className="space-y-6">

        {/* Plan limit banner */}
        <PlanLimitBanner plano={plano} count={membros.length} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total",     value: membros.length, sub: `de ${maxMembros} no plano`, icon: Users,         color: "text-blue-400" },
            { label: "Ativos",    value: ativoCount,     sub: "com acesso",                icon: CheckCircle2,  color: "text-emerald-400" },
            { label: "Pendentes", value: pendenteCount,  sub: "aguardando convite",         icon: RefreshCw,     color: "text-amber-400" },
            { label: "Inativos",  value: membros.filter((m) => m.status === "inativo").length, sub: "sem acesso", icon: XCircle, color: "text-slate-500" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <Icon size={16} className={color} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Buscar por nome ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
            >
              <option value="">Todos os cargos</option>
              {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="pendente">Pendente</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw size={24} className="text-slate-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Users size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="text-slate-300 font-medium">
                {membros.length === 0 ? "Nenhum membro cadastrado" : "Nenhum resultado encontrado"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {membros.length === 0
                  ? "Convide sua equipe para começar a colaborar."
                  : "Tente ajustar os filtros ou a busca."}
              </p>
            </div>
            {membros.length === 0 && canAddMore && (
              <button
                onClick={() => { setEditTarget(null); setInviteOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                <UserPlus size={15} /> Convidar primeiro membro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                membro={m}
                isOwner={false}
                onEdit={openEdit}
                onToggleStatus={requestToggleStatus}
                onDelete={requestDelete}
                onViewProfile={openProfile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <InviteModal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setEditTarget(null); }}
        userId={user?.id ?? ""}
        onSaved={loadMembros}
        editing={editTarget}
      />

      <ProfileDrawer
        membro={profileTarget}
        onClose={() => setProfileTarget(null)}
        onEdit={(m) => { setProfileTarget(null); openEdit(m); }}
        onToggleStatus={requestToggleStatus}
        onDelete={requestDelete}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        onConfirm={() => { confirm.action(); setConfirm((p) => ({ ...p, open: false })); }}
        onCancel={() => setConfirm((p) => ({ ...p, open: false }))}
      />
    </AppShell>
  );
}
