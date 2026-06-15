"use client"
import { useEffect, useState } from "react"

type Vereador = { id: string; nome: string; partido: string }
type Comissao = { id: string; nome: string; sigla?: string }
type ProposicaoComissao = {
  id: string; ordem: number; status: string
  parecer?: string; parecerTexto?: string; parecerConjunto: boolean
  dataVotacao?: string
  comissao: Comissao
  analista?: { nome: string }
  votos: { aprovado: boolean; vereador: Vereador }[]
}
type Emenda = {
  id: string; tipo: string; artigo: string; texto: string; autorNome?: string
  autorVereador?: Vereador
}
type PropDetalhe = {
  id: string; numero: string; ano: number; tipo: string; ementa: string
  origemTipo: string; autorExterno?: string; dataEntrada: string
  status: string; dispensaParecer: boolean; dispensaIntersticio: boolean
  regimeUrgencia: boolean; numVotacoes: number; destinoFinal: string
  autorVereador?: Vereador
  comissoes: ProposicaoComissao[]
  emendas: Emenda[]
}

const TIPO: Record<string, string> = { pl: "Projeto de Lei", resolucao: "Resolução", requerimento: "Requerimento", mocao: "Moção" }
const PARECER_LABEL: Record<string, string> = { favoravel: "Favorável", contrario: "Contrário", favoravel_emendas: "Favorável c/ Emendas" }
const PARECER_COLOR: Record<string, string> = { favoravel: "#16a34a", contrario: "#dc2626", favoravel_emendas: "#d97706" }
const STATUS_COMISSAO: Record<string, string> = { aguardando: "Aguardando", em_analise: "Em análise", concluido: "Concluído", dispensado: "Dispensado" }

