import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TIPO_LABEL: Record<string, string> = {
  instagram: "Post para Instagram",
  facebook: "Post para Facebook",
  twitter: "Post para Twitter/X",
  release: "Release para imprensa",
  discurso: "Discurso",
  oficio: "Ofício",
};

const TOM_LABEL: Record<string, string> = {
  formal: "formal",
  informal: "informal e próximo do cidadão",
  emotivo: "emotivo e inspirador",
  tecnico: "técnico e informativo",
};

function buildPrompt(
  tipo: string,
  tema: string,
  tom: string,
  nomePolitico: string,
  partidoCargo: string
): string {
  const tipoLabel = TIPO_LABEL[tipo] ?? tipo;
  const tomLabel = TOM_LABEL[tom] ?? tom;
  const hasHashtags = ["instagram", "facebook", "twitter"].includes(tipo);

  let instructions = "";
  if (tipo === "twitter") {
    instructions =
      "IMPORTANTE: O post deve ter no máximo 280 caracteres (incluindo espaços e pontuação). Seja objetivo e impactante.";
  } else if (tipo === "instagram") {
    instructions =
      "O post pode ter até 2200 caracteres. Use parágrafos curtos, emojis quando adequado e uma chamada para ação no final.";
  } else if (tipo === "facebook") {
    instructions =
      "O post pode ter até 500 palavras. Use parágrafos curtos e linguagem acessível ao público em geral.";
  } else if (tipo === "release") {
    instructions =
      "Siga a estrutura padrão de release: título em caixa alta, lead (quem, o quê, quando, onde, por quê), corpo com detalhes e citação do político, e ao final 'Mais informações: [CONTATO]'.";
  } else if (tipo === "discurso") {
    instructions =
      "Estruture com: abertura (cumprimentos e saudações protocolares), desenvolvimento (3 pontos principais), e conclusão (chamada à ação ou encerramento solene). Use linguagem adequada para discurso oral.";
  } else if (tipo === "oficio") {
    instructions =
      "Siga o formato ABNT de ofício: cabeçalho com 'OFÍCIO Nº [NÚMERO]/[ANO]', local e data '[LOCAL], [DATA]', destinatário, vocativo, corpo, despedida formal ('Atenciosamente,') e espaço para assinatura.";
  }

  const hashtagLine = hasHashtags
    ? '\n\nApós o conteúdo principal, adicione uma linha em branco e então "HASHTAGS:" seguido de até 10 hashtags relevantes separadas por espaço.'
    : "";

  return `Crie um(a) ${tipoLabel} com tom ${tomLabel} para o(a) político(a) ${nomePolitico}${partidoCargo ? ` (${partidoCargo})` : ""}.

Tema/assunto: ${tema}

${instructions}${hashtagLine}

Gere apenas o conteúdo final, pronto para uso. Não adicione explicações, títulos como "Aqui está o post:" ou comentários sobre o que foi gerado.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, tema, tom, nomePolitico, partidoCargo } = body as {
      tipo: string;
      tema: string;
      tom: string;
      nomePolitico: string;
      partidoCargo: string;
    };

    if (!tipo || !tema?.trim() || !tom) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "Você é um especialista em comunicação política brasileira com ampla experiência em assessoria de imprensa, marketing político e elaboração de conteúdo para mandatos parlamentares. Domina as normas da língua portuguesa formal e informal, as boas práticas de comunicação para redes sociais no Brasil, e como adaptar mensagens para diferentes públicos políticos. Sempre gera conteúdo original, relevante, ético e adequado ao contexto político brasileiro.",
      messages: [
        {
          role: "user",
          content: buildPrompt(tipo, tema, tom, nomePolitico, partidoCargo),
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
