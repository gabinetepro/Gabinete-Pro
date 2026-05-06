"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PoliticoProfile {
  id: string;
  nome: string;
  nome_politico: string | null;
  cargo: string | null;
  partido: string | null;
  municipio: string | null;
  estado: string | null;
  foto_url: string | null;
  avatar_url: string | null;
  nome_gabinete: string | null;
  slug: string | null;
}

interface Demanda {
  id: string;
  descricao: string | null;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  aberta:       { label: "Aberta",        cls: "bg-yellow-100 text-yellow-800" },
  em_andamento: { label: "Em andamento",  cls: "bg-blue-100 text-blue-800"    },
  resolvida:    { label: "Resolvida",     cls: "bg-green-100 text-green-800"  },
};

function initials(nome: string) {
  return nome.trim().split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

export default function PublicPageClient({
  perfil,
  demandas,
}: {
  perfil: PoliticoProfile;
  demandas: Demanda[];
}) {
  const [nome,      setNome]      = useState("");
  const [telefone,  setTelefone]  = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviado,   setEnviado]   = useState(false);
  const [enviando,  setEnviando]  = useState(false);
  const [erro,      setErro]      = useState<string | null>(null);

  const nomePolitico = perfil.nome_politico ?? perfil.nome;
  const localidade   = [perfil.municipio, perfil.estado].filter(Boolean).join(", ");
  const fotoUrl      = perfil.foto_url ?? perfil.avatar_url;

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim())      { setErro("Seu nome é obrigatório."); return; }
    if (!descricao.trim()) { setErro("Descreva sua demanda."); return; }
    setEnviando(true);
    setErro(null);
    const { error: insertErr } = await supabase.from("demandas").insert({
      user_id:              perfil.id,
      nome_solicitante:     nome.trim(),
      telefone_solicitante: telefone || null,
      descricao:            descricao.trim(),
      status:               "aberta",
    });
    setEnviando(false);
    if (insertErr) {
      setErro("Erro ao enviar. Por favor, tente novamente.");
      return;
    }
    setEnviado(true);
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-500 p-8 text-center text-white">
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt={nomePolitico} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-white/30 shadow-lg" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 ring-4 ring-white/30 shadow-lg">
            {initials(nomePolitico)}
          </div>
        )}
        <h1 className="text-3xl font-bold">{nomePolitico}</h1>
        {perfil.cargo && <p className="text-blue-100 mt-1 font-semibold">{perfil.cargo}</p>}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
          {perfil.partido && (
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">
              {perfil.partido}
            </span>
          )}
          {localidade && (
            <span className="text-xs bg-white/10 text-blue-100 px-3 py-1 rounded-full">
              📍 {localidade}
            </span>
          )}
        </div>
        <p className="text-blue-100 mt-4 text-sm">Canal oficial de atendimento ao cidadão</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 py-8">
        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📝 {perfil.nome_gabinete ?? "Enviar uma demanda"}
          </h2>
          {enviado ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-green-600 font-semibold text-lg">Demanda enviada com sucesso!</p>
              <p className="text-gray-500 text-sm mt-1">Acompanhe o status abaixo.</p>
              <button
                onClick={() => { setEnviado(false); setNome(""); setTelefone(""); setDescricao(""); }}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Enviar outra demanda
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviar} className="space-y-4">
              {erro && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                  {erro}
                </p>
              )}
              <input
                type="text"
                placeholder="Seu nome completo *"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErro(null); }}
                required
                className={inputCls}
              />
              <input
                type="tel"
                placeholder="Seu telefone / WhatsApp"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={inputCls}
              />
              <textarea
                placeholder="Descreva sua demanda ou solicitação *"
                value={descricao}
                onChange={(e) => { setDescricao(e.target.value); setErro(null); }}
                required
                rows={4}
                className={`${inputCls} resize-none`}
              />
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm"
              >
                {enviando ? "Enviando..." : "Enviar demanda →"}
              </button>
            </form>
          )}
        </div>

        {/* Demandas recentes */}
        {demandas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Demandas recentes</h2>
            <div className="space-y-3">
              {demandas.map((d) => {
                const st = STATUS_STYLE[d.status] ?? STATUS_STYLE.aberta;
                return (
                  <div key={d.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-gray-700 text-sm flex-1 leading-relaxed">
                        {d.descricao?.slice(0, 120)}{(d.descricao?.length ?? 0) > 120 ? "…" : ""}
                      </p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        Powered by{" "}
        <a href="https://gabinete-pro.vercel.app" className="text-blue-500 hover:underline">
          Gabinete Pro
        </a>
      </footer>
    </div>
  );
}
