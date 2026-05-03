import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { Users, CheckSquare, CalendarDays, Sparkles } from "lucide-react";

const stats = [
  {
    title: "Eleitores cadastrados",
    description: "Total na base",
    value: "0",
    icon: Users,
    color: "text-emerald-400",
  },
  {
    title: "Tarefas abertas",
    description: "Na Central de Conteúdo",
    value: "0",
    icon: CheckSquare,
    color: "text-blue-400",
  },
  {
    title: "Eventos esta semana",
    description: "Na agenda",
    value: "0",
    icon: CalendarDays,
    color: "text-blue-300",
  },
  {
    title: "Conteúdos gerados",
    description: "Este mês",
    value: "0",
    icon: Sparkles,
    color: "text-emerald-300",
  },
];

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Visão geral do seu gabinete">
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ title, description, value, icon: Icon, color }) => (
            <Card key={title} title={title} description={description}>
              <div className="flex items-end justify-between mt-2">
                <p className={`text-4xl font-extrabold ${color} tracking-tight`}>{value}</p>
                <Icon size={28} className="text-slate-700" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            title="Atividade recente"
            description="Últimas ações no sistema"
            className="lg:col-span-2"
          >
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center mb-4">
                <Sparkles size={20} className="text-white" />
              </div>
              <p className="text-slate-400 text-sm">Nenhuma atividade ainda.</p>
              <p className="text-slate-600 text-xs mt-1">As ações aparecerão aqui.</p>
            </div>
          </Card>

          <Card title="Acesso rápido" description="Atalhos principais">
            <div className="space-y-2 mt-2">
              {["Novo eleitor", "Nova tarefa", "Novo evento", "Gerar conteúdo"].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all duration-150 border border-transparent hover:border-border"
                >
                  + {item}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
