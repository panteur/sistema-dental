'use client'

import StatisticsDashboard from '@/components/StatisticsDashboard'

export default function StatisticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Estadísticas</h1>
        <p className="text-slate-400 mt-1">Reportes, métricas y exportación de datos</p>
      </div>
      <StatisticsDashboard />
    </div>
  )
}
