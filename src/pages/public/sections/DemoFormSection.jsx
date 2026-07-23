import { useState, useEffect, useRef } from 'react'

const display = { fontFamily: "'Fraunces', Georgia, serif" }

// Matches the backend base — adjust if your app's axios baseURL differs.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function useReveal(threshold = 0.15) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#1a2b4a]/12 bg-white text-[#1a2b4a] text-sm outline-none focus:border-[#c9a227] transition placeholder:text-[#1a2b4a]/35"

function DemoFormSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', school_name: '', message: '', hp_ilimi_x92: '' })
  const [phase, setPhase] = useState('form') // 'form' | 'submitting' | 'success' | 'error'
  const [error, setError] = useState('')
  const [ref, visible] = useReveal()

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (phase === 'submitting') return
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in your name, email, and phone.')
      return
    }

    setPhase('submitting')
    try {
      const res = await fetch(`${API_BASE}/api/v1/agamotto/demo-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        const firstError =
          (data.errors && Object.values(data.errors)[0]?.[0]) ||
          data.message ||
          'Something went wrong. Please try again.'
        throw new Error(firstError)
      }

      setPhase('success')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setPhase('error')
    }
  }

  if (phase === 'success') {
    return (
      <section id="demo" className="bg-white">
        <div className="max-w-xl mx-auto px-5 sm:px-8 py-24 md:py-32 text-center">
          <div className="w-16 h-16 rounded-full bg-[#c9a227]/15 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-bold text-2xl sm:text-3xl text-[#1a2b4a] mb-3" style={display}>
            You're all set. 😊
          </h2>
          <p className="text-[#1a2b4a]/65 text-base leading-relaxed">
            We'll call within 2 hours, we promise.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="demo" className="bg-white">
      <div ref={ref} className="max-w-xl mx-auto px-5 sm:px-8 py-24 md:py-32">
        <div
          className="text-center mb-10 transition-all duration-800 ease-out motion-reduce:transition-none"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <span className="w-8 h-px bg-[#c9a227]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a2b4a]/60">Book a demo</span>
            <span className="w-8 h-px bg-[#c9a227]" />
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl text-[#1a2b4a] mb-4" style={display}>
            See it on your own school's terms.
          </h2>
          <p className="text-[#1a2b4a]/65 text-base leading-relaxed">
            Leave your details and we'll reply within <span className="font-semibold text-[#1a2b4a]">2 hours</span> to
            arrange a time that suits you — or call us right now on{' '}
            <a href="tel:+233556244194" className="font-semibold text-[#1a2b4a] hover:text-[#c9a227] transition">
              055 624 4194
            </a>.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 transition-all duration-800 ease-out motion-reduce:transition-none"
          style={{ transitionDelay: '150ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          {/* Honeypot — invisible to real visitors. Field name is
              deliberately meaningless (not "website"/"email"/"name") so
              browser autofill can't mistake it for a real field and
              accidentally trip it on a genuine submission. */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="hp_ilimi_x92">Leave this field empty</label>
            <input
              id="hp_ilimi_x92"
              name="hp_ilimi_x92"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.hp_ilimi_x92}
              onChange={(e) => update('hp_ilimi_x92', e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={inputClass}
            required
          />

          <input
            type="text"
            placeholder="School name (optional)"
            value={form.school_name}
            onChange={(e) => update('school_name', e.target.value)}
            className={inputClass}
          />

          <textarea
            rows={3}
            placeholder="Tell us a bit about your school (optional)"
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className={inputClass}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={phase === 'submitting'}
            className="w-full bg-[#1a2b4a] text-white font-semibold py-3.5 rounded-full hover:bg-[#243a5e] transition disabled:opacity-50"
          >
            {phase === 'submitting' ? 'Sending...' : 'Request your demo'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default DemoFormSection