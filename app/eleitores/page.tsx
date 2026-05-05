"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  UserPlus, Search, Download, Upload, Users, BarChart2,
  List, X, RefreshCw, Eye, Edit2, Tag, ChevronDown,
  CheckSquare, Square, ChevronLeft, ChevronRight, Filter,
  AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import AppShell from "@/components/layout/AppShell";
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
  votou_antes: string | null;
  intencao_voto: string | null;
  engajamento: string | null;
  temas_interesse: string[] | null;
  aceita_comunicados: boolean;
  preferencia_contato: string | null;
  observacoes: string | null;
  tags: string[] | null;
  status: string;
  created_at: string;
}

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  data_nascimento: string;
  genero: string;
  profissao: string;
  escolaridade: string;
  faixa_renda: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  como_conheceu: string;
  votou_antes: string;
  intencao_voto: string;
  engajamento: string;
  temas_interesse: string[];
  aceita_comunicados: boolean;
  preferencia_contato: string;
  observacoes: string;
  tags: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const GENERO_OPTIONS     = ["Masculino", "Feminino", "Outro", "Prefiro não dizer"];
const ESCOLARIDADE_OPT   = ["Fundamental", "Médio", "Superior", "Pós-graduação"];
const FAIXA_RENDA_OPT    = ["Até 1SM", "1-3SM", "3-5SM", "Acima de 5SM"];
const COMO_CONHECEU_OPT  = ["Indicação", "Evento", "Redes sociais", "Atendimento presencial", "Website", "Outro"];
const JA_VOTOU_OPT       = ["Sim", "Não", "Primeira vez"];
const INTENCAO_OPT       = ["Certo", "Provável", "Indeciso"];
const ENGAJAMENTO_OPT    = ["Apoiador passivo", "Ativo", "Multiplicador", "Liderança"];
const TEMAS_OPT          = ["Saúde", "Educação", "Segurança", "Infraestrutura", "Cultura", "Esporte", "Meio Ambiente", "Emprego"];
const PREF_CONTATO_OPT   = ["WhatsApp", "Email", "Telefone"];

