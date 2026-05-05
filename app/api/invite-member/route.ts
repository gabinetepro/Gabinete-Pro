import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = cookies();

  // Verify the requester is authenticated
  const supabaseUser = createServerClient(
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

  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { email } = (await req.json()) as { email: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
  }

  // Service role key required for admin.inviteUserByEmail
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("[invite-member] SUPABASE_SERVICE_ROLE_KEY não configurada");
    return NextResponse.json(
      { error: "Configuração do servidor incompleta. Contate o suporte." },
      { status: 500 }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gabinete-pro.vercel.app"}/auth/callback`,
  });

  if (error) {
    console.error("[invite-member] inviteUserByEmail error:", error.message);
    // User already exists — not a hard error, they just need to log in
    if (error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ ok: true, alreadyExists: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
