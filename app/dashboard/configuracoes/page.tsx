'use client'
import { useEffect, useState } from 'react'

type Opcao = { id: string; tipo: string; nome: string; ativo: boolean; ordem: number }
type Tipo = 'origem' | 'categoria' | 'secretaria'

const ABAS: { id: Tipo; label: string }[] = [
  { id: 'origem',     label: 'Origens' },
  { id: 'categoria',  label: 'Categorias' },
  { id: 'secretaria', label: 'Secretarias Responsáveis' },
]

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<Tipo>('origem')
  const [opcoes, setOpcoes] = useState<Opcao[]>([])
  const [novo, setNovo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')

  async function carregar(tipo: Tipo) {
    const res = await fetch(`/api/config-opcoes?tipo=${tipo}`)
    const data = await res.json()
    setOpcoes(data)
  }

  useEffect(() => { carregar(aba) }, [aba])

  async function adicionar() {
    if (!novo.trim()) return
    setSalvando(true)
    await fetch('/api/config-opcoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: aba, nome: novo.trim() }),
    })
    setNovo('')
    setSalvando(false)
    carregar(aba)
  }

  async function salvarEdicao(id: string) {
    if (!editNome.trim()) return
    await fetch(`/api/config-opcoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editNome.trim() }),
    })
    setEditandoId(null)
    carregar(aba)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta opção?')) return
    await fetch(`/api/config-opcoes/${id}`, { method: 'DELETE' })
    carregar(aba)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await fetch(`/api/config-opcoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ativo }),
    })
    carregar(aba)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie as opções dos dropdowns de Requerimentos e TAGs</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
              aba === a.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Adicionar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Adicionar {ABAS.find(a => a.id === aba)?.label.slice(0, -1)}
        </p>
        <div className="flex gap-2">
          <input
            value={novo}
            onChange={e => setNovo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionar())}
            placeholder={`Nome da ${aba === 'secretaria' ? 'secretaria' : aba}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30"
          />
          <button onClick={adicionar} disabled={salvando || !novo.trim()}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: '#8B0000' }}>
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {opcoes.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Nenhuma opção cadastrada.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {opcoes.map(op => (
              <li key={op.id} className="flex items-center gap-3 px-4 py-3">
                {editandoId === op.id ? (
                  <>
                    <input autoFocus value={editNome} onChange={e => setEditNome(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(op.id); if (e.key === 'Escape') setEditandoId(null) }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30" />
                    <button onClick={() => salvarEdicao(op.id)}
                      className="text-xs font-semibold text-green-700 hover:text-green-900 transition px-2 py-1 rounded border border-green-200 bg-green-50">
                      Salvar
                    </button>
                    <button onClick={() => setEditandoId(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition px-2 py-1 rounded border border-gray-200">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${op.ativo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                      {op.nome}
                    </span>
                    <button onClick={() => toggleAtivo(op.id, op.ativo)}
                      className={`text-xs px-2 py-0.5 rounded border font-medium transition ${
                        op.ativo ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' : 'border-gray-200 text-gray-400 bg-gray-50 hover:bg-gray-100'
                      }`}>
                      {op.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => { setEditandoId(op.id); setEditNome(op.nome) }}
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => excluir(op.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
