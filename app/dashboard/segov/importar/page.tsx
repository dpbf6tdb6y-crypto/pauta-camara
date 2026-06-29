'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Modo = 'texto' | 'pdf' | 'word' | 'excel'
type Etapa = 'upload' | 'revisao' | 'sucesso'

type ItemExtraido = {
  tipo: string
  numero: string
  ano: number
  ementa: string
  jaExiste: boolean
  incluir: boolean
  observacao?: string
  dataEnvio?: string
}

const MODOS: { id: Modo; label: string; accept: string; ext: string }[] = [
  { id: 'texto', label: 'Colar Texto', accept: '', ext: '' },
  { id: 'pdf',   label: 'PDF',         accept: 'application/pdf,.pdf', ext: '.pdf' },
  { id: 'word',  label: 'Word',        accept: '.docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx' },
  { id: 'excel', label: 'Excel',       accept: '.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx' },
]

const TIPO_COR: Record<string, string> = {
  PL: 'bg-blue-100 text-blue-800',
  PLC: 'bg-indigo-100 text-indigo-800',
  PDL: 'bg-violet-100 text-violet-800',
  REQ: 'bg-amber-100 text-amber-800',
  IND: 'bg-teal-100 text-teal-800',
  MOC: 'bg-pink-100 text-pink-800',
}

const ICONE: Record<Modo, React.ReactNode> = {
  texto: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  ),
  pdf: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  word: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  excel: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M3 14h18M10 3v18M3 3h18v18H3V3z" />
    </svg>
  ),
}

const COR_MODO: Record<Modo, string> = {
  texto: 'border-gray-400 text-gray-700',
  pdf:   'border-red-500 text-red-700',
  word:  'border-blue-500 text-blue-700',
  excel: 'border-green-600 text-green-700',
}

