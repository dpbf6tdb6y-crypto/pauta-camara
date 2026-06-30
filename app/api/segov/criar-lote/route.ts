import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { itens } = await req.json();
  if (!itens || !Array.isArray(itens)) {
    return NextResponse.json({ error: "Itens inválidos" }, { status: 400 });
  }

  let criados = 0;
  let erros = 0;

  for (const item of itens) {
    try {
      await prisma.segov.create({
        data: {
          tipo: item.tipo,
          numero: String(item.numero),
          ano: parseInt(item.ano),
          ementa: item.ementa?.trim() || "(sem ementa)",
          vereadorId: item.vereadorId || null,
          autorNome: item.autorNome || null,
          status: "Aguardando",
          observacao: item.observacao || null,
          dataEnvio: item.dataEnvio ? new Date(item.dataEnvio) : null,
        },
      });
      criados++;
    } catch {
      erros++;
    }
  }

  return NextResponse.json({ criados, erros });
}
