import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

type Proposicao = { tipo: string; numero: string; ano: number; ementa: string };

// PDF: usa Claude API (lê o PDF nativamente, entende qualquer encoding e formato)
async function extrairPdfComClaude(buffer: Buffer): Promise<Proposicao[]> {
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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            {
              type: "text",
              text: `Este documento é uma pauta de reunião da Câmara Municipal de Nova Lima, MG.
Extraia TODAS as proposições legislativas mencionadas (Projetos de Lei, Requerimentos, Moções, Indicações, etc).

Retorne SOMENTE um JSON válido, sem markdown, sem explicação:
[{"tipo":"PL","numero":"2726","ano":2026,"ementa":"breve descrição do que o projeto declara ou institui"}]

Regras:
- "Projeto de Lei" → tipo "PL"
- "Projeto de Lei Complementar" → tipo "PLC"
- "Projeto de Decreto Legislativo" → tipo "PDL"
- "Requerimento" → tipo "REQ"
- "Indicação" → tipo "IND"
- "Moção" → tipo "MOC"
- Números: remova pontos separadores (ex: 2.726 → "2726", 2.730 → "2730")
- Ementa: texto do que o projeto propõe (ex: "Declara a Semana da Mulher como oficialmente...")`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro Claude API (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text || "[]";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

// Texto/Word/Excel: extração por regex com suporte a nomes por extenso (pt-BR)
function extrairComRegex(texto: string): Proposicao[] {
  const mapa = new Map<string, Proposicao>();

  function add(tipo: string, numRaw: string, anoStr: string, ementa = "") {
    const numero = numRaw.replace(/\./g, ""); // "2.726" → "2726"
    const key = `${tipo}_${numero}_${anoStr}`;
    if (!mapa.has(key)) {
      mapa.set(key, { tipo, numero, ano: parseInt(anoStr), ementa: ementa.trim() });
    }
  }

  // Sufixo opcional para capturar ementa (texto após - ou :)
  const suf = String.raw`(?:[^\w\n\r]*[-–—:]\s*([^\n\r]{5,200}))?`;

  // 1. Abreviações: PL 123/2026, REQ nº 45/2026
  const reAbrev = new RegExp(
    String.raw`\b(PL|PLC|PDL|REQ|IND|MOC)\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b` + suf,
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = reAbrev.exec(texto)) !== null) add(m[1].toUpperCase(), m[2], m[3], m[4]);

  // 2. "Projeto de Lei [Complementar] nº 2.726/2026"
  const rePL = new RegExp(
    String.raw`Projeto\s+de\s+Lei(?:\s+(Complementar))?\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b` + suf,
    "gi"
  );
  while ((m = rePL.exec(texto)) !== null) add(m[1] ? "PLC" : "PL", m[2], m[3], m[4]);

  // 3. "Requerimento nº 45/2026"
  const reREQ = new RegExp(
    String.raw`Requerimento\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b` + suf,
    "gi"
  );
  while ((m = reREQ.exec(texto)) !== null) add("REQ", m[1], m[2], m[3]);

  // 4. "Moção / Mocao nº 3/2026"
  const reMOC = new RegExp(
    String.raw`Mo[çc][ãa]o\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b` + suf,
    "gi"
  );
  while ((m = reMOC.exec(texto)) !== null) add("MOC", m[1], m[2], m[3]);

  // 5. "Indicação / Indicacao nº 10/2026"
  const reIND = new RegExp(
    String.raw`Indica[çc][ãa]o\s*[nN°º]*\.?\s*([\d][\d.]*)\s*[\/\-]\s*(\d{4})\b` + suf,
    "gi"
  );
  while ((m = reIND.exec(texto)) !== null) add("IND", m[1], m[2], m[3]);

  return Array.from(mapa.values());
}

export async function POST(req: Request) {
  let proposicoes: Proposicao[] = [];
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

    const nome = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (nome.endsWith(".pdf")) {
      try {
        proposicoes = await extrairPdfComClaude(buffer);
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
      } catch (e: any) {
        return NextResponse.json({ error: "Erro ao ler o arquivo." }, { status: 400 });
      }
      proposicoes = extrairComRegex(texto);
    }
  } else {
    const body = await req.json();
    const texto = body.texto || "";
    if (!texto.trim()) return NextResponse.json({ error: "Nenhum texto fornecido" }, { status: 400 });
    proposicoes = extrairComRegex(texto);
  }

  if (proposicoes.length === 0) {
    return NextResponse.json({ proposicoes: [], total: 0 });
  }

  // Verifica quais já existem no SEGOV
  const existentes = await Promise.all(
    proposicoes.map(p =>
      prisma.segov.findFirst({ where: { tipo: p.tipo, numero: p.numero, ano: p.ano } })
    )
  );

  const resultado = proposicoes.map((p, i) => ({ ...p, jaExiste: existentes[i] !== null }));
  return NextResponse.json({ proposicoes: resultado, total: resultado.length });
}