const ENGAJAMENTO_BADGE: Record<string, string> = {
  "Apoiador passivo": "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  "Ativo":            "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Multiplicador":    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  "Liderança":        "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

const PIE_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"];

const IMPORT_FIELDS = [
  { key: "nome",       label: "Nome completo",   required: true  },
  { key: "email",      label: "Email",            required: false },
  { key: "telefone",   label: "Telefone",         required: false },
  { key: "whatsapp",   label: "WhatsApp",         required: false },
  { key: "bairro",     label: "Bairro",           required: false },
  { key: "cidade",     label: "Cidade",           required: false },
  { key: "uf",         label: "UF (2 letras)",    required: false },
  { key: "engajamento",label: "Engajamento",      required: false },
  { key: "observacoes", label: "Observação",       required: false },
];

const emptyForm: FormData = {
  nome: "", email: "", telefone: "", whatsapp: "",
  data_nascimento: "", genero: "", profissao: "",
  escolaridade: "", faixa_renda: "", cep: "", rua: "",
  numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  como_conheceu: "", votou_antes: "", intencao_voto: "",
  engajamento: "", temas_interesse: [], aceita_comunicados: false,
  preferencia_contato: "", observacoes: "", tags: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function maskCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getAgeRange(dn: string | null): string {
  if (!dn) return "N/I";
  const age = Math.floor((Date.now() - new Date(dn).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return "<18";
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  if (age < 65) return "55-64";
  return "65+";
}

function eleitorToForm(e: Eleitor): FormData {
  return {
    nome:                e.nome,
    email:               e.email ?? "",
    telefone:            e.telefone ?? "",
    whatsapp:            e.whatsapp ?? "",
    data_nascimento:     e.data_nascimento ?? "",
    genero:              e.genero ?? "",
    profissao:           e.profissao ?? "",
    escolaridade:        e.escolaridade ?? "",
    faixa_renda:         e.faixa_renda ?? "",
    cep:                 e.cep ?? "",
    rua:                 e.rua ?? "",
    numero:              e.numero ?? "",
    complemento:         e.complemento ?? "",
    bairro:              e.bairro ?? "",
    cidade:              e.cidade ?? "",
    uf:                  e.uf ?? "",
    como_conheceu:       e.como_conheceu ?? "",
    votou_antes:         e.votou_antes ?? "",
    intencao_voto:       e.intencao_voto ?? "",
    engajamento:         e.engajamento ?? "",
    temas_interesse:     e.temas_interesse ?? [],
    aceita_comunicados:  e.aceita_comunicados ?? false,
    preferencia_contato: e.preferencia_contato ?? "",
    observacoes:          e.observacoes ?? "",
    tags:                e.tags ?? [],
  };
}

function buildPayload(f: FormData, userId: string) {
  return {
    user_id:              userId,
    nome:                 f.nome.trim(),
    email:                f.email || null,
    telefone:             f.telefone || null,
    whatsapp:             f.whatsapp || null,
    data_nascimento:      f.data_nascimento || null,
    genero:               f.genero || null,
    profissao:            f.profissao || null,
    escolaridade:         f.escolaridade || null,
    faixa_renda:          f.faixa_renda || null,
    cep:                  f.cep || null,
    rua:                  f.rua || null,
    numero:               f.numero || null,
    complemento:          f.complemento || null,
    bairro:               f.bairro || null,
    cidade:               f.cidade || null,
    uf:                   f.uf || null,
    como_conheceu:        f.como_conheceu || null,
    votou_antes:          f.votou_antes || null,
    intencao_voto:        f.intencao_voto || null,
    engajamento:          f.engajamento || null,
    temas_interesse:      f.temas_interesse,
    aceita_comunicados:   f.aceita_comunicados,
    preferencia_contato:  f.preferencia_contato || null,
    observacoes:           f.observacoes || null,
    tags:                 f.tags,
    status:               "ativo",
  };
}

// ── Shared select/input classes ────────────────────────────────────────────

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors";
const selectCls = `${inputCls} appearance-none`;

// ── EleitorFormModal ───────────────────────────────────────────────────────

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  editingEleitor: Eleitor | null;
  userId: string;
  onSaved: () => void;
}

function EleitorFormModal({ open, onClose, editingEleitor, userId, onSaved }: FormModalProps) {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData(editingEleitor ? eleitorToForm(editingEleitor) : emptyForm);
      setActiveTab(1);
      setTagInput("");
      setError(null);
    }
  }, [open, editingEleitor]);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTema(t: string) {
    setFormData((prev) => ({
      ...prev,
      temas_interesse: prev.temas_interesse.includes(t)
        ? prev.temas_interesse.filter((x) => x !== t)
        : [...prev.temas_interesse, t],
    }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !formData.tags.includes(t)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));
  }

  async function handleCepChange(raw: string) {
    const masked = maskCep(raw);
    set("cep", masked);
    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      setFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            rua:    data.logradouro ?? prev.rua,
            bairro: data.bairro     ?? prev.bairro,
            cidade: data.localidade ?? prev.cidade,
            uf:     data.uf         ?? prev.uf,
          }));
        }
      } catch { /* ignore */ }
      finally { setFetchingCep(false); }
    }
  }

  async function handleSave() {
    if (!formData.nome.trim()) { setError("Nome é obrigatório."); setActiveTab(1); return; }
    setSaving(true);
    setError(null);
    const payload = buildPayload(formData, userId);
    const { error: dbErr } = editingEleitor
      ? await supabase.from("eleitores").update(payload).eq("id", editingEleitor.id)
      : await supabase.from("eleitores").insert(payload);
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onSaved();
    onClose();
  }

  if (!open) return null;

  const tabs = ["Dados pessoais ✱", "Endereço", "Perfil político", "Tags & Obs."];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-base font-semibold text-slate-100">
            {editingEleitor ? "Editar eleitor" : "Novo eleitor"}
          </h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6 shrink-0">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i + 1)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === i + 1
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {i + 1}. {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Tab 1 — Dados pessoais */}
          {activeTab === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 -mt-1 mb-1">
                <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                  ✱ Apenas esta aba é obrigatória. As demais (Endereço, Perfil político, Tags) são opcionais — você pode salvar agora e completar depois.
                </p>
              </div>
              <div className="col-span-2">
                <label className="label">Nome completo *</label>
                <input className={inputCls} value={formData.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className={inputCls} value={formData.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className={inputCls} value={formData.telefone} onChange={e => set("telefone", maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="label">WhatsApp</label>
                <input className={inputCls} value={formData.whatsapp} onChange={e => set("whatsapp", maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="label">Data de nascimento</label>
                <input type="date" className={inputCls} value={formData.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} />
              </div>
              <div>
                <label className="label">Gênero</label>
                <select className={selectCls} value={formData.genero} onChange={e => set("genero", e.target.value)}>
                  <option value="">Selecionar</option>
                  {GENERO_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Profissão</label>
                <input className={inputCls} value={formData.profissao} onChange={e => set("profissao", e.target.value)} placeholder="Ex: Professor" />
              </div>
              <div>
                <label className="label">Escolaridade</label>
                <select className={selectCls} value={formData.escolaridade} onChange={e => set("escolaridade", e.target.value)}>
                  <option value="">Selecionar</option>
                  {ESCOLARIDADE_OPT.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Faixa de renda</label>
                <select className={selectCls} value={formData.faixa_renda} onChange={e => set("faixa_renda", e.target.value)}>
                  <option value="">Selecionar</option>
                  {FAIXA_RENDA_OPT.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Tab 2 — Endereço */}
          {activeTab === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">CEP {fetchingCep && <span className="text-slate-500 text-xs ml-1">(buscando...)</span>}</label>
                <input className={inputCls} value={formData.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" />
              </div>
              <div>
                <label className="label">Número</label>
                <input className={inputCls} value={formData.numero} onChange={e => set("numero", e.target.value)} placeholder="123" />
              </div>
              <div className="col-span-2">
                <label className="label">Rua / Logradouro</label>
                <input className={inputCls} value={formData.rua} onChange={e => set("rua", e.target.value)} placeholder="Rua das Flores" />
              </div>
              <div className="col-span-2">
                <label className="label">Complemento</label>
                <input className={inputCls} value={formData.complemento} onChange={e => set("complemento", e.target.value)} placeholder="Apto 12, Bloco B" />
              </div>
              <div>
                <label className="label">Bairro</label>
                <input className={inputCls} value={formData.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Centro" />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className={inputCls} value={formData.cidade} onChange={e => set("cidade", e.target.value)} placeholder="São Paulo" />
              </div>
              <div>
                <label className="label">Estado (UF)</label>
                <input className={inputCls} value={formData.uf} onChange={e => set("uf", e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
              </div>
            </div>
          )}

          {/* Tab 3 — Perfil político */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Como conheceu o político</label>
                  <select className={selectCls} value={formData.como_conheceu} onChange={e => set("como_conheceu", e.target.value)}>
                    <option value="">Selecionar</option>
                    {COMO_CONHECEU_OPT.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Já votou no político?</label>
                  <select className={selectCls} value={formData.votou_antes} onChange={e => set("votou_antes", e.target.value)}>
                    <option value="">Selecionar</option>
                    {JA_VOTOU_OPT.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Intenção de voto</label>
                  <select className={selectCls} value={formData.intencao_voto} onChange={e => set("intencao_voto", e.target.value)}>
                    <option value="">Selecionar</option>
                    {INTENCAO_OPT.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nível de engajamento</label>
                  <select className={selectCls} value={formData.engajamento} onChange={e => set("engajamento", e.target.value)}>
                    <option value="">Selecionar</option>
                    {ENGAJAMENTO_OPT.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Preferência de contato</label>
                  <select className={selectCls} value={formData.preferencia_contato} onChange={e => set("preferencia_contato", e.target.value)}>
                    <option value="">Selecionar</option>
                    {PREF_CONTATO_OPT.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label mb-3 block">Temas de interesse ({formData.temas_interesse.length} selecionados)</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMAS_OPT.map((t) => {
                    const sel = formData.temas_interesse.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTema(t)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          sel
                            ? "bg-blue-600/20 border border-blue-500/50 text-blue-300"
                            : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {sel ? <CheckSquare size={14} className="text-blue-400 shrink-0" /> : <Square size={14} className="text-slate-500 shrink-0" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.aceita_comunicados}
                  onChange={e => set("aceita_comunicados", e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm text-slate-300">Aceita receber comunicados (LGPD)</span>
              </label>
            </div>
          )}

          {/* Tab 4 — Tags & observações */}
          {activeTab === 4 && (
            <div className="space-y-5">
              <div>
                <label className="label mb-2 block">Tags personalizadas</label>
                <div className="flex gap-2 mb-3">
                  <input
                    className={inputCls}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                    placeholder="Ex: liderança comunitária  (Enter para adicionar)"
                  />
                  <button onClick={addTag} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors whitespace-nowrap">
                    Adicionar
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                        #{t}
                        <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-blue-100">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label mb-2 block">Observações livres</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={6}
                  value={formData.observacoes}
                  onChange={e => set("observacoes", e.target.value)}
                  placeholder="Anotações, contexto, observações importantes sobre este eleitor..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 shrink-0">
          <div className="flex gap-2">
            {activeTab > 1 && (
              <button onClick={() => setActiveTab(activeTab - 1)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors">
                ← Anterior
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTab < 4 && (
              <button onClick={() => setActiveTab(activeTab + 1)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors">
                Próxima →
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              {editingEleitor ? "Salvar alterações" : "Cadastrar eleitor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ImportModal ────────────────────────────────────────────────────────────

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onImported: () => void;
}

function ImportModal({ open, onClose, userId, onImported }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileHeaders, setFileHeaders]   = useState<string[]>([]);
  const [fileRows, setFileRows]         = useState<string[][]>([]);
  const [columnMap, setColumnMap]       = useState<Record<string, string>>({});
  const [importing, setImporting]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [result, setResult]             = useState<{ success: number; errors: number } | null>(null);
  const [parseError, setParseError]     = useState<string | null>(null);

  useEffect(() => {
    if (open) { setFileHeaders([]); setFileRows([]); setColumnMap({}); setResult(null); setParseError(null); setProgress(0); }
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setFileHeaders([]);
    setFileRows([]);

    const isXlsx = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");
    const isCsv  = file.name.toLowerCase().endsWith(".csv");
    if (!isXlsx && !isCsv) { setParseError("Formato inválido. Use .xlsx, .xls ou .csv"); return; }

    try {
      if (isXlsx) {
        const buf = await file.arrayBuffer();
        const { read, utils } = await import("xlsx");
        const wb = read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = utils.sheet_to_json<any[]>(ws, { header: 1 });
        const headers = (rows[0] as string[]).map(String);
        const data = rows.slice(1).map(r => headers.map((_, i) => String(r[i] ?? "")));
        setFileHeaders(headers);
        setFileRows(data.slice(0, 5));
        // Auto-map matching headers
        const auto: Record<string, string> = {};
        IMPORT_FIELDS.forEach(f => {
          const match = headers.find(h => h.toLowerCase().includes(f.key) || h.toLowerCase() === f.label.toLowerCase());
          if (match) auto[f.key] = match;
        });
        setColumnMap(auto);
      } else {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
        const data = lines.slice(1).map(l => l.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
        setFileHeaders(headers);
        setFileRows(data.slice(0, 5));
        const auto: Record<string, string> = {};
        IMPORT_FIELDS.forEach(f => {
          const match = headers.find(h => h.toLowerCase().includes(f.key));
          if (match) auto[f.key] = match;
        });
        setColumnMap(auto);
      }
    } catch (err) {
      setParseError("Erro ao ler o arquivo. " + (err instanceof Error ? err.message : ""));
    }
  }

  async function handleImport() {
    if (!columnMap["nome"]) { setParseError("Mapeie pelo menos o campo Nome."); return; }
    setImporting(true);
    setProgress(20);

    const isXlsx = (fileRef.current?.files?.[0]?.name ?? "").toLowerCase().match(/\.xlsx?$/);
    const file   = fileRef.current?.files?.[0];
    if (!file) return;

    let allRows: string[][] = [];
    try {
      if (isXlsx) {
        const buf = await file.arrayBuffer();
        const { read, utils } = await import("xlsx");
        const wb = read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = utils.sheet_to_json<any[]>(ws, { header: 1 });
        const headers = (rows[0] as string[]).map(String);
        allRows = rows.slice(1).map(r => headers.map((_, i) => String(r[i] ?? "")));
      } else {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        allRows = lines.slice(1).map(l => l.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
      }
    } catch { setParseError("Erro ao processar arquivo."); setImporting(false); return; }

    setProgress(50);

    const getCol = (key: string, row: string[]) => {
      const col = columnMap[key];
      if (!col) return null;
      const idx = fileHeaders.indexOf(col);
      return idx >= 0 ? (row[idx] || null) : null;
    };

    const records = allRows
      .filter(row => getCol("nome", row)?.trim())
      .map(row => ({
        user_id:    userId,
        nome:       getCol("nome", row)!.trim(),
        email:      getCol("email", row) || null,
        telefone:   getCol("telefone", row) || null,
        whatsapp:   getCol("whatsapp", row) || null,
        bairro:     getCol("bairro", row) || null,
        cidade:     getCol("cidade", row) || null,
        uf:         getCol("uf", row)?.toUpperCase().slice(0, 2) || null,
        engajamento:getCol("engajamento", row) || null,
        observacoes: getCol("observacoes", row) || null,
        status:     "ativo",
        tags:       [] as string[],
        temas_interesse: [] as string[],
        aceita_comunicados: false,
      }));

    setProgress(75);

    // Batch insert in chunks of 50
    let success = 0, errors = 0;
    for (let i = 0; i < records.length; i += 50) {
      const { error } = await supabase.from("eleitores").insert(records.slice(i, i + 50));
      if (error) errors += Math.min(50, records.length - i);
      else success += Math.min(50, records.length - i);
    }

    setProgress(100);
    setResult({ success, errors });
    setImporting(false);
    if (success > 0) onImported();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-base font-semibold text-slate-100">Importar planilha</h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* File input */}
          <div>
            <label className="label mb-2 block">Arquivo (.xlsx, .xls ou .csv)</label>
            <div
              className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} className="mx-auto text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Clique para selecionar ou arraste o arquivo</p>
              <p className="text-xs text-slate-600 mt-1">.xlsx, .xls e .csv suportados</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {parseError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {parseError}
            </div>
          )}

          {/* Preview */}
          {fileRows.length > 0 && (
            <div>
              <p className="label mb-2 block">Prévia (primeiras 5 linhas)</p>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="text-xs text-slate-400 w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      {fileHeaders.map(h => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {fileRows.map((row, ri) => (
                      <tr key={ri} className="border-t border-slate-700/50">
                        {row.map((cell, ci) => <td key={ci} className="px-3 py-1.5 truncate max-w-32">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Column mapping */}
          {fileHeaders.length > 0 && !result && (
            <div>
              <p className="label mb-3 block">Mapeamento de colunas</p>
              <div className="space-y-2">
                {IMPORT_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-3">
                    <span className="text-sm text-slate-300 w-44 shrink-0">
                      {f.label}{f.required && " *"}
                    </span>
                    <select
                      value={columnMap[f.key] ?? ""}
                      onChange={e => setColumnMap(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className={`${selectCls} flex-1`}
                    >
                      <option value="">— Não importar —</option>
                      {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Importando...</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm space-y-1">
              <p className="text-emerald-400 font-semibold">✓ {result.success} eleitor{result.success !== 1 ? "es" : ""} importado{result.success !== 1 ? "s" : ""} com sucesso</p>
              {result.errors > 0 && <p className="text-red-400">✗ {result.errors} registro{result.errors !== 1 ? "s" : ""} com erro</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:bg-slate-800">
            {result ? "Fechar" : "Cancelar"}
          </button>
          {fileHeaders.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {importing && <RefreshCw size={13} className="animate-spin" />}
              Importar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DashboardView ──────────────────────────────────────────────────────────

interface DashboardData {
  total: number;
  multiplicadores: number;
  liderancas: number;
  indecisos: number;
  ativos: number;
  bairroData: { name: string; value: number }[];
  ageData: { name: string; value: number }[];
  intencaoData: { name: string; value: number }[];
  temasData: { name: string; value: number }[];
}

function DashboardView({ userId }: { userId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: rows } = await supabase
        .from("eleitores")
        .select("engajamento, intencao_voto, temas_interesse, data_nascimento, bairro")
        .eq("user_id", userId)
        .limit(2000);

      if (!rows) { setLoading(false); return; }

      const bairroMap: Record<string, number> = {};
      const ageMap: Record<string, number>    = {};
      const temasMap: Record<string, number>  = {};

      rows.forEach(r => {
        if (r.bairro) bairroMap[r.bairro] = (bairroMap[r.bairro] || 0) + 1;
        const ag = getAgeRange(r.data_nascimento);
        ageMap[ag] = (ageMap[ag] || 0) + 1;
        (r.temas_interesse ?? []).forEach((t: string) => { temasMap[t] = (temasMap[t] || 0) + 1; });
      });

      setData({
        total:           rows.length,
        multiplicadores: rows.filter(r => r.engajamento === "Multiplicador").length,
        liderancas:      rows.filter(r => r.engajamento === "Liderança").length,
        indecisos:       rows.filter(r => r.intencao_voto === "Indeciso").length,
        ativos:          rows.filter(r => r.engajamento === "Ativo").length,
        bairroData: Object.entries(bairroMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value })),
        ageData:    ["<18","18-24","25-34","35-44","45-54","55-64","65+","N/I"].map(name => ({ name, value: ageMap[name] || 0 })).filter(d => d.value > 0),
        intencaoData: ["Certo","Provável","Indeciso"].map(name => ({ name, value: rows.filter(r => r.intencao_voto === name).length })).filter(d => d.value > 0),
        temasData: Object.entries(temasMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })),
      });
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const statCards = [
    { label: "Total cadastrado",    value: data.total,           color: "text-white" },
    { label: "Multiplicadores",     value: data.multiplicadores, color: "text-emerald-400" },
    { label: "Lideranças",          value: data.liderancas,      color: "text-purple-400" },
    { label: "Ativos",              value: data.ativos,          color: "text-blue-400" },
    { label: "Indecisos",           value: data.indecisos,       color: "text-amber-400" },
  ];

  const tooltipStyle = { background: "#1E293B", border: "1px solid #1E3A5F", borderRadius: "8px", fontSize: 12 };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-center">
            <p className={`text-3xl font-extrabold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Por bairro */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Top 5 bairros</h3>
          {data.bairroData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.bairroData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#10B981" }} />
                <Bar dataKey="value" name="Eleitores" fill="url(#grad1)" radius={[4,4,0,0]}>
                  <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-12">Sem dados de bairro</p>}
        </div>

        {/* Intenção de voto */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Intenção de voto</h3>
          {data.intencaoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.intencaoData} cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name">
                  {data.intencaoData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-12">Sem dados de intenção de voto</p>}
        </div>

        {/* Por faixa etária */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Faixa etária</h3>
          {data.ageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.ageData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#8B5CF6" }} />
                <Bar dataKey="value" name="Eleitores" fill="#8B5CF6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-12">Sem dados de nascimento</p>}
        </div>

        {/* Temas de interesse */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Temas de interesse</h3>
          {data.temasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.temasData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#10B981" }} />
                <Bar dataKey="value" name="Eleitores" fill="#10B981" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-12">Sem dados de temas</p>}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-t border-slate-700/50">
      {[40, 28, 24, 20, 28, 32, 20].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 w-${w} rounded bg-slate-700/60 animate-pulse`} />
        </td>
      ))}
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function EleitoresPage() {
  const { user, loading: authLoading } = useAuth();

  // View
  const [view, setView] = useState<"list" | "dashboard">("list");

  // List state
  const [eleitores, setEleitores] = useState<Eleitor[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState<"nome" | "created_at">("created_at");
  const [filterCidade, setFilterCidade]     = useState("");
  const [filterEngajamento, setFilterEngaj] = useState("");
  const [filterIntencao, setFilterIntencao] = useState("");
  const [filterTema, setFilterTema]         = useState("");
  const [cidades, setCidades]               = useState<string[]>([]);
  const [showFilters, setShowFilters]       = useState(false);
  const [exporting, setExporting]           = useState(false);

  // Modals
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEleitor, setEditingEleitor]   = useState<Eleitor | null>(null);

  // ── Load data ──────────────────────────────────────────────────

  const loadEleitores = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let q = supabase
      .from("eleitores")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (search) q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%,bairro.ilike.%${search}%,telefone.ilike.%${search}%`);
    if (filterCidade)     q = q.ilike("cidade", filterCidade);
    if (filterEngajamento) q = q.eq("engajamento", filterEngajamento);
    if (filterIntencao)   q = q.eq("intencao_voto", filterIntencao);
    if (filterTema)       q = q.contains("temas_interesse", [filterTema]);

    q = q.order(sortBy, { ascending: sortBy === "nome" }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await q;
    setEleitores((data as Eleitor[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [user, page, search, sortBy, filterCidade, filterEngajamento, filterIntencao, filterTema]);

  const loadCidades = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("eleitores").select("cidade").eq("user_id", user.id).not("cidade", "is", null);
    const unique = Array.from(new Set((data ?? []).map((d: { cidade: string | null }) => d.cidade).filter(Boolean) as string[])).sort();
    setCidades(unique);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) { loadEleitores(); loadCidades(); }
  }, [authLoading, user, loadEleitores, loadCidades]);

  // Check for ?editId= param on mount
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("editId");
    if (editId) {
      supabase.from("eleitores").select("*").eq("id", editId).eq("user_id", user.id).single()
        .then(({ data }) => { if (data) setEditingEleitor(data as Eleitor); });
    }
  }, [user]);

  // ── Export ─────────────────────────────────────────────────────

  async function handleExport() {
    if (!user) return;
    setExporting(true);

    let q = supabase.from("eleitores").select("*").eq("user_id", user.id);
    if (search) q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%,bairro.ilike.%${search}%`);
    if (filterCidade)      q = q.ilike("cidade", filterCidade);
    if (filterEngajamento) q = q.eq("engajamento", filterEngajamento);
    if (filterIntencao)    q = q.eq("intencao_voto", filterIntencao);
    if (filterTema)        q = q.contains("temas_interesse", [filterTema]);

    const { data } = await q.order("created_at", { ascending: false });
    const rows = (data as Eleitor[]) ?? [];

    const headers = ["Nome","Email","Telefone","WhatsApp","Nascimento","Gênero","Profissão","Escolaridade","Renda","CEP","Rua","Número","Complemento","Bairro","Cidade","UF","Como Conheceu","Já Votou","Intenção","Engajamento","Temas","Aceita Comunicados","Pref. Contato","Tags","Observação","Cadastro"];
    const lines = rows.map(e =>
      [e.nome, e.email??'', e.telefone??'', e.whatsapp??'', e.data_nascimento??'', e.genero??'', e.profissao??'',
       e.escolaridade??'', e.faixa_renda??'', e.cep??'', e.rua??'', e.numero??'', e.complemento??'',
       e.bairro??'', e.cidade??'', e.uf??'', e.como_conheceu??'', e.votou_antes??'', e.intencao_voto??'',
       e.engajamento??'', (e.temas_interesse??[]).join(';'), e.aceita_comunicados?'Sim':'Não',
       e.preferencia_contato??'', (e.tags??[]).join(';'), e.observacoes??'', fmtDate(e.created_at),
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
    );

    const csv  = "﻿" + [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `eleitores-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  // ── Render ─────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const headerRight = (
    <div className="flex items-center gap-2">
      <button onClick={() => setView("list")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}>
        <List size={14} />Lista
      </button>
      <button onClick={() => setView("dashboard")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "dashboard" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}>
        <BarChart2 size={14} />Dashboard
      </button>
    </div>
  );

  return (
    <AppShell title="CRM de Eleitores" subtitle="Gerencie e segmente sua base eleitoral" headerRight={headerRight}>

      {view === "dashboard" && user ? (
        <DashboardView userId={user.id} />
      ) : (
        <div className="space-y-4">
          {/* Stats strip */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">{total.toLocaleString("pt-BR")}</span>
              <span className="text-sm text-slate-400">eleitores</span>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setShowImportModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <Upload size={13} />Importar
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || total === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-40"
              >
                {exporting ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                Exportar CSV
              </button>
              <button
                onClick={() => { setEditingEleitor(null); setShowAddModal(true); }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:opacity-90 transition-opacity"
              >
                <UserPlus size={13} />Novo eleitor
              </button>
            </div>
          </div>

          {/* Search & filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Buscar por nome, email, bairro ou telefone..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative">
              <select value={sortBy} onChange={e => { setSortBy(e.target.value as "nome" | "created_at"); setPage(0); }} className={`${selectCls} pr-8 text-xs`}>
                <option value="created_at">Mais recentes</option>
                <option value="nome">Nome A-Z</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${showFilters ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-slate-700 text-slate-400 hover:text-slate-200"}`}
            >
              <Filter size={13} />Filtros
              {(filterCidade || filterEngajamento || filterIntencao || filterTema) && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
              <div className="relative">
                <select value={filterCidade} onChange={e => { setFilterCidade(e.target.value); setPage(0); }} className={`${selectCls} text-xs pr-7`}>
                  <option value="">Todas as cidades</option>
                  {cidades.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterEngajamento} onChange={e => { setFilterEngaj(e.target.value); setPage(0); }} className={`${selectCls} text-xs pr-7`}>
                  <option value="">Engajamento</option>
                  {ENGAJAMENTO_OPT.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterIntencao} onChange={e => { setFilterIntencao(e.target.value); setPage(0); }} className={`${selectCls} text-xs pr-7`}>
                  <option value="">Intenção de voto</option>
                  {INTENCAO_OPT.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterTema} onChange={e => { setFilterTema(e.target.value); setPage(0); }} className={`${selectCls} text-xs pr-7`}>
                  <option value="">Tema de interesse</option>
                  {TEMAS_OPT.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              {(filterCidade || filterEngajamento || filterIntencao || filterTema) && (
                <button
                  onClick={() => { setFilterCidade(""); setFilterEngaj(""); setFilterIntencao(""); setFilterTema(""); setPage(0); }}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2"
                >
                  <X size={12} />Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Table */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/80">
                  <tr>
                    {["Nome", "Telefone", "Bairro", "Cidade", "Engajamento", "Tags", "Cadastro", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    : eleitores.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
                              <Users size={22} className="text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-sm">Nenhum eleitor encontrado</p>
                            <button
                              onClick={() => { setEditingEleitor(null); setShowAddModal(true); }}
                              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                            >
                              <UserPlus size={13} />Cadastrar primeiro eleitor
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                    : eleitores.map(e => (
                      <tr key={e.id} className="border-t border-slate-700/40 hover:bg-slate-700/20 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600/30 to-emerald-500/30 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-blue-300">{e.nome.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-200 truncate max-w-40">{e.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{e.telefone ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{e.bairro ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{e.cidade ?? "—"}</td>
                        <td className="px-4 py-3">
                          {e.engajamento
                            ? <span className={`text-xs px-2 py-0.5 rounded-full ${ENGAJAMENTO_BADGE[e.engajamento] ?? "bg-slate-500/20 text-slate-400"}`}>{e.engajamento}</span>
                            : <span className="text-slate-600 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {(e.tags ?? []).slice(0, 2).map(t => (
                              <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400 flex items-center gap-0.5">
                                <Tag size={9} />#{t}
                              </span>
                            ))}
                            {(e.tags ?? []).length > 2 && (
                              <span className="text-xs text-slate-600">+{(e.tags!).length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/eleitores/${e.id}`} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors" title="Ver perfil">
                              <Eye size={14} />
                            </Link>
                            <button onClick={() => setEditingEleitor(e)} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors" title="Editar">
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pg = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded text-xs font-medium transition-colors ${pg === page ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700"}`}>
                      {pg + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {user && (
        <>
          <EleitorFormModal
            open={showAddModal || editingEleitor !== null}
            onClose={() => { setShowAddModal(false); setEditingEleitor(null); }}
            editingEleitor={editingEleitor}
            userId={user.id}
            onSaved={() => { loadEleitores(); loadCidades(); }}
          />
          <ImportModal
            open={showImportModal}
            onClose={() => setShowImportModal(false)}
            userId={user.id}
            onImported={() => { loadEleitores(); loadCidades(); }}
          />
        </>
      )}
    </AppShell>
  );
}
