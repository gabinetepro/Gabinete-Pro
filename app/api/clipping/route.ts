import { NextResponse } from "next/server";

interface RawArticle {
  source: { id: string | null; name: string };
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
}

interface NewsApiResponse {
  status: string;
  articles?: RawArticle[];
  message?: string;
  code?: string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave da NewsAPI não configurada no servidor." },
        { status: 500 }
      );
    }

    const { municipio, estado, interesses } = (await req.json()) as {
      municipio: string;
      estado: string;
      interesses?: string[];
    };

    if (!municipio || !estado) {
      return NextResponse.json(
        { error: "Município e estado são obrigatórios." },
        { status: 400 }
      );
    }

    // Build query: municipality + state + up to 2 interest areas
    const terms = [municipio, estado, ...(interesses ?? []).slice(0, 2)];
    const q = terms.map((t) => `"${t}"`).join(" OR ");

    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const apiUrl =
      `https://newsapi.org/v2/everything` +
      `?q=${encodeURIComponent(q)}` +
      `&language=pt` +
      `&sortBy=publishedAt` +
      `&pageSize=30` +
      `&from=${from}` +
      `&apiKey=${apiKey}`;

    const response = await fetch(apiUrl, { cache: "no-store" });
    const data = (await response.json()) as NewsApiResponse;

    if (data.status !== "ok") {
      console.error("[clipping] NewsAPI error:", data.message, data.code);
      return NextResponse.json(
        { error: data.message ?? "Erro ao buscar notícias." },
        { status: 502 }
      );
    }

    const articles = (data.articles ?? [])
      .filter(
        (a) =>
          a.title &&
          a.title !== "[Removed]" &&
          a.url &&
          a.url !== "https://removed.com"
      )
      .slice(0, 24);

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[clipping]", err);
    return NextResponse.json(
      { error: "Erro ao buscar notícias. Tente novamente." },
      { status: 500 }
    );
  }
}
