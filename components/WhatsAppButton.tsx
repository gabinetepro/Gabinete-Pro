"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5500000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="group fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle size={26} className="text-white" />
      {/* Tooltip */}
      <span className="absolute left-16 bottom-1/2 translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-800 border border-border text-xs font-medium text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Fale conosco
      </span>
    </a>
  );
}
