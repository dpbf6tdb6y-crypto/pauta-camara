import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const item = await prisma.segov.update({
    where: { id: params.id },
    data: {
      numero: body.numero,
      ano: parseInt(body.ano) || new Date().getFullYear(),
      tipo: body.tipo,
      ementa: body.ementa,
      vereadorId: body.vereadorId || null,
      status: body.status,
      dataEnvio: body.dataEnvio ? new Date(body.dataEnvio) : null,
      observacao: body.observacao || null,
    },
    include: { vereador: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.segov.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
