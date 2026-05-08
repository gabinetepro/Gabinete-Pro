'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ASSUNTOS = [
  'Infraestrutura',
  'Saúde',
  'Educação',
  'Segurança',
  'Meio Ambiente',
  'Habitação',
  'Assistência Social',
  'Transporte',
  'Emprego',
  'Outro',
]

const CONTATO_OPCOES = ['WhatsApp', 'Email', 'Qualquer um']

interface Perfil {
  id: string
  nome: string
  slug: string
  plano: string
}

interface Demanda {
  id: string
  descricao: string
  status: string
  created_at: string
  assunto?: string
}

export default function PublicPageClient({
  perfil,
  demandas: demandasIniciais,
}: {
  perfil: Perfil
  demandas: Demanda[]
}) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [assunto, setAssunto] = useState('')
  const [contatoPreferido, setContatoPreferido] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [demandas, setDemandas] = useState(demandasIniciais)

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome || !telefone || !email || !assunto || !descricao) return
    setEnviando(true)
    const { data, error } = await supabase.from('demandas').insert({
      user_id: perfil.id,
      nome_solicitante: nome,
      telefone_solicitante: telefone,
      email_solicitante: email,
      assunto,
      contato_preferido: contatoPreferido || null,
      descricao,
      status: 'aberta',
    }).select().single()
    if (!error && data) {
      setDemandas([data, ...demandas])
      setEnviado(true)
      setNome('')
      setTelefone('')
      setEmail('')
      setAssunto('')
      setContatoPreferido('')
      setDescricao('')
    }
    setEnviando(false)
  }

  const statusInfo: Record<string, { label: string; className: string }> = {
    aberta: { label: 'Aberta', className: 'bg-yellow-100 text-yellow-800' },
    em_andamento: { label: 'Em andamento', className: 'bg-blue-100 text-blue-800' },
    resolvida: { label: 'Resolvida', className: 'bg-green-100 text-green-800' },
  }

  const contatoLabel = contatoPreferido === 'WhatsApp'
    ? 'WhatsApp'
    : contatoPreferido === 'Email'
    ? 'email'
    : 'WhatsApp ou email'

  const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-500 py-10 px-4 text-center text-white">
        <div className="text-5xl mb-3">🏛</div>
        <h1 className="text-3xl font-bold">{perfil.nome}</h1>
        <p className="text-blue-100 mt-1 text-sm">
          Canal oficial de atendimento ao cidadão
        </p>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6 pb-12">
        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            📝 Enviar uma demanda
          </h2>
          {enviado ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-600 font-semibold text-lg">
                Demanda enviada com sucesso!
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Entraremos em contato pelo{' '}
                <span className="font-medium text-gray-700">{contatoLabel}</span>{' '}
                em breve.
              </p>
              <button
                onClick={() => setEnviado(false)}
                className="mt-5 text-sm text-blue-600 hover:underline"
              >
                Enviar outra demanda
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviar} className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome completo *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="tel"
                placeholder="Seu WhatsApp *"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="email"
                placeholder="Seu melhor email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
              <select
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                required
                className={`${inputCls} ${!assunto ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="" disabled>Assunto *</option>
                {ASSUNTOS.map((a) => (
                  <option key={a} value={a} className="text-gray-800">{a}</option>
                ))}
              </select>
              <select
                value={contatoPreferido}
                onChange={(e) => setContatoPreferido(e.target.value)}
                className={`${inputCls} ${!contatoPreferido ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="">Como prefere ser contactado? (opcional)</option>
                {CONTATO_OPCOES.map((o) => (
                  <option key={o} value={o} className="text-gray-800">{o}</option>
                ))}
              </select>
              <textarea
                placeholder="Descreva sua demanda ou solicitação *"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                rows={4}
                className={`${inputCls} resize-none`}
              />
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition text-sm disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar demanda →'}
              </button>
            </form>
          )}
        </div>

        {/* Lista de demandas */}
        {demandas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              📋 Demandas recentes
            </h2>
            <div className="space-y-3">
              {demandas.map((d) => (
                <div key={d.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {d.assunto && (
                        <span className="inline-block text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium mb-2">
                          {d.assunto}
                        </span>
                      )}
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {d.descricao && d.descricao.length > 100
                          ? d.descricao.slice(0, 100) + '…'
                          : d.descricao}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                        (statusInfo[d.status] || statusInfo.aberta).className
                      }`}
                    >
                      {(statusInfo[d.status] || statusInfo.aberta).label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-xs border-t border-gray-100">
        Powered by{' '}
        <a
          href="https://gabinete-pro.vercel.app"
          className="text-blue-500 hover:underline"
        >
          Gabinete Pro
        </a>
      </footer>
    </div>
  )
}
