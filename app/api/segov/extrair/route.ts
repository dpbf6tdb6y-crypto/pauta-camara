import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

function extrairTextoPdf(buffer: Buffer): string {
  // Extrai sequências de texto ASCII legível do buffer PDF.
  // Funciona para PDFs baseados em texto (agendas, atas), que armazenam
  // o conteúdo como ASCII puro nos streams internos do arquivo.
  const raw = buffer.toString("latin1");
  const partes = raw.match(/[\x21-\x7E]{2,}/g) || [];
  return partes.join(" ");
}

async function textoDoArquivo(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const nome = file.name.toLowerCase();
  if (nome.endsWith(".pdf")) {
    return extrairTextoPdf(buffer);
  }
  if (nome.endsWith(".docx") || nome.endsWith(".doc")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    return wb.SheetNames.map(n => XLSX.utils.sheet_to_txt(wb.Sheets[n])).join("\n");
  }
  throw new Error("Formato não suportado. Use PDF, Word ou Excel.");
}

export async function POST(req: Request) {
  let texto = "";
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    try {
      texto = await textoDoArquivo(file);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Erro ao ler o arquivo" }, { status: 400 });
    }
  } else {
    const body = await req.json();
    texto = body.texto || "";
  }

  if (!texto.trim()) return NextResponse.json({ error: "Nenhum texto extraído" }, { status: 400 });

  // Captura tipo+numero+ano e opcionalmente a ementa (texto após - ou : na mesma linha)
  const regex = /\b(PL|PLC|PDL|REQ|IND|MOC)\s*[nNºN°]*\.?\s*(\d+)[\/\-](\d{4})\b(?:[^\w\n\r]*[-–—:]\s*([^\n\r]{5,300}))?/gi;

  const encontrados: { tipo: string; numero: string; ano: number; ementa: string }[] = [];
  const vistos = new Set<string>();
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const key = `${match[1].toUpperCase()}_${match[2]}_${match[3]}`;
    if (!vistos.has(key)) {
      vistos.add(key);
      encontrados.push({
        tipo: match[1].toUpperCase(),
        numero: match[2],
        ano: parseInt(match[3]),
        ementa: match[4]?.trim() || "",
      });
    }
  }

  if (encontrados.length === 0) {
    return NextResponse.json({ proposicoes: [], total: 0 });
  }

  // Verifica quais já existem no SEGOV
  const existentes = await Promise.all(
    encontrados.map(e =>
      prisma.segov.findFirst({ where: { tipo: e.tipo, numero: e.numero, ano: e.ano } })
    )
  );

  const proposicoes = encontrados.map((e, i) => ({
    ...e,
    jaExiste: existentes[i] !== null,
  }));

  return NextResponse.json({ proposicoes, total: proposicoes.length });
}
