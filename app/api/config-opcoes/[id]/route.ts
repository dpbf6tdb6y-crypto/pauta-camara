import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const opcao = await prisma.configOpcao.update({ where: { id: params.id }, data: body });
  return NextResponse.json(opcao);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.configOpcao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
