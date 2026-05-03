"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const items = [
  {
    q: "Preciso saber de tecnologia para usar?",
    a: "Não. O Gabinete Pro foi criado para políticos e assessores, não para programadores. A interface é simples e intuitiva — se você usa WhatsApp, consegue usar o Gabinete Pro.",
  },
  {
    q: "Funciona para deputados e senadores também?",
    a: "Sim. O sistema funciona para qualquer mandato político brasileiro: vereadores, prefeitos, deputados estaduais, deputados federais e senadores.",
  },
  {
    q: "Minha equipe pode usar junto comigo?",
    a: "Sim. Nos planos Assessor e Gabinete você convida membros da equipe com permissões diferentes para cada um — assessor, editor, visualizador e administrador.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Não há fidelidade. Você cancela quando quiser diretamente pelo painel, sem burocracia, sem multa e sem necessidade de ligar para ninguém.",
  },
  {
    q: "Meus dados de eleitores ficam seguros?",
    a: "Sim. Todos os dados são protegidos conforme a LGPD e ficam armazenados em servidores seguros no Brasil. Nunca compartilhamos ou vendemos seus dados.",
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
