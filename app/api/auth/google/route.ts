import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ??
  "https://gabinete-pro.vercel.app/api/auth/google/callback";

export async function GET() {
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
