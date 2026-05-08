import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const cookieStore = cookies();

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gabinete-pro.vercel.app";
  const targetEmail = email.trim().toLowerCase();

  // Gerar link de convite em vez de enviar o email padrão do Supabase
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email: targetEmail,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (linkError) {
    console.error("[invite-member] generateLink error:", linkError.message);
    if (linkError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ ok: true, alreadyExists: true });
    }
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const inviteUrl = linkData.properties?.action_link ?? `${siteUrl}/login`;

  // Nome de quem convidou (para personalizar o email)
  const { data: inviterProfile } = await supabaseUser
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();
  const inviterName = inviterProfile?.nome ?? "Um membro do gabinete";

  const htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite — Gabinete Pro</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#10b981);padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:32px;">🏛️</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                Gabinete Pro
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Gestão inteligente de gabinete político
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;font-weight:700;">
                Você foi convidado! 🎉
              </h2>
              <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6;">
                <strong style="color:#0f172a;">${inviterName}</strong> convidou você para fazer parte do
                <strong style="color:#0f172a;">Gabinete Pro</strong> — a plataforma que organiza comunicação,
                agenda e atendimento ao cidadão em um único lugar.
              </p>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">
                Clique no botão abaixo para criar sua conta e começar a usar agora mesmo.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(135deg,#2563eb,#10b981);">
                    <a
                      href="${inviteUrl}"
                      style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;"
                    >
                      Aceitar convite →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-align:center;">
                O link expira em 24 horas. Se não esperava este convite, ignore este email.
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                Com dúvidas? Fale conosco em
                <a href="mailto:suporte@gabinete-pro.vercel.app" style="color:#2563eb;text-decoration:none;">
                  suporte@gabinete-pro.vercel.app
                </a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;padding:16px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © 2025 Gabinete Pro · Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const { error: emailError } = await resend.emails.send({
    from: "Gabinete Pro <onboarding@resend.dev>",
    to: targetEmail,
    subject: `${inviterName} convidou você para o Gabinete Pro`,
    html: htmlEmail,
  });

  if (emailError) {
    console.error("[invite-member] resend error:", emailError);
    return NextResponse.json({ error: "Erro ao enviar email de convite." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
