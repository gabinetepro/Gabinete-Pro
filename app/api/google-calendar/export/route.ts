import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getGoogleToken } from "@/lib/googleAuth";

function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nextDay(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().substring(0, 10);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { eventoId: string };
  const { eventoId } = body;

  if (!eventoId) {
    return NextResponse.json({ error: "eventoId é obrigatório." }, { status: 400 });
  }

  const auth = await getGoogleToken();
  if (!auth) {
    return NextResponse.json(
      { error: "Google não conectado. Reconecte sua conta.", needsReconnect: true },
      { status: 401 }
    );
  }

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

  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .eq("user_id", auth.userId)
    .single();

  if (!evento) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  type GCalTime = { dateTime: string; timeZone: string } | { date: string };

  let start: GCalTime;
  let end:   GCalTime;

  if (evento.hora_inicio) {
    const endTime = evento.hora_fim ?? addOneHour(evento.hora_inicio as string);
    start = { dateTime: `${evento.data}T${evento.hora_inicio}:00`, timeZone: "America/Sao_Paulo" };
    end   = { dateTime: `${evento.data}T${endTime}:00`,            timeZone: "America/Sao_Paulo" };
  } else {
    start = { date: evento.data as string };
    end   = { date: nextDay(evento.data as string) };
  }

  const gcalEvent: Record<string, unknown> = { summary: evento.titulo, start, end };
  if (evento.descricao) gcalEvent.description = evento.descricao;
  if (evento.local)     gcalEvent.location     = evento.local;

  const createRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gcalEvent),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("[export] Google Calendar API error:", errText);
    const needsReconnect = createRes.status === 401;
    return NextResponse.json(
      { error: "Erro ao exportar para o Google Calendar.", needsReconnect },
      { status: 502 }
    );
  }

  const created = (await createRes.json()) as { id: string };
  return NextResponse.json({ googleEventId: created.id });
}
