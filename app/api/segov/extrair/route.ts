import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

type Proposicao = {
  tipo: string;
  numero: string;
  ano: number;
  ementa: string;
  observacao?: string;
  dataEnvio?: string;
};

// Extrai a data da sessão do texto — "23 de junho de 2026" → "2026-06-23"
function extrairData(texto: string): string | undefined {
  const meses: Record<string, number> = {
    janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
    julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  };
  const m = texto.match(/(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);
  if (!m) return undefined;
  const mesNome = m[2].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const mes = meses[mesNome] || 1;
  const d = new Date(parseInt(m[3]), mes - 1, parseInt(m[1]));
  return d.toISOString();
}

// Recorta apenas a seção "Apresentação de proposições" do texto
function extrairSecaoApresentacao(texto: string): string {
  const reInicio = /Apresenta[çc][ãa]o\s+de\s+proposi[çc][õo]es/i;
  const reFim = /Leitura\s+de\s+Parecer|d\)\s*Leitura|II\s+SEGUNDA|SEGUNDA\s+PARTE/i;
  const ini = texto.match(reInicio);
  if (!ini || ini.index === undefined) return texto;
  const resto = texto.slice(ini.index + ini[0].length);
  const fim = resto.match(reFim);
  return fim && fim.index !== undefined ? resto.slice(0, fim.index) : resto;
}

// Extração por regex para texto/Word/Excel — com suporte a nomes por extenso em pt-BR
function extrairComRegex(texto: string): Proposicao[] {
  const mapa = new Map<string, Proposicao>();
  const dataEnvio = extrairData(texto);
  const secao = extrairSecaoApresentacao(texto);

  function add(tipo: string, numRaw: string, anoStr: string, matchIndex: number, matchLen: number) {
    const numero = numRaw.replace(/\./g, "");
    const key = `${tipo}_${numero}_${anoStr}`;
    if (mapa.has(key)) return;

    const afterMatch = secao.slice(matchIndex + matchLen, matchIndex + matchLen + 600);

    // Ementa: texto após "que " ou após " - " / " – "
    let ementa = "";
    const emenMatch = afterMatch.match(/^[^\n\r]*(?:,\s*que\s+|[-–—:]\s*)([^\n\r]{5,250})/);
    if (emenMatch) ementa = emenMatch[1].trim();

    // Andamento: "* Encaminhar à Comissão de ..."
    let observacao: string | undefined;
    const encMatch = afterMatch.match(/\*\s*Encaminhar\s+[àa]\s+([^\n\r.]+)/i);
    if (encMatch) observacao = encMatch[1].trim();

    mapa.set(key, { tipo, numero, ano: parseInt(anoStr), ementa, observacao, dataEnvio });
  }

  let m: RegExpExecArray | null;

  // Abreviações: PL 123/2026, REQ nº 45/2026
  const reAbrev = /\b(PL|PLC|PDL|REQ|IND|MOC)\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b/gi;
  while ((m = reAbrev.exec(secao)) !== null) add(m[1].toUpperCase(), m[2], m[3], m.index, m[0].length);

  // "Projeto de Lei [Complementar] nº 2.726/2026"
  const rePL = /Projeto\s+de\s+Lei(?:\s+(Complementar))?\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b/gi;
  while ((m = rePL.exec(secao)) !== null) add(m[1] ? "PLC" : "PL", m[2], m[3], m.index, m[0].length);

  // "Requerimento nº 45/2026"
  const reREQ = /Requerimento\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b/gi;
  while ((m = reREQ.exec(secao)) !== null) add("REQ", m[1], m[2], m.index, m[0].length);

  // "Projeto de Decreto Legislativo nº 517/2026"
  const rePDL = /Projeto\s+de\s+Decreto\s+Legislativo\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b/gi;
  while ((m = rePDL.exec(secao)) !== null) add("PDL", m[1], m[2], m.index, m[0].length);

  // "Moção / Mocao nº 3/2026"
  const reMOC = /Mo[çc][ãa]o\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b/gi;
  while ((m = reMOC.exec(secao)) !== null) add("MOC", m[1], m[2], m.index, m[0].length);

  // "Indicação / Indicacao nº 10/2026"
  const reIND = /Indica[çc][ãa]o\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b/gi;
  while ((m = reIND.exec(secao)) !== null) add("IND", m[1], m[2], m.index, m[0].length);

  return Array.from(mapa.values());
}

