import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Kiwify envia o token secreto como query param ?token=KIWIFY_WEBHOOK_SECRET
function verifySignature(request: NextRequest): boolean {
  const token = request.nextUrl.searchParams.get("token");
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret) return false;
  return token === secret;
}

function planFromPrice(priceInCents: number): "solo" | "assessor" | "gabinete" | null {
  if (priceInCents === 14700) return "solo";
  if (priceInCents === 24700) return "assessor";
  if (priceInCents === 39700) return "gabinete";
  return null;
}

export async function POST(request: NextRequest) {
  if (!verifySignature(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Kiwify payload shape:
  // { order_status, Customer: { email }, Product: { price } }
  const orderStatus = body.order_status as string;
  const email = (body.Customer as { email?: string })?.email;
  const priceInCents = (body.Product as { price?: number })?.price;

  if (orderStatus !== "paid" || !email || !priceInCents) {
    // Evento irrelevante — responder 200 para Kiwify não retentar
    return NextResponse.json({ received: true });
  }

  const plano = planFromPrice(priceInCents);
  if (!plano) {
    return NextResponse.json({ error: "Plano não reconhecido" }, { status: 422 });
  }

  // Usar service role key para ignorar RLS e atualizar qualquer perfil
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ plano, status: "ativo" })
    .eq("email", email);

  if (error) {
    console.error("[kiwify webhook] erro ao atualizar perfil:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, plano });
}
