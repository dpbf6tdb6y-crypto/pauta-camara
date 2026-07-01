import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalVereadores, totalComissoes,
         segovTotal, segovAguardando, segovComParecer, segovAprovado] =
    await Promise.all([
      prisma.vereador.count({ where: { ativo: true, poder: "legislativo" } }),
      prisma.comissao.count({ where: { ativa: true } }),
      prisma.segov.count(),
      prisma.segov.count({ where: { status: "Aguardando" } }),
      prisma.segov.count({ where: { status: "Com Parecer" } }),
      prisma.segov.count({ where: { status: "Aprovado" } }),
    ]);

  const stats = [
    { label: "Vereadores Ativos", value: totalVereadores, color: "#c0392b", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Comissões Ativas", value: totalComissoes, color: "#8B0000", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "Total SEGOV", value: segovTotal, color: "#6B21A8", icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Visão geral do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border-l-4" style={{ borderLeftColor: s.color }}>
            <div className="rounded-lg p-3" style={{ background: s.color }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEGOV */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Secretaria de Governo — SEGOV</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{segovTotal}</p>
            <p className="text-xs text-gray-500 mt-1">Total de Proposições</p>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{segovAguardando}</p>
            <p className="text-xs text-yellow-600 mt-1">Aguardando</p>
          </div>
          <div className="rounded-lg bg-purple-50 border border-purple-100 p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{segovComParecer}</p>
            <p className="text-xs text-purple-600 mt-1">Com Parecer</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{segovAprovado}</p>
            <p className="text-xs text-green-600 mt-1">Aprovadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
