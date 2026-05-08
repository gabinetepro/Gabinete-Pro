import { createClient } from '@supabase/supabase-js'
import PublicPageClient from './PublicPageClient'

export default async function PublicPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: perfil } = await supabase
    .from('profiles')
    .select('id, nome, slug, plano')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!perfil) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🏛</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Perfil não encontrado</h1>
        <p className="text-gray-500 mb-6 text-center">
          O link pode estar incorreto ou o perfil ainda não foi configurado.
        </p>
        <p className="text-sm text-gray-400">
          Powered by{' '}
          <a href="https://gabinete-pro.vercel.app" className="text-blue-500">
            Gabinete Pro
          </a>
        </p>
      </div>
    )
  }

  const { data: demandas } = await supabase
    .from('demandas')
    .select('id, descricao, status, created_at, nome_solicitante')
    .eq('user_id', perfil.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return <PublicPageClient perfil={perfil} demandas={demandas || []} />
}
