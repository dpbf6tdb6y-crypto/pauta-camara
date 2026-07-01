'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'

export type VereadorData  = { nome: string; total: number }
export type StatusData    = { status: string; total: number }

const STATUS_COR: Record<string, string> = {
  'Aguardando':  '#eab308',
  'Com Parecer': '#a855f7',
  'Em análise':  '#3b82f6',
  'Aprovado':    '#22c55e',
  'Rejeitado':   '#ef4444',
  'Arquivado':   '#9ca3af',
  'Retirado':    '#f97316',
}

const VEREADOR_CORES = [
  '#8B0000','#c0392b','#7b2d8b','#1d4ed8','#0e7490',
  '#065f46','#92400e','#374151','#a21caf','#b45309',
  '#047857','#be185d','#1e40af','#6d28d9','#0f766e','#9f1239',
]

interface Props {
  porVereador:        VereadorData[]
  porStatusExecutivo: StatusData[]
  totalExecutivo:     number
}

export default function DashboardCharts({ porVereador, porStatusExecutivo, totalExecutivo }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* ── Proposições por Vereador ── */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Proposições por Vereador
        </p>
        {porVereador.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">Nenhum dado disponível</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={porVereador}
              layout="vertical"
              margin={{ left: 8, right: 40, top: 2, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} hide />
              <YAxis
                type="category" dataKey="nome" width={140}
                tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v} proposição(ões)`, 'Total']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {porVereador.map((_, i) => (
                  <Cell key={i} fill={VEREADOR_CORES[i % VEREADOR_CORES.length]} />
                ))}
                <LabelList
                  dataKey="total"
                  position="right"
                  style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Proposições do Executivo ── */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Proposições do Poder Executivo
          </p>
          <span className="text-lg font-bold text-purple-700">{totalExecutivo}</span>
        </div>
        {totalExecutivo === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">Nenhuma proposição do Executivo</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={porStatusExecutivo}
              margin={{ left: 0, right: 16, top: 22, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} hide />
              <Tooltip
                formatter={(v: number) => [`${v} proposição(ões)`, 'Total']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={52}>
                {porStatusExecutivo.map(entry => (
                  <Cell key={entry.status} fill={STATUS_COR[entry.status] || '#6b7280'} />
                ))}
                <LabelList
                  dataKey="total"
                  position="top"
                  style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
