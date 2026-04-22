'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

/* ─── useInView hook ─── */
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect() }
      },
      { threshold: 0.15, ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

/* ─── Data ─── */
const services = [
  {
    title: 'Limpieza Dental',
    desc: 'Profilaxis profesional para mantener tus dientes sanos y prevenir enfermedades periodontales.',
    img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop&q=80',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: 'Ortodoncia',
    desc: 'Brackets convencionales, estéticos e invisibles para una sonrisa perfectamente alineada.',
    img: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop&q=80',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    title: 'Implantes Dentales',
    desc: 'Reemplazo permanente de dientes perdidos con tecnología de implantología avanzada.',
    img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop&q=80',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21" />
      </svg>
    ),
  },
  {
    title: 'Blanqueamiento',
    desc: 'Tratamientos profesionales para devolver la blancura natural a tu sonrisa en pocas sesiones.',
    img: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&h=400&fit=crop&q=80',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Endodoncia',
    desc: 'Tratamientos de conducto con tecnología rotatoria para salvar dientes comprometidos.',
    img: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&h=400&fit=crop&q=80',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    title: 'Odontopediatría',
    desc: 'Cuidado dental especializado para niños en un ambiente amigable y de confianza.',
    img: 'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?w=600&h=400&fit=crop&q=80',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
]

const testimonials = [
  {
    name: 'María García',
    text: 'Excelente atención y muy profesionales. Mi tratamiento de ortodoncia fue todo un éxito. Recomiendo ampliamente esta clínica.',
    rating: 5,
    treatment: 'Ortodoncia',
  },
  {
    name: 'Carlos Mendoza',
    text: 'Me realizaron un implante dental y el resultado fue increíble. El equipo me hizo sentir seguro durante todo el proceso.',
    rating: 5,
    treatment: 'Implante dental',
  },
  {
    name: 'Ana Rodríguez',
    text: 'Llevé a mis hijos por primera vez y la experiencia fue maravillosa. Los doctores tienen mucha paciencia y profesionalismo.',
    rating: 5,
    treatment: 'Odontopediatría',
  },
]

const stats = [
  { value: '+15', label: 'Años de experiencia' },
  { value: '+8,000', label: 'Pacientes atendidos' },
  { value: '98%', label: 'Satisfacción' },
  { value: '+20', label: 'Especialistas' },
]

/* ─── Component ─── */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [formStatus, setFormStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const [heroRef, heroInView] = useInView()
  const [statsRef, statsInView] = useInView()
  const [servicesRef, servicesInView] = useInView()
  const [aboutRef, aboutInView] = useInView()
  const [testimonialsRef, testimonialsInView] = useInView()
  const [ctaRef, ctaInView] = useInView()
  const [contactRef, contactInView] = useInView()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFormStatus({ type: '', message: '' })
    try {
      const res = await fetch(`${API_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: `+56 ${formData.phone}` }),
      })
      if (res.ok) {
        setFormStatus({ type: 'success', message: 'Mensaje enviado correctamente. Te contactaremos pronto.' })
        setFormData({ name: '', email: '', phone: '', message: '' })
      } else {
        setFormStatus({ type: 'error', message: 'Error al enviar. Intenta nuevamente.' })
      }
    } catch {
      setFormStatus({ type: 'error', message: 'Error de conexión. Verifica tu red.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">

      {/* ════════ NAVBAR ════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <span className={`text-lg font-bold ${scrolled ? 'text-slate-900' : 'text-white'}`}>DentalCare</span>
                <span className={`block text-[10px] font-medium tracking-wider uppercase ${scrolled ? 'text-slate-400' : 'text-white/60'}`}>Clínica Dental</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '#servicios', label: 'Servicios' },
                { href: '#nosotros', label: 'Nosotros' },
                { href: '#testimonios', label: 'Testimonios' },
                { href: '#contacto', label: 'Contacto' },
              ].map((item) => (
                <a key={item.href} href={item.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                  {item.label}
                </a>
              ))}
              <div className={`w-px h-6 mx-2 ${scrolled ? 'bg-slate-200' : 'bg-white/20'}`} />
              <Link href="/login" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                Ingresar
              </Link>
              <Link href="/appointments" className="ml-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-sky-600/25 hover:bg-sky-700 hover:shadow-sky-700/30 transition-all">
                Agendar Cita
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg" aria-label="Menú">
              <svg className={`w-6 h-6 ${scrolled ? 'text-slate-700' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenu
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-xl">
            <div className="px-5 py-4 space-y-1">
              {['Servicios', 'Nosotros', 'Testimonios', 'Contacto'].map((label) => (
                <a key={label} href={`#${label.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">
                  {label}
                </a>
              ))}
              <hr className="my-2" />
              <Link href="/login" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">
                Ingresar al Sistema
              </Link>
              <Link href="/appointments" onClick={() => setMobileMenu(false)} className="block mt-2 text-center bg-sky-600 text-white px-5 py-3 rounded-xl font-semibold">
                Agendar Cita
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ════════ HERO ════════ */}
      <header className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1629909615184-74f495363b67?w=1920&h=1080&fit=crop&q=80"
            alt="Consultorio dental moderno"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-slate-900/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 py-32">
          <div ref={heroRef} className="max-w-2xl">
            <div className={`fade-up ${heroInView ? 'visible' : ''}`}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-sm font-medium mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Aceptando citas esta semana
              </span>
            </div>

            <h1 className={`fade-up ${heroInView ? 'visible' : ''} text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6`} style={{ transitionDelay: '100ms' }}>
              Tu sonrisa merece{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                atención de excelencia
              </span>
            </h1>

            <p className={`fade-up ${heroInView ? 'visible' : ''} text-lg text-slate-300 leading-relaxed mb-8 max-w-xl`} style={{ transitionDelay: '200ms' }}>
              Más de 15 años brindando salud dental integral con tecnología de vanguardia, 
              un equipo de especialistas certificados y un compromiso genuino con tu bienestar.
            </p>

            <div className={`fade-up ${heroInView ? 'visible' : ''} flex flex-wrap gap-4`} style={{ transitionDelay: '300ms' }}>
              <Link href="/appointments" className="btn-primary text-base">
                Agendar mi Cita
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a href="#servicios" className="btn-outline text-base">
                Conocer Servicios
              </a>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </header>

      {/* ════════ STATS BAR ════════ */}
      <section ref={statsRef} className="relative -mt-12 z-20">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <div className={`fade-scale ${statsInView ? 'visible' : ''} bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-0 grid grid-cols-2 md:grid-cols-4`}>
            {stats.map((stat, i) => (
              <div key={i} className={`text-center py-6 md:py-8 ${i < stats.length - 1 ? 'md:border-r md:border-slate-100' : ''}`}>
                <p className="text-3xl md:text-4xl font-extrabold text-sky-600">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SERVICES ════════ */}
      <section id="servicios" className="py-24">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div ref={servicesRef} className={`fade-up ${servicesInView ? 'visible' : ''} text-center max-w-2xl mx-auto mb-16`}>
            <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Nuestros Servicios</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3">
              Tratamientos integrales para toda la familia
            </h2>
            <p className="text-slate-500 mt-4 text-lg">
              Ofrecemos una amplia gama de especialidades dentales con la mejor tecnología y profesionales dedicados a tu salud bucal.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, i) => (
              <div
                key={i}
                className={`fade-up ${servicesInView ? 'visible' : ''} group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={svc.img}
                    alt={svc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                    {svc.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{svc.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{svc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ABOUT / WHY US ════════ */}
      <section id="nosotros" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div ref={aboutRef} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image side */}
            <div className={`fade-left ${aboutInView ? 'visible' : ''} relative`}>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop&q=80"
                  alt="Equipo de dentistas profesionales"
                  className="w-full h-[400px] lg:h-[480px] object-cover"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -right-4 md:right-8 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">98%</p>
                    <p className="text-xs text-slate-500 font-medium">Pacientes satisfechos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div className={`fade-right ${aboutInView ? 'visible' : ''}`}>
              <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Sobre Nosotros</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-6">
                Expertos comprometidos con tu salud dental
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                Nuestro equipo de más de 20 especialistas combina años de experiencia con 
                tecnología de última generación para ofrecerte tratamientos seguros, 
                eficaces y cómodos.
              </p>

              <div className="space-y-5">
                {[
                  {
                    title: 'Equipo Certificado',
                    desc: 'Dentistas con formación continua en las mejores universidades del país.',
                    bgColor: 'bg-sky-50',
                    textColor: 'text-sky-600',
                  },
                  {
                    title: 'Tecnología Avanzada',
                    desc: 'Radiografía digital, escáner 3D e impresión para diagnósticos precisos.',
                    bgColor: 'bg-violet-50',
                    textColor: 'text-violet-600',
                  },
                  {
                    title: 'Ambiente de Confianza',
                    desc: 'Instalaciones modernas, protocolos de esterilización y trato humano.',
                    bgColor: 'bg-emerald-50',
                    textColor: 'text-emerald-600',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`mt-0.5 w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <svg className={`w-5 h-5 ${item.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section id="testimonios" className="py-24">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div ref={testimonialsRef} className={`fade-up ${testimonialsInView ? 'visible' : ''} text-center max-w-2xl mx-auto mb-16`}>
            <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Testimonios</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3">
              Lo que dicen nuestros pacientes
            </h2>
            <p className="text-slate-500 mt-4 text-lg">
              La satisfacción de nuestros pacientes es nuestro mejor indicador de calidad.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`fade-up ${testimonialsInView ? 'visible' : ''} bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-slate-600 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.treatment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA BANNER ════════ */}
      <section ref={ctaRef} className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1920&h=600&fit=crop&q=80"
            alt="Consultorio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-900/90 to-sky-700/80" />
        </div>
        <div className={`fade-scale ${ctaInView ? 'visible' : ''} relative z-10 max-w-3xl mx-auto px-5 text-center`}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            ¿Listo para transformar tu sonrisa?
          </h2>
          <p className="text-sky-100 text-lg mb-8 max-w-xl mx-auto">
            Agenda tu cita hoy y da el primer paso hacia una salud dental óptima. 
            Nuestro equipo te espera.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/appointments" className="btn-white text-base">
              Agendar Cita Ahora
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </Link>
            <a href="tel:+525512345678" className="btn-outline text-base">
              Llamar: +52 55 1234 5678
            </a>
          </div>
        </div>
      </section>

      {/* ════════ CONTACT ════════ */}
      <section id="contacto" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div ref={contactRef} className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Info */}
            <div className={`fade-left ${contactInView ? 'visible' : ''}`}>
              <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Contacto</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
                Estamos para ayudarte
              </h2>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                ¿Tienes dudas sobre nuestros servicios o quieres reservar una cita? Escríbenos y te responderemos a la brevedad.
              </p>

              <div className="space-y-6">
                {[
                  { icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z', label: 'Teléfono', value: '+56 9 1234 5678' },
                  { icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75', label: 'Email', value: 'contacto@dentalcare.cl' },
                  { icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', label: 'Dirección', value: 'Av. Nueva Providencia 1550, Santiago' },
                  { icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Horario', value: 'Lun-Vie 9:00-19:00 · Sáb 9:00-14:00' },
                ].map((info, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={info.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">{info.label}</p>
                      <p className="text-slate-900 font-semibold">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className={`fade-right ${contactInView ? 'visible' : ''}`}>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-lg space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 py-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium">
                      +56
                    </span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 9) })}
                      className="flex-1 border border-slate-200 rounded-r-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none"
                      placeholder="9 1234 5678"
                      maxLength={9}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors outline-none resize-none"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>

                {formStatus.message && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${formStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {formStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-600/20 hover:shadow-sky-700/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : 'Enviar Mensaje'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">DentalCare</span>
              </div>
              <p className="text-sm leading-relaxed">
                Clínica dental comprometida con tu salud bucal. Tecnología avanzada y atención personalizada.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
                <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
                <li><a href="#testimonios" className="hover:text-white transition-colors">Testimonios</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2.5 text-sm">
                <li>Limpieza Dental</li>
                <li>Ortodoncia</li>
                <li>Implantes</li>
                <li>Blanqueamiento</li>
                <li>Endodoncia</li>
              </ul>
            </div>

            {/* Access */}
            <div>
              <h4 className="text-white font-semibold mb-4">Acceso</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/appointments" className="hover:text-white transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    Agendar Cita
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Ingresar al Sistema
                  </Link>
                </li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-slate-500 mb-2">Horario de atención</p>
                <p className="text-sm text-slate-300">Lun-Vie: 9:00 - 19:00</p>
                <p className="text-sm text-slate-300">Sábado: 9:00 - 14:00</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} DentalCare. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