export default function ImportarSeggovPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('upload')
  const [modo, setModo] = useState<Modo>('pdf')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [extraindo, setExtraindo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [itens, setItens] = useState<ItemExtraido[]>([])
  const [dataEnvio, setDataEnvio] = useState<string | undefined>(undefined)
  const [resultado, setResultado] = useState<{ criados: number; erros: number } | null>(null)

  function trocarModo(m: Modo) {
    setModo(m)
    setArquivo(null)
    setErro('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function extrair() {
    setExtraindo(true)
    setErro('')

    try {
      let res: Response
      if (modo === 'texto') {
        res = await fetch('/api/segov/extrair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto }),
        })
      } else {
        if (!arquivo) { setExtraindo(false); return }
        const form = new FormData()
        form.append('file', arquivo)
        res = await fetch('/api/segov/extrair', { method: 'POST', body: form })
      }

      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao extrair')
        setExtraindo(false)
        return
      }

      if (data.proposicoes.length === 0) {
        setErro('Nenhuma proposição encontrada no documento. Verifique se o arquivo contém referências como "PL 123/2026".')
        setExtraindo(false)
        return
      }

      setDataEnvio(data.dataEnvio)
      setItens(data.proposicoes.map((p: any) => ({
        ...p,
        incluir: !p.jaExiste,
      })))
      setEtapa('revisao')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }

    setExtraindo(false)
  }

  function atualizarEmenta(idx: number, ementa: string) {
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, ementa } : it))
  }

  function toggleIncluir(idx: number) {
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, incluir: !it.incluir } : it))
  }

  function removerLinha(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  const paraCadastrar = itens.filter(it => it.incluir && !it.jaExiste)

  async function cadastrar() {
    setSalvando(true)
    const res = await fetch('/api/segov/criar-lote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: paraCadastrar.map(it => ({
          ...it,
          dataEnvio: it.dataEnvio ?? dataEnvio,
        })),
      }),
    })
    const data = await res.json()
    setResultado(data)
    setEtapa('sucesso')
    setSalvando(false)
  }

  const podaExtrair = modo === 'texto' ? texto.trim().length > 0 : arquivo !== null

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/segov" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Importar para o SEGOV</h1>
          <p className="text-sm text-gray-500">Extrai proposições do documento e cadastra automaticamente</p>
        </div>
      </div>

      {/* ETAPA 1 — Upload */}
      {etapa === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Seleção de formato */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Formato do arquivo</p>
            <div className="grid grid-cols-4 gap-3">
              {MODOS.map(m => (
                <button key={m.id} onClick={() => trocarModo(m.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition text-sm font-semibold ${
                    modo === m.id ? `${COR_MODO[m.id]} bg-gray-50 shadow-sm` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}>
                  <div className={modo === m.id ? '' : 'opacity-30'}>{ICONE[m.id]}</div>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Área de input */}
          {modo === 'texto' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Texto da Pauta</label>
                {texto && (
                  <button onClick={() => setTexto('')}
                    className="text-xs text-gray-400 hover:text-red-600 transition flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar
                  </button>
                )}
              </div>
              <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={12}
                placeholder={"Cole aqui o texto da pauta...\n\nExemplo:\n1. PL 2592/2026 - Dispõe sobre a criação de...\n2. REQ 45/2026 - Requerimento de informações sobre..."}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30 resize-none font-mono" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Arquivo {MODOS.find(m2 => m2.id === modo)?.label}
              </label>
              <div onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
                  arquivo ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}>
                {arquivo ? (
                  <div className="space-y-1">
                    <svg className="w-10 h-10 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-green-700">{arquivo.name}</p>
                    <p className="text-xs text-green-600">{(arquivo.size / 1024).toFixed(1)} KB — clique para trocar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-gray-400">{MODOS.find(m2 => m2.id === modo)?.ext}</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept={MODOS.find(m2 => m2.id === modo)?.accept} className="hidden"
                onChange={e => { setArquivo(e.target.files?.[0] ?? null); setErro('') }} />
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{erro}</div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button onClick={extrair} disabled={extraindo || !podaExtrair}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ background: '#8B0000' }}>
              {extraindo ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Extraindo...
                </>
              ) : 'Extrair Proposições'}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2 — Revisão */}
      {etapa === 'revisao' && (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-gray-800">
                {itens.length} proposição(ões) encontrada(s)
                {dataEnvio && (
                  <span className="ml-2 text-sm font-normal text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Sessão de {new Date(dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {paraCadastrar.length} nova(s) para cadastrar · seção &quot;Apresentação de proposições&quot;
                {itens.filter(it => it.jaExiste).length > 0 && (
                  <span className="ml-2 text-amber-600">
                    · {itens.filter(it => it.jaExiste).length} já cadastrada(s) no SEGOV
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEtapa('upload'); setErro('') }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                Voltar
              </button>
              <button onClick={cadastrar} disabled={salvando || paraCadastrar.length === 0}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ background: '#8B0000' }}>
                {salvando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Cadastrando...
                  </>
                ) : `Cadastrar ${paraCadastrar.length} no SEGOV`}
              </button>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox"
                      checked={itens.filter(it => !it.jaExiste).every(it => it.incluir)}
                      onChange={e => setItens(prev => prev.map(it => it.jaExiste ? it : { ...it, incluir: e.target.checked }))}
                      className="w-4 h-4 accent-red-800" />
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Proposição</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600">Ementa extraída</th>
                  <th className="w-8 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itens.map((item, idx) => (
                  <tr key={idx} className={`transition ${item.jaExiste ? 'bg-amber-50/50' : item.incluir ? '' : 'opacity-50'}`}>
                    <td className="px-3 py-3 text-center">
                      {item.jaExiste ? (
                        <span title="Já cadastrado no SEGOV">
                          <svg className="w-4 h-4 text-amber-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                        </span>
                      ) : (
                        <input type="checkbox" checked={item.incluir} onChange={() => toggleIncluir(idx)}
                          className="w-4 h-4 accent-red-800" />
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${TIPO_COR[item.tipo] || 'bg-gray-100 text-gray-700'}`}>
                          {item.tipo}
                        </span>
                        <span className="font-semibold text-gray-800">{item.numero}/{item.ano}</span>
                      </div>
                      {item.jaExiste && (
                        <span className="text-xs text-amber-600 font-medium">Já no SEGOV</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.ementa}
                        onChange={e => atualizarEmenta(idx, e.target.value)}
                        placeholder="Ementa não extraída — preencha manualmente"
                        disabled={item.jaExiste}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-800/30 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      {item.observacao && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          {item.observacao}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => removerLinha(idx)} title="Remover linha"
                        className="text-gray-300 hover:text-red-500 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ETAPA 3 — Sucesso */}
      {etapa === 'sucesso' && resultado && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">
              {resultado.criados} proposição(ões) cadastrada(s) no SEGOV
            </p>
            {resultado.erros > 0 && (
              <p className="text-sm text-red-600 mt-1">{resultado.erros} erro(s) — verifique se já existem entradas duplicadas</p>
            )}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => { setEtapa('upload'); setItens([]); setArquivo(null); setTexto(''); setResultado(null); setDataEnvio(undefined) }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
              Nova Importação
            </button>
            <Link href="/dashboard/segov"
              className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition"
              style={{ background: '#8B0000' }}>
              Ver no SEGOV
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
