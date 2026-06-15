export type ComissaoInfo = {
  id: string
  ordem: number
  status: string
  parecerConjunto?: boolean
  comissao: { sigla: string; nome: string }
}

export type Proposicao = {
  id: string
  numero: string
  ano: number
  tipo: string
  ementa: string
  status: string
  etapaAtual: string
  destinoFinal?: string
  numVotacoes?: number
  dispensaParecer?: boolean
  comissoes?: ComissaoInfo[]
}

export type PautaItem = {
  id: string
  proposicao: Proposicao
  ordem: number
  secao: string
  resultado?: string
}

export type Sessao = {
  id: string
  data: string
  tipo: string
  numero?: number
  ano?: number
  local?: string
  status: string
  itens: PautaItem[]
}

export const TIPO: Record<string, string> = {
  pl: "PL", resolucao: "Res.", requerimento: "Req.", mocao: "Moção",
}

export const TIPO_SESSAO: Record<string, string> = {
  ordinaria: "Ordinária", extraordinaria: "Extraordinária",
  especial: "Especial", solene: "Solene",
}

export function fmtData(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  })
}

export function isCRF(c: ComissaoInfo) {
  return (
    c.comissao.sigla === "CRF" ||
    c.comissao.nome.toLowerCase().includes("redação final") ||
    c.comissao.nome.toLowerCase().includes("redacao final")
  )
}
