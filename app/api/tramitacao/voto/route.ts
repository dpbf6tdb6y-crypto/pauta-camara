import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { proposicaoComissaoId, vereadorId, aprovado } = await req.json();

  await prisma.votoParecerVereador.upsert({
    where: { proposicaoComissaoId_vereadorId: { proposicaoComissaoId, vereadorId } },
    update: { aprovado },
    create: { proposicaoComissaoId, vereadorId, aprovado },
  });

  return NextResponse.json({ ok: true });
}
