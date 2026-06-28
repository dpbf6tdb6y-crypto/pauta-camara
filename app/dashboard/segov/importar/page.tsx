'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_LIST = ['Aguardando', 'Em análise', 'Aprovado', 'Rejeitado', 'Arquivado', 'Retirado']

export default function ImportarSeggovPage() {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [status, setStatus] = useState('Aprovado')
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{ atualizados: number; naoEncontrados: string[] } | null>(null)

  async function importar() {
    if (!texto.trim()) return
    setProcessando(true)
    setResultado(null)
    const res = await fetch('/api/segov/importar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, status }),
    })
    const data = await res.json()
    setResultado(data)
    setProcessando(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/segov" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Importar Pauta da Reunião</h1>
          <p className="text-sm text-gray-500">Cole o texto da pauta e o sistema atualiza os status automaticamente</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>Como funciona:</strong> Cole o texto da pauta abaixo. O sistema vai identificar automaticamente
          as proposições (ex: <em>PL 123/2026</em>, <em>REQ 45/2026</em>) e atualizar o status de cada uma
          que estiver cadastrada no SEGOV.
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Status a aplicar nas proposições encontradas
          </label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Texto da Pauta <span className="text-red-500">*</span>
          </label>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={12}
            placeholder={`Cole aqui o texto da pauta da reunião...\n\nExemplo:\n1. PL 2592/2026 - Dispõe sobre...\n2. REQ 45/2026 - Requerimento de...\n3. PLC 12/2026 - Projeto de lei complementar...`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30 resize-none font-mono"
          />
        </div>

        {resultado && (
          <div className={`rounded-lg p-4 border ${resultado.atualizados > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className={`font-semibold text-sm ${resultado.atualizados > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
              {resultado.atualizados > 0
                ? `✓ ${resultado.atualizados} proposição(ões) atualizada(s) para "${status}"`
                : '⚠ Nenhuma proposição encontrada no cadastro SEGOV'}
            </p>
            {resultado.naoEncontrados.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-yellow-700 font-medium">Identificadas no texto mas não cadastradas no SEGOV:</p>
                <ul className="mt-1 space-y-0.5">
                  {resultado.naoEncontrados.map((ref, i) => (
                    <li key={i} className="text-xs text-yellow-700">• {ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link href="/dashboard/segov"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </Link>
          <button onClick={importar} disabled={processando || !texto.trim()}
            className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#8B0000' }}>
            {processando ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Processando...
              </>
            ) : 'Processar Pauta'}
          </button>
        </div>
      </div>
    </div>
  )
}
