'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/calendar', label: 'Calendario', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/statistics', label: 'Estadísticas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/dashboard/appointments', label: 'Citas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/dashboard/patients', label: 'Pacientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/dashboard/services', label: 'Servicios', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { href: '/dashboard/schedule', label: 'Horarios', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/users', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 6v1h8v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
]

function Logo({ collapsed = false }) {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-shadow">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      {!collapsed && (
        <div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">DentalCare</span>
          <span className="block text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wide uppercase">Clínica Dental</span>
        </div>
      )}
    </Link>
  )
}

function NavItem({ item, isActive, collapsed }) {
  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-3 px-4 py-2.5 mx-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-sky-50 text-sky-700 shadow-sm shadow-sky-100'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
      title={collapsed ? item.label : ''}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-600 rounded-r-full" />
      )}
      <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sky-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.5} d={item.icon} />
      </svg>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

function UserProfile({ user, collapsed, onLogout }) {
  const roleLabels = { admin: 'Administrador', dentista: 'Dentista', recepcionista: 'Recepcionista' }
  const roleColors = {
    admin: 'bg-violet-100 text-violet-600',
    dentista: 'bg-sky-100 text-sky-600',
    recepcionista: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div className="p-4">
      {!collapsed && (
        <div className="mb-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${roleColors[user.role] || 'bg-slate-100 text-slate-600'}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={onLogout}
        className={`flex items-center gap-2 px-3 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium w-full ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? 'Cerrar Sesión' : ''}
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileOpen])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/25">
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  const handleLogout = () => { logout(); router.push('/login') }
  const sidebarWidth = collapsed ? 'w-20' : 'w-64'
  const mainMargin = collapsed ? 'md:ml-20' : 'md:ml-64'

  const filteredNav = navItems.filter(item => !item.adminOnly || user?.role === 'admin')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-40 flex items-center justify-between px-4 shadow-sm">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl shadow-slate-900/10 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex justify-between items-center border-b border-slate-100">
          <Logo />
          <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-4 space-y-1">
          {filteredNav.map((item) => (
            <NavItem key={item.href} item={item} isActive={pathname === item.href} collapsed={false} />
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100">
          <UserProfile user={user} collapsed={false} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col fixed left-0 top-0 h-full ${sidebarWidth} bg-white border-r border-slate-200/60 transition-all duration-300 z-30`}>
        {/* Logo */}
        <div className="p-5 flex-shrink-0">
          <Logo collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-7 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavItem key={item.href} item={item} isActive={pathname === item.href} collapsed={collapsed} />
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-slate-100 flex-shrink-0">
          <UserProfile user={user} collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 md:pt-0 ${mainMargin} transition-all duration-300`}>
        <div className="p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
