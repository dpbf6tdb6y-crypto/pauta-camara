'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const TIPOS = ['PL', 'PLC', 'PDL', 'REQ', 'IND', 'MOC']
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
  const [itens, setItens] = useState<any[]>([])
  const [vereadores, setVereadores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroVereador, setFiltroVereador] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [excluindo, setExcluindo] = useState(false)

  async function carregar() {
    setLoading(true)
    setSelecionados(new Set())
    const params = new URLSearchParams()
    if (filtroTipo) params.set('tipo', filtroTipo)
    if (filtroStatus) params.set('status', filtroStatus)
    if (filtroVereador) params.set('vereadorId', filtroVereador)
    const res = await fetch(`/api/segov?${params}`)
    setItens(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/vereadores').then(r => r.json()).then(setVereadores)
  }, [])

  useEffect(() => { carregar() }, [filtroTipo, filtroStatus, filtroVereador])

  function toggleItem(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTodos() {
    if (selecionados.size === itens.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(itens.map(i => i.id)))
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este item?')) return
    await fetch(`/api/segov/${id}`, { method: 'DELETE' })
    carregar()
  }

  async function excluirSelecionados() {
    if (!confirm(`Excluir ${selecionados.size} item(s) selecionado(s)?`)) return
    setExcluindo(true)
    await Promise.all([...selecionados].map(id => fetch(`/api/segov/${id}`, { method: 'DELETE' })))
    setExcluindo(false)
    carregar()
  }

  const todosSelecionados = itens.length > 0 && selecionados.size === itens.length
  const algunsSelecionados = selecionados.size > 0 && selecionados.size < itens.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">SEGOV</h1>
          <p className="text-sm text-gray-500">Secretaria de Governo — proposições e status</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/segov/importar"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar Pauta
          </Link>
          <Link href="/dashboard/segov/novo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ background: '#8B0000' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova SEGOV
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroVereador} onChange={e => setFiltroVereador(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
          <option value="">Todos os vereadores</option>
          {vereadores.map((v: any) => <option key={v.id} value={v.id}>{v.nome}</option>)}
        </select>
        {(filtroTipo || filtroStatus || filtroVereador) && (
          <button onClick={() => { setFiltroTipo(''); setFiltroStatus(''); setFiltroVereador('') }}
            className="text-sm text-red-700 hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Barra de seleção */}
      {selecionados.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-red-800">
            {selecionados.size} {selecionados.size === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelecionados(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700 transition">
              Cancelar
            </button>
            <button onClick={excluirSelecionados} disabled={excluindo}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60">
              {excluindo ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Excluir selecionados
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox"
                    checked={todosSelecionados}
                    ref={el => { if (el) el.indeterminate = algunsSelecionados }}
                    onChange={toggleTodos}
                    className="w-4 h-4 accent-red-800 cursor-pointer" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Proposição</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ementa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vereador</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-64">Comissão</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Entrada</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Última movimentação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {itens.map((item: any) => {
                const sel = selecionados.has(item.id)
                return (
                  <tr key={item.id}
                    onClick={() => toggleItem(item.id)}
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.vereador?.nome
                        ? <span className="text-gray-600">{item.vereador.nome}</span>
                        : item.autorNome
                          ? <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{item.autorNome}</span>
                          : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs w-64 space-y-1">
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
                    <td className="px-3 py-3 w-16" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col items-end gap-1">
                        <Link href={`/dashboard/segov/${item.id}/editar`}
                          className="text-xs text-blue-600 hover:underline font-medium">Editar</Link>
                        <button onClick={() => excluir(item.id)}
                          className="text-xs text-red-500 hover:underline font-medium">Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && itens.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            {selecionados.size > 0 && (
              <span className="ml-2 text-red-600 font-medium">· {selecionados.size} selecionado(s)</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
