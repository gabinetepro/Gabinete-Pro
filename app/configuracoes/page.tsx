"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  User, Mic2, Building2, Bell, Shield, CreditCard,
  Camera, Save, Eye, EyeOff, ChevronDown, Check,
  AtSign, Globe, Hash, Play, Music, RefreshCw,
  CheckCircle2, LogOut,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProfileFull {
  id: string;
  email: string;
  nome: string;
  plano: "solo" | "assessor" | "gabinete" | "trial";
  status: string;
  created_at: string;
  // migration 002
  estado: string | null;
  municipio: string | null;
  cargo: string | null;
  interesses: string[] | null;
  // migration 005
  nome_politico: string | null;
  partido: string | null;
  biografia: string | null;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  tom_voz: string | null;
  estilos_comunicacao: string[] | null;
  texto_referencia: string | null;
  nome_gabinete: string | null;
  endereco_gabinete: string | null;
  telefone_gabinete: string | null;
  email_gabinete: string | null;
  horario_gabinete: string | null;
  notif_demandas: boolean;
  notif_resumo: boolean;
  notif_pautas: boolean;
  avatar_url: string | null;
  foto_gabinete_url: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CARGOS_POLITICOS = [
  "Vereador", "Deputado Estadual", "Deputado Federal",
  "Senador", "Prefeito", "Vice-prefeito", "Secretário", "Liderança Regional",
];

const PARTIDOS = [
  "PT", "PL", "PP", "MDB", "PSD", "União Brasil", "Republicanos",
  "PDT", "PSB", "Solidariedade", "PSDB", "DEM", "Avante", "Patriota",
  "PROS", "PCdoB", "PV", "REDE", "Cidadania", "PSOL", "Novo", "PMB", "Outro",
];

const TOM_VOZ_OPT = [
  { value: "formal",   label: "Formal",   desc: "Linguagem técnica e institucional" },
  { value: "informal", label: "Informal", desc: "Próximo, direto e acessível" },
  { value: "tecnico",  label: "Técnico",  desc: "Dados, evidências e profundidade" },
  { value: "emotivo",  label: "Emotivo",  desc: "Emocional, inspirador e humano" },
  { value: "direto",   label: "Direto",   desc: "Objetivo, sem rodeios" },
];

const ESTILOS_OPT = [
  "Usa emojis",
  "Usa hashtags",
  "Linguagem simples",
  "Dados e estatísticas",
  "Histórias pessoais",
  "Chamadas para ação",
];

const PLANO_FEATURES: Record<string, { label: string; features: string[] }> = {
  trial:    { label: "Trial",    features: ["1 usuário", "Funcionalidades básicas", "7 dias gratuitos"] },
  solo:     { label: "Solo",     features: ["1 usuário", "Eleitores ilimitados", "Estúdio de conteúdo", "Agenda e pautas"] },
  assessor: { label: "Assessor", features: ["Até 3 usuários", "Tudo do Solo", "Equipe colaborativa", "Exportação CSV/XLSX"] },
  gabinete: { label: "Gabinete", features: ["Até 8 usuários", "Tudo do Assessor", "Relatórios avançados", "Suporte prioritário"] },
};

const PLANO_PRICE: Record<string, string> = {
  trial: "Gratuito", solo: "R$147/mês", assessor: "R$247/mês", gabinete: "R$397/mês",
};

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors";
const selectCls = `${inputCls} appearance-none`;

const EMPTY_PROFILE: Omit<ProfileFull, "id" | "email" | "plano" | "status" | "created_at"> = {
  nome: "", nome_politico: null, partido: null, cargo: null, biografia: null, site: null,
  estado: null, municipio: null, interesses: null,
  instagram: null, facebook: null, twitter: null, youtube: null, tiktok: null,
  tom_voz: null, estilos_comunicacao: [], texto_referencia: null,
  nome_gabinete: null, endereco_gabinete: null, telefone_gabinete: null,
  email_gabinete: null, horario_gabinete: null,
  notif_demandas: true, notif_resumo: true, notif_pautas: true,
  avatar_url: null, foto_gabinete_url: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${checked ? "bg-blue-600" : "bg-slate-700"}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

// ── AvatarUpload ────────────────────────────────────────────────────────────

interface AvatarUploadProps {
  userId: string;
  url: string | null;
  nome: string;
  field: "avatar_url" | "foto_gabinete_url";
  size?: "sm" | "lg";
  onUploaded: (url: string) => void;
}

function AvatarUpload({ userId, url, nome, field, size = "lg", onUploaded }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(url);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(url); }, [url]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${field}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("gabinete-media")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (!uploadErr) {
      const { data } = supabase.storage.from("gabinete-media").getPublicUrl(path);
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(finalUrl);
      await supabase.from("profiles").update({ [field]: data.publicUrl }).eq("id", userId);
      onUploaded(data.publicUrl);
    }
    setUploading(false);
  }

  const dim = size === "lg" ? "w-24 h-24 text-2xl" : "w-16 h-16 text-base";
  const iconDim = size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <div className="relative inline-block">
      <div
        onClick={() => fileRef.current?.click()}
        className={`${dim} rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold cursor-pointer overflow-hidden relative group`}
      >
        {preview
          ? <div className="w-full h-full" style={{ backgroundImage: `url(${preview})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          : <span>{initials(nome || "?")}</span>
        }
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading
            ? <RefreshCw size={18} className="text-white animate-spin" />
            : <Camera size={18} className="text-white" />
          }
        </div>
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={`absolute -bottom-1 -right-1 ${iconDim} rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center hover:bg-blue-500 transition-colors`}
      >
        <Camera size={10} className="text-white" />
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ── SectionCard ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ── SaveBar ────────────────────────────────────────────────────────────────

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-2">
      <span className="text-xs text-slate-500">
        {saved ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> Salvo com sucesso</span> : null}
      </span>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
      >
        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </div>
  );
}

// ── PerfilSection ──────────────────────────────────────────────────────────

function PerfilSection({ profile, userId, onSaved }: { profile: ProfileFull; userId: string; onSaved: (p: Partial<ProfileFull>) => void }) {
  const [f, setF] = useState({
    nome:         profile.nome         ?? "",
    nome_politico:profile.nome_politico ?? "",
    partido:      profile.partido      ?? "",
    cargo:        profile.cargo        ?? "",
    estado:       profile.estado       ?? "",
    municipio:    profile.municipio    ?? "",
    biografia:    profile.biografia    ?? "",
    site:         profile.site         ?? "",
    instagram:    profile.instagram    ?? "",
    facebook:     profile.facebook     ?? "",
    twitter:      profile.twitter      ?? "",
    youtube:      profile.youtube      ?? "",
    tiktok:       profile.tiktok       ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  function set(k: keyof typeof f, v: string) { setF((p) => ({ ...p, [k]: v })); setSaved(false); }

  async function save() {
    setSaving(true);
    const payload = {
      nome:          f.nome.trim() || null,
      nome_politico: f.nome_politico.trim() || null,
      partido:       f.partido || null,
      cargo:         f.cargo || null,
      estado:        f.estado.trim() || null,
      municipio:     f.municipio.trim() || null,
      biografia:     f.biografia.trim() || null,
      site:          f.site.trim() || null,
      instagram:     f.instagram.trim() || null,
      facebook:      f.facebook.trim() || null,
      twitter:       f.twitter.trim() || null,
      youtube:       f.youtube.trim() || null,
      tiktok:        f.tiktok.trim() || null,
    };
    await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    setSaved(true);
    onSaved(payload as Partial<ProfileFull>);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Foto de perfil">
        <div className="flex items-center gap-5">
          <AvatarUpload
            userId={userId}
            url={avatarUrl}
            nome={f.nome}
            field="avatar_url"
            onUploaded={(url) => setAvatarUrl(url)}
          />
          <div>
            <p className="text-sm font-medium text-slate-300">{f.nome || "Seu nome"}</p>
            <p className="text-xs text-slate-500 mt-0.5">JPG ou PNG, máx. 5 MB</p>
            <p className="text-xs text-slate-500 mt-0.5">Clique na foto para atualizar</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Dados pessoais">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome completo</label>
            <input className={inputCls} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: João da Silva" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome político</label>
            <input className={inputCls} value={f.nome_politico} onChange={(e) => set("nome_politico", e.target.value)} placeholder="Como é conhecido" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Partido</label>
            <div className="relative">
              <select className={selectCls} value={f.partido} onChange={(e) => set("partido", e.target.value)}>
                <option value="">Selecione</option>
                {PARTIDOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Cargo atual</label>
            <div className="relative">
              <select className={selectCls} value={f.cargo} onChange={(e) => set("cargo", e.target.value)}>
                <option value="">Selecione</option>
                {CARGOS_POLITICOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado de atuação</label>
            <input className={inputCls} value={f.estado} onChange={(e) => set("estado", e.target.value)} placeholder="Ex: São Paulo" maxLength={2} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Município</label>
            <input className={inputCls} value={f.municipio} onChange={(e) => set("municipio", e.target.value)} placeholder="Ex: São Paulo" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Biografia curta
            <span className="ml-1 text-slate-600">({f.biografia.length}/500)</span>
          </label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={4}
            maxLength={500}
            value={f.biografia}
            onChange={(e) => set("biografia", e.target.value)}
            placeholder="Breve apresentação para uso nos conteúdos…"
          />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Site pessoal</label>
          <input className={inputCls} value={f.site} onChange={(e) => set("site", e.target.value)} placeholder="https://seusite.com.br" type="url" />
        </div>
      </SectionCard>

      <SectionCard title="Redes sociais">
        <div className="space-y-3">
          {([
            { key: "instagram", icon: AtSign,  label: "Instagram",   ph: "@usuario" },
            { key: "facebook",  icon: Globe,   label: "Facebook",    ph: "usuario ou URL" },
            { key: "twitter",   icon: Hash,    label: "Twitter / X", ph: "@usuario" },
            { key: "youtube",   icon: Play,    label: "YouTube",     ph: "URL do canal" },
            { key: "tiktok",    icon: Music,   label: "TikTok",      ph: "@usuario" },
          ] as { key: keyof typeof f; icon: React.ElementType; label: string; ph: string }[]).map(({ key, icon: Icon, label, ph }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input className={inputCls} value={f[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

// ── TomVozSection ──────────────────────────────────────────────────────────

function TomVozSection({ profile, userId, onSaved }: { profile: ProfileFull; userId: string; onSaved: (p: Partial<ProfileFull>) => void }) {
  const [tomVoz,     setTomVoz]     = useState(profile.tom_voz ?? "");
  const [estilos,    setEstilos]    = useState<string[]>(profile.estilos_comunicacao ?? []);
  const [textoRef,   setTextoRef]   = useState(profile.texto_referencia ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function toggleEstilo(e: string) {
    setEstilos((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const payload = {
      tom_voz:             tomVoz || null,
      estilos_comunicacao: estilos,
      texto_referencia:    textoRef.trim() || null,
    };
    await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    setSaved(true);
    onSaved(payload as Partial<ProfileFull>);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Tom de voz">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOM_VOZ_OPT.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTomVoz(t.value); setSaved(false); }}
              className={`p-4 rounded-xl border text-left transition-all ${
                tomVoz === t.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-700 hover:border-slate-500 bg-slate-800/30"
              }`}
            >
              <p className={`text-sm font-semibold mb-1 ${tomVoz === t.value ? "text-blue-400" : "text-slate-300"}`}>{t.label}</p>
              <p className="text-xs text-slate-500">{t.desc}</p>
              {tomVoz === t.value && <Check size={14} className="text-blue-400 mt-2" />}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Estilo de comunicação">
        <p className="text-xs text-slate-500 mb-4">Selecione todos que se aplicam ao seu estilo:</p>
        <div className="flex flex-wrap gap-2">
          {ESTILOS_OPT.map((e) => {
            const active = estilos.includes(e);
            return (
              <button
                key={e}
                type="button"
                onClick={() => toggleEstilo(e)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  active
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                {active && <Check size={11} className="inline mr-1" />}
                {e}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Texto de referência">
        <p className="text-xs text-slate-500 mb-3">
          Cole um exemplo do seu estilo de escrita. A IA vai usar isso para calibrar o tom automaticamente no Estúdio de Conteúdo.
        </p>
        <textarea
          className={`${inputCls} resize-none`}
          rows={6}
          value={textoRef}
          onChange={(e) => { setTextoRef(e.target.value); setSaved(false); }}
          placeholder="Cole aqui um post, discurso ou texto seu que representa bem seu estilo…"
        />
      </SectionCard>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

// ── GabineteSection ────────────────────────────────────────────────────────

function GabineteSection({ profile, userId, onSaved }: { profile: ProfileFull; userId: string; onSaved: (p: Partial<ProfileFull>) => void }) {
  const [f, setF] = useState({
    nome_gabinete:      profile.nome_gabinete      ?? "",
    endereco_gabinete:  profile.endereco_gabinete  ?? "",
    telefone_gabinete:  profile.telefone_gabinete  ?? "",
    email_gabinete:     profile.email_gabinete     ?? "",
    horario_gabinete:   profile.horario_gabinete   ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [fotoUrl, setFotoUrl] = useState(profile.foto_gabinete_url);

  function set(k: keyof typeof f, v: string) { setF((p) => ({ ...p, [k]: v })); setSaved(false); }

  async function save() {
    setSaving(true);
    const payload = {
      nome_gabinete:     f.nome_gabinete.trim()     || null,
      endereco_gabinete: f.endereco_gabinete.trim() || null,
      telefone_gabinete: f.telefone_gabinete.trim() || null,
      email_gabinete:    f.email_gabinete.trim()    || null,
      horario_gabinete:  f.horario_gabinete.trim()  || null,
    };
    await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    setSaved(true);
    onSaved(payload as Partial<ProfileFull>);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Foto do gabinete">
        <div className="flex items-center gap-5">
          <AvatarUpload
            userId={userId}
            url={fotoUrl}
            nome={f.nome_gabinete || "Gabinete"}
            field="foto_gabinete_url"
            onUploaded={(url) => setFotoUrl(url)}
          />
          <div>
            <p className="text-sm font-medium text-slate-300">{f.nome_gabinete || "Nome do gabinete"}</p>
            <p className="text-xs text-slate-500 mt-0.5">Clique na imagem para atualizar</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Dados do gabinete">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do gabinete</label>
            <input className={inputCls} value={f.nome_gabinete} onChange={(e) => set("nome_gabinete", e.target.value)} placeholder="Ex: Gabinete do Vereador João" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Endereço completo</label>
            <input className={inputCls} value={f.endereco_gabinete} onChange={(e) => set("endereco_gabinete", e.target.value)} placeholder="Rua, número, bairro, cidade — UF" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefone de atendimento</label>
              <input className={inputCls} value={f.telefone_gabinete} onChange={(e) => set("telefone_gabinete", e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email de atendimento</label>
              <input className={inputCls} type="email" value={f.email_gabinete} onChange={(e) => set("email_gabinete", e.target.value)} placeholder="atendimento@gabinete.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Horário de funcionamento</label>
            <input className={inputCls} value={f.horario_gabinete} onChange={(e) => set("horario_gabinete", e.target.value)} placeholder="Ex: Seg-Sex das 09h às 18h" />
          </div>
        </div>
      </SectionCard>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

// ── NotificacoesSection ────────────────────────────────────────────────────

function NotificacoesSection({ profile, userId, onSaved }: { profile: ProfileFull; userId: string; onSaved: (p: Partial<ProfileFull>) => void }) {
  const [notifDemandas, setNotifDemandas] = useState(profile.notif_demandas ?? true);
  const [notifResumo,   setNotifResumo]   = useState(profile.notif_resumo   ?? true);
  const [notifPautas,   setNotifPautas]   = useState(profile.notif_pautas   ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    setSaving(true);
    const payload = {
      notif_demandas: notifDemandas,
      notif_resumo:   notifResumo,
      notif_pautas:   notifPautas,
    };
    await supabase.from("profiles").update(payload).eq("id", userId);
    setSaving(false);
    setSaved(true);
    onSaved(payload as Partial<ProfileFull>);
    setTimeout(() => setSaved(false), 3000);
  }

  const items = [
    {
      label:   "Nova demanda",
      desc:    "Receba um email quando um eleitor registrar uma nova demanda.",
      value:   notifDemandas,
      onChange: (v: boolean) => { setNotifDemandas(v); setSaved(false); },
    },
    {
      label:   "Resumo semanal",
      desc:    "Relatório de atividades toda segunda-feira às 8h.",
      value:   notifResumo,
      onChange: (v: boolean) => { setNotifResumo(v); setSaved(false); },
    },
    {
      label:   "Alertas de pautas",
      desc:    "Seja notificado quando uma pauta legislativa relevante for detectada.",
      value:   notifPautas,
      onChange: (v: boolean) => { setNotifPautas(v); setSaved(false); },
    },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Preferências de email">
        <div className="space-y-4">
          {items.map(({ label, desc, value, onChange }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-300">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={value} onChange={onChange} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}

// ── SegurancaSection ───────────────────────────────────────────────────────

function SegurancaSection({ userEmail }: { userEmail: string }) {
  const [senhaAtual,   setSenhaAtual]   = useState("");
  const [novaSenha,    setNovaSenha]    = useState("");
  const [confirmar,    setConfirmar]    = useState("");
  const [showSenha,    setShowSenha]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [revoking,     setRevoking]     = useState(false);
  const [revokeMsg,    setRevokeMsg]    = useState<string | null>(null);

  async function handleChangePwd() {
    setError(null);
    if (!senhaAtual) { setError("Informe a senha atual."); return; }
    if (novaSenha.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmar) { setError("As senhas não conferem."); return; }

    setLoading(true);

    // Re-authenticate with current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: senhaAtual,
    });
    if (signInErr) { setError("Senha atual incorreta."); setLoading(false); return; }

    const { error: updateErr } = await supabase.auth.updateUser({ password: novaSenha });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setSuccess("Senha alterada com sucesso.");
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
      setTimeout(() => setSuccess(null), 4000);
    }
  }

  async function handleRevokeSessions() {
    setRevoking(true);
    await supabase.auth.signOut({ scope: "others" });
    setRevoking(false);
    setRevokeMsg("Todas as outras sessões foram encerradas.");
    setTimeout(() => setRevokeMsg(null), 4000);
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Trocar senha">
        {error   && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>}
        {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">{success}</p>}
        <div className="space-y-4">
          {[
            { label: "Senha atual",        val: senhaAtual, set: setSenhaAtual },
            { label: "Nova senha",         val: novaSenha,  set: setNovaSenha  },
            { label: "Confirmar nova senha", val: confirmar, set: setConfirmar  },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  className={`${inputCls} pr-10`}
                  value={val}
                  onChange={(e) => { set(e.target.value); setError(null); }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={handleChangePwd}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
            {loading ? "Alterando…" : "Alterar senha"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Sessões ativas">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-300">Encerrar outras sessões</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Revoga o acesso em todos os dispositivos, exceto o atual.
            </p>
            {revokeMsg && <p className="text-xs text-emerald-400 mt-1">{revokeMsg}</p>}
          </div>
          <button
            onClick={handleRevokeSessions}
            disabled={revoking}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {revoking ? <RefreshCw size={12} className="animate-spin" /> : <LogOut size={12} />}
            Revogar
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ── PlanoSection ───────────────────────────────────────────────────────────

function PlanoSection({ profile }: { profile: ProfileFull }) {
  const plano = profile.plano ?? "solo";
  const info  = PLANO_FEATURES[plano] ?? PLANO_FEATURES.solo;

  const PLANO_COLOR: Record<string, string> = {
    trial:    "from-slate-600 to-slate-700",
    solo:     "from-blue-600 to-indigo-700",
    assessor: "from-purple-600 to-violet-700",
    gabinete: "from-emerald-600 to-teal-700",
  };

  const nextPlano: Record<string, string | null> = {
    trial: "solo", solo: "assessor", assessor: "gabinete", gabinete: null,
  };
  const upgradeTo = nextPlano[plano];

  return (
    <div className="space-y-5">
      <SectionCard title="Plano atual">
        <div className={`bg-gradient-to-br ${PLANO_COLOR[plano]} rounded-2xl p-6 mb-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Plano ativo</p>
              <p className="text-3xl font-black text-white">{info.label}</p>
              <p className="text-lg font-semibold text-white/80 mt-1">{PLANO_PRICE[plano]}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <CreditCard size={22} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/70">
              Membro desde {fmtDate(profile.created_at)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Incluído no plano</p>
          {info.features.map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </SectionCard>

      {upgradeTo && (
        <SectionCard title="Fazer upgrade">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300">
                Plano {PLANO_FEATURES[upgradeTo].label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {PLANO_FEATURES[upgradeTo].features.join(" · ")}
              </p>
            </div>
            <a
              href="https://kiwify.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              Fazer upgrade
            </a>
          </div>
        </SectionCard>
      )}

      {plano === "gabinete" && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">Você está no plano mais completo do Gabinete Pro.</p>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "perfil",        label: "Perfil",          icon: User        },
  { id: "tom-voz",       label: "Tom de voz",       icon: Mic2        },
  { id: "gabinete",      label: "Gabinete",         icon: Building2   },
  { id: "notificacoes",  label: "Notificações",     icon: Bell        },
  { id: "seguranca",     label: "Segurança",        icon: Shield      },
  { id: "plano",         label: "Plano",            icon: CreditCard  },
];

export default function ConfiguracoesPage() {
  const { user, profile: authProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("perfil");
  const [profile, setProfile]     = useState<ProfileFull | null>(null);
  const [loading, setLoading]     = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(data as ProfileFull ?? { ...EMPTY_PROFILE, id: user.id, email: user.email ?? "", nome: "", plano: "solo", status: "ativo", created_at: new Date().toISOString() });
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  function mergeProfile(patch: Partial<ProfileFull>) {
    setProfile((p) => p ? { ...p, ...patch } : p);
  }

  if (loading || !profile) {
    return (
      <AppShell title="Configurações">
        <div className="flex items-center justify-center py-24">
          <RefreshCw size={24} className="text-slate-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const userId    = user?.id ?? "";
  const userEmail = user?.email ?? authProfile?.email ?? "";

  return (
    <AppShell title="Configurações" subtitle="Gerencie seu perfil, gabinete e preferências">
      <div className="flex gap-6">
        {/* Sidebar navigation */}
        <aside className="hidden lg:flex flex-col gap-1 w-44 flex-shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeTab === id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 w-full mb-2 flex-shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "perfil"       && <PerfilSection       profile={profile} userId={userId} onSaved={mergeProfile} />}
          {activeTab === "tom-voz"      && <TomVozSection       profile={profile} userId={userId} onSaved={mergeProfile} />}
          {activeTab === "gabinete"     && <GabineteSection     profile={profile} userId={userId} onSaved={mergeProfile} />}
          {activeTab === "notificacoes" && <NotificacoesSection profile={profile} userId={userId} onSaved={mergeProfile} />}
          {activeTab === "seguranca"    && <SegurancaSection    userEmail={userEmail} />}
          {activeTab === "plano"        && <PlanoSection        profile={profile} />}
        </div>
      </div>
    </AppShell>
  );
}
