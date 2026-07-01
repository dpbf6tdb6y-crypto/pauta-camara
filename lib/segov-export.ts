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
  fluxo?: Record<string, { done: boolean; doneAt?: string; data?: any }> | null;
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

const FLUXO_DEF_EXPORT = [
  { key: 'protocolado',         labelCurto: 'Prot.'      },
  { key: 'pautado',             labelCurto: 'Pautado'    },
  { key: 'comissao1',           labelCurto: 'Com. 1'     },
  { key: 'comissao2',           labelCurto: 'Com. 2'     },
  { key: 'comissao3',           labelCurto: 'Com. 3'     },
  { key: 'comissaoEspecial',    labelCurto: 'C. Esp.'    },
  { key: 'comissaoConjunta',    labelCurto: 'C. Conj.'   },
  { key: 'dispensaParecer',     labelCurto: 'D. Par.'    },
  { key: 'dispensaIntersticio', labelCurto: 'D. Int.'    },
  { key: 'pedidoVista',         labelCurto: 'P. Vista'   },
  { key: 'pedidoAdiamento',     labelCurto: 'P. Adj.'    },
  { key: 'emenda',              labelCurto: 'Emenda'     },
  { key: 'emendaNumero',        labelCurto: 'Id. Emenda' },
  { key: 'votacao1',            labelCurto: '1ª Vot.'    },
  { key: 'votacao2',            labelCurto: '2ª Vot.'    },
  { key: 'resultadoFinal',      labelCurto: 'Resultado'  },
]

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
  ws["!cols"] = headers.map(h => ({ wch: Math.min(60, Math.max(12, h.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SEGOV");
  XLSX.writeFile(wb, nomeArquivo);
}

export function exportarSegovPDF(
  itens: SegovItem[],
  _colunas?: ColunasKey[],
  nomeArquivo = "segov.pdf"
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = 841.89;
  const H = 595.28;
  const margin = 36;
  const cw = W - 2 * margin;

  let pageNum = 1;

  function drawPageHeader() {
    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, W, 26, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text("SEGOV — Secretaria de Governo  |  Câmara Municipal de Nova Lima", margin, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}  |  ${itens.length} proposição(ões)  |  Pág. ${pageNum}`,
      W - margin, 17, { align: "right" }
    );
  }

  drawPageHeader();
  let y = 40;

  itens.forEach((item, idx) => {
    const fluxo = (item.fluxo || {}) as Record<string, { done: boolean; doneAt?: string; data?: any }>;
    const pautadoDoneAt = fluxo["pautado"]?.doneAt;
    const diasEmAberto = pautadoDoneAt
      ? Math.floor((Date.now() - new Date(pautadoDoneAt).getTime()) / 86400000)
      : null;

    const autor = autorDe(item);
    const marcados = FLUXO_DEF_EXPORT.filter(d => fluxo[d.key]?.done);
    const hasFluxo = marcados.length > 0;

    const ementaLinhas = doc.splitTextToSize(item.ementa || "", cw - 16);
    const ementaDisplay = ementaLinhas.slice(0, 5);
    if (ementaLinhas.length > 5) ementaDisplay[4] = ementaDisplay[4] + "…";

    const cardH = 24 + 18 + 6 + ementaDisplay.length * 11 + (hasFluxo ? 40 : 0) + 14;

    if (y + cardH > H - margin + 10 && idx > 0) {
      doc.addPage();
      pageNum++;
      drawPageHeader();
      y = 40;
    }

    // ── Cabeçalho da proposição ──────────────────────────
    const resultado = fluxo["resultadoFinal"];
    const aprovado  = resultado?.done && resultado?.data?.resultado === "aprovado";
    const reprovado = resultado?.done && resultado?.data?.resultado !== "aprovado";

    if (aprovado)       doc.setFillColor(22, 163, 74);   // green-600
    else if (reprovado) doc.setFillColor(220, 38, 38);   // red-600
    else                doc.setFillColor(126, 34, 206);  // purple-700

    doc.rect(margin, y, cw, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${item.tipo} ${item.numero}/${item.ano}`, margin + 8, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(item.status, W - margin - 8, y + 15, { align: "right" });
    y += 24;

    // ── Linha: Autor + Dias em Aberto ────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`Autor: ${autor}`, margin + 6, y + 12);
    if (diasEmAberto !== null) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(29, 78, 216);  // blue-700
      doc.text(`${diasEmAberto} dias em aberto`, W - margin - 6, y + 12, { align: "right" });
    }
    y += 18;

    // ── Ementa ───────────────────────────────────────────
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(ementaDisplay, margin + 6, y + 6);
    y += ementaDisplay.length * 11 + 6;

    // ── Fluxo de tramitação ──────────────────────────────
    if (hasFluxo) {
      const maxStepW = 72;
      const stepW = Math.min(maxStepW, cw / marcados.length);
      const startX = margin + 6;
      const nodeY = y + 8;

      marcados.forEach((step, i) => {
        const x = startX + i * stepW;
        const sd = fluxo[step.key];
        const isReprov = sd?.data?.resultado === "reprovado";

        if (isReprov) doc.setFillColor(220, 38, 38);
        else          doc.setFillColor(22, 163, 74);

        doc.circle(x + 7, nodeY, 5.5, "F");

        // checkmark
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.line(x + 4.5, nodeY, x + 6.5, nodeY + 2.5);
        doc.line(x + 6.5, nodeY + 2.5, x + 9.5, nodeY - 2.5);

        // connector to next
        if (i < marcados.length - 1) {
          if (isReprov) doc.setDrawColor(220, 38, 38);
          else          doc.setDrawColor(22, 163, 74);
          doc.setLineWidth(0.8);
          doc.line(x + 12.5, nodeY, x + stepW - 1, nodeY);
        }

        // label
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(60, 60, 60);
        doc.text(step.labelCurto, x + 7, nodeY + 12, { align: "center" });
      });

      y += 36;
    }

    // ── Separador ────────────────────────────────────────
    if (idx < itens.length - 1) {
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 3, W - margin, y + 3);
      y += 12;
    }
  });

  doc.save(nomeArquivo);
}
