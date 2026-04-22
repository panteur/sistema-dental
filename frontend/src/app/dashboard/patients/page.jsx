'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { format, parseISO, isValid, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

const statusColors = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  no_presento: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_presento: 'No se presentó'
}

export default function PatientsPage() {
  const { api } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(null)
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const res = await api.get('/patients')
      setPatients(res.data.patients || [])
    } catch (err) {
      console.error('Error loading patients:', err)
    }
    setLoading(false)
  }

  const loadPatientAppointments = async (patientId) => {
    setLoadingAppointments(true)
    setAppointments([])
    try {
      const res = await api.get(`/appointments?patient_id=${patientId}&limit=50`)
      setAppointments(res.data.appointments || [])
    } catch (err) {
      console.error('Error loading appointments:', err)
    }
    setLoadingAppointments(false)
  }

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient)
    loadPatientAppointments(patient.id)
  }

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus })
      loadPatientAppointments(selectedPatient.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar la cita')
    }
  }

  const handleReschedule = async (appointmentId) => {
    if (!rescheduleData.date || !rescheduleData.time) {
      alert('Selecciona fecha y hora')
      return
    }
    setRescheduleLoading(true)
    try {
      await api.put(`/appointments/${appointmentId}`, {
        date: rescheduleData.date,
        time: rescheduleData.time
      })
      setShowRescheduleModal(null)
      setRescheduleData({ date: '', time: '' })
      loadPatientAppointments(selectedPatient.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Error al reagendar la cita')
    }
    setRescheduleLoading(false)
  }

  const filteredPatients = patients.filter(p => 
    `${p.name} ${p.last_name} ${p.rut || p.dni || ''} ${p.email || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    if (!dateStr.includes('T')) return format(new Date(dateStr + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })
    const date = parseISO(dateStr)
    return isValid(date) ? format(date, "d 'de' MMMM yyyy", { locale: es }) : dateStr
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, RUN o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  onClick={() => handlePatientClick(patient)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {patient.name?.charAt(0)}{patient.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name} {patient.last_name}</p>
                      <p className="text-sm text-gray-500">RUN: {patient.rut || patient.dni}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {patient.phone}
                    </p>
                    {patient.email && (
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {patient.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No se encontraron pacientes</p>
          )}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-xl font-semibold">
                    {selectedPatient.name?.charAt(0)}{selectedPatient.last_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPatient.name} {selectedPatient.last_name}</h2>
                  <p className="text-gray-500">RUN: {selectedPatient.rut || selectedPatient.dni}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contact Info */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="font-medium">{selectedPatient.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedPatient.email || '-'}</p>
                </div>
                {selectedPatient.address && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Dirección</p>
                    <p className="font-medium">{selectedPatient.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointments List */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Citas</h3>
              
              {loadingAppointments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary-600 border-t-transparent"></div>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      onClick={() => setSelectedAppointment(selectedAppointment === apt.id ? null : apt.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedAppointment === apt.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{apt.service_name}</p>
                          <p className="text-sm text-gray-500">Dr. {apt.dentist_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[apt.status] || apt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(apt.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {apt.time}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="text-sm text-gray-500 mt-2">{apt.notes}</p>
                      )}
                      
                      {/* Action Buttons - Only show when selected */}
                      {selectedAppointment === apt.id && apt.status !== 'cancelada' && apt.status !== 'completada' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          {apt.status === 'pendiente' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateAppointmentStatus(apt.id, 'confirmada') }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition"
                            >
                              Confirmar
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowRescheduleModal(apt.id) }}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-lg transition"
                          >
                            Reagendar
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (confirm('¿Marcar como no se presentó?')) {
                                updateAppointmentStatus(apt.id, 'no_presento')
                              }
                            }}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded-lg transition"
                          >
                            No se presentó
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (confirm('¿Anular esta cita?')) {
                                updateAppointmentStatus(apt.id, 'cancelada')
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition"
                          >
                            Anular
                          </button>
                        </div>
                      )}

                      {/* Reschedule Modal for this appointment */}
                      {showRescheduleModal === apt.id && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Nueva fecha y hora:</p>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="date"
                              min={format(new Date(), 'yyyy-MM-dd')}
                              value={rescheduleData.date}
                              onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                              type="time"
                              value={rescheduleData.time}
                              onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReschedule(apt.id) }}
                              disabled={rescheduleLoading || !rescheduleData.date || !rescheduleData.time}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm py-2 rounded-lg transition"
                            >
                              {rescheduleLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowRescheduleModal(null); setRescheduleData({ date: '', time: '' }) }}
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Este paciente no tiene citas registradas</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
