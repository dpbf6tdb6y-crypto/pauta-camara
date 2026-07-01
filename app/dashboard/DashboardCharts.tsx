'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
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
  porVereador:       VereadorData[]
  porStatusExecutivo: StatusData[]
  totalExecutivo:    number
}

export default function DashboardCharts({ porVereador, porStatusExecutivo, totalExecutivo }: Props) {
  const chartH = Math.max(280, porVereador.length * 36 + 40)

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* ── Proposições por Vereador ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Proposições por Vereador</h2>
        {porVereador.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">Nenhum dado disponível</p>
        ) : (
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={porVereador} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category" dataKey="nome" width={130}
                tick={{ fontSize: 11 }} tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v} proposição(ões)`, 'Total']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="total" radius={[0, 5, 5, 0]} maxBarSize={28}>
                {porVereador.map((_, i) => (
                  <Cell key={i} fill={VEREADOR_CORES[i % VEREADOR_CORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Proposições do Executivo ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="font-semibold text-gray-800">Proposições do Poder Executivo</h2>
          <span className="text-3xl font-bold text-purple-700">{totalExecutivo}</span>
        </div>
        {totalExecutivo === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">Nenhuma proposição do Executivo</p>
        ) : porStatusExecutivo.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porStatusExecutivo} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v} proposição(ões)`, 'Total']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="total" radius={[5, 5, 0, 0]} maxBarSize={48}>
                {porStatusExecutivo.map(entry => (
                  <Cell key={entry.status} fill={STATUS_COR[entry.status] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* Só um status — mostra pie simples: executivo vs legislativo */
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={porStatusExecutivo}
                dataKey="total"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, total }) => `${status}: ${total}`}
              >
                {porStatusExecutivo.map(entry => (
                  <Cell key={entry.status} fill={STATUS_COR[entry.status] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