// PDF: usa Claude API (lê nativamente, entende qualquer encoding)
async function extrairPdfComClaude(buffer: Buffer): Promise<{ proposicoes: Proposicao[]; dataEnvio?: string }> {
  const base64 = buffer.toString("base64");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          {
            type: "text",
            text: `Este documento é uma pauta de sessão da Câmara Municipal de Nova Lima, MG.
Extraia APENAS as proposições da seção "Apresentação de proposições" (seção c da Primeira Parte).
NÃO inclua itens de "Leitura de Parecer", "Discussão e votação" ou outras seções.

Retorne SOMENTE um JSON válido (sem markdown, sem explicação):
{
  "dataEnvio": "2026-06-23",
  "proposicoes": [
    {"tipo":"PL","numero":"2725","ano":2026,"ementa":"Declara Utilidade Pública a Associação...","observacao":"Comissão de Legislação e Justiça"}
  ]
}

Regras:
- tipo: "Projeto de Lei"→PL, "Projeto de Lei Complementar"→PLC, "Projeto de Decreto Legislativo"→PDL, "Requerimento"→REQ, "Indicação"→IND, "Moção"→MOC
- numero: remova pontos (2.725→"2725")
- ementa: o que o projeto propõe (começa normalmente com "Declara", "Institui", "Altera", "Dispõe"...)
- observacao: destino indicado em "* Encaminhar à ..." (apenas o nome da comissão, sem "Comissão de")
- dataEnvio: data da sessão no formato YYYY-MM-DD`,
          }
        ]
      }]
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro Claude API (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text || "{}";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { proposicoes: [] };

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const dataEnvio = parsed.dataEnvio ? new Date(parsed.dataEnvio).toISOString() : undefined;
    const proposicoes: Proposicao[] = (parsed.proposicoes || []).map((p: any) => ({
      tipo: p.tipo,
      numero: String(p.numero).replace(/\./g, ""),
      ano: parseInt(p.ano),
      ementa: p.ementa || "",
      observacao: p.observacao || undefined,
      dataEnvio,
    }));
    return { proposicoes, dataEnvio };
  } catch {
    return { proposicoes: [] };
  }
}

export async function POST(req: Request) {
  let proposicoes: Proposicao[] = [];
  let dataEnvio: string | undefined;
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

    const nome = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (nome.endsWith(".pdf")) {
      try {
        const result = await extrairPdfComClaude(buffer);
        proposicoes = result.proposicoes;
        dataEnvio = result.dataEnvio;
      } catch (e: any) {
        return NextResponse.json({ error: e.message || "Erro ao processar PDF" }, { status: 500 });
      }
    } else {
      let texto = "";
      try {
        if (nome.endsWith(".docx") || nome.endsWith(".doc")) {
          const result = await mammoth.extractRawText({ buffer });
          texto = result.value;
        } else if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) {
          const wb = XLSX.read(buffer, { type: "buffer" });
          texto = wb.SheetNames.map(n => XLSX.utils.sheet_to_txt(wb.Sheets[n])).join("\n");
        } else {
          return NextResponse.json({ error: "Formato não suportado. Use PDF, Word ou Excel." }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Erro ao ler o arquivo." }, { status: 400 });
      }
      proposicoes = extrairComRegex(texto);
      dataEnvio = proposicoes[0]?.dataEnvio;
    }
  } else {
    const body = await req.json();
    const texto = body.texto || "";
    if (!texto.trim()) return NextResponse.json({ error: "Nenhum texto fornecido" }, { status: 400 });
    proposicoes = extrairComRegex(texto);
    dataEnvio = proposicoes[0]?.dataEnvio;
  }

  if (proposicoes.length === 0) {
    return NextResponse.json({ proposicoes: [], total: 0, dataEnvio });
  }

  // Verifica quais já existem no SEGOV
  const existentes = await Promise.all(
    proposicoes.map(p =>
      prisma.segov.findFirst({ where: { tipo: p.tipo, numero: p.numero, ano: p.ano } })
    )
  );

  const resultado = proposicoes.map((p, i) => ({ ...p, jaExiste: existentes[i] !== null }));
  return NextResponse.json({ proposicoes: resultado, total: resultado.length, dataEnvio });
}
