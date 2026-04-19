'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { format, addDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatRut, validateRut, cleanRut, formatPhone, formatPhoneForDB } from '@/utils/rut'

export default function AppointmentPage() {
  const { api } = useAuth()
  
  const [step, setStep] = useState(1)
  const [dentists, setDentists] = useState([])
  const [services, setServices] = useState([])
  const [selectedDentist, setSelectedDentist] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  
  const [patientData, setPatientData] = useState({
    dni: '',
    name: '',
    last_name: '',
    phone: '',
    email: ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rutError, setRutError] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDentist && selectedDate && selectedService) {
      loadSlots()
    } else if (selectedDentist && selectedDate) {
      loadSlots()
    }
  }, [selectedDentist, selectedDate, selectedService])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [servicesRes, dentistsRes] = await Promise.all([
        api.get('/public/services'),
        api.get('/public/dentists')
      ])
      setServices(servicesRes.data.services || [])
      setDentists(dentistsRes.data.dentists || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSlots = async () => {
    setLoadingSlots(true)
    setSlotsError('')
    setSelectedTime(null)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      let url = `/public/slots?dentist_id=${selectedDentist}&date=${dateStr}`
      if (selectedService) {
        url += `&service_id=${selectedService}`
      }
      const res = await api.get(url)
      setAvailableSlots(res.data.slots || [])
      if (res.data.message && res.data.slots.length === 0) {
        setSlotsError(res.data.message)
      }
    } catch (err) {
      console.error('Error loading slots:', err)
      setAvailableSlots([])
    }
    setLoadingSlots(false)
  }

  const handlePatientChange = (e) => {
    const { name, value } = e.target
    if (name === 'dni') {
      const cleaned = cleanRut(value)
      const formatted = formatRut(cleaned)
      setPatientData({ ...patientData, dni: formatted })
      if (cleaned.length >= 2) {
        if (!validateRut(formatted)) {
          setRutError('RUN inválido')
        } else {
          setRutError('')
        }
      } else {
        setRutError('')
      }
    } else if (name === 'phone') {
      setPatientData({ ...patientData, phone: formatPhone(value) })
    } else {
      setPatientData({ ...patientData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (patientData.dni && !validateRut(patientData.dni)) {
      setRutError('RUN inválido')
      setSubmitting(false)
      return
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      await api.post('/public/appointment', {
        dni: patientData.dni || `TMP-${Date.now()}`,
        name: patientData.name,
        last_name: patientData.last_name,
        phone: formatPhoneForDB(patientData.phone),
        email: patientData.email || null,
        dentist_id: selectedDentist,
        service_id: selectedService,
        date: dateStr,
        time: selectedTime
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al agendar la cita. Intenta nuevamente.')
    }
    setSubmitting(false)
  }

  const dates = []
  for (let i = 0; i < 14; i++) {
    const d = addDays(new Date(), i)
    if (d.getDay() !== 0) {
      dates.push(d)
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)
  const selectedDentistData = dentists.find(d => d.id === selectedDentist)

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cita Agendada!</h2>
          <p className="text-slate-500 mb-6">
            Su cita ha sido agendada exitosamente. Nos pondremos en contacto para confirmar los detalles.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm"><span className="text-slate-500">Dentista:</span> <span className="font-semibold text-slate-800">{selectedDentistData?.name}</span></p>
            <p className="text-sm"><span className="text-slate-500">Servicio:</span> <span className="font-semibold text-slate-800">{selectedServiceData?.name}</span></p>
            <p className="text-sm"><span className="text-slate-500">Fecha:</span> <span className="font-semibold text-slate-800">{format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}</span></p>
            <p className="text-sm"><span className="text-slate-500">Hora:</span> <span className="font-semibold text-slate-800">{selectedTime}</span></p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">DentalCare</span>
              <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">Agendar Cita</span>
            </div>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {[
            { num: 1, label: 'Servicio' },
            { num: 2, label: 'Horario' },
            { num: 3, label: 'Datos' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step > s.num 
                    ? 'bg-emerald-500 text-white' 
                    : step === s.num 
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30' 
                      : 'bg-slate-200 text-slate-400'
                }`}>
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : s.num}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {idx < 2 && (
                <div className={`w-20 h-1 mx-2 rounded-full transition-colors ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Cargando...</p>
            </div>
          </div>
        )}

        {!loading && step === 1 && (
          <div className="space-y-8">
            {/* Dentist Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold">1</div>
                <h2 className="text-lg font-bold text-slate-900">Seleccione dentista</h2>
              </div>
              
              {dentists.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No hay dentistas disponibles en este momento.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {dentists.map((dentist) => (
                    <button
                      key={dentist.id}
                      onClick={() => { setSelectedDentist(dentist.id); setSelectedTime(null) }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-left ${
                        selectedDentist === dentist.id 
                          ? 'border-sky-500 bg-sky-50 shadow-md' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          selectedDentist === dentist.id ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-600'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{dentist.name}</p>
                          <p className="text-xs text-slate-500">{dentist.specialty || 'Especialista dental'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold">2</div>
                <h2 className="text-lg font-bold text-slate-900">Seleccione servicio</h2>
              </div>
              
              {services.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No hay servicios disponibles.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => { setSelectedService(service.id); setSelectedTime(null) }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-left ${
                        selectedService === service.id 
                          ? 'border-sky-500 bg-sky-50 shadow-md' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 text-sm">{service.name}</p>
                      {service.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{service.description}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">{service.duration} min</span>
                        <span className="text-sm font-bold text-sky-600">${parseFloat(service.price || 0).toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => selectedDentist && selectedService && setStep(2)}
              disabled={!selectedDentist || !selectedService}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-sky-600/20 hover:shadow-sky-700/30"
            >
              Continuar al horario
              <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}

        {!loading && step === 2 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                <span className="text-slate-600">Dentista:</span>
                <span className="font-semibold text-slate-900">{selectedDentistData?.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                <span className="text-slate-600">Servicio:</span>
                <span className="font-semibold text-slate-900">{selectedServiceData?.name}</span>
              </span>
              {selectedServiceData && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-slate-600">Duración:</span>
                  <span className="font-semibold text-slate-900">{selectedServiceData.duration} min</span>
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Seleccione fecha y hora</h2>
              
              {/* Date picker */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Fecha</label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {dates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); setAvailableSlots([]) }}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      } ${isToday(date) ? 'ring-2 ring-sky-400 ring-offset-1' : ''}`}
                    >
                      <p className="text-[10px] uppercase font-semibold tracking-wide">{format(date, 'EEE', { locale: es })}</p>
                      <p className="text-lg font-bold mt-0.5">{format(date, 'd')}</p>
                      <p className="text-[10px] opacity-70">{format(date, 'MMM')}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Horario disponible
                    {loadingSlots && <span className="text-slate-400 font-normal ml-2">(Cargando...)</span>}
                    {!loadingSlots && availableSlots.length > 0 && (
                      <span className="text-slate-400 font-normal ml-2">— {availableSlots.length} disponibles</span>
                    )}
                  </label>
                  
                  {slotsError && !loadingSlots && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm flex items-start gap-2 mb-4">
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      {slotsError}
                    </div>
                  )}

                  {!loadingSlots && availableSlots.length === 0 && !slotsError && (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                      <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-sm">No hay horarios disponibles para este día.</p>
                      <p className="text-xs text-slate-400 mt-1">Selecciona otra fecha.</p>
                    </div>
                  )}

                  {availableSlots.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 px-3 rounded-xl text-center text-sm font-semibold transition-all ${
                            selectedTime === slot
                              ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30'
                              : 'bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setSelectedTime(null) }}
                  className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={() => selectedDate && selectedTime && setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-sky-600/20"
                >
                  Continuar
                  <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && step === 3 && (
          <div className="space-y-6">
            {/* Appointment Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Resumen de su cita</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Dentista</p>
                  <p className="text-sm font-bold text-slate-800">{selectedDentistData?.name}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Servicio</p>
                  <p className="text-sm font-bold text-slate-800">{selectedServiceData?.name}</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-3">
                  <p className="text-xs text-sky-400 mb-1">Fecha</p>
                  <p className="text-sm font-bold text-sky-700">{format(selectedDate, 'd MMM yyyy', { locale: es })}</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-3">
                  <p className="text-xs text-sky-400 mb-1">Hora</p>
                  <p className="text-sm font-bold text-sky-700">{selectedTime}</p>
                </div>
              </div>
            </div>

            {/* Patient Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Sus datos de contacto</h2>
              <p className="text-sm text-slate-500 mb-6">Ingresa tus datos para confirmar la cita.</p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre *</label>
                    <input type="text" name="name" required value={patientData.name} onChange={handlePatientChange}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                      placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Apellido *</label>
                    <input type="text" name="last_name" required value={patientData.last_name} onChange={handlePatientChange}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                      placeholder="Tu apellido" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">RUN / Identificación</label>
                    <input type="text" name="dni" value={patientData.dni} onChange={handlePatientChange}
                      className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors outline-none ${rutError ? 'border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'}`}
                      placeholder="Ej. 12.345.678-9" />
                    {rutError && <p className="text-red-500 text-xs mt-1">{rutError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono *</label>
                    <input type="tel" name="phone" required value={patientData.phone} onChange={handlePatientChange}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                      placeholder="+56 9 1234 5678" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo electrónico</label>
                  <input type="email" name="email" value={patientData.email} onChange={handlePatientChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                    placeholder="correo@ejemplo.com" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-all">
                    Atrás
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-sky-600/20 hover:shadow-sky-700/30">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Confirmando...
                      </span>
                    ) : 'Confirmar Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
