import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sessaoId, proposicaoIds } = await req.json();

  const itensExistentes = await prisma.pautaItem.findMany({
    where: { sessaoId },
    orderBy: { ordem: "asc" },
  });

  const jaAdicionadas = new Set(itensExistentes.map((i) => i.proposicaoId));
  const novas = (proposicaoIds as string[]).filter((id) => !jaAdicionadas.has(id));

  if (novas.length > 0) {
    const proximaOrdem = itensExistentes.length + 1;
    await prisma.pautaItem.createMany({
      data: novas.map((proposicaoId, i) => ({
        sessaoId,
        proposicaoId,
        ordem: proximaOrdem + i,
      })),
    });

    await prisma.proposicao.updateMany({
      where: { id: { in: novas } },
      data: { etapaAtual: "pautado" },
    });
  }

  return NextResponse.json({ adicionadas: novas.length, duplicadas: proposicaoIds.length - novas.length });
}
