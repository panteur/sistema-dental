'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'

export default function AppointmentsPage() {
  const { api, user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    loadAppointments()
  }, [selectedDate, filter])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      let url = `/appointments?date=${selectedDate}`
      if (filter !== 'all') {
        url += `&status=${filter}`
      }
      const res = await api.get(url)
      setAppointments(res.data.appointments || [])
    } catch (err) {
      console.error('Error loading appointments:', err)
    }
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      loadAppointments()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-700',
      confirmada: 'bg-green-100 text-green-700',
      completada: 'bg-blue-100 text-blue-700',
      cancelada: 'bg-red-100 text-red-700',
      no_presento: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_presento: 'No se presentó'
    }
    return labels[status] || status
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Citas</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Hora</th>
                    <th className="pb-3 font-medium">Paciente</th>
                    <th className="pb-3 font-medium">Servicio</th>
                    <th className="pb-3 font-medium">Dentista</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="text-sm">
                      <td className="py-4 font-medium">{apt.time?.substring(0, 5)}</td>
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{apt.patient_name} {apt.patient_last_name}</p>
                        <p className="text-gray-500">{apt.patient_phone}</p>
                      </td>
                      <td className="py-4">{apt.service_name}</td>
                      <td className="py-4">{apt.dentist_name}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </td>
                      <td className="py-4">
                        {apt.status === 'pendiente' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(apt.id, 'confirmada')}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => updateStatus(apt.id, 'cancelada')}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {apt.status === 'confirmada' && (
                          <button
                            onClick={() => updateStatus(apt.id, 'completada')}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Completar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay citas para esta fecha</p>
          )}
        </div>
      </div>
    </div>
  )
}
