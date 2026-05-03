# Gabinete Pro

## O que é
SaaS de gestão de gabinete político brasileiro. Vereadores, prefeitos e assessores usam para gerenciar comunicação, agenda, eleitores e equipe.

## Stack
- Next.js 14 com App Router e TypeScript
- Tailwind CSS (dark mode via classe)
- Supabase (banco de dados PostgreSQL + autenticação)
- API Anthropic Claude para IA
- Deploy na Vercel

## Variáveis de ambiente necessárias
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KIWIFY_WEBHOOK_SECRET=

## Design
- Cor primária: #4F46E5 (roxo)
- Fundo dark mode: #0F172A
- Fonte: Inter
- Dark mode obrigatório em 100% das telas

## Três planos
- Solo: 1 usuário, R$147/mês
- Assessor: até 3 usuários, R$247/mês
- Gabinete: até 8 usuários, R$397/mês

## Regra de negócio principal
Acesso liberado via webhook da Kiwify após pagamento. Funcionalidades bloqueadas por plano mostram cadeado e botão de upgrade.
