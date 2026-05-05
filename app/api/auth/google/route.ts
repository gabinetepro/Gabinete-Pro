import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  "https://gabinete-pro.vercel.app/api/auth/google/callback";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) console.error("[google/auth] GOOGLE_CLIENT_ID env var is missing");
  if (!process.env.GOOGLE_CLIENT_SECRET) console.error("[google/auth] GOOGLE_CLIENT_SECRET env var is missing");
  console.log("[google/auth] REDIRECT_URI:", REDIRECT_URI);

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
    return NextResponse.redirect("https://gabinete-pro.vercel.app/login");
  }

  const state = crypto.randomUUID();

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id",     process.env.GOOGLE_CLIENT_ID!);
  googleUrl.searchParams.set("redirect_uri",  REDIRECT_URI);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope",         "https://www.googleapis.com/auth/calendar");
  googleUrl.searchParams.set("access_type",   "offline");
  googleUrl.searchParams.set("prompt",        "consent");
  googleUrl.searchParams.set("state",         state);

  console.log("[google/auth] Redirecting to Google OAuth:", googleUrl.toString());
  const response = NextResponse.redirect(googleUrl.toString());
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    maxAge:   600,
    path:     "/",
  });

  return response;
}
