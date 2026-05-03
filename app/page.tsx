import Link from "next/link";
import {
  Sparkles,
  CalendarDays,
  LayoutDashboard,
  Layout,
  FileText,
  Users,
  UserCog,
  Check,
  ArrowRight,
  Zap,
  TrendingUp,
  ThumbsUp,
  Timer,
  Star,
  X,
} from "lucide-react";
import AppMockup from "@/components/landing/AppMockup";
import FAQ from "@/components/landing/FAQ";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-slate-100">

      {/* ── HEADER FIXO ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Gabinete Pro
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="#planos"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
            >
              Começar agora
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        id="hero"
        className="relative pt-16 min-h-screen flex items-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#060E1F] via-[#0F172A] to-[#071A12]" />
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Coluna de texto */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium">
                <Zap size={12} />
                Inteligência artificial para mandatos
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Seu gabinete político,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent">
                  organizado e inteligente
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0">
                A plataforma de gestão de mandato usada por vereadores, prefeitos,
                deputados e senadores em todo o Brasil.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="#planos"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
                >
                  Ver planos
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-lg border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100 transition-all"
                >
                  Como funciona
                </Link>
              </div>

              {/* Garantia */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 justify-center lg:justify-start text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-400" />
                  7 dias grátis
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-400" />
                  Cancele quando quiser
                </span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-400" />
                  Sem fidelidade
                </span>
              </div>
            </div>

            {/* Mockup do app */}
            <div className="flex justify-center lg:justify-end">
              <AppMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              Como funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Tudo que seu mandato precisa
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Três pilares que transformam a gestão do seu gabinete.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                color: "from-blue-600 to-blue-400",
                title: "IA que cria por você",
                desc: "Gere posts para redes sociais, notas de imprensa e pronunciamentos com um clique. A IA entende o contexto político brasileiro.",
              },
              {
                icon: CalendarDays,
                color: "from-blue-500 to-emerald-400",
                title: "Agenda integrada",
                desc: "Sincronize com o Google Agenda, receba sugestões de cobertura e nunca perca um evento importante do mandato.",
              },
              {
                icon: LayoutDashboard,
                color: "from-emerald-500 to-emerald-300",
                title: "Tudo em um só lugar",
                desc: "Central de Conteúdo, eleitores, equipe, pautas centralizados. Menos ferramentas, mais foco no que importa.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="group bg-surface border border-border rounded-xl p-8 hover:border-blue-500/30 transition-all duration-300 hover:shadow-glow-blue"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-24 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Uma plataforma completa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Sparkles,
                title: "Gerador de conteúdo com IA",
                desc: "Posts, notas e comunicados gerados por IA treinada para política brasileira.",
              },
              {
                icon: Layout,
                title: "Central de Conteúdo",
                desc: "Organize o fluxo editorial da equipe com colunas de rascunho, revisão e publicado.",
              },
              {
                icon: CalendarDays,
                title: "Google Agenda integrado",
                desc: "Sincronize eventos e receba sugestões de cobertura automáticas.",
              },
              {
                icon: FileText,
                title: "Monitor de pautas",
                desc: "Acompanhe projetos de lei, votações e pautas da câmara em tempo real.",
              },
              {
                icon: Users,
                title: "Cadastro de eleitores",
                desc: "Base de eleitores com histórico de atendimentos, pedidos e follow-ups.",
              },
              {
                icon: UserCog,
                title: "Gestão de equipe",
                desc: "Controle de acesso por nível, atribuição de tarefas e visão de produtividade.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-6 rounded-xl bg-surface border border-border hover:border-emerald-500/20 transition-all duration-200 group"
              >
                <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-blue-600/20 to-emerald-500/20 border border-blue-500/20 flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                  <Icon size={18} className="text-emerald-400" />
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

      {/* ── NÚMEROS ── */}
      <section id="numeros" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              Resultados reais
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Números que falam por si
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Vereadores, prefeitos, deputados e senadores já transformaram seus gabinetes com o Gabinete Pro.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "500+", label: "Políticos Ativos", desc: "mandatos em todo o Brasil" },
              { icon: TrendingUp, value: "3x", label: "Mais conteúdo publicado", desc: "em relação ao método anterior" },
              { icon: ThumbsUp, value: "98%", label: "Taxa de satisfação", desc: "dos usuários ativos" },
              { icon: Timer, value: "30 dias", label: "Para ver resultados", desc: "após a primeira configuração" },
            ].map(({ icon: Icon, value, label, desc }) => (
              <div
                key={label}
                className="group relative bg-surface border border-border rounded-xl p-6 text-center hover:border-blue-500/30 transition-all duration-300 hover:shadow-glow-blue overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-600/20 to-emerald-500/20 border border-blue-500/20 flex items-center justify-center">
                    <Icon size={18} className="text-emerald-400" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                    {value}
                  </p>
                  <p className="text-sm font-semibold text-slate-100 mb-1">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section id="depoimentos" className="py-24 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
              Depoimentos
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              O que dizem nossos usuários
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Vereadores, prefeitos, deputados e senadores que transformaram seus gabinetes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Rafael Mendes",
                role: "Vereador",
                city: "São Paulo — SP",
                initial: "R",
                color: "from-blue-600 to-blue-400",
                quote:
                  "O Gabinete Pro mudou completamente como minha equipe trabalha. Antes levávamos dias para produzir conteúdo para as redes — agora em minutos temos posts prontos e aprovados. A agenda integrada ao Google foi o diferencial que eu precisava.",
              },
              {
                name: "Ana Carolina",
                role: "Assessora Parlamentar",
                city: "Belo Horizonte — MG",
                initial: "A",
                color: "from-blue-500 to-emerald-500",
                quote:
                  "Gerencio três mandatos ao mesmo tempo e o Gabinete Pro é o que torna isso possível. A Central de Conteúdo e o cadastro de eleitores centralizam tudo numa única tela. Economizamos pelo menos 15 horas por semana em tarefas operacionais.",
              },
              {
                name: "Paulo Ferreira",
                role: "Deputado Estadual",
                city: "Curitiba — PR",
                initial: "P",
                color: "from-emerald-600 to-emerald-400",
                quote:
                  "Como deputado estadual, acompanhar pautas e votações é essencial. O monitor de pautas do Gabinete Pro me avisa em tempo real sobre qualquer movimentação relevante. A IA para gerar pronunciamentos então é simplesmente impressionante.",
              },
            ].map(({ name, role, city, initial, color, quote }) => (
              <div
                key={name}
                className="bg-surface border border-border rounded-xl p-8 flex flex-col gap-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-glow-blue"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-emerald-400 fill-emerald-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </p>
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

      {/* ── COMPARATIVO ── */}
      <section id="comparativo" className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              Comparativo
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Por que o Gabinete Pro?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sem o Gabinete Pro */}
            <div className="bg-surface border border-red-500/20 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <X size={16} className="text-red-400" />
                </div>
                <h3 className="text-base font-bold text-slate-100">Sem o Gabinete Pro</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Horas perdidas criando conteúdo manualmente",
                  "Agenda desorganizada, eventos perdidos",
                  "Equipe sem comunicação e alinhamento",
                  "Eleitores sem cadastro nem histórico",
                  "Zero estratégia de comunicação",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                    <X size={14} className="text-red-400/70 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Com o Gabinete Pro */}
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-blue-600/40 to-emerald-500/40 blur-[2px]" />
              <div className="relative bg-surface rounded-xl p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">Com o Gabinete Pro</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Conteúdo gerado pela IA em segundos",
                    "Agenda integrada com sugestões automáticas",
                    "Equipe sincronizada em tempo real",
                    "Base de eleitores organizada e pesquisável",
                    "Estratégia completa de mandato",
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
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="py-24 bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              Planos
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Escolha o plano do seu mandato
            </h2>
            <p className="mt-4 text-slate-400">
              Acesso liberado imediatamente após o pagamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Solo */}
            <div className="bg-surface border border-border rounded-xl p-8">
              <h3 className="text-base font-bold text-slate-100 mb-1">Solo</h3>
              <p className="text-xs text-slate-500 mb-6">
                Para vereadores, prefeitos, deputados e senadores que trabalham de forma independente
              </p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-100">R$147</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["1 usuário", "Todas as funcionalidades", "Suporte por e-mail", "IA incluída"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="block w-full text-center py-2.5 text-sm font-semibold rounded-lg border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100 transition-all"
              >
                Assinar Solo
              </a>
            </div>

            {/* Assessor — destaque */}
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 blur-[2px] opacity-70" />
              <div className="relative bg-surface rounded-xl p-8">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
                    Mais popular
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">Assessor</h3>
                <p className="text-xs text-slate-500 mb-6">Para gabinetes em crescimento com equipe de assessoria</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    R$247
                  </span>
                  <span className="text-slate-400 text-sm">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Até 3 usuários", "Todas as funcionalidades", "Suporte prioritário", "IA incluída", "Relatórios avançados"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className="block w-full text-center py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:from-blue-500 hover:to-emerald-400 transition-all hover:shadow-glow"
                >
                  Assinar Assessor
                </a>
              </div>
            </div>

            {/* Gabinete */}
            <div className="bg-surface border border-border rounded-xl p-8">
              <h3 className="text-base font-bold text-slate-100 mb-1">Gabinete</h3>
              <p className="text-xs text-slate-500 mb-6">Para prefeituras e gabinetes com equipe completa</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-100">R$397</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Até 8 usuários", "Todas as funcionalidades", "Suporte VIP", "IA incluída", "Relatórios avançados", "Onboarding dedicado"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="block w-full text-center py-2.5 text-sm font-semibold rounded-lg border border-border text-slate-300 hover:border-blue-500/50 hover:text-slate-100 transition-all"
              >
                Assinar Gabinete
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-emerald-500 px-8 py-20 text-center">
            {/* Orbs decorativos */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
                Pronto para transformar seu gabinete?
              </h2>
              <p className="text-white/75 text-lg max-w-xl mx-auto mb-10">
                Comece hoje com 7 dias grátis. Sem fidelidade, cancele quando quiser.
              </p>
              <a
                href="#planos"
                className="inline-flex items-center gap-2 px-10 py-4 text-base font-bold rounded-xl bg-white text-blue-700 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
              >
                Começar agora →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Perguntas frequentes
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-surface/30 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Gabinete Pro
          </span>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Termos de Uso
            </a>
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
