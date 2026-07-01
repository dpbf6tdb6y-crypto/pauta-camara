import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const itens = await prisma.tag.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(itens);
}

export async function POST(req: Request) {
  const body = await req.json();
  const ano = new Date().getFullYear();
  const count = await prisma.tag.count();
  const referencia = `TAG-${String(count + 1).padStart(3, "0")}/${ano}`;
  const item = await prisma.tag.create({
    data: {
      referencia,
      data: new Date(body.data),
      pedido: body.pedido,
      status: body.status || "Aguardando",
      relevancia: body.relevancia || null,
      origem: body.origem || null,
      categoria: body.categoria || null,
      secretaria: body.secretaria || null,
      dataConclusao: body.dataConclusao ? new Date(body.dataConclusao) : null,
      documentos: body.documentos || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
