interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  glow?: boolean;
}

export default function Card({ children, className = "", title, description, glow = false }: CardProps) {
  return (
    <div
      className={`group relative bg-surface border border-border rounded-xl p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-glow-blue hover:bg-gradient-card ${glow ? "shadow-glow" : ""} ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              {title}
            </h3>
          )}
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
