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

function fmtNumero(n: string) {
  return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
  const pad = 10; // inner padding inside card

  let pageNum = 1;

  function drawPageHeader() {
    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, W, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SEGOV — Secretaria de Governo  |  Câmara Municipal de Nova Lima", margin, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}  |  ${itens.length} proposição(ões)  |  Pág. ${pageNum}`,
      W - margin, 16, { align: "right" }
    );
  }

  drawPageHeader();
  let y = 32;

  itens.forEach((item, idx) => {
    const fluxo = (item.fluxo || {}) as Record<string, { done: boolean; doneAt?: string; data?: any }>;
    const pautadoDoneAt = fluxo["pautado"]?.doneAt;
    const diasEmAberto = pautadoDoneAt
      ? Math.floor((Date.now() - new Date(pautadoDoneAt).getTime()) / 86400000)
      : null;

    const autor = autorDe(item);
    const marcados = FLUXO_DEF_EXPORT.filter(d => fluxo[d.key]?.done);
    const hasFluxo = marcados.length > 0;
    const titulo = `${item.tipo} ${fmtNumero(item.numero)}/${item.ano}  —  ${autor}`;

    const ementaLinhas = doc.splitTextToSize(item.ementa || "", cw - pad * 2);
    const ementaDisplay = ementaLinhas.slice(0, 5) as string[];
    if (ementaLinhas.length > 5) ementaDisplay[4] = ementaDisplay[4] + "…";

    // Estimate card height
    const cardH = pad                           // top pad
      + 14                                      // título linha 1
      + (diasEmAberto !== null ? 13 : 0)        // dias em aberto
      + 6                                       // gap before ementa
      + ementaDisplay.length * 11               // ementa lines
      + (hasFluxo ? 38 : 0)                     // fluxo section
      + pad;                                    // bottom pad

    if (y + cardH + 6 > H - 10 && idx > 0) {
      doc.addPage();
      pageNum++;
      drawPageHeader();
      y = 32;
    }

    // ── Cartão com borda verde ───────────────────────────
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.2);
    doc.rect(margin, y, cw, cardH, "S");

    let cy = y + pad; // cursor dentro do card

    // ── Linha 1: PL 2.114/2026 — Autor  |  Status ───────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(titulo, margin + pad, cy + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(item.status, W - margin - pad, cy + 10, { align: "right" });
    cy += 14;

    // ── Dias em aberto ───────────────────────────────────
    if (diasEmAberto !== null) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(29, 78, 216);
      doc.text(`${diasEmAberto} dias em aberto`, W - margin - pad, cy + 9, { align: "right" });
      cy += 13;
    }

    cy += 6;

    // ── Ementa ───────────────────────────────────────────
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(ementaDisplay, margin + pad, cy);
    cy += ementaDisplay.length * 11;

    // ── Fluxo de tramitação ──────────────────────────────
    if (hasFluxo) {
      cy += 6;
      const maxStepW = 72;
      const stepW = Math.min(maxStepW, cw / marcados.length);
      const startX = margin + pad;
      const nodeY = cy + 8;

      marcados.forEach((step, i) => {
        const x = startX + i * stepW;
        const sd = fluxo[step.key];
        const isReprov = sd?.data?.resultado === "reprovado";

        if (isReprov) doc.setFillColor(220, 38, 38);
        else          doc.setFillColor(22, 163, 74);
        doc.circle(x + 7, nodeY, 5.5, "F");

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.line(x + 4.5, nodeY, x + 6.5, nodeY + 2.5);
        doc.line(x + 6.5, nodeY + 2.5, x + 9.5, nodeY - 2.5);

        if (i < marcados.length - 1) {
          if (isReprov) doc.setDrawColor(220, 38, 38);
          else          doc.setDrawColor(22, 163, 74);
          doc.setLineWidth(0.8);
          doc.line(x + 13, nodeY, x + stepW - 1, nodeY);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(50, 50, 50);
        doc.text(step.labelCurto, x + 7, nodeY + 13, { align: "center" });
      });
    }

    y += cardH + 6; // gap between cards
  });

  doc.save(nomeArquivo);
}
