'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek as getStartOfWeek
} from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_COLORS = {
  pendiente: 'bg-yellow-500',
  confirmada: 'bg-green-500',
  completada: 'bg-green-500',
  cancelada: 'bg-red-500',
  no_presento: 'bg-gray-400'
}

const STATUS_BG = {
  pendiente: 'bg-yellow-50 border-yellow-200',
  confirmada: 'bg-green-50 border-green-200',
  completada: 'bg-green-50 border-green-200',
  cancelada: 'bg-red-50 border-red-200',
  no_presento: 'bg-gray-50 border-gray-200'
}

const STATUS_TEXT = {
  pendiente: 'text-yellow-700',
  confirmada: 'text-green-700',
  completada: 'bg-green-700',
  cancelada: 'text-red-700',
  no_presento: 'text-gray-600'
}

const STATUS_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  no_presento: 'bg-gray-100 text-gray-600'
}

export default function CalendarView({ onAppointmentClick }) {
  const { api, user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [dentists, setDentists] = useState([])
  const [selectedDentist, setSelectedDentist] = useState('all')

  useEffect(() => {
    loadDentists()
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [currentDate, selectedDentist])

  useEffect(() => {
    setSelectedDay(currentDate)
  }, [currentDate])

  const loadDentists = async () => {
    try {
      const res = await api.get('/users/dentists')
      setDentists(res.data.dentists || [])
    } catch (err) {
      console.error('Error loading dentists:', err)
    }
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

      const startDate = format(calStart, 'yyyy-MM-dd')
      const endDate = format(calEnd, 'yyyy-MM-dd')

      let url = `/appointments/by-range?start_date=${startDate}&end_date=${endDate}`
      if (selectedDentist !== 'all' && user?.role === 'admin') {
        url += `&dentist_id=${selectedDentist}`
      } else if (user?.role === 'dentista') {
        url += `&dentist_id=${user.id}`
      }

      const res = await api.get(url)
      setAppointments(res.data.appointments || [])
    } catch (err) {
      console.error('Error loading appointments:', err)
    }
    setLoading(false)
  }

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => isSameDay(new Date(apt.date), day))
  }

  const selectedDayAppts = getAppointmentsForDay(selectedDay)

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="select-none">
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {week.map((day, di) => {
              const dayAppts = getAppointmentsForDay(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const isCurrentMonth = isSameMonth(day, currentDate)

              return (
                <button
                  key={di}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    relative flex flex-col items-center justify-start pt-1 pb-1 rounded-lg transition-all text-sm
                    ${isSelected ? 'bg-sky-100 ring-2 ring-sky-500' : 'hover:bg-gray-100'}
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                  `}
                >
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium
                    ${isToday ? 'bg-sky-600 text-white' : 'text-gray-700'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayAppts.slice(0, 3).map((apt, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${STATUS_COLORS[apt.status] || 'bg-gray-400'}`}
                        />
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="text-[9px] text-gray-500 font-medium">+{dayAppts.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center flex-1">
          {format(currentDate, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
        >
          Hoy
        </button>
      </div>

      {user?.role === 'admin' && (
        <div className="flex justify-end">
          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="all">Todos los dentistas</option>
            {dentists.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
          {renderCalendar()}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-3 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900">
            {format(selectedDay, "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
            <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500">
              ({selectedDayAppts.length} {selectedDayAppts.length === 1 ? 'cita' : 'citas'})
            </span>
          </h4>
        </div>

        {selectedDayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No hay citas para este día</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[400px] sm:max-h-[450px] overflow-y-auto">
            {selectedDayAppts.map(apt => (
              <button
                key={apt.id}
                onClick={() => onAppointmentClick?.(apt)}
                className={`w-full px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3 hover:bg-gray-50 transition text-left ${STATUS_BG[apt.status] || 'bg-white'}`}
              >
                <div className={`w-1.5 h-10 sm:h-12 rounded-full ${STATUS_COLORS[apt.status] || 'bg-gray-400'} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {apt.patient_name} {apt.patient_last_name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${STATUS_BADGE[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {apt.status === 'pendiente' ? 'Pendiente' :
                       apt.status === 'confirmada' ? 'Confirmada' :
                       apt.status === 'completada' ? 'Completada' :
                       apt.status === 'cancelada' ? 'Cancelada' : 'No presentó'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 text-xs sm:text-sm text-gray-600">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{apt.time?.substring(0, 5)}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline truncate">{apt.service_name || 'Consulta'}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline truncate">{apt.dentist_name}</span>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
