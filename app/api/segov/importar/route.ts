import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { texto, status } = await req.json();
  if (!texto || !status) return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });

  // Encontra referências como "PL 123/2026", "REQ 45/2026" etc.
  const regex = /\b(PL|PLC|PDL|REQ|IND|MOC)\s*[nNºN°]*\.?\s*(\d+)[\/\-](\d{4})\b/gi;
  const encontrados: { tipo: string; numero: string; ano: number }[] = [];
  let match;
  while ((match = regex.exec(texto)) !== null) {
    encontrados.push({
      tipo: match[1].toUpperCase(),
      numero: match[2],
      ano: parseInt(match[3]),
    });
  }

  if (encontrados.length === 0) {
    return NextResponse.json({ atualizados: 0, naoEncontrados: [] });
  }

  let atualizados = 0;
  const naoEncontrados: string[] = [];

  for (const ref of encontrados) {
    const item = await prisma.segov.findFirst({
      where: { numero: ref.numero, ano: ref.ano, tipo: ref.tipo },
    });
    if (item) {
      await prisma.segov.update({ where: { id: item.id }, data: { status } });
      atualizados++;
    } else {
      naoEncontrados.push(`${ref.tipo} ${ref.numero}/${ref.ano}`);
    }
  }

  return NextResponse.json({ atualizados, naoEncontrados });
}
