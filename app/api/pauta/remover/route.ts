import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { proposicaoId, sessaoId } = await req.json();

  await prisma.pautaItem.deleteMany({
    where: sessaoId ? { proposicaoId, sessaoId } : { proposicaoId },
  });

  return NextResponse.json({ ok: true });
}
