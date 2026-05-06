import { createClient } from "@supabase/supabase-js";
import PublicPageClient from "./PublicPageClient";

interface PoliticoProfile {
  id: string;
  nome: string;
  nome_politico: string | null;
  cargo: string | null;
  partido: string | null;
  municipio: string | null;
  estado: string | null;
  foto_url: string | null;
  avatar_url: string | null;
  nome_gabinete: string | null;
}

interface Demanda {
  id: string;
  titulo: string | null;
  mensagem: string;
  status: string;
  categoria: string | null;
  created_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, nome_politico, cargo, partido, municipio, estado, foto_url, avatar_url, nome_gabinete")
    .eq("slug", params.slug)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
            <div className="text-5xl mb-3">🏛️</div>
            <h1 className="text-xl font-black text-white leading-tight">Perfil não encontrado</h1>
          </div>
          <div className="px-6 py-6 text-center space-y-4">
            <p className="text-slate-500 text-sm leading-relaxed">O link pode estar incorreto ou o perfil ainda não foi configurado.</p>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-left">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Se você é o político:</strong> acesse as configurações do Gabinete Pro para ativar sua página pública.
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-slate-400">Powered by <span className="text-blue-500 font-semibold">Gabinete Pro</span></p>
          </div>
        </div>
      </div>
    );
  }

  const { data: demandas } = await supabase
    .from("demandas_publicas")
    .select("id, titulo, mensagem, status, categoria, created_at")
    .eq("politico_user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <PublicPageClient
      profile={profile as PoliticoProfile}
      initialDemandas={(demandas ?? []) as Demanda[]}
    />
  );
}
