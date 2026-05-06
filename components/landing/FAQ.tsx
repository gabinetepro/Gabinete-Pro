"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "Preciso saber de tecnologia para usar?",
    a: "Não. O Gabinete Pro foi criado para políticos e assessores, não para programadores. A interface é simples e intuitiva — se você usa WhatsApp, consegue usar o Gabinete Pro. O setup leva menos de 5 minutos.",
  },
  {
    q: "A IA entende o contexto político brasileiro?",
    a: "Sim. O sistema é treinado especificamente para comunicação política no Brasil: linguagem dos municípios, estrutura de ofícios e Projetos de Lei, tom para sessões da câmara, posts para eleitorado brasileiro. Não é um ChatGPT genérico.",
  },
  {
    q: "Posso importar minha lista de eleitores atual?",
    a: "Sim. Você faz upload de uma planilha Excel ou CSV com sua base atual e o sistema importa automaticamente. Também é possível exportar a qualquer momento para uso externo.",
  },
  {
    q: "Funciona para qualquer cargo político?",
    a: "Sim. O sistema funciona para vereadores, prefeitos, vice-prefeitos, deputados estaduais, deputados federais e senadores. Cada cargo tem fluxos e formatos adaptados.",
  },
  {
    q: "O que acontece após os 7 dias grátis?",
    a: "Você escolhe o plano que melhor se encaixa no seu mandato e continua com acesso completo. Se preferir não continuar, basta não assinar — sem cobrança automática, sem burocracia.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map(({ q, a }, i) => (
        <div
          key={i}
          className="border border-border rounded-xl overflow-hidden bg-surface transition-all duration-200 hover:border-blue-500/30"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold text-slate-100">{q}</span>
            <ChevronDown
              size={16}
              className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
