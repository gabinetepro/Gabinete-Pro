import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  "https://gabinete-pro.vercel.app/api/auth/google/callback";

const BASE = "https://gabinete-pro.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code        = searchParams.get("code");
  const state       = searchParams.get("state");
  const googleError = searchParams.get("error");

  if (googleError || !code) {
    return NextResponse.redirect(
      `${BASE}/agenda?google_error=${encodeURIComponent(googleError ?? "cancelled")}`
    );
  }

  const cookieStore = cookies();
  const savedState  = cookieStore.get("google_oauth_state")?.value;

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${BASE}/agenda?google_error=invalid_state`);
  }

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
    return NextResponse.redirect(`${BASE}/login`);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[google/callback] token exchange failed:", err);
    return NextResponse.redirect(`${BASE}/agenda?google_error=token_failed`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token:   string;
    refresh_token?: string;
    expires_in:     number;
  };

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      google_access_token:  tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry:  expiry,
      google_connected:     true,
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("[google/callback] db update error:", dbError);
    return NextResponse.redirect(`${BASE}/agenda?google_error=save_failed`);
  }

  const response = NextResponse.redirect(`${BASE}/agenda?google=connected`);
  response.cookies.delete("google_oauth_state");
  return response;
}
