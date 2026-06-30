import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SegovItem = {
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

function formatarData(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "—";
}

function autorDe(item: SegovItem) {
  return item.vereador?.nome || item.autorNome || "—";
}

function comissaoDe(item: SegovItem) {
  const partes: string[] = [];
  if (item.observacao) partes.push(`Destino: ${item.observacao}`);
  if (item.parecerComissao) partes.push(`Parecer: ${item.parecerComissao}${item.parecerConjunto ? " (CONJUNTO)" : ""}`);
  if (item.proxComissao) partes.push(`Próx.: ${item.proxComissao}`);
  return partes.join(" / ") || "—";
}

export function exportarSegovExcel(itens: SegovItem[], nomeArquivo = "segov.xlsx") {
  const linhas = itens.map(item => ({
    Tipo: item.tipo,
    "Número/Ano": `${item.numero}/${item.ano}`,
    Ementa: item.ementa,
    Autor: autorDe(item),
    "Comissão Destino": item.observacao || "",
    "Parecer da Comissão": item.parecerComissao || "",
    Conjunto: item.parecerConjunto ? "Sim" : "",
    "Próxima Comissão": item.proxComissao || "",
    Status: item.status,
    Entrada: formatarData(item.dataEnvio),
    "Última Movimentação": formatarData(item.updatedAt),
  }));

  const ws = XLSX.utils.json_to_sheet(linhas);
  ws["!cols"] = [
    { wch: 6 }, { wch: 12 }, { wch: 60 }, { wch: 20 }, { wch: 28 },
    { wch: 28 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SEGOV");
  XLSX.writeFile(wb, nomeArquivo);
}

export function exportarSegovPDF(itens: SegovItem[], nomeArquivo = "segov.pdf") {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text("SEGOV — Secretaria de Governo", 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Câmara Municipal de Nova Lima — gerado em ${new Date().toLocaleDateString("pt-BR")}`, 40, 56);
  doc.text(`${itens.length} item(ns)`, 40, 70);

  const linhas = itens.map(item => [
    `${item.tipo} ${item.numero}/${item.ano}`,
    item.ementa,
    autorDe(item),
    comissaoDe(item),
    item.status,
    formatarData(item.dataEnvio),
    formatarData(item.updatedAt),
  ]);

  autoTable(doc, {
    startY: 84,
    head: [["Proposição", "Ementa", "Autor", "Comissão", "Status", "Entrada", "Últ. Mov."]],
    body: linhas,
    styles: { fontSize: 7.5, cellPadding: 4, valign: "top" },
    headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 260 },
      2: { cellWidth: 80 },
      3: { cellWidth: 150 },
      4: { cellWidth: 55 },
      5: { cellWidth: 50 },
      6: { cellWidth: 55 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(nomeArquivo);
}
