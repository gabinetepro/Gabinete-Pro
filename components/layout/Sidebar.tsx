"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenSquare,
  Layout,
  Calendar,
  FileText,
  Users,
  UserCog,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/criar-conteudo", label: "Criar Conteúdo", icon: PenSquare },
  { href: "/kanban", label: "Central de Conteúdo", icon: Layout },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/pautas", label: "Pautas", icon: FileText },
  { href: "/eleitores", label: "Eleitores", icon: Users },
  { href: "/equipe", label: "Equipe", icon: UserCog },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-sidebar border-r border-border flex flex-col z-40">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
          Gabinete Pro
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Gestão política inteligente</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-glow"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-slate-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-500">Sistema online • v1.0</p>
        </div>
      </div>
    </aside>
  );
}
