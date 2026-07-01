import { prisma } from "@/lib/prisma";
import DashboardCharts from "./DashboardCharts";

export const dynamic = "force-dynamic";

const STATUS_LIST = [
  'Aguardando', 'Com Parecer', 'Em análise', 'Aprovado', 'Rejeitado', 'Arquivado', 'Retirado',
] as const;

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Aguardando':  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200'  },
  'Com Parecer': { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200'  },
  'Em análise':  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  'Aprovado':    { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'   },
  'Rejeitado':   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
  'Arquivado':   { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200'    },
  'Retirado':    { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200'  },
};

function isExec(item: { autorNome: string | null }) {
  return (item.autorNome || '').toLowerCase().includes('executivo')
      || (item.autorNome || '').toLowerCase().includes('prefeitura');
}

export default async function DashboardPage() {
  const itens = await prisma.segov.findMany({
    include: { vereador: true },
    orderBy: [{ ano: 'desc' }, { numero: 'asc' }],
  });

  // ── Totais básicos ───────────────────────────────────────
  const total = itens.length;

  const porStatus: Record<string, number> = {};
  STATUS_LIST.forEach(s => { porStatus[s] = 0; });
  itens.forEach(item => {
    porStatus[item.status] = (porStatus[item.status] || 0) + 1;
  });

  // ── Resultado final (do fluxo JSONB) ────────────────────
  let aprovadoFinal = 0;
  let reprovadoFinal = 0;
  let somaDias = 0;
  let contDias = 0;

  itens.forEach(item => {
    const f = (item.fluxo as any) || {};
    const rf = f.resultadoFinal;
    if (rf?.done) {
      if (rf.data?.resultado === 'aprovado') aprovadoFinal++;
      else reprovadoFinal++;
    }
    // Média de dias: pautado → resultadoFinal
    if (f.pautado?.doneAt && rf?.done && rf?.doneAt) {
      const dias = Math.floor(
        (new Date(rf.doneAt).getTime() - new Date(f.pautado.doneAt).getTime()) / 86400000
      );
      if (dias >= 0) { somaDias += dias; contDias++; }
    }
  });

  const mediaDias = contDias > 0 ? Math.round(somaDias / contDias) : null;

  // ── Autores ──────────────────────────────────────────────
  const executivoItens = itens.filter(isExec);
  const totalExecutivo  = executivoItens.length;

  // Proposições por vereador (não-executivo)
  const porVereadorMap: Record<string, number> = {};
  itens.forEach(item => {
    if (isExec(item)) return;
    const nomes: string[] = item.vereador?.nome
      ? [item.vereador.nome]
      : (item.autorNome || '').split(/\s+e\s+|,\s+/).map((n: string) => n.trim()).filter(Boolean);
    nomes.forEach(n => { porVereadorMap[n] = (porVereadorMap[n] || 0) + 1; });
  });

  const porVereador = Object.entries(porVereadorMap)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  const totalVereadores = porVereador.length;

  // Executivo por status
  const execStatus: Record<string, number> = {};
  executivoItens.forEach(item => {
    execStatus[item.status] = (execStatus[item.status] || 0) + 1;
  });
  const porStatusExecutivo = Object.entries(execStatus)
    .map(([status, total]) => ({ status, total }))
    .sort((a, b) => b.total - a.total);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Visão geral do sistema legislativo — SEGOV</p>
      </div>

      {/* ── Resumo (4 cards) ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total de Proposições" value={total} color="#8B0000"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <StatCard
          label="Vereadores c/ Proposições" value={totalVereadores} color="#1d4ed8"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <StatCard
          label="Proposições do Executivo" value={totalExecutivo} color="#7c3aed"
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
        <StatCard
          label="Média para Conclusão"
          value={mediaDias !== null ? `${mediaDias} dias` : '—'}
          color="#0e7490" small
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* ── Por Status ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Por Status</h2>
        <div className="grid grid-cols-7 gap-3">
          {STATUS_LIST.map(s => {
            const c = STATUS_STYLE[s];
            return (
              <div key={s} className={`rounded-lg border p-3 text-center ${c.bg} ${c.border}`}>
                <p className={`text-2xl font-bold ${c.text}`}>{porStatus[s] || 0}</p>
                <p className={`text-xs mt-1 ${c.text} font-medium leading-tight`}>{s}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Resultado Final ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Resultado Final (votação)</h2>
        <div className="flex gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-8 py-4 text-center">
            <p className="text-3xl font-bold text-green-700">{aprovadoFinal}</p>
            <p className="text-sm mt-1 text-green-600 font-medium">Aprovadas</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-8 py-4 text-center">
            <p className="text-3xl font-bold text-red-700">{reprovadoFinal}</p>
            <p className="text-sm mt-1 text-red-600 font-medium">Reprovadas</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-8 py-4 text-center">
            <p className="text-3xl font-bold text-gray-500">{total - aprovadoFinal - reprovadoFinal}</p>
            <p className="text-sm mt-1 text-gray-500 font-medium">Em tramitação</p>
          </div>
          {mediaDias !== null && (
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-8 py-4 text-center ml-auto">
              <p className="text-3xl font-bold text-cyan-700">{mediaDias}</p>
              <p className="text-sm mt-1 text-cyan-600 font-medium">Dias (média)</p>
              <p className="text-xs text-cyan-500">do pautado à conclusão</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Gráficos ── */}
      <DashboardCharts
        porVereador={porVereador}
        porStatusExecutivo={porStatusExecutivo}
        totalExecutivo={totalExecutivo}
      />
    </div>
  );
}

function StatCard({
  label, value, color, icon, small,
}: {
  label: string; value: string | number; color: string; icon: string; small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border-l-4" style={{ borderLeftColor: color }}>
      <div className="rounded-lg p-3 flex-shrink-0" style={{ background: color }}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <p className={`font-bold text-gray-800 ${small ? 'text-xl' : 'text-2xl'}`}>{value}</p>
        <p className="text-gray-500 text-xs leading-tight">{label}</p>
      </div>
    </div>
  );
}
