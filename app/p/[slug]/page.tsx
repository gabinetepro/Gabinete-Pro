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
  slug: string | null;
}

interface Demanda {
  id: string;
  descricao: string | null;
  status: string;
  created_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PublicPage({ params }: { params: { slug: string } }) {
  console.log("[p/slug] Buscando slug:", params.slug);

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("id, nome, nome_politico, cargo, partido, municipio, estado, foto_url, avatar_url, nome_gabinete, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  console.log("[p/slug] Resultado:", { id: perfil?.id, erro: erroPerfil?.message });

  if (!perfil) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Perfil não encontrado</h1>
          <p className="text-gray-500 mb-4">
            O link pode estar incorreto ou o perfil ainda não foi configurado.
          </p>
          <p className="text-sm text-gray-400">
            Powered by{" "}
            <a href="https://gabinete-pro.vercel.app" className="text-blue-500 hover:underline">
              Gabinete Pro
            </a>
          </p>
        </div>
      </div>
    );
  }

  const { data: demandas } = await supabase
    .from("demandas")
    .select("id, descricao, status, created_at")
    .eq("user_id", perfil.id)
    .in("status", ["aberta", "em_andamento", "resolvida"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PublicPageClient
      perfil={perfil as PoliticoProfile}
      demandas={(demandas ?? []) as Demanda[]}
    />
  );
}
