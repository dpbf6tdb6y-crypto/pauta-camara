'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'

const STATUS_LIST = ['Aguardando', 'Em análise', 'Aprovado', 'Rejeitado', 'Arquivado', 'Retirado']

type Modo = 'texto' | 'pdf' | 'word' | 'excel'

const MODOS: { id: Modo; label: string; ext: string; accept: string; cor: string; icone: React.ReactNode }[] = [
  {
    id: 'texto', label: 'Colar Texto', ext: '', accept: '',
    cor: 'border-gray-300 text-gray-700',
    icone: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
  },
  {
    id: 'pdf', label: 'PDF', ext: '.pdf', accept: 'application/pdf,.pdf',
    cor: 'border-red-400 text-red-700',
    icone: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <text x="8" y="17" style={{fontSize:'6px',fill:'#dc2626',fontWeight:'bold',stroke:'none'}}>PDF</text>
      </svg>
    ),
  },
  {
    id: 'word', label: 'Word', ext: '.docx,.doc', accept: '.docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    cor: 'border-blue-400 text-blue-700',
    icone: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <text x="7.5" y="17" style={{fontSize:'5px',fill:'#1d4ed8',fontWeight:'bold',stroke:'none'}}>DOC</text>
      </svg>
    ),
  },
  {
    id: 'excel', label: 'Excel', ext: '.xlsx,.xls', accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    cor: 'border-green-500 text-green-700',
    icone: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <text x="7.5" y="17" style={{fontSize:'5px',fill:'#15803d',fontWeight:'bold',stroke:'none'}}>XLS</text>
      </svg>
    ),
  },
]

export default function ImportarSeggovPage() {
  const [modo, setModo] = useState<Modo>('texto')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [status, setStatus] = useState('Aprovado')
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{ atualizados: number; naoEncontrados: string[]; totalEncontrados?: number } | null>(null)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const modoAtual = MODOS.find(m => m.id === modo)!

  function selecionarModo(m: Modo) {
    setModo(m)
    setArquivo(null)
    setResultado(null)
    setErro('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function processar() {
    setProcessando(true)
    setResultado(null)
    setErro('')

    try {
      let res: Response

      if (modo === 'texto') {
        if (!texto.trim()) { setProcessando(false); return }
        res = await fetch('/api/segov/importar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto, status }),
        })
      } else {
        if (!arquivo) { setProcessando(false); return }
        const form = new FormData()
        form.append('file', arquivo)
        form.append('status', status)
        res = await fetch('/api/segov/importar-arquivo', { method: 'POST', body: form })
      }

      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao processar')
      } else {
        setResultado(data)
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }

    setProcessando(false)
  }

  const podeProcesar = modo === 'texto' ? texto.trim().length > 0 : arquivo !== null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/segov" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Importar Pauta da Reunião</h1>
          <p className="text-sm text-gray-500">Identifica proposições automaticamente e atualiza os status</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* Seleção de formato */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Formato do arquivo</p>
          <div className="grid grid-cols-4 gap-3">
            {MODOS.map(m => (
              <button
                key={m.id}
                onClick={() => selecionarModo(m.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition text-sm font-semibold ${
                  modo === m.id
                    ? `${m.cor} bg-gray-50 shadow-sm`
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
                }`}
              >
                <div className={modo === m.id ? '' : 'opacity-40'}>{m.icone}</div>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          O sistema identifica referências como <em>PL 123/2026</em>, <em>REQ 45/2026</em> e atualiza o
          status de cada proposição cadastrada no SEGOV.
        </div>

        {/* Status a aplicar */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Status a aplicar nas proposições encontradas
          </label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Área de input */}
        {modo === 'texto' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Texto da Pauta <span className="text-red-500">*</span>
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={10}
              placeholder={`Cole aqui o texto da pauta...\n\nExemplo:\n1. PL 2592/2026 - Dispõe sobre...\n2. REQ 45/2026 - Requerimento de...`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30 resize-none font-mono"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Arquivo {modoAtual.label} <span className="text-red-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                arquivo ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onClick={() => inputRef.current?.click()}
            >
              {arquivo ? (
                <div className="space-y-1">
                  <svg className="w-10 h-10 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-green-700 text-sm">{arquivo.name}</p>
                  <p className="text-xs text-green-600">{(arquivo.size / 1024).toFixed(1)} KB — clique para trocar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="w-10 h-10 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">Clique para selecionar o arquivo</p>
                  <p className="text-xs text-gray-400">{modoAtual.ext} — arraste ou clique</p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={modoAtual.accept}
              className="hidden"
              onChange={e => {
                setArquivo(e.target.files?.[0] ?? null)
                setResultado(null)
                setErro('')
              }}
            />
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
            {erro}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className={`rounded-lg p-4 border ${resultado.atualizados > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className={`font-semibold text-sm ${resultado.atualizados > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
              {resultado.atualizados > 0
                ? `✓ ${resultado.atualizados} proposição(ões) atualizada(s) para "${status}"`
                : '⚠ Nenhuma proposição encontrada no cadastro SEGOV'}
              {resultado.totalEncontrados !== undefined && resultado.totalEncontrados > resultado.atualizados && (
                <span className="font-normal text-xs ml-2">
                  ({resultado.totalEncontrados} referências identificadas no documento)
                </span>
              )}
            </p>
            {resultado.naoEncontrados.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-yellow-700">Identificadas no documento mas não cadastradas no SEGOV:</p>
                <ul className="mt-1 space-y-0.5">
                  {resultado.naoEncontrados.map((ref, i) => (
                    <li key={i} className="text-xs text-yellow-700">• {ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link href="/dashboard/segov"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </Link>
          <button
            onClick={processar}
            disabled={processando || !podeProcesar}
            className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#8B0000' }}
          >
            {processando ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Processando...
              </>
            ) : 'Processar'}
          </button>
        </div>
      </div>
    </div>
  )
}
