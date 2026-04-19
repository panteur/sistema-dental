'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import CalendarView from '@/components/CalendarView'

function CancelDialog({ apt, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

function RescheduleModal({ apt, onClose, onSave, api }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).filter(d => d.getDay() !== 0)

  const loadSlots = async (date) => {
    setLoadingSlots(true)
    setSelectedTime(null)
    setAvailableSlots([])
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const serviceId = apt.service_id || ''
      const url = `/public/slots?dentist_id=${apt.dentist_id}&date=${dateStr}${serviceId ? `&service_id=${serviceId}` : ''}`
      const res = await api.get(url)
      setAvailableSlots(res.data.slots || [])
    } catch (err) {
      console.error('Error loading slots:', err)
      setAvailableSlots([])
    }
    setLoadingSlots(false)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    loadSlots(date)
  }

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) return
    setSaving(true)
    setError('')
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      await api.put(`/appointments/${apt.id}`, {
        date: dateStr,
        time: selectedTime,
      })
      onSave()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo reagendar')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
            <p className="text-amber-800 font-semibold mb-1">Cita actual:</p>
            <p className="text-amber-700">
              {format(new Date(apt.date), "d 'de' MMMM yyyy", { locale: es })} — {apt.time?.substring(0, 5)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nueva fecha</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {dates.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateSelect(date)}
                  className={`p-2.5 rounded-xl text-center transition-all text-[10px] sm:text-[11px] ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <p className="font-bold">{format(date, 'EEE', { locale: es }).slice(0, 3)}</p>
                  <p className="text-base font-extrabold mt-0.5">{format(date, 'd')}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nueva hora {loadingSlots && <span className="text-slate-400 font-normal">(Cargando...)</span>}
              </label>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                  {loadingSlots ? 'Cargando...' : 'No hay horarios disponibles'}
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

export default function CalendarPage() {
  const { api } = useAuth()
  const [selectedApt, setSelectedApt] = useState(null)
  const [cancelApt, setCancelApt] = useState(null)
  const [rescheduleApt, setRescheduleApt] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCancelConfirm = async () => {
    try {
      await api.patch(`/appointments/${cancelApt.id}/status`, { status: 'cancelada' })
      setCancelApt(null)
      setSelectedApt(null)
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRescheduleSave = () => {
    setSelectedApt(null)
    setRefreshKey(k => k + 1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendario de Citas</h1>
        <p className="text-slate-500 mt-1">Selecciona un día para ver sus citas</p>
      </div>

      <CalendarView key={refreshKey} onAppointmentClick={setSelectedApt} />

      {selectedApt && (
        <AppointmentDetailModal
          apt={selectedApt}
          onClose={() => setSelectedApt(null)}
          onCancel={(apt) => {
            setCancelApt(apt)
          }}
          onReschedule={(apt) => {
            setRescheduleApt(apt)
          }}
        />
      )}

      {cancelApt && (
        <CancelDialog
          apt={cancelApt}
          onClose={() => setCancelApt(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {rescheduleApt && (
        <RescheduleModal
          apt={rescheduleApt}
          api={api}
          onClose={() => setRescheduleApt(null)}
          onSave={handleRescheduleSave}
        />
      )}
    </div>
  )
}

function AppointmentDetailModal({ apt, onClose, onCancel, onReschedule }) {
  if (!apt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Detalle de Cita</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Paciente</p>
              <p className="font-medium text-slate-900">{apt.patient_name} {apt.patient_last_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Servicio</p>
              <p className="font-medium text-slate-900">{apt.service_name || 'Consulta'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fecha</p>
              <p className="font-medium text-slate-900">
                {format(new Date(apt.date), "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Hora</p>
              <p className="font-medium text-slate-900">{apt.time?.substring(0, 5)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Dentista</p>
              <p className="font-medium text-slate-900">{apt.dentist_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Estado</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                apt.status === 'completada' ? 'bg-green-100 text-green-800 border-green-200' :
                apt.status === 'cancelada' ? 'bg-red-100 text-red-800 border-red-200' :
                apt.status === 'confirmada' ? 'bg-green-100 text-green-800 border-green-200' :
                apt.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {apt.status === 'completada' ? 'Completada' :
                 apt.status === 'cancelada' ? 'Cancelada' :
                 apt.status === 'confirmada' ? 'Confirmada' :
                 apt.status === 'pendiente' ? 'Pendiente' :
                 'No se presentó'}
              </span>
            </div>
            {apt.patient_phone && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Teléfono</p>
                <p className="font-medium text-slate-900">{apt.patient_phone}</p>
              </div>
            )}
            {apt.notes && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Notas</p>
                <p className="text-sm text-slate-700">{apt.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          {apt.status !== 'cancelada' && apt.status !== 'completada' && (
            <>
              <button
                onClick={() => onReschedule(apt)}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors"
              >
                Reagendar
              </button>
              <button
                onClick={() => onCancel(apt)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Anular
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
