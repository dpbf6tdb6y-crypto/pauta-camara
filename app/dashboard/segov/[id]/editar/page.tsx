'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const TIPOS = ['PL', 'PLC', 'PDL', 'REQ', 'IND', 'MOC']
const STATUS_LIST = ['Aguardando', 'Com Parecer', 'Em análise', 'Aprovado', 'Rejeitado', 'Arquivado', 'Retirado']

type Autor = { id?: string; nome: string; isPE: boolean }

function formatNumero(n: string) {
  const digits = n.replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export default function EditarSeggovPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [vereadores, setVereadores] = useState<any[]>([])
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState({
    numero: '', ano: String(new Date().getFullYear()), tipo: 'PL',
    ementa: '', status: 'Aguardando', dataEnvio: '',
  })
  const [autores, setAutores] = useState<Autor[]>([])
  const [autorInput, setAutorInput] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/vereadores').then(r => r.json()),
      fetch('/api/segov').then(r => r.json()),
    ]).then(([vers, todos]) => {
      setVereadores(vers)
      const item = todos.find((i: any) => i.id === id)
      if (item) {
        setForm({
          numero: item.numero,
          ano: String(item.ano),
          tipo: item.tipo,
          ementa: item.ementa,
          status: item.status,
          dataEnvio: item.dataEnvio ? item.dataEnvio.split('T')[0] : '',
        })

        // Monta lista de autores a partir dos dados do item
        const lista: Autor[] = []
        const nomeRaw: string = item.autorNome || ''
        if (item.vereadorId) {
          const v = vers.find((v: any) => v.id === item.vereadorId)
          if (v) lista.push({ id: v.id, nome: v.nome, isPE: false })
        }
        if (nomeRaw) {
          const nomes = nomeRaw.split(/\s+e\s+|,\s+/).map((n: string) => n.trim()).filter(Boolean)
          for (const nome of nomes) {
            const lower = nome.toLowerCase()
            if (lower.includes('executivo') || lower.includes('prefeitura')) {
              if (!lista.some(a => a.isPE)) lista.push({ nome: 'Poder Executivo', isPE: true })
            } else {
              // tenta match com vereador se ainda não adicionado
              const matched = vers.find((v: any) => {
                const nV = v.nome.toLowerCase()
                return nome.toLowerCase().split(/\s+/).filter((p: string) => p.length > 2).some((p: string) => nV.includes(p))
              })
              if (matched && !lista.some(a => a.id === matched.id)) {
                lista.push({ id: matched.id, nome: matched.nome, isPE: false })
              } else if (!matched && !lista.some(a => a.nome === nome)) {
                lista.push({ nome, isPE: false })
              }
            }
          }
        }
        setAutores(lista)
      }
      setCarregando(false)
    })
  }, [id])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function adicionarAutor(valor: string) {
    if (!valor) return
    setAutorInput('')
    if (valor === 'executivo') {
      if (!autores.some(a => a.isPE))
        setAutores(prev => [...prev, { nome: 'Poder Executivo', isPE: true }])
      return
    }
    const v = vereadores.find((v: any) => v.id === valor)
    if (v && !autores.some(a => a.id === v.id))
      setAutores(prev => [...prev, { id: v.id, nome: v.nome, isPE: false }])
  }

  function removerAutor(idx: number) {
    setAutores(prev => prev.filter((_, i) => i !== idx))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const autorNome = autores.map(a => a.nome).join(' e ') || null
    const vereadorId = autores.find(a => !a.isPE && a.id)?.id || null
    const res = await fetch(`/api/segov/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, autorNome, vereadorId }),
    })
    if (res.ok) router.push('/dashboard/segov')
    else { alert('Erro ao salvar'); setSalvando(false) }
  }

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center">
        <Link href="/dashboard/segov"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition w-24">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-800">Editar</h1>
          <p className="text-sm text-gray-500">{form.tipo} {formatNumero(form.numero)}/{form.ano}</p>
        </div>
        <div className="w-24" />
      </div>

      <form onSubmit={salvar} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {/* Linha 1: Número | Ano | Tipo | Status */}
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Número</label>
            <input required
              value={formatNumero(form.numero)}
              onChange={e => set('numero', e.target.value.replace(/\./g, ''))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ano</label>
            <input value={form.ano} onChange={e => set('ano', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo</label>
            <select required value={form.tipo} onChange={e => set('tipo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
              {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Ementa */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ementa</label>
          <textarea required rows={6} value={form.ementa} onChange={e => set('ementa', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30 resize-none" />
        </div>

        {/* Autor */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Autor</label>
          <div className="flex gap-2 items-start">
            <select value={autorInput}
              onChange={e => { adicionarAutor(e.target.value); setAutorInput('') }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30">
              <option value="">— Selecionar autor —</option>
              <option value="executivo">⚡ Poder Executivo</option>
              <optgroup label="Vereadores">
                {vereadores.map((v: any) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </optgroup>
            </select>
            {autores.length > 0 && (
              <div className="flex flex-wrap gap-2 flex-1">
                {autores.map((a, i) => (
                  <span key={i}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      a.isPE
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                    {a.isPE && <span className="text-orange-500">⚡</span>}
                    {a.nome}
                    <button type="button" onClick={() => removerAutor(i)}
                      className="ml-0.5 text-gray-400 hover:text-red-500 transition">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Data de Envio */}
        <div className="w-48">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Data de Entrada</label>
          <input type="date" value={form.dataEnvio} onChange={e => set('dataEnvio', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link href="/dashboard/segov"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </Link>
          <button type="submit" disabled={salvando}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#8B0000' }}>
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
