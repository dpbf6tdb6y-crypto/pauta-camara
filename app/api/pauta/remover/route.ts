import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { proposicaoId } = await req.json();

  await prisma.pautaItem.deleteMany({ where: { proposicaoId } });

  return NextResponse.json({ ok: true });
}
