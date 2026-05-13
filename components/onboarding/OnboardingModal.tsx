"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// SQL needed:
// ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completo boolean DEFAULT false;
// ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tom_de_voz text;

const CARGOS = [
  "Vereador(a)",
  "Prefeito(a)",
  "Deputado(a) Estadual",
  "Deputado(a) Federal",
  "Senador(a)",
  "Outro",
];

const TONS = [
  { value: "direto",   label: "Direto e objetivo",   desc: "Mensagens claras, sem rodeios" },
  { value: "popular",  label: "Popular e próximo",    desc: "Linguagem simples e acessível" },
  { value: "tecnico",  label: "Técnico e embasado",   desc: "Dados e argumentos consistentes" },
  { value: "empatico", label: "Empático e humano",    desc: "Foco nas pessoas e histórias" },
];

interface Props {
  userId: string;
  nomeInicial?: string;
}

export default function OnboardingModal({ userId, nomeInicial = "" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const [cargo,   setCargo]   = useState("");
  const [nome,    setNome]    = useState(nomeInicial);
  const [cidade,  setCidade]  = useState("");
  const [partido, setPartido] = useState("");
  const [tom,     setTom]     = useState("");

  async function salvarPerfil(concluir: boolean) {
    setSalvando(true);
    await supabase.from("profiles").update({
      ...(cargo   && { cargo }),
      ...(nome    && { nome }),
      ...(cidade  && { municipio: cidade }),
      ...(partido && { partido }),
      ...(tom     && { tom_de_voz: tom }),
      onboarding_completo: true,
    }).eq("id", userId);
    setSalvando(false);
    router.push(concluir ? "/criar-conteudo" : "/dashboard");
  }

  const inputCls =
    "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Progress bar */}
        <div className="flex gap-1.5 p-5 pb-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step
                  ? "bg-gradient-to-r from-blue-600 to-emerald-500"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="p-6 pt-5">
          {/* Step 1: Boas-vindas */}
          {step === 1 && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Bem-vindo ao Gabinete Pro!
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Vamos configurar seu gabinete em 2 minutos para que a IA escreva
                no seu tom de voz e sobre as pautas do seu mandato.
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold hover:opacity-90 transition"
              >
                Vamos lá →
              </button>
            </div>
          )}

          {/* Step 2: Perfil */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Seu perfil político</h2>
              <p className="text-xs text-slate-400 mb-5">
                Essas informações personalizam o conteúdo gerado pela IA.
              </p>
              <div className="space-y-3">
                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className={`${inputCls} ${!cargo ? "text-slate-500" : "text-white"} bg-slate-800`}
                >
                  <option value="" disabled>Selecione seu cargo</option>
                  {CARGOS.map((c) => (
                    <option key={c} value={c} className="text-white bg-slate-800">{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Cidade onde atua"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Partido (ex: PT, PL, MDB...)"
                  value={partido}
                  onChange={(e) => setPartido(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tom de voz */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Tom de voz</h2>
              <p className="text-xs text-slate-400 mb-5">
                Como você se comunica com os eleitores?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTom(t.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tom === t.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-500 bg-slate-800/40"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold mb-1 ${
                        tom === t.value ? "text-blue-300" : "text-slate-200"
                      }`}
                    >
                      {t.label}
                    </p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!tom}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Google Calendar */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Google Calendar</h2>
              <p className="text-xs text-slate-400 mb-5">
                Sincronize sua agenda para gerar conteúdo automático por evento.
              </p>
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shrink-0">
                    📅
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Google Calendar</p>
                    <p className="text-xs text-slate-400">Sincronização bidirecional</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Com a agenda conectada, cada evento vira sugestão de post, ofício e
                  roteiro de fala automaticamente.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => salvarPerfil(true)}
                  disabled={salvando}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Ir para o Estúdio →"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 text-center">
          <button
            onClick={() => salvarPerfil(false)}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            Pular configuração
          </button>
        </div>
      </div>
    </div>
  );
}
