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

function fmtDDMM(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function statusChip(status: string): { bg: [number,number,number]; fg: [number,number,number] } {
  switch (status) {
    case "Com Parecer":  return { bg: [233,213,255], fg: [107,33,168] };
    case "Em análise":   return { bg: [219,234,254], fg: [29,78,216]  };
    case "Aprovado":     return { bg: [187,247,208], fg: [22,101,52]  };
    case "Rejeitado":    return { bg: [254,202,202], fg: [185,28,28]  };
    case "Arquivado":    return { bg: [243,244,246], fg: [75,85,99]   };
    case "Retirado":     return { bg: [255,237,213], fg: [154,52,18]  };
    default:             return { bg: [254,243,199], fg: [146,64,14]  }; // Aguardando
  }
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
  const pad = 12;
  const ementaLH = 15; // line height for 11pt ementa

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

    // Author names (same logic as list page)
    const nomes: string[] = [];
    if (item.vereador?.nome) nomes.push(item.vereador.nome);
    if (item.autorNome) {
      (item.autorNome as string).split(/\s+e\s+|,\s+/).forEach((n: string) => {
        const t = n.trim();
        if (t && !nomes.includes(t)) nomes.push(t);
      });
    }

    const marcados = FLUXO_DEF_EXPORT.filter(d => fluxo[d.key]?.done);
    const hasFluxo = marcados.length > 0;

    const graficoCor: "verde" | "vermelho" | "normal" = fluxo["resultadoFinal"]?.done
      ? (fluxo["resultadoFinal"]?.data?.resultado === "aprovado" ? "verde" : "vermelho")
      : "normal";

    // Pre-calculate ementa lines — font MUST be set first
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const ementaLinhas = doc.splitTextToSize(item.ementa || "", cw - pad * 2 - 4) as string[];
    const maxLines = 5;
    const ementaDisplay = ementaLinhas.slice(0, maxLines) as string[];
    if (ementaLinhas.length > maxLines) ementaDisplay[maxLines - 1] = ementaDisplay[maxLines - 1] + "…";

    const cardH = pad
      + 16                                           // header row (chips + número + status + pautado + dias)
      + 10                                           // gap
      + ementaDisplay.length * ementaLH             // ementa
      + (nomes.length > 0 ? 8 + 14 : 0)            // gap + author chips
      + (hasFluxo ? 10 + 1 + 10 + 42 : 0)          // gap + separator + gap + fluxo nodes
      + pad;

    if (y + cardH + 8 > H - 10 && idx > 0) {
      doc.addPage();
      pageNum++;
      drawPageHeader();
      y = 32;
    }

    // ── Borda verde do cartão ────────────────────────────
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.4);
    doc.rect(margin, y, cw, cardH, "S");

    let cy = y + pad;
    let cx = margin + pad;

    // ── [PL] chip ────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const tipoW = doc.getTextWidth(item.tipo) + 8;
    doc.setFillColor(254, 202, 202);
    doc.rect(cx, cy + 1, tipoW, 13, "F");
    doc.setTextColor(185, 28, 28);
    doc.text(item.tipo, cx + 4, cy + 10);
    cx += tipoW + 6;

    // ── Número bold ──────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(25, 25, 25);
    const numStr = `${fmtNumero(item.numero)}/${item.ano}`;
    doc.text(numStr, cx, cy + 12);
    cx += doc.getTextWidth(numStr) + 8;

    // ── [Status] chip ────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const sc = statusChip(item.status);
    const statusW = doc.getTextWidth(item.status) + 10;
    doc.setFillColor(sc.bg[0], sc.bg[1], sc.bg[2]);
    doc.rect(cx, cy + 1, statusW, 13, "F");
    doc.setTextColor(sc.fg[0], sc.fg[1], sc.fg[2]);
    doc.text(item.status, cx + 5, cy + 10);
    cx += statusW + 8;

    // ── Pautado: DD/MM/YYYY ──────────────────────────────
    if (pautadoDoneAt) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      const pText = `Pautado: ${new Date(pautadoDoneAt).toLocaleDateString("pt-BR")}`;
      doc.text(pText, cx, cy + 10);
      cx += doc.getTextWidth(pText) + 8;
    }

    // ── X dias em aberto ─────────────────────────────────
    if (diasEmAberto !== null) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      if (diasEmAberto > 30)      doc.setTextColor(220, 38, 38);
      else if (diasEmAberto > 15) doc.setTextColor(161, 98, 7);
      else                        doc.setTextColor(22, 163, 74);
      doc.text(`${diasEmAberto} dias em aberto`, cx, cy + 10);
    }
    cy += 16;
    cy += 10;

    // ── Ementa ───────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(55, 55, 55);
    ementaDisplay.forEach((linha, i) => {
      doc.text(linha, margin + pad, cy + i * ementaLH);
    });
    cy += ementaDisplay.length * ementaLH;

    // ── Chips de autor ───────────────────────────────────
    if (nomes.length > 0) {
      cy += 8;
      let ax = margin + pad;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      nomes.forEach(nome => {
        const nW = doc.getTextWidth(nome) + 10;
        doc.setFillColor(238, 242, 255);
        doc.rect(ax, cy, nW, 12, "F");
        doc.setTextColor(67, 56, 202);
        doc.text(nome, ax + 5, cy + 9);
        ax += nW + 5;
      });
      cy += 14;
    }

    // ── Separador + Fluxo de tramitação ──────────────────
    if (hasFluxo) {
      cy += 10;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin + pad, cy, W - margin - pad, cy);
      cy += 10;

      const nodeR = 6.5;
      const stepW = Math.min(70, cw / marcados.length);
      const startX = margin + pad + nodeR;
      const nodeY = cy + nodeR;

      marcados.forEach((step, i) => {
        const x = startX + i * stepW;
        const sd = fluxo[step.key];
        const isLast = i === marcados.length - 1;

        // Node color (same logic as UI)
        let nr = 22, ng = 163, nb = 74; // green
        if (graficoCor === "vermelho") { nr = 220; ng = 38; nb = 38; }
        else if (graficoCor === "normal" && isLast) { nr = 37; ng = 99; nb = 235; } // blue

        doc.setFillColor(nr, ng, nb);
        doc.circle(x, nodeY, nodeR, "F");

        // Checkmark
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1.2);
        doc.line(x - 2.8, nodeY, x - 0.5, nodeY + 2.8);
        doc.line(x - 0.5, nodeY + 2.8, x + 3.5, nodeY - 2.8);

        // Connector + arrow to next
        if (i < marcados.length - 1) {
          doc.setDrawColor(nr, ng, nb);
          doc.setLineWidth(0.8);
          const lx1 = x + nodeR + 1;
          const lx2 = x + stepW - nodeR - 1;
          doc.line(lx1, nodeY, lx2, nodeY);
          doc.line(lx2, nodeY, lx2 - 3, nodeY - 2);
          doc.line(lx2, nodeY, lx2 - 3, nodeY + 2);
        }

        // Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(50, 50, 50);
        doc.text(step.labelCurto, x, nodeY + nodeR + 9, { align: "center", maxWidth: stepW - 2 });

        // Date
        if (sd?.doneAt) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6);
          doc.setTextColor(140, 140, 140);
          doc.text(fmtDDMM(sd.doneAt), x, nodeY + nodeR + 17, { align: "center" });
        }

        // Comissão badge
        if (sd?.data?.comissaoNome) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6);
          const bw = doc.getTextWidth(sd.data.comissaoNome) + 6;
          doc.setFillColor(219, 234, 254);
          doc.rect(x - bw / 2, nodeY + nodeR + 20, bw, 9, "F");
          doc.setTextColor(29, 78, 216);
          doc.text(sd.data.comissaoNome, x, nodeY + nodeR + 27, { align: "center" });
        }

        // Resultado badge
        if (sd?.data?.resultado) {
          const rText = sd.data.resultado === "aprovado" ? "Aprov." : "Reprov.";
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6);
          const bw = doc.getTextWidth(rText) + 8;
          if (sd.data.resultado === "aprovado") {
            doc.setFillColor(187, 247, 208); doc.setTextColor(22, 101, 52);
          } else {
            doc.setFillColor(254, 202, 202); doc.setTextColor(185, 28, 28);
          }
          doc.rect(x - bw / 2, nodeY + nodeR + 20, bw, 9, "F");
          doc.text(rText, x, nodeY + nodeR + 27, { align: "center" });
        }
      });
    }

    y += cardH + 8;
  });

  doc.save(nomeArquivo);
}
