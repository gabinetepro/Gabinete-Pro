import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOM_LABEL: Record<string, string> = {
  formal:   "formal e institucional",
  informal: "informal e próximo do cidadão",
  emotivo:  "emotivo e inspirador",
  tecnico:  "técnico e informativo",
};

function getInstructions(plataforma: string, formato: string): string {
  // ── Twitter ───────────────────────────────────────────────────
  if (plataforma === "twitter") {
    return "IMPORTANTE: O post deve ter no máximo 280 caracteres (espaços incluídos). Seja direto, impactante e use linguagem digital. Pode incluir até 2 hashtags dentro do limite.";
  }

  // ── Ofício ────────────────────────────────────────────────────
  if (plataforma === "oficio") {
    return `Siga o formato ABNT de ofício:
GABINETE DE [CARGO] [NOME]
OFÍCIO Nº [NÚMERO]/[ANO]
[CIDADE], [DATA]

Ao [CARGO E NOME DO DESTINATÁRIO]
[INSTITUIÇÃO]

Prezado(a) [TRATAMENTO],

[Corpo: introdução, desenvolvimento objetivo e pedido/comunicação clara]

Atenciosamente,

[NOME]
[CARGO] | [PARTIDO]`;
  }

  // ── Discurso ──────────────────────────────────────────────────
  if (plataforma === "discurso") {
    return `Estruture o discurso com:
1. ABERTURA: cumprimentos e saudações protocolares (autoridades, colegas, cidadãos)
2. DESENVOLVIMENTO: 3 pontos principais com argumentos, dados e exemplos concretos
3. CONCLUSÃO: síntese e encerramento solene ou chamada à ação
Use linguagem oral, com ritmo natural, pausas marcadas e frases médias.`;
  }

  // ── Imprensa ──────────────────────────────────────────────────
  if (plataforma === "imprensa") {
    if (formato === "Release") {
      return `Siga a estrutura jornalística de release:
TÍTULO EM CAIXA ALTA (impactante, máx. 15 palavras)
Subtítulo: (opcional, aprofunda o título)

[CIDADE], [DATA] – Lead: primeiro parágrafo respondendo quem, o quê, quando, onde e por quê (máx. 50 palavras).

Corpo: 2 a 3 parágrafos com detalhes, contexto e impacto para a população.

"[Citação direta do político em primeira pessoa]", afirmou [NOME E CARGO].

Sobre o gabinete: [BOILERPLATE]

Contato: [NOME] | [EMAIL] | [TELEFONE]`;
    }
    // Nota de Imprensa
    return `Escreva uma nota de imprensa curta e objetiva:
[CIDADE], [DATA]

TÍTULO (máx. 10 palavras, em caixa alta)

Parágrafo único explicando o fato (quem, o quê, quando, onde — máx. 80 palavras).

"[Citação direta do político]", [NOME E CARGO].

Para mais informações: [CONTATO]

Máx. 150 palavras no total.`;
  }

  // ── Instagram e Facebook ──────────────────────────────────────
  if (formato === "Reels") {
    return `Crie um roteiro para Reels (vídeo curto de até 60s):

GANCHO (primeiros 3 segundos): frase única e impactante que prende imediatamente
DESENVOLVIMENTO: 3 pontos rápidos (1 linha cada, linguagem falada)
CTA FINAL: chamada para ação clara (comentar, seguir, compartilhar)

Máx. 120 palavras. Use os marcadores GANCHO:, DESENVOLVIMENTO: e CTA: claramente.`;
  }

  if (formato === "Sequência de Stories") {
    return `Crie uma sequência de 6 Stories (slides) numerados:

📍 Slide 1 — GANCHO: pergunta ou afirmação impactante (máx. 10 palavras)
📍 Slide 2 — Ponto 1 (máx. 15 palavras + 1 emoji relevante)
📍 Slide 3 — Ponto 2 (máx. 15 palavras + 1 emoji relevante)
📍 Slide 4 — Ponto 3 (máx. 15 palavras + 1 emoji relevante)
📍 Slide 5 — Dado ou citação de impacto
📍 Slide 6 — CTA: pergunta de engajamento ou chamada para ação

Use emojis nos slides e linguagem direta e visual.`;
  }

  if (formato === "Carrossel") {
    return `Crie um carrossel com 7 slides numerados:

Slide 1 — CAPA: título chamativo (máx. 8 palavras) + frase de gancho
Slides 2 a 6 — cada slide com: título curto (negrito) + 1-2 frases de desenvolvimento
Slide 7 — CTA: chamada para salvar, compartilhar ou seguir

Formate cada slide exatamente assim:
**Slide N: [Título do slide]**
[Texto do slide]

Use linguagem acessível e inclua emojis quando adequado.`;
  }

  // Foto Avulsa (Instagram ou Facebook)
  if (plataforma === "facebook") {
    return "Crie um post para Facebook com até 400 palavras. Use parágrafos curtos (3-4 linhas), linguagem acessível ao público geral e uma chamada para ação no final.";
  }
  // Instagram foto avulsa
  return "Crie um post para Instagram com até 2200 caracteres. Use parágrafos curtos, emojis quando adequado e uma chamada para ação no final.";
}

