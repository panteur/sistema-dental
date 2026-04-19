'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { formatRut, validateRut, cleanRut, formatPhone, formatPhoneForDB } from '@/utils/rut'

export default function UsersPage() {
  const { api, user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    email: '',
    password: '',
    role: 'dentista',
    phone: '',
    specialty: ''
  })
  const [search, setSearch] = useState('')
  const [rutError, setRutError] = useState('')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async (searchQuery = '') => {
    setLoading(true)
    try {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''
      const res = await api.get(`/users${params}`)
      setUsers(res.data.users || [])
    } catch (err) {
      console.error('Error loading users:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const openEditModal = (userData) => {
    setEditingUser(userData)
    setFormData({
      rut: userData.rut || '',
      name: userData.name,
      email: userData.email,
      password: '',
      role: userData.role,
      phone: userData.phone || '',
      specialty: userData.specialty || ''
    })
    setRutError('')
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ rut: '', name: '', email: '', password: '', role: 'dentista', phone: '', specialty: '' })
    setRutError('')
    setShowModal(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'rut') {
      const cleaned = cleanRut(value)
      const formatted = formatRut(cleaned)
      setFormData({ ...formData, rut: formatted })
      if (cleaned.length >= 2) {
        if (!validateRut(formatted)) {
          setRutError('RUT inválido')
        } else {
          setRutError('')
        }
      } else {
        setRutError('')
      }
    } else if (name === 'phone') {
      setFormData({ ...formData, phone: formatPhone(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (formData.rut && !validateRut(formData.rut)) {
        setRutError('RUT inválido')
        setSaving(false)
        return
      }

      const data = {
        rut: formData.rut || null,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone ? formatPhoneForDB(formData.phone) : null,
        specialty: formData.specialty || null
      }

      if (formData.password) {
        data.password = formData.password
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data)
      } else {
        if (!formData.password) {
          alert('La contraseña es requerida para nuevos usuarios')
          setSaving(false)
          return
        }
        await api.post('/users', data)
      }
      
      setShowModal(false)
      loadUsers()
    } catch (err) {
      console.error('Error saving user:', err)
      alert(err.response?.data?.error || 'Error al guardar el usuario')
    }
    setSaving(false)
  }

  const deleteUser = async (id) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return
    if (id === user.id) {
      alert('No puedes eliminarte a ti mismo')
      return
    }
    try {
      await api.delete(`/users/${id}`)
      loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Error al eliminar el usuario')
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
      dentista: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dentista' },
      recepcionista: { bg: 'bg-green-100', text: 'text-green-700', label: 'Recepcionista' }
    }
    return badges[role] || { bg: 'bg-gray-100', text: 'text-gray-700', label: role }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-gray-500">No tienes permisos para ver esta página</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, email o RUT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">RUT</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Teléfono</th>
                    <th className="pb-3 font-medium">Especialidad</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => {
                    const badge = getRoleBadge(u.role)
                    return (
                      <tr key={u.id}>
                        <td className="py-4 text-gray-600">{u.rut || '-'}</td>
                        <td className="py-4 font-medium text-gray-900">{u.name}</td>
                        <td className="py-4 text-gray-600">{u.email}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 text-gray-600">{u.phone || '-'}</td>
                        <td className="py-4 text-gray-600">{u.specialty || '-'}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay usuarios registrados</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Crear primer usuario
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${rutError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: 12.345.678-5"
                />
                {rutError && <p className="text-red-500 text-xs mt-1">{rutError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Dr. Juan García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="juan@clinicadental.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="dentista">Dentista</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              {formData.role === 'dentista' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Ej: Ortodoncia, Endodoncia"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
