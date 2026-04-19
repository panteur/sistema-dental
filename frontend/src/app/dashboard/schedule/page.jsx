'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

export default function SchedulePage() {
  const { api, user } = useAuth()
  const [dentists, setDentists] = useState([])
  const [schedules, setSchedules] = useState({})
  const [selectedDentist, setSelectedDentist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isDentist = user?.role === 'dentista'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/dentists')
      setDentists(res.data.dentists)

      if (isDentist) {
        setSelectedDentist(user.id)
      } else if (res.data.dentists.length > 0) {
        setSelectedDentist(res.data.dentists[0].id)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedDentist) {
      loadSchedules()
    }
  }, [selectedDentist])

  const loadSchedules = async () => {
    try {
      const res = await api.get(`/schedules/user/${selectedDentist}`)
      const scheduleMap = {}
      res.data.schedules?.forEach(s => {
        scheduleMap[s.day_of_week] = s
      })
      setSchedules(scheduleMap)
    } catch (err) {
      console.error('Error loading schedules:', err)
    }
  }

  const handleSave = async (day, data) => {
    setSaving(true)
    try {
      if (data.active) {
        if (schedules[day]?.id) {
          await api.put(`/schedules/${schedules[day].id}`, data)
        } else {
          await api.post('/schedules', { user_id: selectedDentist, ...data })
        }
      } else {
        if (schedules[day]?.id) {
          await api.delete(`/schedules/${schedules[day].id}`)
        }
      }
      loadSchedules()
    } catch (err) {
      console.error('Error saving schedule:', err)
      alert('Error al guardar el horario')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
        {isAdmin && (
          <select
            value={selectedDentist || ''}
            onChange={(e) => setSelectedDentist(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccionar dentista</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedDentist && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          Selecciona un dentista para ver y editar sus horarios
        </div>
      )}

      {selectedDentist && (
        <div className="space-y-4">
          {DAYS.map((day) => (
            <ScheduleRow
              key={day.value}
              day={day}
              schedule={schedules[day.value]}
              onSave={handleSave}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ScheduleRow({ day, schedule, onSave, saving }) {
  const [active, setActive] = useState(!!schedule?.active)
  const [startTime, setStartTime] = useState(schedule?.start_time?.substring(0, 5) || '09:00')
  const [endTime, setEndTime] = useState(schedule?.end_time?.substring(0, 5) || '17:00')
  const [breakStart, setBreakStart] = useState(schedule?.break_start?.substring(0, 5) || '12:00')
  const [breakEnd, setBreakEnd] = useState(schedule?.break_end?.substring(0, 5) || '13:00')

  useEffect(() => {
    setActive(!!schedule?.active)
    setStartTime(schedule?.start_time?.substring(0, 5) || '09:00')
    setEndTime(schedule?.end_time?.substring(0, 5) || '17:00')
    setBreakStart(schedule?.break_start?.substring(0, 5) || '12:00')
    setBreakEnd(schedule?.break_end?.substring(0, 5) || '13:00')
  }, [schedule])

  const handleSave = () => {
    onSave(day.value, {
      day_of_week: day.value,
      start_time: startTime,
      end_time: endTime,
      break_start: active ? breakStart : null,
      break_end: active ? breakEnd : null,
      active
    })
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${active ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
          <h3 className="font-semibold text-gray-900">{day.label}</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {active && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descanso inicio</label>
            <input
              type="time"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descanso fin</label>
            <input
              type="time"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
