import { NextResponse } from "next/server";

function buildEmailHtml(params: {
  nome: string;
  protocolo: string;
  mensagemOriginal: string;
  resposta: string;
  nomePolitico: string;
  cargo: string | null;
}): string {
  const { nome, protocolo, mensagemOriginal, resposta, nomePolitico, cargo } = params;
  const cargoLabel = cargo ? `${cargo}` : "Gabinete";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resposta à sua mensagem</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:32px 40px;">
              <p style="margin:0;color:#c7d2fe;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Gabinete Pro</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Resposta do ${cargoLabel}</h1>
              <p style="margin:6px 0 0;color:#a5b4fc;font-size:13px;">${nomePolitico}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Olá, <strong style="color:#1e293b;">${nome}</strong></p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                Recebemos sua mensagem e preparamos uma resposta para você. Obrigado pelo contato!
              </p>

              <!-- Protocol -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;letter-spacing:0.5px;">PROTOCOLO</p>
                <p style="margin:4px 0 0;font-size:14px;color:#334155;font-weight:700;font-family:monospace;">${protocolo}</p>
              </div>

              <!-- Original message -->
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Sua mensagem</p>
              <div style="background:#f1f5f9;border-left:3px solid #cbd5e1;border-radius:4px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${mensagemOriginal.replace(/\n/g, "<br>")}</p>
              </div>

              <!-- Response -->
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;">Nossa resposta</p>
              <div style="background:#eef2ff;border-left:3px solid #4f46e5;border-radius:4px;padding:16px;margin-bottom:32px;">
                <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${resposta.replace(/\n/g, "<br>")}</p>
              </div>

              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                Se tiver mais dúvidas, entre em contato novamente.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Esta mensagem foi enviada pelo <strong>Gabinete Pro</strong> em nome de ${nomePolitico}.<br/>
                Por favor, não responda este email diretamente.
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
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      emailTo: string;
      nome: string;
      protocolo: string;
      mensagemOriginal: string;
      resposta: string;
      nomePolitico: string;
      cargo: string | null;
    };

    const { emailTo, nome, protocolo, mensagemOriginal, resposta, nomePolitico, cargo } = body;

    if (!emailTo || !resposta?.trim()) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      // No email service configured — log and return success so UI flow continues
      console.log("[enviar-resposta] RESEND_API_KEY não configurado. Resposta salva no banco apenas.");
      return NextResponse.json({ ok: true, method: "db_only" });
    }

    const html = buildEmailHtml({ nome, protocolo, mensagemOriginal, resposta, nomePolitico, cargo });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gabinete Pro <noreply@gabinete.pro>",
        to: emailTo,
        subject: `Resposta à sua mensagem — Protocolo ${protocolo}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[enviar-resposta] Resend error:", err);
      return NextResponse.json({ error: "Falha ao enviar email." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, method: "email" });
  } catch (err) {
    console.error("[enviar-resposta]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
