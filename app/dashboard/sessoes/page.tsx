"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

type Sessao = {
  id: string
  data: string
  tipo: string
  numero?: number
  local?: string
  status: string
  itens?: { id: string }[]
}

const TIPO_SESSAO: Record<string, string> = {
  ordinaria: "Ordinária", extraordinaria: "Extraordinária",
  especial: "Especial", solene: "Solene",
}

function fmtData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  })
}

export default function SessoesPage() {
  const [lista, setLista] = useState<Sessao[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    tipo: "ordinaria",
    numero: "",
    ano: new Date().getFullYear(),
    local: "",
  })

  async function carregar() {
    const res = await fetch("/api/sessoes")
    setLista(await res.json())
  }

  useEffect(() => { carregar() }, [])

  async function excluir(id: string) {
    if (!confirm('Excluir esta sessão encerrada? Esta ação não pode ser desfeita.')) return
    await fetch(`/api/sessoes/${id}`, { method: 'DELETE' })
    carregar()
  }

  async function salvar() {
    await fetch("/api/sessoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, numero: form.numero ? +form.numero : undefined }),
    })
    setModal(false)
    setForm({ data: new Date().toISOString().slice(0, 10), tipo: "ordinaria", numero: "", ano: new Date().getFullYear(), local: "" })
    carregar()
  }

  const agendadas = lista.filter(s => s.status === "agendada")
  const encerradas = lista.filter(s => s.status !== "agendada")

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sessões & Pautas</h1>
          <p className="text-gray-500 text-sm">
            {agendadas.length} em aberto · {encerradas.length} encerrada(s)
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nova Sessão
        </button>
      </div>

      <div className="max-w-sm">
        {agendadas.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Em aberto</p>
            {agendadas.map(s => (
              <Link key={s.id} href={`/dashboard/sessoes/${s.id}`}
                className="block rounded-xl p-4 mb-2 border-2 transition hover:shadow-md"
                style={{ background: "#dcfce7", borderColor: "#86efac" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-green-900 text-sm">{TIPO_SESSAO[s.tipo] || s.tipo}</p>
                  {s.numero && <span className="text-xs text-green-700 font-medium">Nº {s.numero}</span>}
                </div>
                <p className="text-xs text-green-800 capitalize">{fmtData(s.data)}</p>
                {s.local && <p className="text-xs text-green-600 mt-0.5">{s.local}</p>}
                <p className="text-xs text-green-700 mt-1">{s.itens?.length ?? 0} item(s) na pauta</p>
              </Link>
            ))}
          </div>
        )}

        {encerradas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Encerradas</p>
            {encerradas.map(s => (
              <div key={s.id} className="relative mb-2">
                <Link href={`/dashboard/sessoes/${s.id}`}
                  className="block rounded-xl p-4 border-2 transition hover:shadow-md"
                  style={{ background: "#fee2e2", borderColor: "#fca5a5" }}>
                  <div className="flex items-center justify-between mb-1 pr-7">
                    <p className="font-semibold text-red-900 text-sm">{TIPO_SESSAO[s.tipo] || s.tipo}</p>
                    {s.numero && <span className="text-xs text-red-700 font-medium">Nº {s.numero}</span>}
                  </div>
                  <p className="text-xs text-red-800 capitalize">{fmtData(s.data)}</p>
                  {s.local && <p className="text-xs text-red-600 mt-0.5">{s.local}</p>}
                  <p className="text-xs text-red-700 mt-1">{s.itens?.length ?? 0} item(s) na pauta</p>
                </Link>
                <button
                  onClick={() => excluir(s.id)}
                  title="Excluir sessão"
                  className="absolute top-3 right-3 p-1 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-100 transition z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {lista.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Nenhuma sessão cadastrada.</p>
        )}
      </div>

      {/* Modal Nova Sessão */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Nova Sessão</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sessão</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ordinaria">Ordinária</option>
                  <option value="extraordinaria">Extraordinária</option>
                  <option value="especial">Especial</option>
                  <option value="solene">Solene</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Sessão</label>
                <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
                  placeholder="Ex: 15"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })}
                  placeholder="Ex: Plenário da Câmara"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvar}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
                Criar Sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
