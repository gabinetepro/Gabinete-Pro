import Link from "next/link";
import {
  Sparkles, CalendarDays, Layout, Users, UserCog,
  Check, ArrowRight, Star, X,
  Newspaper, Bot, Cpu,
} from "lucide-react";
import AppMockup from "@/components/landing/AppMockup";
import FAQ from "@/components/landing/FAQ";

// ── Feature showcase mockups ────────────────────────────────────────────────

function AIMockup() {
  const types = [
    { label: "Projeto de Lei", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Post Instagram", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Discurso", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Ofício", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ];
  return (
    <div className="bg-[#0d1117] border border-slate-700/60 rounded-2xl p-5 shadow-2xl w-full max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-500">Estúdio de Conteúdo IA</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {types.map(t => (
          <div key={t.label} className={`border rounded-lg px-3 py-2 text-xs font-medium ${t.color} ${t.bg}`}>
            {t.label}
          </div>
        ))}
      </div>
      <div className="bg-slate-800/60 rounded-lg p-3 mb-3">
        <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wider">Tema</p>
        <p className="text-xs text-slate-300">Pavimentação do Jardim das Flores</p>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 w-full animate-pulse" />
        <div className="h-2 rounded-full bg-slate-700 w-4/5" />
        <div className="h-2 rounded-full bg-slate-700 w-3/5" />
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-emerald-400">Gerando conteúdo…</span>
      </div>
    </div>
  );
}

function PautasMockup() {
  const news = [
    { area: "Infraestrutura", title: "Buracos na Av. Central preocupam moradores", rel: "Alta" },
    { area: "Saúde", title: "UPA registra superlotação nos fins de semana", rel: "Alta" },
    { area: "Educação", title: "Escola Municipal pede reforma urgente", rel: "Média" },
  ];
  return (
    <div className="bg-[#0d1117] border border-slate-700/60 rounded-2xl p-5 shadow-2xl w-full max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={14} className="text-blue-400" />
        <span className="text-xs font-semibold text-slate-300">Monitor de Pautas — Hoje</span>
      </div>
      <div className="space-y-3">
        {news.map((n) => (
          <div key={n.title} className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {n.area}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
                n.rel === "Alta"
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
              }`}>
                {n.rel}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">{n.title}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer">Gerar post →</span>
              <span className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer">Gerar ofício →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaMockup() {
  return (
    <div className="bg-[#0d1117] border border-slate-700/60 rounded-2xl p-5 shadow-2xl w-full max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={14} className="text-emerald-400" />
        <span className="text-xs font-semibold text-slate-300">Amanhã, 14/05</span>
        <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Google Sync</span>
      </div>
      <div className="space-y-3 mb-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-300">09:00 — Visita ao Jardim Paulista</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Demanda de pavimentação</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-purple-300">15:00 — Sessão Ordinária</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Câmara Municipal</p>
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-600/20 to-emerald-500/20 border border-blue-500/20 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={11} className="text-blue-400" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">IA sugere</span>
        </div>
        <p className="text-[11px] text-slate-300">Post da visita + ofício de demanda para a Prefeitura prontos para aprovar</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-slate-100">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span>🏛️</span>
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">Gabinete Pro</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060E1F] via-[#0F172A] to-[#071A12]" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold">
                ⚡ Inteligência Artificial para mandatos políticos
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-6">
                Nunca mais fique{" "}
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent">
                  sem o que postar.
                </span>
                <br className="hidden sm:block" />
                {" "}Nem{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  sem votos.
                </span>
              </h1>

              <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0">
                O Gabinete Pro conecta sua agenda ao Google Notícias e gera automaticamente posts, ofícios, Projetos de Lei e discursos — no seu tom de voz.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow hover:scale-[1.02] active:scale-100"
                >
                  Começar grátis por 7 dias
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100 transition-all"
                >
                  Ver como funciona
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 justify-center lg:justify-start text-xs text-slate-500">
                {["7 dias grátis", "Suporte incluso", "Cancele quando quiser"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">O PROBLEMA</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Seu gabinete ainda funciona assim?
            </h2>
          </div>

          {/* Caos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: "📊",
                title: "Planilha Excel",
                desc: "Eleitores em planilhas bagunçadas. Histórico perdido. Na eleição, ninguém sabe quem apoiou quem.",
              },
              {
                icon: "⏰",
                title: "Horas criando conteúdo",
                desc: "Assessor perdendo 2h criando um post do zero, sem saber as notícias do dia na cidade.",
              },
              {
                icon: "📅",
                title: "Agenda desconectada",
                desc: "Você tem uma visita amanhã, mas ninguém lembrou de criar o post de presença ou o ofício de demanda.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-surface border border-red-500/15 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="text-sm font-bold text-slate-200">{title}</h3>
                  <X size={14} className="text-red-400 ml-auto shrink-0" />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Seta */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-6 bg-gradient-to-b from-red-500/40 to-emerald-500/40" />
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Com o Gabinete Pro</div>
              <div className="w-px h-6 bg-gradient-to-b from-emerald-500/40 to-emerald-500/10" />
            </div>
          </div>

          {/* Solução */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "👥",
                title: "CRM inteligente",
                desc: "Histórico completo de cada eleitor. Importação de planilha em 1 clique. Base organizada para a próxima campanha.",
              },
              {
                icon: "🤖",
                title: "IA gera em segundos",
                desc: "Post, PL, ofício ou discurso prontos em 30 segundos. No seu tom de voz, com contexto político local.",
              },
              {
                icon: "✨",
                title: "Agenda → Conteúdo",
                desc: "Evento cadastrado vira sugestão de post, ofício e roteiro de fala automaticamente. Antes de você chegar lá.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="relative">
                <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-500/20 blur-[1px]" />
                <div className="relative bg-surface rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="text-sm font-bold text-slate-200">{title}</h3>
                    <Check size={14} className="text-emerald-400 ml-auto shrink-0" />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA — 3 features alternadas ── */}
      <section id="como-funciona" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">COMO FUNCIONA</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Uma plataforma. Tudo integrado.
            </h2>
          </div>

          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <AIMockup />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Bot size={12} />
                Estúdio de Conteúdo IA
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-4 leading-tight">
                A IA que escreve de verdade — não um chatbot genérico
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                O Gabinete Pro aprende o tom de voz do seu mandato e gera Projetos de Lei tecnicamente embasados, ofícios formatados, posts para todas as redes e discursos para sessões.
              </p>
              <ul className="space-y-3">
                {[
                  "Projetos de Lei com embasamento técnico",
                  "Ofícios e requerimentos prontos para assinar",
                  "Posts otimizados para cada rede social",
                  "Discursos e roteiros de fala",
                  "Clipping e notas de imprensa",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Newspaper size={12} />
                Monitor de Pautas
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-4 leading-tight">
                As notícias da sua cidade, na palma da mão
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Integrado ao Google Notícias, o Monitor de Pautas traz as principais notícias do município em tempo real. A IA analisa cada pauta e sugere o posicionamento ideal — nota de apoio, pronunciamento ou ofício de demanda.
              </p>
              <ul className="space-y-3">
                {[
                  "Notícias filtradas por município e áreas de interesse",
                  "Sugestão de ação para cada pauta (nota, ofício, discurso)",
                  "Salvar pautas para acompanhamento contínuo",
                  "Gerar conteúdo diretamente da notícia com 1 clique",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PautasMockup />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <AgendaMockup />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CalendarDays size={12} />
                Agenda Inteligente
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-4 leading-tight">
                Sua agenda vira conteúdo automaticamente
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Você adicionou uma visita ao bairro no Google Agenda. O Gabinete Pro já leu o evento e sugere: post para o Instagram, ofício de demanda para a Prefeitura e roteiro de fala para a ocasião. Tudo antes de você chegar lá.
              </p>
              <ul className="space-y-3">
                {[
                  "Sincronização bidirecional com Google Calendar",
                  "Sugestão automática de conteúdo por evento",
                  "Calendário visual com visão mensal e semanal",
                  "Notificações de eventos com cobertura pendente",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTADOS ── */}
      <section className="py-24 bg-surface/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">RESULTADOS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Mandatos que usam o Gabinete Pro
            </h2>
          </div>

          {/* 3 métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { value: "3×", label: "mais conteúdo produzido por semana", sub: "comparado ao método anterior" },
              { value: "70%", label: "menos tempo em tarefas administrativas", sub: "para assessores e gabinetes" },
              { value: "5 min", label: "para configurar e começar a usar", sub: "sem precisar de suporte" },
            ].map(({ value, label, sub }) => (
              <div key={value} className="group bg-surface border border-border rounded-xl p-8 text-center hover:border-blue-500/30 transition-all duration-300">
                <p className="text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  {value}
                </p>
                <p className="text-sm font-semibold text-slate-200 mb-1">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Depoimento em destaque */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-600/30 to-emerald-500/30 blur-[1px]" />
            <div className="relative bg-surface rounded-2xl p-8">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="text-emerald-400 fill-emerald-400" />
                ))}
              </div>
              <p className="text-slate-200 text-base leading-relaxed mb-6 italic">
                &ldquo;Antes eu gastava 2 horas criando um post. Hoje o Gabinete Pro gera em 30 segundos, já com as notícias do dia integradas.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  V
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Vereador</p>
                  <p className="text-xs text-slate-500">São Paulo — SP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS GRID ── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "Ana Carolina",
                role: "Assessora Parlamentar",
                city: "Belo Horizonte — MG",
                initial: "A",
                color: "from-blue-500 to-emerald-500",
                quote: "Gerencio três mandatos ao mesmo tempo e o Gabinete Pro é o que torna isso possível. O CRM de eleitores e o Kanban de conteúdo centralizam tudo numa única tela. Economizamos pelo menos 15 horas por semana.",
              },
              {
                name: "Paulo Ferreira",
                role: "Deputado Estadual",
                city: "Curitiba — PR",
                initial: "P",
                color: "from-emerald-600 to-emerald-400",
                quote: "Como deputado estadual, acompanhar pautas e votações é essencial. O monitor de pautas me avisa em tempo real. A IA para gerar pronunciamentos então é simplesmente impressionante — escreve melhor que muita assessoria.",
              },
            ].map(({ name, role, city, initial, color, quote }) => (
              <div key={name} className="bg-surface border border-border rounded-xl p-8 flex flex-col gap-5 hover:border-blue-500/20 transition-all duration-300">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className="text-emerald-400 fill-emerald-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 italic">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{name}</p>
                    <p className="text-xs text-slate-500">{role} · {city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-24 bg-surface/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">TUDO EM UM SÓ LUGAR</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Tudo que seu gabinete precisa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Cpu,           emoji: "🤖", title: "Estúdio de Conteúdo IA",  desc: "PL, ofícios, posts, discursos e releases gerados por IA treinada para política brasileira." },
              { icon: Newspaper,     emoji: "📰", title: "Monitor de Pautas",       desc: "Notícias em tempo real do seu município + sugestão de posicionamento e ação política." },
              { icon: CalendarDays,  emoji: "📅", title: "Agenda Inteligente",      desc: "Google Calendar + sugestão automática de conteúdo para cada evento do mandato." },
              { icon: Users,         emoji: "👥", title: "CRM de Eleitores",        desc: "Histórico completo, segmentação por tags, importação CSV e página pública com protocolo." },
              { icon: Layout,        emoji: "📋", title: "Cards de Conteúdo",       desc: "Kanban estilo Trello para a equipe: rascunho → revisão → aprovado → publicado." },
              { icon: UserCog,       emoji: "👤", title: "Gestão de Equipe",        desc: "Convites com permissões granulares. Assessores veem só o que precisam ver." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-xl bg-surface border border-border hover:border-emerald-500/20 transition-all duration-200 group">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-blue-600/20 to-emerald-500/20 border border-blue-500/20 flex items-center justify-center text-lg group-hover:border-emerald-500/40 transition-colors">
                  {emoji}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">PLANOS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Escolha o plano do seu mandato
            </h2>
            <p className="mt-4 text-slate-400">
              Acesso completo liberado imediatamente. 7 dias grátis em todos os planos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Essencial */}
            <div className="bg-surface border border-border rounded-xl p-8">
              <h3 className="text-base font-bold text-slate-100 mb-1">Essencial</h3>
              <p className="text-xs text-slate-500 mb-6">Para vereadores que trabalham de forma independente</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-100">R$197</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "1 usuário",
                  "Todas as funcionalidades de IA",
                  "CRM de eleitores",
                  "Monitor de pautas",
                  "Agenda + Google Calendar",
                  "Suporte incluso",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="block w-full text-center py-3 text-sm font-semibold rounded-lg border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100 transition-all"
              >
                Começar grátis
              </Link>
            </div>

            {/* Profissional — destaque */}
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 blur-[2px] opacity-70" />
              <div className="relative bg-surface rounded-xl p-8">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg">
                    ★ Mais popular
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">Profissional</h3>
                <p className="text-xs text-slate-500 mb-6">Para mandatos com equipe de assessoria</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    R$297
                  </span>
                  <span className="text-slate-400 text-sm">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "Até 5 usuários",
                    "Tudo do plano Essencial",
                    "Cards de Conteúdo (Kanban)",
                    "Clipping + Monitor de pautas avançado",
                    "Gestão de equipe com permissões",
                    "Suporte prioritário",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className="block w-full text-center py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
                >
                  Começar grátis
                </Link>
              </div>
            </div>

            {/* Gabinete */}
            <div className="bg-surface border border-border rounded-xl p-8">
              <h3 className="text-base font-bold text-slate-100 mb-1">Gabinete</h3>
              <p className="text-xs text-slate-500 mb-6">Para prefeitos e deputados com equipe completa</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-100">R$497</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Até 15 usuários",
                  "Tudo do plano Profissional",
                  "Sem limites de geração IA",
                  "Importação em massa de eleitores",
                  "Exportação CSV completa",
                  "Onboarding personalizado + suporte VIP",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="block w-full text-center py-3 text-sm font-semibold rounded-lg border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100 transition-all"
              >
                Falar com a equipe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-surface/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Perguntas frequentes
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden px-8 py-20 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600" />
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-sm">
                <Sparkles size={12} />
                Comece hoje, veja resultado esta semana
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                Seu mandato merece uma IA<br className="hidden sm:block" />
                {" "}que trabalha por você.
              </h2>
              <p className="text-white/75 text-lg max-w-xl mx-auto mb-10">
                Junte-se aos mandatos mais organizados e produtivos do Brasil.
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 px-10 py-4 text-base font-bold rounded-xl bg-white text-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100"
              >
                Começar grátis agora
                <ArrowRight size={18} />
              </Link>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
                {["7 dias grátis", "Suporte incluso", "Cancele quando quiser", "Setup em 5 minutos"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check size={11} className="text-emerald-300" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-surface/30 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5">
            <span>🏛️</span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Gabinete Pro</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Termos de Uso</a>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-700 rounded-full px-3 py-1">
              🔒 Dados protegidos pela LGPD
            </span>
            <p className="text-xs text-slate-600">© 2026 Gabinete Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
