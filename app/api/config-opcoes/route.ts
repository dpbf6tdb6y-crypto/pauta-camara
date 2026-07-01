import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const opcoes = await prisma.configOpcao.findMany({
    where: { ...(tipo ? { tipo } : {}), ativo: true },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(opcoes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tipo, nome } = body;
  if (!tipo || !nome) return NextResponse.json({ error: "tipo e nome obrigatórios" }, { status: 400 });
  const count = await prisma.configOpcao.count({ where: { tipo } });
  const opcao = await prisma.configOpcao.create({ data: { tipo, nome: nome.trim(), ordem: count } });
  return NextResponse.json(opcao, { status: 201 });
}
