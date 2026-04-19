'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

const ROLES = { ADMIN: 'admin', DENTIST: 'dentista', RECEPTIONIST: 'recepcionista' }

function StatusBadge({ status }) {
  const styles = {
    pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completada: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelada: 'bg-red-50 text-red-700 border-red-200',
    no_presento: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  const labels = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_presento: 'No se presentó',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pendiente}`}>
      {labels[status] || status}
    </span>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{value ?? '—'}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

/* ─── CANCEL DIALOG ─── */
function CancelDialog({ apt, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">¿Anular esta cita?</h3>
          <p className="text-sm text-slate-500 mb-1">
            {apt.patient_name} {apt.patient_last_name}
          </p>
          <p className="text-sm text-slate-400">
            {format(new Date(apt.date), "d 'de' MMMM yyyy", { locale: es })} — {apt.time?.substring(0, 5)}
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            No, mantener
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
            Sí, anular
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── RESCHEDULE MODAL ─── */
function RescheduleModal({ apt, onClose, onSave, api }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const months = Array.from({ length: 3 }, (_, i) => addMonths(new Date(), i))

  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  }).filter(d => d.getDay() !== 0 && d >= new Date())

  const loadSlots = async (date) => {
    setLoadingSlots(true)
    setSelectedTime(null)
    setAvailableSlots([])
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const serviceId = apt.service_id || apt.service_duration ? apt.service_id : ''
      const url = `/public/slots?dentist_id=${apt.dentist_id}&date=${dateStr}${serviceId ? `&service_id=${serviceId}` : ''}`
      const res = await api.get(url)
      setAvailableSlots(res.data.slots || [])
    } catch (err) {
      console.error('Error loading slots:', err)
      setAvailableSlots([])
    }
    setLoadingSlots(false)
  }

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate)
    }
  }, [selectedDate])

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) return
    setSaving(true)
    setError('')
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      await api.put(`/appointments/${apt.id}`, {
        date: dateStr,
        time: selectedTime,
        service_id: apt.service_id || undefined,
      })
      onSave()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo reagendar')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reagendar Cita</h3>
            <p className="text-sm text-slate-500 mt-0.5">{apt.patient_name} {apt.patient_last_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
          )}

          {/* Current info */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
            <p className="text-amber-800 font-semibold mb-1">Cita actual:</p>
            <p className="text-amber-700">
              {format(new Date(apt.date), "d 'de' MMMM yyyy", { locale: es })} — {apt.time?.substring(0, 5)}
            </p>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar mes</label>
            <div className="flex gap-2 mb-4">
              {months.map((month) => (
                <button
                  key={month.toISOString()}
                  onClick={() => setSelectedMonth(month)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSameMonth(month, selectedMonth)
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {format(month, 'MMMM yyyy', { locale: es })}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-slate-700 mb-2">Nueva fecha</label>
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  disabled={date < new Date()}
                  className={`p-2 rounded-lg text-center text-xs transition-all ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? 'bg-sky-600 text-white shadow-md'
                      : date < new Date()
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } ${isToday(date) && date >= new Date() ? 'ring-2 ring-sky-400 ring-offset-1' : ''}`}
                >
                  <p className="font-bold">{format(date, 'EEE', { locale: es }).slice(0, 3)}</p>
                  <p className="text-lg font-extrabold mt-0.5">{format(date, 'd')}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nueva hora {loadingSlots && <span className="text-slate-400 font-normal">(Cargando...)</span>}
              </label>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        selectedTime === slot
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-sky-100 text-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4 text-center">
                  {loadingSlots ? 'Cargando...' : 'No hay horarios disponibles para este día'}
                </p>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm">
              <p className="text-emerald-700 font-semibold">Nueva cita:</p>
              <p className="text-emerald-600">
                {format(selectedDate, "d 'de' MMMM yyyy", { locale: es })} — {selectedTime}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || !selectedTime || saving}
            className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── APPOINTMENT CARD (shared) ─── */
function AppointmentCard({ apt, onCancel, onReschedule, onComplete, onMarkNoShow }) {
  const canAct = apt.status !== 'cancelada' && apt.status !== 'completada'
  const canReschedule = apt.status === 'pendiente' || apt.status === 'confirmada'

  return (
    <div className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {apt.patient_name?.[0]}{apt.patient_last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{apt.patient_name} {apt.patient_last_name}</p>
            <p className="text-xs text-slate-500">{apt.service_name}</p>
            {apt.patient_phone && <p className="text-xs text-slate-400">{apt.patient_phone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{format(new Date(apt.date), "d MMM yyyy", { locale: es })}</p>
            <p className="text-xs text-slate-500">{apt.time?.substring(0, 5)}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">{apt.dentist_name}</p>
            <p className="text-xs text-slate-400">{apt.dentist_specialty}</p>
          </div>
          <StatusBadge status={apt.status} />
          {canAct && (
            <div className="flex gap-1.5">
              {canReschedule && (
                <button
                  onClick={() => onReschedule(apt)}
                  className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                  title="Reagendar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onCancel(apt)}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                title="Anular"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── ADMIN DASHBOARD ─── */
function AdminDashboard({ api }) {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, statsRes] = await Promise.all([
          api.get('/users'),
          api.get('/appointments/stats'),
        ])
        setUsers(usersRes.data.users || [])
        setStats(statsRes.data.stats || {})
      } catch (err) {
        console.error(err)
      }
    }
    load().finally(() => setLoading(false))
  }, [])

  const roleLabels = { admin: 'Administrador', dentista: 'Dentista', recepcionista: 'Recepcionista' }
  const roleColors = {
    admin: 'bg-violet-100 text-violet-700',
    dentista: 'bg-sky-100 text-sky-700',
    recepcionista: 'bg-emerald-100 text-emerald-700',
  }

  const totalUsers = users.length
  const byRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {})

  if (loading) return <DashboardSkeleton />

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-400 mt-1">Resumen del sistema y gestión de usuarios</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Usuarios" value={totalUsers} color="bg-violet-100 text-violet-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard label="Dentistas" value={byRole.dentista || 0} color="bg-sky-100 text-sky-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
        />
        <StatCard label="Recepcionistas" value={byRole.recepcionista || 0} color="bg-emerald-100 text-emerald-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.355 0-2.697-.056-4.024-.166-1.133-.093-1.99-.85-2.217-1.945C8.668 12.21 8.45 12 8.25 12a3.75 3.75 0 01-2.25-6.79c.534-.304 1.166-.488 1.87-.655M20.25 8.511V12a3 3 0 01-3 3m-11.5-3.5H7.5m0 0v6m0-6H6" /></svg>}
        />
        <StatCard label="Citas Totales" value={stats.total || 0} color="bg-slate-100 text-slate-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Pendientes" value={stats.pending || 0} color="bg-amber-100 text-amber-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Confirmadas" value={stats.confirmed || 0} color="bg-emerald-100 text-emerald-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Completadas" value={stats.completed || 0} color="bg-blue-100 text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Usuarios del Sistema</h2>
          <Link href="/dashboard/users" className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
            Ver todos
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Especialidad</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.slice(0, 8).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                        {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-slate-900 text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.specialty || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {u.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center py-12 text-slate-400 text-sm">No hay usuarios registrados.</p>}
        </div>
      </div>
    </div>
  )
}

/* ─── DENTIST DASHBOARD ─── */
function DentistDashboard({ api, user }) {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [cancelApt, setCancelApt] = useState(null)
  const [rescheduleApt, setRescheduleApt] = useState(null)

  const loadData = async () => {
    try {
      const weekStart = format(new Date(), 'yyyy-MM-dd')
      const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const [aptRes, statsRes] = await Promise.all([
        api.get(`/appointments/by-range?dentist_id=${user.id}&start_date=${weekStart}&end_date=${weekEnd}`),
        api.get(`/appointments/stats?dentist_id=${user.id}`),
      ])
      setAppointments(aptRes.data.appointments || [])
      setStats(statsRes.data.stats || {})
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [user.id])

  const handleCancel = async () => {
    try {
      await api.patch(`/appointments/${cancelApt.id}/status`, { status: 'cancelada' })
      setCancelApt(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReschedule = async () => {
    setRescheduleApt(null)
    loadData()
  }

  const handleComplete = async (apt) => {
    try {
      await api.patch(`/appointments/${apt.id}/status`, { status: 'completada' })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleNoShow = async (apt) => {
    try {
      await api.patch(`/appointments/${apt.id}/status`, { status: 'no_presento' })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  const dayAppointments = appointments.filter(a => {
    const aptDate = new Date(a.date)
    return aptDate.toDateString() === selectedDate.toDateString()
  })

  const todayApts = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString())

  if (loading) return <DashboardSkeleton />

  return (
    <div>
      {cancelApt && <CancelDialog apt={cancelApt} onClose={() => setCancelApt(null)} onConfirm={handleCancel} />}
      {rescheduleApt && (
        <RescheduleModal
          apt={rescheduleApt}
          api={api}
          onClose={() => setRescheduleApt(null)}
          onSave={handleReschedule}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Mi Agenda</h1>
        <p className="text-slate-400 mt-1">Citas y disponibilidad para los próximos días</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Citas Hoy" value={todayApts.length} color="bg-sky-100 text-sky-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
        />
        <StatCard label="Pendientes" value={stats.pending || 0} color="bg-amber-100 text-amber-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Confirmadas" value={stats.confirmed || 0} color="bg-emerald-100 text-emerald-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Esta Semana" value={appointments.length} color="bg-violet-100 text-violet-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.689V8.69zM12 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.06a1.125 1.125 0 01-1.683-.976V8.69z" /></svg>}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-6">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Selecciona un día</h2>
        </div>
        <div className="flex overflow-x-auto">
          {weekDates.map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString()
            const dayApts = appointments.filter(a => new Date(a.date).toDateString() === date.toDateString())
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-4 min-w-[80px] border-r border-slate-100 last:border-r-0 transition-all ${
                  isSelected ? 'bg-sky-50 border-b-2 border-b-sky-500' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-sky-600' : 'text-slate-400'}`}>
                  {format(date, 'EEE', { locale: es })}
                </span>
                <span className={`text-2xl font-extrabold mt-1 ${isSelected ? 'text-sky-700' : 'text-slate-800'}`}>
                  {format(date, 'd')}
                </span>
                {dayApts.length > 0 && (
                  <span className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-600'
                  }`}>
                    {dayApts.length} {dayApts.length === 1 ? 'cita' : 'citas'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Citas del {format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <span className="text-sm text-slate-500">{dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''}</span>
        </div>
        <div>
          {dayAppointments.length > 0 ? (
            dayAppointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((apt) => (
                <div key={apt.id} className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 text-center">
                      <span className="text-xl font-bold text-slate-900">{apt.time?.substring(0, 5)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{apt.patient_name} {apt.patient_last_name}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{apt.service_name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={apt.status} />
                          {apt.status !== 'cancelada' && apt.status !== 'completada' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => setRescheduleApt(apt)}
                                className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                                title="Reagendar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleComplete(apt)}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Marcar completada"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleNoShow(apt)}
                                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                title="No se presentó"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setCancelApt(apt)}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Anular"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-slate-400 text-sm font-medium">No hay citas para este día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── RECEPTIONIST DASHBOARD ─── */
function ReceptionistDashboard({ api }) {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [cancelApt, setCancelApt] = useState(null)
  const [rescheduleApt, setRescheduleApt] = useState(null)

  const loadData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const future = format(addDays(new Date(), 30), 'yyyy-MM-dd')
      const [aptRes, statsRes] = await Promise.all([
        api.get(`/appointments/by-range?start_date=${today}&end_date=${future}`),
        api.get('/appointments/stats'),
      ])
      setAppointments(aptRes.data.appointments || [])
      setStats(statsRes.data.stats || {})
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [])

  const handleCancel = async () => {
    try {
      await api.patch(`/appointments/${cancelApt.id}/status`, { status: 'cancelada' })
      setCancelApt(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReschedule = () => {
    setRescheduleApt(null)
    loadData()
  }

  const filterOptions = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'today', label: 'Hoy' },
    { key: 'all', label: 'Todas (activas)' },
  ]

  const filtered = appointments.filter(a => {
    if (filter === 'pending') return a.status === 'pendiente'
    if (filter === 'confirmed') return a.status === 'confirmada'
    if (filter === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd')
      return a.date === today
    }
    return a.status !== 'cancelada' && a.status !== 'completada'
  })

  if (loading) return <DashboardSkeleton />

  return (
    <div>
      {cancelApt && <CancelDialog apt={cancelApt} onClose={() => setCancelApt(null)} onConfirm={handleCancel} />}
      {rescheduleApt && (
        <RescheduleModal
          apt={rescheduleApt}
          api={api}
          onClose={() => setRescheduleApt(null)}
          onSave={handleReschedule}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Gestión de Citas</h1>
        <p className="text-slate-400 mt-1">Todas las reservas activas y pendientes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pendientes" value={stats.pending || 0} color="bg-amber-100 text-amber-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Confirmadas" value={stats.confirmed || 0} color="bg-emerald-100 text-emerald-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Completadas" value={stats.completed || 0} color="bg-blue-100 text-blue-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        />
        <StatCard label="Canceladas" value={stats.cancelled || 0} color="bg-red-100 text-red-600"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === opt.key ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div>
          {filtered.length > 0 ? (
            filtered
              .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date)
                if (dateCompare !== 0) return dateCompare
                return a.time.localeCompare(b.time)
              })
              .map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  onCancel={setCancelApt}
                  onReschedule={setRescheduleApt}
                />
              ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-slate-400 text-sm font-medium">No hay reservas para el filtro seleccionado</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 text-center">
          <Link href="/dashboard/appointments" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
            Ver gestión completa de citas →
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── SKELETON ─── */
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div><div className="h-8 bg-slate-200 rounded w-48 mb-2" /><div className="h-4 bg-slate-200 rounded w-64" /></div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  )
}

/* ─── MAIN EXPORT ─── */
export default function DashboardPage() {
  const { api, user } = useAuth()
  if (!user) return <DashboardSkeleton />
  const role = user.role
  if (role === ROLES.ADMIN) return <AdminDashboard api={api} />
  if (role === ROLES.DENTIST) return <DentistDashboard api={api} user={user} />
  if (role === ROLES.RECEPTIONIST) return <ReceptionistDashboard api={api} />
  return <AdminDashboard api={api} />
}
