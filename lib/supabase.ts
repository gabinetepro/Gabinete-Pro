import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient stores tokens in cookies (not localStorage),
// keeping the browser client in sync with the SSR middleware.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
