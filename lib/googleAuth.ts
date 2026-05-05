import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface GoogleToken {
  accessToken: string;
  userId: string;
}

export async function getGoogleToken(): Promise<GoogleToken | null> {
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
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expiry, google_connected")
    .eq("id", user.id)
    .single();

  if (!profile?.google_connected || !profile.google_access_token) return null;

  const expiry = profile.google_token_expiry ? new Date(profile.google_token_expiry) : null;
  const needsRefresh = !expiry || expiry.getTime() - Date.now() < 5 * 60 * 1000;

  if (!needsRefresh) {
    return { accessToken: profile.google_access_token as string, userId: user.id };
  }

  if (!profile.google_refresh_token) return null;

  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: profile.google_refresh_token as string,
      grant_type:    "refresh_token",
    }).toString(),
  });

  if (!refreshRes.ok) return null;

  const refreshed = (await refreshRes.json()) as { access_token: string; expires_in: number };
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("profiles")
    .update({ google_access_token: refreshed.access_token, google_token_expiry: newExpiry })
    .eq("id", user.id);

  return { accessToken: refreshed.access_token, userId: user.id };
}
