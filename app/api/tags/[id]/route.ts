import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.tag.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const item = await prisma.tag.update({
    where: { id: params.id },
    data: {
      data: body.data ? new Date(body.data) : undefined,
      pedido: body.pedido,
      status: body.status,
      relevancia: body.relevancia ?? null,
      origem: body.origem ?? null,
      categoria: body.categoria ?? null,
      secretaria: body.secretaria ?? null,
      dataConclusao: body.dataConclusao ? new Date(body.dataConclusao) : null,
      documentos: body.documentos ?? null,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.tag.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
