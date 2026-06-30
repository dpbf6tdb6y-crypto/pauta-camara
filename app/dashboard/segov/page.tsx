'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { exportarSegovExcel, exportarSegovPDF, COLUNAS_RELATORIO, type ColunasKey } from '@/lib/segov-export'
import { useTopbar } from '@/contexts/topbar'

const STATUS_LIST = ['Aguardando', 'Com Parecer', 'Em análise', 'Aprovado', 'Rejeitado', 'Arquivado', 'Retirado']

const STATUS_COR: Record<string, string> = {
  'Aguardando':   'bg-yellow-100 text-yellow-800',
  'Com Parecer':  'bg-purple-100 text-purple-800',
  'Em análise':   'bg-blue-100 text-blue-800',
  'Aprovado':     'bg-green-100 text-green-800',
  'Rejeitado':    'bg-red-100 text-red-800',
  'Arquivado':    'bg-gray-100 text-gray-700',
  'Retirado':     'bg-orange-100 text-orange-800',
}

export default function SeggovPage() {
  const { setLeftContent, setRightContent } = useTopbar()
  const router = useRouter()
  const [itens, setItens] = useState<any[]>([])
  const [vereadores, setVereadores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [excluindo, setExcluindo] = useState(false)
  const [menuRelatorios, setMenuRelatorios] = useState(false)
  const [modalRelatorio, setModalRelatorio] = useState(false)
  const [formatoRelatorio, setFormatoRelatorio] = useState<'excel' | 'pdf'>('excel')
  const [colunasSel, setColunasSel] = useState<Set<ColunasKey>>(
    new Set(COLUNAS_RELATORIO.map(c => c.key))
  )

  // Filtros por coluna (busca livre, aplicados sobre os itens já carregados)
  const [colProposicao, setColProposicao] = useState('')
  const [colEmenta, setColEmenta] = useState('')
  const [colVereador, setColVereador] = useState('')
  const [colComissao, setColComissao] = useState('')
  const [colStatus, setColStatus] = useState('')

  async function carregar() {
    setLoading(true)
    setSelecionados(new Set())
    const res = await fetch('/api/segov')
    setItens(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/vereadores').then(r => r.json()).then(setVereadores)
    carregar()
  }, [])

  function toggleItem(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(prev => {
        const next = new Set(prev)
        itensExibidos.forEach(i => next.delete(i.id))
        return next
      })
    } else {
      setSelecionados(prev => new Set([...prev, ...itensExibidos.map(i => i.id)]))
    }
  }

  async function excluirSelecionados() {
    if (!confirm(`Excluir ${selecionados.size} item(s) selecionado(s)?`)) return
    setExcluindo(true)
    await Promise.all([...selecionados].map(id => fetch(`/api/segov/${id}`, { method: 'DELETE' })))
    setExcluindo(false)
    carregar()
  }

  const itensExibidos = useMemo(() => itens.filter(item => {
    if (colProposicao) {
      const ref = `${item.tipo} ${item.numero}/${item.ano}`.toLowerCase()
      if (!ref.includes(colProposicao.toLowerCase())) return false
    }
    if (colEmenta && !(item.ementa || '').toLowerCase().includes(colEmenta.toLowerCase())) return false
    if (colVereador) {
      const nome = (item.vereador?.nome || item.autorNome || '').toLowerCase()
      if (!nome.includes(colVereador.toLowerCase())) return false
    }
    if (colComissao) {
      const texto = [item.observacao, item.parecerComissao, item.proxComissao].filter(Boolean).join(' ').toLowerCase()
      if (!texto.includes(colComissao.toLowerCase())) return false
    }
    if (colStatus && item.status !== colStatus) return false
    return true
  }), [itens, colProposicao, colEmenta, colVereador, colComissao, colStatus])

  const filtrosColunaAtivos = colProposicao || colEmenta || colVereador || colComissao || colStatus

  function limparFiltrosColuna() {
    setColProposicao(''); setColEmenta(''); setColVereador(''); setColComissao(''); setColStatus('')
  }

  const todosSelecionados = itensExibidos.length > 0 && itensExibidos.every(i => selecionados.has(i.id))
  const algunsSelecionados = itensExibidos.some(i => selecionados.has(i.id)) && !todosSelecionados

  const itensParaExportar = selecionados.size > 0
    ? itensExibidos.filter(i => selecionados.has(i.id))
    : itensExibidos

  // Injeta título + botões no topbar global
  useEffect(() => {
    const btn = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-normal leading-5 transition"
    setLeftContent(
      <div className="flex items-center justify-between w-full pr-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Secretaria de Governo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/segov/novo"
            className={`${btn} text-white`}
            style={{ background: '#8B0000' }}>
            + Nova Proposição
          </Link>
          <Link href="/dashboard/segov/importar"
            className={`${btn} text-white bg-green-600 hover:bg-green-700`}>
            Importar Pauta
          </Link>
          <button onClick={() => setModalRelatorio(true)}
            className={`${btn} text-white bg-blue-600 hover:bg-blue-700`}>
            {selecionados.size > 0 ? `Relatório (${selecionados.size} selecionado${selecionados.size > 1 ? 's' : ''})` : 'Relatórios'}
          </button>
        </div>
      </div>
    )
    return () => setLeftContent(null)
  }, [itensExibidos, selecionados])

  // Botão Excluir no lado direito do topbar (antes do Atualizar)
  useEffect(() => {
    if (selecionados.size === 0) {
      setRightContent(null)
      return
    }
    setRightContent(
      <button onClick={excluirSelecionados} disabled={excluindo}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-normal leading-5 text-white bg-red-400 hover:bg-red-500 transition disabled:opacity-60">
        {excluindo
          ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        }
        Excluir {selecionados.size} selecionado{selecionados.size > 1 ? 's' : ''}
      </button>
    )
    return () => setRightContent(null)
  }, [selecionados, excluindo])

  function toggleColuna(key: ColunasKey) {
    setColunasSel(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function exportar() {
    const cols = COLUNAS_RELATORIO.map(c => c.key).filter(k => colunasSel.has(k))
    if (cols.length === 0) return
    if (formatoRelatorio === 'excel') exportarSegovExcel(itensParaExportar, cols, 'segov.xlsx')
    else exportarSegovPDF(itensParaExportar, cols, 'segov.pdf')
    setModalRelatorio(false)
  }

  return (
    <div className="space-y-2">

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-scroll overflow-y-auto max-h-[calc(100vh-80px)]">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">Nenhum item encontrado</p>
            <p className="text-sm mt-1">Cadastre um novo item ou ajuste os filtros</p>
          </div>
        ) : (
          <table className="w-full min-w-[1400px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox"
                    checked={todosSelecionados}
                    ref={el => { if (el) el.indeterminate = algunsSelecionados }}
                    onChange={toggleTodos}
                    className="w-4 h-4 accent-red-800 cursor-pointer" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-32">Proposição</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-[420px]">Ementa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-36">Vereador</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-56">Comissão</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-28">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Entrada</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-28">Última mov.</th>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50/70 sticky top-[45px] z-10">
                <th className="px-4 py-2">
                  {filtrosColunaAtivos && (
                    <button onClick={limparFiltrosColuna} title="Limpar filtros de coluna"
                      className="text-gray-400 hover:text-red-600 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </th>
                <th className="px-4 py-2">
                  <input value={colProposicao} onChange={e => setColProposicao(e.target.value)}
                    placeholder="Buscar nº..."
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-800/30" />
                </th>
                <th className="px-4 py-2">
                  <input value={colEmenta} onChange={e => setColEmenta(e.target.value)}
                    placeholder="Buscar palavra ou frase na ementa..."
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-800/30" />
                </th>
                <th className="px-4 py-2">
                  <input value={colVereador} onChange={e => setColVereador(e.target.value)}
                    placeholder="Buscar nome..."
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-800/30" />
                </th>
                <th className="px-4 py-2">
                  <input value={colComissao} onChange={e => setColComissao(e.target.value)}
                    placeholder="Buscar comissão..."
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-800/30" />
                </th>
                <th className="px-4 py-2">
                  <select value={colStatus} onChange={e => setColStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded px-1 py-1 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-red-800/30">
                    <option value="">Todos</option>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {itensExibidos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum item corresponde aos filtros de coluna.{' '}
                    <button onClick={limparFiltrosColuna} className="text-red-700 hover:underline">Limpar filtros</button>
                  </td>
                </tr>
              )}
              {itensExibidos.map((item: any) => {
                const sel = selecionados.has(item.id)
                return (
                  <tr key={item.id}
                    onClick={() => router.push(`/dashboard/segov/${item.id}/editar`)}
                    className={`transition cursor-pointer ${sel ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={sel} onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 accent-red-800 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      <span className="text-xs bg-red-100 text-red-800 rounded px-1.5 py-0.5 mr-1.5">{item.tipo}</span>
                      {item.numero}/{item.ano}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-justify">{item.ementa}</td>
                    <td className="px-4 py-3">
                      {item.vereador?.nome
                        ? <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">
                            {item.vereador.nome}
                          </span>
                        : item.autorNome
                          ? <div className="flex flex-col gap-1">
                              {item.autorNome.split(/\s+e\s+|,\s+/).map((nome: string, i: number) => (
                                <span key={i} className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">
                                  {nome.trim()}
                                </span>
                              ))}
                            </div>
                          : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs space-y-1">
                      {item.observacao && (
                        <div title={item.observacao} className="text-gray-500">{item.observacao}</div>
                      )}
                      {item.parecerComissao && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.parecerConjunto && (
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-1 py-0.5 rounded">CONJ</span>
                          )}
                          <span className="text-purple-700 font-medium" title={`Parecer: ${item.parecerComissao}`}>
                            ✓ {item.parecerComissao}
                          </span>
                        </div>
                      )}
                      {item.proxComissao && (
                        <div className="text-gray-400" title={`Encaminhar: ${item.proxComissao}`}>→ {item.proxComissao}</div>
                      )}
                      {!item.observacao && !item.parecerComissao && (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COR[item.status] || 'bg-gray-100 text-gray-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {item.dataEnvio ? new Date(item.dataEnvio).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && itens.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {itensExibidos.length} {itensExibidos.length === 1 ? 'item' : 'itens'}
            {filtrosColunaAtivos && itensExibidos.length !== itens.length && (
              <span className="ml-1">de {itens.length}</span>
            )}
            {selecionados.size > 0 && (
              <>
                <span className="ml-2 text-red-600 font-medium">· {selecionados.size} selecionado(s)</span>
                <button onClick={() => setSelecionados(new Set())}
                  className="ml-2 text-gray-400 hover:text-gray-600 text-xs underline">
                  Limpar seleção
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de seleção de colunas para relatório */}
      {modalRelatorio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">Configurar Relatório</h2>
              <button onClick={() => setModalRelatorio(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
              {/* Formato */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Formato</p>
                <div className="flex gap-3">
                  {(['excel', 'pdf'] as const).map(f => (
                    <button key={f} onClick={() => setFormatoRelatorio(f)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                        formatoRelatorio === f
                          ? 'border-red-800 bg-red-50 text-red-800'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {f === 'excel' ? '📊 Excel (.xlsx)' : '📄 PDF'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colunas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colunas</p>
                  <div className="flex gap-3">
                    <button onClick={() => setColunasSel(new Set(COLUNAS_RELATORIO.map(c => c.key)))}
                      className="text-xs text-blue-600 hover:underline">Todas</button>
                    <button onClick={() => setColunasSel(new Set())}
                      className="text-xs text-gray-400 hover:underline">Limpar</button>
                  </div>
                </div>
                <div className="space-y-1">
                  {COLUNAS_RELATORIO.map(col => (
                    <label key={col.key}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <input type="checkbox" checked={colunasSel.has(col.key)}
                        onChange={() => toggleColuna(col.key)}
                        className="w-4 h-4 accent-red-800" />
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                {itensExibidos.length} item(ns) serão exportados
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalRelatorio(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={exportar} disabled={colunasSel.size === 0}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: '#8B0000' }}>
                Exportar {formatoRelatorio === 'excel' ? 'Excel' : 'PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
