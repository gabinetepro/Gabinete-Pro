import DarkModeToggle from "./DarkModeToggle";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function Header({ title, subtitle, rightContent }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div>
        {title && (
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
        )}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {rightContent}
        <DarkModeToggle />
      </div>
    </header>
  );
}
