import { createClient } from "@supabase/supabase-js";

// SQL needed:
// CREATE TABLE public.uso_ia (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   mes text NOT NULL,
//   quantidade integer DEFAULT 0 NOT NULL,
//   UNIQUE(user_id, mes)
// );
// ALTER TABLE public.uso_ia ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "own" ON public.uso_ia FOR ALL USING (auth.uid() = user_id);

export const LIMITES_PLANO: Record<string, number> = {
  essencial:    150,
  profissional: 500,
  gabinete:     999999,
  // backwards compat with old plan names
  solo:         150,
  assessor:     500,
  trial:        30,
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function verificarLimiteIA(
  userId: string,
  plano: string
): Promise<{ ok: boolean; uso: number; limite: number }> {
  const limite = LIMITES_PLANO[plano] ?? LIMITES_PLANO.essencial;
  if (limite >= 999999) return { ok: true, uso: 0, limite };

  const mes = currentMonth();
  const { data } = await adminClient()
    .from("uso_ia")
    .select("quantidade")
    .eq("user_id", userId)
    .eq("mes", mes)
    .maybeSingle();

  const uso = data?.quantidade ?? 0;
  return { ok: uso < limite, uso, limite };
}

export async function incrementarUsoIA(userId: string): Promise<void> {
  const db = adminClient();
  const mes = currentMonth();

  const { data } = await db
    .from("uso_ia")
    .select("id, quantidade")
    .eq("user_id", userId)
    .eq("mes", mes)
    .maybeSingle();

  if (data) {
    await db.from("uso_ia").update({ quantidade: data.quantidade + 1 }).eq("id", data.id);
  } else {
    await db.from("uso_ia").insert({ user_id: userId, mes, quantidade: 1 });
  }
}
