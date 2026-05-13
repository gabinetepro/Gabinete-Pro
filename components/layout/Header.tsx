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
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-slate-100 transition-colors p-1"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <div>
          {title && (
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
          )}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {rightContent}
        <DarkModeToggle />
      </div>
    </header>
  );
}
