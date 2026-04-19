'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

function MetricCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${icon.bg}`}>
          {icon.svg}
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, title, colorClass }) {
  const max = Math.max(...Object.values(data), 1)
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
      <h4 className="text-base font-bold text-slate-900 mb-5">{title}</h4>
      <div className="space-y-4">
        {Object.entries(data).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
          const pct = max > 0 ? (count / max) * 100 : 0
          return (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700 truncate max-w-[140px]">{label}</span>
                <span className="font-bold text-slate-900">{count}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {Object.keys(data).length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>
        )}
      </div>
    </div>
  )
}

function StatusGrid({ byStatus }) {
  const items = [
    { key: 'pendiente', label: 'Pendiente', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700', dotColor: 'bg-amber-400' },
    { key: 'confirmada', label: 'Confirmada', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', dotColor: 'bg-emerald-400' },
    { key: 'completada', label: 'Completada', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', dotColor: 'bg-blue-400' },
    { key: 'cancelada', label: 'Cancelada', color: 'bg-red-50 border-red-200', textColor: 'text-red-700', dotColor: 'bg-red-400' },
    { key: 'no_presento', label: 'No se presentó', color: 'bg-slate-50 border-slate-200', textColor: 'text-slate-600', dotColor: 'bg-slate-400' },
  ]
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
      <h4 className="text-base font-bold text-slate-900 mb-5">Estado de las Citas</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map(({ key, label, color, textColor, dotColor }) => (
          <div key={key} className={`rounded-xl p-4 border text-center ${color}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mx-auto mb-2`} />
            <p className={`text-2xl font-extrabold ${textColor}`}>{byStatus[key] || 0}</p>
            <p className={`text-[10px] font-semibold mt-1 ${textColor}`}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatisticsDashboard() {
  const { api, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [dateRange, setDateRange] = useState({ start: null, end: null })

  useEffect(() => {
    const now = new Date()
    if (period === 'month') {
      setDateRange({
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd')
      })
    } else if (period === 'week') {
      setDateRange({
        start: format(subDays(now, 7), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd')
      })
    } else if (period === 'year') {
      setDateRange({
        start: format(subMonths(startOfMonth(now), 11), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd')
      })
    }
  }, [period])

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadStatistics()
    }
  }, [dateRange, user])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/appointments/by-range?start_date=${dateRange.start}&end_date=${dateRange.end}`)
      const appointments = res.data.appointments || []

      const totalAppointments = appointments.length
      const completedAppointments = appointments.filter(a => a.status === 'completada').length
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelada').length
      const pendingAppointments = appointments.filter(a => a.status === 'pendiente').length
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmada').length
      const noShowAppointments = appointments.filter(a => a.status === 'no_presento').length

      const completionRate = totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
        : '0.0'
      const cancellationRate = totalAppointments > 0
        ? ((cancelledAppointments / totalAppointments) * 100).toFixed(1)
        : '0.0'

      const appointmentsByStatus = {
        pendiente: pendingAppointments,
        confirmada: confirmedAppointments,
        completada: completedAppointments,
        cancelada: cancelledAppointments,
        no_presento: noShowAppointments
      }

      const appointmentsByService = appointments.reduce((acc, apt) => {
        const service = apt.service_name || 'Sin servicio'
        acc[service] = (acc[service] || 0) + 1
        return acc
      }, {})

      const appointmentsByDentist = appointments.reduce((acc, apt) => {
        const dentist = apt.dentist_name || 'Sin dentista'
        acc[dentist] = (acc[dentist] || 0) + 1
        return acc
      }, {})

      const totalRevenue = appointments
        .filter(a => a.status === 'completada')
        .reduce((sum, a) => sum + (parseFloat(a.service_price) || 0), 0)

      const uniquePatients = [...new Set(appointments.map(a => a.patient_id))].length
      const newPatients = appointments.filter(a => a.type === 'nueva').length
      const followUps = appointments.filter(a => a.type === 'seguimiento').length

      setStats({
        total: totalAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        noShow: noShowAppointments,
        completionRate,
        cancellationRate,
        byStatus: appointmentsByStatus,
        byService: appointmentsByService,
        byDentist: appointmentsByDentist,
        totalRevenue,
        uniquePatients,
        newPatients,
        followUps
      })
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
    setLoading(false)
  }

  const exportToExcel = () => {
    if (!stats) return
    const appointmentsData = [
      ['Estadísticas del período'],
      [`Desde: ${dateRange.start}`],
      [`Hasta: ${dateRange.end}`],
      [],
      ['Resumen General'],
      ['Métricas', 'Valor'],
      ['Total de citas', stats.total],
      ['Citas completadas', stats.completed],
      ['Citas canceladas', stats.cancelled],
      ['Citas pendientes', stats.pending],
      ['Citas confirmadas', stats.confirmed],
      ['Tasa de completación (%)', stats.completionRate],
      ['Tasa de cancelación (%)', stats.cancellationRate],
      ['Ingresos totales ($)', stats.totalRevenue.toFixed(2)],
      ['Pacientes únicos', stats.uniquePatients],
      ['Nuevos pacientes', stats.newPatients],
      [],
      ['Citas por servicio'],
      ['Servicio', 'Cantidad'],
      ...Object.entries(stats.byService),
      [],
      ['Citas por dentista'],
      ['Dentista', 'Cantidad'],
      ...Object.entries(stats.byDentist),
      [],
      ['Citas por estado'],
      ['Estado', 'Cantidad'],
      ...Object.entries(stats.byStatus)
    ]
    const ws = XLSX.utils.aoa_to_sheet(appointmentsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas')
    XLSX.writeFile(wb, `estadisticas-clinica-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  const exportToPDF = () => {
    if (!stats) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Reporte de Estadisticas - Clinica Dental', 14, 22)
    doc.setFontSize(10)
    doc.text(`Periodo: ${dateRange.start} al ${dateRange.end}`, 14, 30)
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36)
    doc.setFontSize(14)
    doc.text('Resumen General', 14, 48)
    doc.setFontSize(10)
    const summaryData = [
      ['Total de citas', stats.total.toString()],
      ['Completadas', stats.completed.toString()],
      ['Canceladas', stats.cancelled.toString()],
      ['Pendientes', stats.pending.toString()],
      ['Confirmadas', stats.confirmed.toString()],
      ['No se apresentaram', stats.noShow.toString()],
      ['Tasa de completacion (%)', stats.completionRate],
      ['Tasa de cancelacion (%)', stats.cancellationRate],
      ['Ingresos totales', `$${stats.totalRevenue.toFixed(2)}`],
      ['Pacientes unicos', stats.uniquePatients.toString()],
      ['Nuevos pacientes', stats.newPatients.toString()]
    ]
    doc.autoTable({
      startY: 52,
      head: [['Metrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] }
    })
    const yPos = doc.lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text('Citas por Servicio', 14, yPos)
    const serviceData = Object.entries(stats.byService).map(([name, count]) => [name, count.toString()])
    doc.autoTable({
      startY: yPos + 4,
      head: [['Servicio', 'Cantidad']],
      body: serviceData,
      theme: 'striped',
      headStyles: { fillColor: [2, 132, 199] }
    })
    const yPos2 = doc.lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.text('Citas por Dentista', 14, yPos2)
    const dentistData = Object.entries(stats.byDentist).map(([name, count]) => [name, count.toString()])
    doc.autoTable({
      startY: yPos2 + 4,
      head: [['Dentista', 'Cantidad']],
      body: dentistData,
      theme: 'striped',
      headStyles: { fillColor: [2, 132, 199] }
    })
    doc.save(`reporte-clinica-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-12 text-center">
        <svg className="w-12 h-12 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-slate-400 font-medium">No hay datos disponibles</p>
      </div>
    )
  }

  const periodLabels = { week: 'Últimos 7 días', month: 'Este mes', year: 'Últimos 12 meses' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{periodLabels[period]}</p>
            <p className="text-xs text-slate-400">{dateRange.start} — {dateRange.end}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all cursor-pointer hover:bg-slate-100"
          >
            <option value="week">Últimos 7 días</option>
            <option value="month">Este mes</option>
            <option value="year">Últimos 12 meses</option>
          </select>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Total de citas"
          value={stats.total}
          color="text-slate-900"
          icon={{ bg: 'bg-slate-100 text-slate-600', svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }}
        />
        <MetricCard
          label="Completadas"
          value={stats.completed}
          color="text-blue-600"
          icon={{ bg: 'bg-blue-100 text-blue-600', svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }}
        />
        <MetricCard
          label="Canceladas"
          value={stats.cancelled}
          color="text-red-500"
          icon={{ bg: 'bg-red-50 text-red-500', svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> }}
        />
        <MetricCard
          label="Pendientes"
          value={stats.pending}
          color="text-amber-500"
          icon={{ bg: 'bg-amber-50 text-amber-500', svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }}
        />
        <MetricCard
          label="Tasa completación"
          value={`${stats.completionRate}%`}
          color="text-emerald-600"
          icon={{ bg: 'bg-emerald-50 text-emerald-600', svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }}
        />
        <MetricCard
          label="Ingresos"
          value={`$${stats.totalRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`}
          color="text-sky-600"
          icon={{ bg: 'bg-sky-50 text-sky-600', svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarChart data={stats.byService} title="Citas por Servicio" colorClass="bg-gradient-to-r from-sky-500 to-sky-600" />
        <BarChart data={stats.byDentist} title="Citas por Dentista" colorClass="bg-gradient-to-r from-emerald-500 to-emerald-600" />
      </div>

      <StatusGrid byStatus={stats.byStatus} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 text-center hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.uniquePatients}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Pacientes únicos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 text-center hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.newPatients}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Nuevos pacientes</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 text-center hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.followUps}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Seguimientos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 text-center hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.noShow}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">No se presentaron</p>
        </div>
      </div>
    </div>
  )
}
