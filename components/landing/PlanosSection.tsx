"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

type Periodo = "semestral" | "anual";

const PLANOS = [
  {
    nome: "Essencial",
    desc: "Para vereadores que trabalham de forma independente",
    usuarios: "1 usuário",
    ia: "150 gerações de IA/mês",
    features: [
      "CRM de eleitores",
      "Monitor de pautas",
      "Agenda + Google Calendar",
      "Suporte incluso",
      "Análise mensal com especialista do time",
    ],
    cta: "Começar agora",
    destaque: false,
    semestral: { total: "R$997", mensal: "R$166" },
    anual:     { total: "R$1.697", mensal: "R$141" },
  },
  {
    nome: "Profissional",
    desc: "Para mandatos com equipe de assessoria",
    usuarios: "Até 5 usuários",
    ia: "500 gerações de IA/mês",
    features: [
      "Tudo do plano Essencial",
      "Cards de Conteúdo (Kanban)",
      "Monitor de pautas avançado",
      "Gestão de equipe com permissões",
      "Análise mensal com especialista do time",
    ],
    cta: "Começar agora",
    destaque: true,
    semestral: { total: "R$1.697", mensal: "R$283" },
    anual:     { total: "R$2.897", mensal: "R$241" },
  },
  {
    nome: "Gabinete",
    desc: "Para prefeitos e deputados com equipe completa",
    usuarios: "Até 15 usuários",
    ia: "IA ilimitada",
    features: [
      "Tudo do plano Profissional",
      "Importação em massa de eleitores",
      "Exportação CSV completa",
      "Onboarding personalizado + suporte VIP",
      "Análise mensal com especialista do time",
    ],
    cta: "Falar com a equipe",
    destaque: false,
    semestral: { total: "R$2.697", mensal: "R$449" },
    anual:     { total: "R$4.597", mensal: "R$383" },
  },
];

export default function PlanosSection() {
  const [periodo, setPeriodo] = useState<Periodo>("anual");

  return (
    <section id="planos" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">PLANOS</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Escolha o plano do seu mandato
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Acesso completo liberado imediatamente. 7 dias grátis em todos os planos.
          </p>
        </div>

        {/* Toggle semestral / anual */}
        <div className="flex justify-center mb-12">
          <div className="relative flex items-center bg-surface border border-border rounded-full p-1">
            {(["semestral", "anual"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  periodo === p
                    ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p === "semestral" ? "Semestral" : "Anual"}
                {p === "anual" && (
                  <span className="ml-2 text-[10px] font-bold text-emerald-300">
                    -15%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANOS.map((plano) => {
            const preco = plano[periodo];
            return plano.destaque ? (
              <div key={plano.nome} className="relative">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 blur-[2px] opacity-70" />
                <div className="relative bg-surface rounded-xl p-8">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg">
                      ★ Mais popular
                    </span>
                  </div>
                  <PlanContent plano={plano} preco={preco} periodo={periodo} gradient />
                </div>
              </div>
            ) : (
              <div key={plano.nome} className="bg-surface border border-border rounded-xl p-8">
                <PlanContent plano={plano} preco={preco} periodo={periodo} />
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          7 dias grátis em todos os planos · Suporte incluso · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}

function PlanContent({
  plano,
  preco,
  periodo,
  gradient = false,
}: {
  plano: typeof PLANOS[number];
  preco: { total: string; mensal: string };
  periodo: Periodo;
  gradient?: boolean;
}) {
  return (
    <>
      <h3 className="text-base font-bold text-slate-100 mb-1">{plano.nome}</h3>
      <p className="text-xs text-slate-500 mb-6">{plano.desc}</p>

      <div className="mb-2">
        <span
          className={`text-4xl font-extrabold ${
            gradient
              ? "bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
              : "text-slate-100"
          }`}
        >
          {preco.total}
        </span>
        <span className="text-slate-400 text-sm ml-1">/{periodo}</span>
      </div>
      <p className="text-xs text-slate-500 mb-8">
        {preco.mensal}/mês · cobrado {periodo === "anual" ? "anualmente" : "semestralmente"}
      </p>

      <ul className="space-y-3 mb-8">
        {[plano.usuarios, plano.ia, ...plano.features].map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check
              size={14}
              className={`shrink-0 mt-0.5 ${
                f.startsWith("Análise mensal") ? "text-blue-400" : "text-emerald-400"
              }`}
            />
            <span className={f.startsWith("Análise mensal") ? "text-blue-300 font-medium" : ""}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="#"
        className={`block w-full text-center py-3 text-sm font-semibold rounded-lg transition-all ${
          gradient
            ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 hover:shadow-glow"
            : "border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100"
        }`}
      >
        {plano.cta}
      </Link>
    </>
  );
}
