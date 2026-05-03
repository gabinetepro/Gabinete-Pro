import {
  LayoutDashboard,
  PenSquare,
  Layout,
  Calendar,
  FileText,
  Users,
  UserCog,
  Settings,
  Sparkles,
  CheckSquare,
  CalendarDays,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: PenSquare, label: "Criar Conteúdo" },
  { icon: Layout, label: "Central de Conteúdo" },
  { icon: Calendar, label: "Agenda" },
  { icon: FileText, label: "Pautas" },
  { icon: Users, label: "Eleitores" },
  { icon: UserCog, label: "Equipe" },
  { icon: Settings, label: "Configurações" },
];

const metricCards = [
  { label: "Eleitores", value: "1.284", color: "text-emerald-400" },
  { label: "Tarefas", value: "12", color: "text-blue-400" },
  { label: "Eventos", value: "5", color: "text-blue-300" },
  { label: "Conteúdos", value: "38", color: "text-emerald-300" },
];

export default function AppMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow behind the mockup */}
      <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/20 to-emerald-500/20 rounded-2xl blur-2xl" />

      {/* Browser window frame */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-black/60">

        {/* Browser chrome */}
        <div className="bg-[#0A1221] px-4 py-2 flex items-center gap-3 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 bg-slate-800/80 rounded-md px-3 py-0.5 text-center">
            <span className="text-[10px] text-slate-500">app.gabinetepro.com.br</span>
          </div>
        </div>

        {/* App layout */}
        <div className="flex bg-[#0F172A]" style={{ height: "340px" }}>

          {/* Sidebar */}
          <div className="w-36 bg-[#0A1221] border-r border-border/50 flex flex-col shrink-0">
            <div className="px-3 py-3 border-b border-border/50">
              <span className="text-[10px] font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Gabinete Pro
              </span>
            </div>
            <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
              {sidebarItems.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white"
                      : "text-slate-500"
                  }`}
                >
                  <Icon size={10} className="shrink-0" />
                  <span className="text-[9px] font-medium truncate">{label}</span>
                </div>
              ))}
            </nav>
            <div className="px-3 py-2 border-t border-border/50 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[8px] text-slate-600">Online • v1.0</span>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="h-9 bg-[#1E293B]/80 border-b border-border/50 px-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-200">Dashboard</span>
                <p className="text-[8px] text-slate-500 leading-none">Visão geral do seu gabinete</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 space-y-2 overflow-hidden">

              {/* Metric cards */}
              <div className="grid grid-cols-2 gap-2">
                {metricCards.map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="bg-[#1E293B] border border-[#1E3A5F]/60 rounded-lg p-2"
                  >
                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      {label}
                    </p>
                    <p className={`text-xl font-extrabold leading-none ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 bg-[#1E293B] border border-[#1E3A5F]/60 rounded-lg p-2">
                  <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Atividade recente
                  </p>
                  <div className="space-y-1">
                    {[
                      { icon: Sparkles, text: "Post gerado pela IA", time: "2min" },
                      { icon: CheckSquare, text: "Tarefa concluída", time: "15min" },
                      { icon: CalendarDays, text: "Evento adicionado", time: "1h" },
                    ].map(({ icon: Icon, text, time }) => (
                      <div key={text} className="flex items-center gap-1.5">
                        <Icon size={8} className="text-emerald-400 shrink-0" />
                        <span className="text-[8px] text-slate-400 flex-1 truncate">{text}</span>
                        <span className="text-[7px] text-slate-600">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#1E293B] border border-[#1E3A5F]/60 rounded-lg p-2">
                  <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Atalhos
                  </p>
                  <div className="space-y-1">
                    {["+ Novo eleitor", "+ Nova tarefa", "+ Conteúdo"].map((item) => (
                      <div
                        key={item}
                        className="text-[8px] text-slate-500 px-1.5 py-1 rounded border border-border/40 hover:border-border"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
