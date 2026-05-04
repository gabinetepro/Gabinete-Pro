import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { municipio, estado, cargo, interesses } = (await req.json()) as {
      municipio: string;
      estado: string;
      cargo: string;
      interesses: string[];
    };

    if (!municipio || !estado || !cargo || !interesses?.length) {
      return NextResponse.json(
        { error: "Dados de perfil incompletos." },
        { status: 400 }
      );
    }

    const interessesStr = interesses.join(", ");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system:
        "Você é um analista político especializado em pautas legislativas e comunicação política brasileira. Retorna apenas JSON válido, sem texto adicional, explicações ou markdown.",
      messages: [
        {
          role: "user",
          content: `Gere 8 pautas políticas altamente relevantes e atuais para o seguinte perfil:

Município: ${municipio}
Estado: ${estado}
Cargo: ${cargo}
Áreas de interesse: ${interessesStr}

Considere questões locais e regionais relevantes para ${municipio}/${estado}, problemas que afetam a população, e oportunidades de atuação para um(a) ${cargo}.

Retorne SOMENTE um array JSON válido com 8 objetos neste formato exato:
[
  {
    "titulo": "Título impactante e específico (máx. 10 palavras)",
    "resumo": "Resumo da situação em 2-3 linhas com contexto local e impacto para a população de ${municipio}",
    "area": "exatamente uma das áreas: ${interessesStr}",
    "relevancia": "Alta",
    "sugestao_acao": "Sugestão específica e prática de ação que o(a) ${cargo} pode tomar agora",
    "tags": ["palavra-chave1", "palavra-chave2", "palavra-chave3"]
  }
]

Distribua pelo menos 3 pautas com relevância "Alta" e o restante com "Média". Use áreas variadas. As tags devem ser curtas e relevantes.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Resposta inválida da IA");

    const pautas = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ pautas });
  } catch (err) {
    console.error("[pautas]", err);
    return NextResponse.json(
      { error: "Erro ao gerar pautas. Tente novamente." },
      { status: 500 }
    );
  }
}