function buildPrompt(
  plataforma: string,
  formato: string,
  tema: string,
  tom: string,
  nomePolitico: string,
  partidoCargo: string,
  respostas: string[],
  tomVoz: string,
  textoReferencia: string
): string {
  const tomLabel = TOM_LABEL[tom] ?? tom;
  const formatoLabel = formato ? ` — ${formato}` : "";
  const plataformaLabel = plataforma.charAt(0).toUpperCase() + plataforma.slice(1);
  const hasHashtags = ["instagram", "facebook"].includes(plataforma);

  const instructions = getInstructions(plataforma, formato);

  const hashtagLine = hasHashtags
    ? '\n\nApós o conteúdo, adicione uma linha em branco e "HASHTAGS:" com até 10 hashtags relevantes separadas por espaço.'
    : "";

  const contextLines: string[] = [];
  if (tomVoz?.trim()) {
    contextLines.push(`Tom de voz e estilo do político: ${tomVoz.trim()}`);
  }
  if (textoReferencia?.trim()) {
    contextLines.push(`Exemplo de texto de referência do político:\n${textoReferencia.trim()}`);
  }
  if (respostas.length > 0) {
    contextLines.push(`Informações adicionais fornecidas:\n${respostas.map((r, i) => `${i + 1}. ${r}`).join("\n")}`);
  }

  const contextBlock = contextLines.length > 0
    ? `\n\nContexto adicional:\n${contextLines.join("\n\n")}`
    : "";

  return `Crie um conteúdo de ${plataformaLabel}${formatoLabel} com tom ${tomLabel} para o(a) político(a) ${nomePolitico}${partidoCargo ? ` (${partidoCargo})` : ""}.

Tema/assunto: ${tema}

${instructions}${hashtagLine}${contextBlock}

Gere apenas o conteúdo final, pronto para uso. Não adicione explicações, títulos como "Aqui está:" ou comentários.`;
}

function getMaxTokens(plataforma: string, formato: string): number {
  if (["Carrossel", "Sequência de Stories", "Discurso"].includes(formato) || plataforma === "discurso") {
    return 1500;
  }
  if (["Release", "Ofício"].includes(formato) || plataforma === "oficio") {
    return 1200;
  }
  return 900;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      plataforma,
      formato = "",
      tema,
      tom,
      nomePolitico,
      partidoCargo,
      respostas = [],
      tomVoz = "",
      textoReferencia = "",
    } = body as {
      plataforma: string;
      formato?: string;
      tema: string;
      tom: string;
      nomePolitico: string;
      partidoCargo: string;
      respostas?: string[];
      tomVoz?: string;
      textoReferencia?: string;
    };

    if (!plataforma || !tema?.trim() || !tom) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: getMaxTokens(plataforma, formato),
      system:
        "Você é um especialista em comunicação política brasileira com ampla experiência em assessoria de imprensa, marketing político e produção de conteúdo para mandatos parlamentares. Domina a língua portuguesa em registros formais e informais, as boas práticas de comunicação para redes sociais no Brasil e a produção de conteúdo adequado para diferentes plataformas e formatos digitais. Gera conteúdo original, relevante, ético e eficaz para o contexto político brasileiro.",
      messages: [
        {
          role: "user",
          content: buildPrompt(plataforma, formato, tema, tom, nomePolitico, partidoCargo, respostas, tomVoz, textoReferencia),
        },
      ],
    });

    const fullText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const hashtagMarker = "HASHTAGS:";
    const hashtagIndex = fullText.indexOf(hashtagMarker);

    let conteudo = fullText.trim();
    let hashtags = "";

    if (hashtagIndex !== -1) {
      conteudo = fullText.slice(0, hashtagIndex).trim();
      hashtags = fullText.slice(hashtagIndex + hashtagMarker.length).trim();
    }

    return NextResponse.json({ conteudo, hashtags });
  } catch (err) {
    console.error("[gerar-conteudo]", err);
    return NextResponse.json(
      { error: "Erro ao gerar conteúdo. Tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}
