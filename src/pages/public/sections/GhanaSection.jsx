import { useState, useEffect, useRef } from 'react'

/**
 * Landing section 4 — "Built for Ghana" — the moat, stated plainly.
 *
 * A confident, scannable grid rather than persuasion. This is where fees,
 * Mobile Money, SMS, and report cards — not covered by the showcase
 * screenshots — get named as capability. Visual grammar shifts again
 * (structured grid vs. the hero's scatter and the showcase's editorial
 * rows) so the page keeps rhythm section to section.
 */

const display = { fontFamily: "'Fraunces', Georgia, serif" }

const CAPABILITIES = [
  {
    title: 'Three-term calendar',
    desc: 'Built around the real GES academic year, not a generic four-quarter system.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    tint: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Mobile Money fees',
    desc: 'Parents pay the way they already pay everything else — MoMo, tracked automatically.',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z',
    tint: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'SMS to every parent',
    desc: 'One class or the whole school, reached instantly — no app download required of them.',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    tint: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Ghana Card & NHIS records',
    desc: 'The official identification fields your school actually needs to keep, built in from day one.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    tint: 'bg-teal-50 text-teal-600',
  },
  {
    title: 'GES & Cambridge, natively',
    desc: 'Run pure GES, pure Cambridge/IGCSE, or a hybrid — Ilimi handles both curricula and every mix in between.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 5.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    tint: 'bg-rose-50 text-rose-600',
  },
  {
    title: 'NTC & SSNIT staff records',
    desc: 'Every staff field a Ghanaian school is required to track, ready without customisation.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    tint: 'bg-indigo-50 text-indigo-600',
  },
  {
    title: 'CA scores & report cards',
    desc: 'Class score plus exam, computed the way GES report cards expect — every term.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    tint: 'bg-green-50 text-green-600',
  },
  {
    title: 'GH₵ pricing, no surprises',
    desc: "Priced in cedis, for a Ghanaian school's real budget — not converted from a dollar plan.",
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-2c-1.11 0-2.08-.402-2.599-1M12 21a9 9 0 100-18 9 9 0 000 18z',
    tint: 'bg-orange-50 text-orange-600',
  },
]

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

function GhanaSection() {
  const [ref, visible] = useReveal()

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
        <div ref={ref} className="text-center max-w-2xl mx-auto mb-16">
          <div
            className="flex items-center justify-center gap-2.5 mb-6 transition-all duration-700 ease-out motion-reduce:transition-none"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)' }}
          >
            <span className="w-8 h-px bg-[#c9a227]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a2b4a]/60">Built for Ghana</span>
            <span className="w-8 h-px bg-[#c9a227]" />
          </div>
          <h2
            className="font-bold leading-[1.15] tracking-tight text-3xl sm:text-4xl md:text-[2.6rem] mb-5 transition-all duration-700 ease-out motion-reduce:transition-none"
            style={{ ...display, transitionDelay: '100ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
          >
            Global school software makes you adapt to it.
            <br />
            Ilimi was built around how Ghana already works.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((c, i) => (
            <div
              key={c.title}
              className="p-6 rounded-2xl bg-[#faf8f4] border border-[#1a2b4a]/5 transition-all duration-600 ease-out motion-reduce:transition-none hover:border-[#c9a227]/30 hover:shadow-sm"
              style={{ transitionDelay: `${150 + i * 60}ms`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${c.tint}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={c.icon} />
                </svg>
              </div>
              <div className="font-semibold text-[#1a2b4a] mb-1.5">{c.title}</div>
              <p className="text-sm text-[#1a2b4a]/60 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GhanaSection