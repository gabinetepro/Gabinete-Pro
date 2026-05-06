"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "Preciso saber de tecnologia para usar?",
    a: "Não. O setup leva menos de 5 minutos. Interface simples e intuitiva — se você usa WhatsApp, você usa o Gabinete Pro.",
  },
  {
    q: "A IA entende o contexto político brasileiro?",
    a: "Sim. Treinada para gerar PLs, ofícios e pronunciamentos no formato correto da legislação brasileira. Não é um chatbot genérico.",
  },
  {
    q: "Posso importar minha lista de eleitores atual?",
    a: "Sim. Fazemos upload de planilha Excel ou CSV. Seus dados migram em minutos, com mapeamento automático de colunas.",
  },
  {
    q: "Funciona para qualquer cargo político?",
    a: "Sim. Vereador, prefeito, deputado estadual, deputado federal e senador. Cada cargo tem formatos e fluxos adaptados.",
  },
  {
    q: "O que acontece após os 7 dias grátis?",
    a: "Você escolhe o plano ideal para o seu mandato ou cancela sem custo. Sem pegadinhas, sem cobrança automática.",
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
