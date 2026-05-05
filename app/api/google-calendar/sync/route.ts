import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getGoogleToken } from "@/lib/googleAuth";

interface GoogleCalEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start: { dateTime?: string; date?: string };
  end:   { dateTime?: string; date?: string };
}

function extractDate(dt?: string, d?: string): string {
  if (dt) return dt.substring(0, 10);
  return d ?? "";
}

function extractTime(dt?: string): string | null {
  if (!dt) return null;
  // Extract HH:MM from ISO string (e.g. "2024-01-15T09:00:00-03:00")
  const match = dt.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

export async function POST() {
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

  const now    = new Date().toISOString();
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const gcalRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(now)}` +
    `&timeMax=${encodeURIComponent(future)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=100`,
    { headers: { Authorization: `Bearer ${auth.accessToken}` } }
  );

  if (!gcalRes.ok) {
    const errText = await gcalRes.text();
    console.error("[sync] Google Calendar API error:", errText);
    const needsReconnect = gcalRes.status === 401;
    return NextResponse.json(
      { error: "Erro ao buscar eventos do Google Calendar.", needsReconnect },
      { status: 502 }
    );
  }

  const gcalData = (await gcalRes.json()) as { items?: GoogleCalEvent[] };
  const items = (gcalData.items ?? []).filter((e) => e.status !== "cancelled");

  // Get already-synced google_event_ids for this user to avoid duplicates
  const { data: existing } = await supabase
    .from("eventos")
    .select("google_event_id")
    .eq("user_id", auth.userId)
    .not("google_event_id", "is", null);

  const synced = new Set((existing ?? []).map((e) => e.google_event_id as string));

  const toInsert = items
    .filter((e) => !synced.has(e.id))
    .map((e) => ({
      user_id:         auth.userId,
      titulo:          e.summary ?? "(Sem título)",
      tipo:            "evento" as const,
      data:            extractDate(e.start.dateTime, e.start.date),
      hora_inicio:     extractTime(e.start.dateTime),
      hora_fim:        extractTime(e.end.dateTime),
      local:           e.location ?? null,
      descricao:       e.description ?? null,
      participantes:   null,
      google_event_id: e.id,
    }))
    .filter((e) => e.data);

  if (toInsert.length > 0) {
    const { error } = await supabase.from("eventos").insert(toInsert);
    if (error) {
      console.error("[sync] insert error:", error);
      return NextResponse.json({ error: "Erro ao salvar eventos." }, { status: 500 });
    }
  }

  return NextResponse.json({ count: toInsert.length });
}
