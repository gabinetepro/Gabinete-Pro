"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

type Periodo = "semestral" | "anual";

const PLANOS = [
  {
    nome: "Essencial",
    tag: "Para quem quer começar",
    usuarios: "1 usuário",
    ia: "150 gerações de IA/mês",
    features: [
      "CRM de eleitores (até 500 contatos)",
      "Gerador de conteúdo com IA",
      "Agenda + Google Calendar",
      "Monitor de pautas legislativas",
      "Página pública de demandas",
      "Kanban de conteúdo",
      "Suporte por e-mail",
    ],
    mentoria: false,
    cta: "Começar agora",
    destaque: false,
    semestral: { total: "R$997", mensal: "R$166" },
    anual:     { total: "R$1.697", mensal: "R$141" },
  },
  {
    nome: "Profissional",
    tag: "Mais popular ⭐",
    usuarios: "Até 5 usuários",
    ia: "500 gerações de IA/mês",
    features: [
      "Tudo do plano Essencial",
      "CRM ilimitado de eleitores",
      "Gestão de equipe com permissões",
      "Relatórios e exportação CSV",
      "Suporte prioritário",
    ],
    mentoria: true,
    cta: "Começar agora",
    destaque: true,
    semestral: { total: "R$1.697", mensal: "R$283" },
    anual:     { total: "R$2.897", mensal: "R$241" },
  },
  {
    nome: "Gabinete",
    tag: "Para prefeitos e deputados",
    usuarios: "Até 15 usuários",
    ia: "IA ilimitada",
    features: [
      "Tudo do plano Profissional",
      "Importação em massa de eleitores",
      "Onboarding personalizado",
      "Suporte VIP com SLA garantido",
    ],
    mentoria: true,
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
          <div className="relative flex items-center bg-surface border border-border rounded-full p-1 gap-1">
            {(["semestral", "anual"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  periodo === p
                    ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p === "semestral" ? "Semestral" : "Anual"}
                {p === "anual" && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    periodo === "anual"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    2 meses grátis
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
                    <span className="px-4 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg whitespace-nowrap">
                      {plano.tag}
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
      <div className="mb-5">
        {!plano.destaque && (
          <p className="text-xs text-slate-500 mb-1">{plano.tag}</p>
        )}
        <h3 className={`text-lg font-extrabold ${gradient ? "text-white" : "text-slate-100"}`}>
          {plano.nome}
        </h3>
      </div>

      <div className="mb-1">
        <span
          className={`text-4xl font-extrabold ${
            gradient
              ? "bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent"
              : "text-slate-100"
          }`}
        >
          {preco.total}
        </span>
        <span className="text-slate-400 text-sm ml-1">/{periodo}</span>
      </div>
      <p className="text-xs text-slate-500 mb-7">
        {preco.mensal}/mês · cobrado {periodo === "anual" ? "anualmente" : "semestralmente"}
      </p>

      <ul className="space-y-2.5 mb-7">
        <li className="flex items-start gap-2 text-sm text-slate-300">
          <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
          {plano.usuarios}
        </li>
        <li className="flex items-start gap-2 text-sm text-slate-300">
          <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
          {plano.ia}
        </li>
        {plano.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
            {f}
          </li>
        ))}
        {plano.mentoria && (
          <li className="flex items-start gap-2 text-sm">
            <Check size={14} className="shrink-0 mt-0.5 text-blue-400" />
            <span className="text-blue-300 font-semibold">
              ✨ Mentoria 1h/mês com especialista
            </span>
          </li>
        )}
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
