import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type SegovItem = {
  tipo: string;
  numero: string;
  ano: number;
  ementa: string;
  vereador?: { nome: string } | null;
  autorNome?: string | null;
  observacao?: string | null;
  parecerComissao?: string | null;
  parecerConjunto?: boolean;
  proxComissao?: string | null;
  status: string;
  dataEnvio?: string | null;
  updatedAt?: string | null;
};

export const COLUNAS_RELATORIO = [
  { key: "proposicao",      label: "Proposição" },
  { key: "ementa",          label: "Ementa" },
  { key: "autor",           label: "Autor / Vereador" },
  { key: "comissaoDestino", label: "Comissão Destino" },
  { key: "parecerComissao", label: "Parecer da Comissão" },
  { key: "parecerConjunto", label: "Conjunto" },
  { key: "proxComissao",    label: "Próxima Comissão" },
  { key: "status",          label: "Status" },
  { key: "entrada",         label: "Data de Entrada" },
  { key: "ultimaMov",       label: "Última Movimentação" },
] as const;

export type ColunasKey = typeof COLUNAS_RELATORIO[number]["key"];

function formatarData(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
}

function autorDe(item: SegovItem) {
  return item.vereador?.nome || item.autorNome || "—";
}

function valorColuna(item: SegovItem, key: ColunasKey): string {
  switch (key) {
    case "proposicao":      return `${item.tipo} ${item.numero}/${item.ano}`;
    case "ementa":          return item.ementa || "";
    case "autor":           return autorDe(item);
    case "comissaoDestino": return item.observacao || "";
    case "parecerComissao": return item.parecerComissao || "";
    case "parecerConjunto": return item.parecerConjunto ? "Sim" : "";
    case "proxComissao":    return item.proxComissao || "";
    case "status":          return item.status;
    case "entrada":         return formatarData(item.dataEnvio);
    case "ultimaMov":       return formatarData(item.updatedAt);
  }
}

export function exportarSegovExcel(
  itens: SegovItem[],
  colunas: ColunasKey[],
  nomeArquivo = "segov.xlsx"
) {
  const headers = colunas.map(k => COLUNAS_RELATORIO.find(c => c.key === k)!.label);
  const linhas = itens.map(item => {
    const row: Record<string, string> = {};
    colunas.forEach((k, i) => { row[headers[i]] = valorColuna(item, k); });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(linhas);
  // larguras automáticas aproximadas
  ws["!cols"] = headers.map(h => ({ wch: Math.min(60, Math.max(12, h.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SEGOV");
  XLSX.writeFile(wb, nomeArquivo);
}

export function exportarSegovPDF(
  itens: SegovItem[],
  colunas: ColunasKey[],
  nomeArquivo = "segov.pdf"
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(13);
  doc.text("SEGOV — Secretaria de Governo", 40, 38);
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  doc.text(
    `Câmara Municipal de Nova Lima — gerado em ${new Date().toLocaleDateString("pt-BR")} — ${itens.length} item(ns)`,
    40, 52
  );

  const headers = colunas.map(k => COLUNAS_RELATORIO.find(c => c.key === k)!.label);
  const body = itens.map(item => colunas.map(k => valorColuna(item, k)));

  // Distribui largura proporcionalmente; ementa e comissão recebem mais espaço
  const larguraTotal = 762; // A4 landscape - margens
  const pesosPorColuna: Record<ColunasKey, number> = {
    proposicao: 1.2, ementa: 4, autor: 1.5,
    comissaoDestino: 2, parecerComissao: 2, parecerConjunto: 0.8,
    proxComissao: 1.8, status: 1, entrada: 1, ultimaMov: 1,
  };
  const pesoTotal = colunas.reduce((s, k) => s + pesosPorColuna[k], 0);
  const colStyles: Record<number, object> = {};
  colunas.forEach((k, i) => {
    colStyles[i] = { cellWidth: Math.round((pesosPorColuna[k] / pesoTotal) * larguraTotal) };
  });

  autoTable(doc, {
    startY: 66,
    head: [headers],
    body,
    styles: { fontSize: 7.5, cellPadding: 3.5, valign: "top" },
    headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: "bold" },
    columnStyles: colStyles,
    margin: { left: 40, right: 40 },
  });

  doc.save(nomeArquivo);
}
