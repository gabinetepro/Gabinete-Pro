"use client";

import { Menu } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onMenuClick?: () => void;
}

export default function Header({ title, subtitle, rightContent, onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm px-4 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-slate-100 transition-colors p-1 flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          {title && (
            <h2 className="text-xl font-bold text-slate-100 tracking-tight truncate">{title}</h2>
          )}
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
        {rightContent}
        <DarkModeToggle />
      </div>
    </header>
  );
}
