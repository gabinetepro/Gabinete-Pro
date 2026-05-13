import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { verificarLimiteIA, incrementarUsoIA } from "@/lib/limites";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: perfilLimite } = await supabase
    .from("profiles").select("plano").eq("id", user.id).maybeSingle();
  const { ok, limite } = await verificarLimiteIA(user.id, perfilLimite?.plano ?? "essencial");
  if (!ok) {
    return NextResponse.json(
      { error: `Limite de ${limite} gerações de IA por mês atingido. Faça upgrade para continuar.` },
      { status: 429 }
    );
  }

  const { titulo, data, local, descricao } = await request.json() as {
    titulo: string;
    data: string;
    local: string | null;
    descricao: string | null;
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, cargo, partido, tom_de_voz")
    .eq("id", user.id)
    .single();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const message = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: "Você é um especialista em comunicação política brasileira.",
        messages: [
          {
            role: "user",
            content: `Político: ${profile?.nome || ""}${profile?.cargo ? `, ${profile.cargo}` : ""}${profile?.partido ? ` - ${profile.partido}` : ""}.
Tom de voz: ${profile?.tom_de_voz || "formal e institucional"}.

O político tem o seguinte evento:
Título: ${titulo}
Data: ${data}
Local: ${local || "não especificado"}
Descrição: ${descricao || "sem descrição"}

Gere 3 sugestões de conteúdo e retorne APENAS um objeto JSON válido, sem markdown, sem explicações, no formato exato:
{"post":"texto do post para Instagram com até 150 palavras","oficio":"texto do ofício formal","roteiro":"roteiro de fala de 2 minutos para o evento"}`,
          },
        ],
      },
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const rawText = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(jsonText) as { post: string; oficio: string; roteiro: string };

    await incrementarUsoIA(user.id);
    return NextResponse.json({
      post: parsed.post ?? "",
      oficio: parsed.oficio ?? "",
      roteiro: parsed.roteiro ?? "",
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error("[sugerir] error:", err);
    return NextResponse.json({ error: "Erro ao gerar sugestões com IA. Tente novamente." }, { status: 500 });
  }
}