export default function DossieModal({ proposicaoId, onClose }: { proposicaoId: string; onClose: () => void }) {
  const [prop, setProp] = useState<PropDetalhe | null>(null)

  useEffect(() => {
    fetch(`/api/proposicoes/${proposicaoId}`).then(r => r.json()).then(setProp)
  }, [proposicaoId])

  function imprimir() { window.print() }

  if (!prop) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-gray-400 text-sm">Carregando dossiê...</div>
    </div>
  )

  const autor = prop.autorVereador ? `${prop.autorVereador.nome} (${prop.autorVereador.partido})` : prop.autorExterno || "—"

  return (
    <>
      {/* Overlay — oculto na impressão */}
      <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Dossiê da Proposição</h2>
              <p className="text-xs text-gray-400">Informações completas para a sessão</p>
            </div>
            <div className="flex gap-2">
              <button onClick={imprimir}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
                🖨️ Imprimir / PDF
              </button>
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                Fechar
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Identificação */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Identificação</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-800 text-base">{TIPO[prop.tipo] || prop.tipo} Nº {prop.numero}/{prop.ano}</span>
                  {prop.regimeUrgencia && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Urgência</span>}
                  {prop.dispensaParecer && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Dispensa de Parecer</span>}
                  {prop.dispensaIntersticio && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Dispensa de Interstício</span>}
                </div>
                <p className="text-sm text-gray-700">{prop.ementa}</p>
                <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 pt-1">
                  <div><span className="font-medium text-gray-600">Autor:</span> {autor}</div>
                  <div><span className="font-medium text-gray-600">Entrada:</span> {new Date(prop.dataEntrada).toLocaleDateString("pt-BR")}</div>
                  <div><span className="font-medium text-gray-600">Após aprovação:</span> {prop.destinoFinal === "promulgacao" ? "Promulgar" : "Sancionar"} ({prop.numVotacoes} votação{prop.numVotacoes > 1 ? "ões" : ""})</div>
                </div>
              </div>
            </section>

            {/* Comissões */}
            {prop.comissoes.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Comissões</h3>
                <div className="space-y-3">
                  {prop.comissoes.map((c, i) => (
                    <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="font-semibold text-gray-800 text-sm">{c.comissao.sigla || c.comissao.nome}</span>
                          <span className="text-xs text-gray-400">{c.comissao.nome}</span>
                          {c.parecerConjunto && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">Parecer Conjunto</span>}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: c.status === "concluido" ? "#dcfce7" : c.status === "em_analise" ? "#fef3c7" : "#f3f4f6", color: c.status === "concluido" ? "#16a34a" : c.status === "em_analise" ? "#92400e" : "#6b7280" }}>
                          {STATUS_COMISSAO[c.status] || c.status}
                        </span>
                      </div>
                      {c.analista && <p className="text-xs text-gray-500 mb-2">Analista: <span className="font-medium text-gray-700">{c.analista.nome}</span></p>}
                      {c.parecer && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold" style={{ color: PARECER_COLOR[c.parecer] || "#374151" }}>
                            Parecer: {PARECER_LABEL[c.parecer] || c.parecer}
                          </span>
                          {c.dataVotacao && <span className="text-xs text-gray-400">{new Date(c.dataVotacao).toLocaleDateString("pt-BR")}</span>}
                        </div>
                      )}
                      {c.parecerTexto && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 italic">"{c.parecerTexto}"</div>
                      )}
                      {c.votos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.votos.map(v => (
                            <span key={v.vereador.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: v.aprovado ? "#dcfce7" : "#fee2e2", color: v.aprovado ? "#16a34a" : "#dc2626" }}>
                              {v.aprovado ? "✓" : "✗"} {v.vereador.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Emendas */}
            {prop.emendas.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Emendas ({prop.emendas.length})</h3>
                <div className="space-y-2">
                  {prop.emendas.map((e, i) => (
                    <div key={e.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-800">Emenda {i + 1} — {e.tipo}</span>
                        <span className="text-xs text-amber-600">Art. {e.artigo}</span>
                        {(e.autorVereador || e.autorNome) && (
                          <span className="text-xs text-amber-600">
                            por {e.autorVereador ? e.autorVereador.nome : e.autorNome}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700">{e.texto}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {prop.emendas.length === 0 && (
              <p className="text-xs text-gray-400 italic">Nenhuma emenda registrada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Versão para impressão */}
      <div className="hidden print:block p-8 text-sm text-gray-800">
        <div className="text-center mb-6 border-b pb-4">
          <p className="text-xs text-gray-500">Câmara Municipal de Nova Lima — MG</p>
          <h1 className="text-xl font-bold mt-1">Dossiê — {TIPO[prop.tipo] || prop.tipo} Nº {prop.numero}/{prop.ano}</h1>
        </div>
        <p className="mb-1"><strong>Ementa:</strong> {prop.ementa}</p>
        <p className="mb-1"><strong>Autor:</strong> {autor}</p>
        <p className="mb-4"><strong>Data de entrada:</strong> {new Date(prop.dataEntrada).toLocaleDateString("pt-BR")}</p>

        {prop.comissoes.length > 0 && (
          <>
            <h2 className="font-bold text-base border-b pb-1 mb-3">Comissões</h2>
            {prop.comissoes.map((c, i) => (
              <div key={c.id} className="mb-4 pl-4 border-l-2 border-gray-300">
                <p className="font-bold">{i + 1}. {c.comissao.nome} {c.parecerConjunto ? "(Parecer Conjunto)" : ""}</p>
                <p>Status: {STATUS_COMISSAO[c.status] || c.status}</p>
                {c.parecer && <p>Parecer: {PARECER_LABEL[c.parecer] || c.parecer}</p>}
                {c.parecerTexto && <p className="italic mt-1">"{c.parecerTexto}"</p>}
              </div>
            ))}
          </>
        )}

        {prop.emendas.length > 0 && (
          <>
            <h2 className="font-bold text-base border-b pb-1 mb-3 mt-4">Emendas</h2>
            {prop.emendas.map((e, i) => (
              <div key={e.id} className="mb-3 pl-4 border-l-2 border-amber-400">
                <p className="font-bold">Emenda {i + 1} — {e.tipo} — Art. {e.artigo}</p>
                {(e.autorVereador || e.autorNome) && <p>Autor: {e.autorVereador ? e.autorVereador.nome : e.autorNome}</p>}
                <p className="mt-1">{e.texto}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}
