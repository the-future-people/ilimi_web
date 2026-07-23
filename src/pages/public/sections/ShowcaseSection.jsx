import { useState, useEffect, useRef } from 'react'
import studentsShot from '../../../assets/screenshots/students.png'
import dashboardShot from '../../../assets/screenshots/dashboard.png'

/**
 * Landing section 3 — "What Ilimi does", the product proof.
 *
 * Two showcases rather than four feature blocks: lead with the strongest
 * asset (a real, populated student list — Ghanaian names and guardian
 * contacts doing the persuading), then the dashboard for breadth. Fees, SMS
 * and report cards are named in the Built-for-Ghana section, not here.
 *
 * Screenshots sit in a subtle browser frame — signals "real working
 * software" and hides raw screenshot edges.
 */

const display = { fontFamily: "'Fraunces', Georgia, serif" }

function useReveal(threshold = 0.2) {
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

function BrowserFrame({ src, alt }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white">
      {/* Chrome bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f1f0ec] border-b border-black/5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#e0574a]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#e6b23c]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#54b04a]" />
        <div className="ml-3 flex-1 max-w-xs">
          <div className="h-5 rounded bg-white/70 border border-black/5 flex items-center px-2">
            <span className="text-[10px] text-[#1a2b4a]/40 tracking-wide">app.ilimi.com</span>
          </div>
        </div>
      </div>
      <img src={src} alt={alt} loading="lazy" className="w-full block" />
    </div>
  )
}

function ShowcaseSection() {
  const [ref1, v1] = useReveal()
  const [ref2, v2] = useReveal()

  return (
    <section className="bg-[#faf8f4]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-32">
        {/* Section eyebrow */}
        <div className="flex items-center gap-2.5 mb-14">
          <span className="w-8 h-px bg-[#c9a227]" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a2b4a]/60">See it in action</span>
        </div>

        {/* Showcase 1 — the real student list */}
        <div ref={ref1} className="grid md:grid-cols-2 gap-10 md:gap-14 items-center mb-24 md:mb-32">
          <div
            className="transition-all duration-900 ease-out motion-reduce:transition-none order-2 md:order-1"
            style={{ opacity: v1 ? 1 : 0, transform: v1 ? 'translateX(0)' : 'translateX(-24px)' }}
          >
            <h2 className="font-bold leading-[1.15] tracking-tight text-3xl sm:text-4xl mb-5" style={display}>
              A real school. Real records. One place.
            </h2>
            <p className="text-lg leading-relaxed text-[#1a2b4a]/70 mb-6">
              Every student, grouped by class, with guardian contacts a tap away.
              Photos, phone numbers, the whole record — no exercise books, no
              scattered files. This is an actual Ilimi school, not a mock-up.
            </p>
            <ul className="space-y-2.5">
              {['Grouped by class, most senior first', 'Guardian contact on every row', 'Search, filter, and open any profile instantly'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[#1a2b4a]/75">
                  <svg className="w-5 h-5 text-[#c9a227] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="transition-all duration-900 ease-out motion-reduce:transition-none order-1 md:order-2"
            style={{ transitionDelay: '120ms', opacity: v1 ? 1 : 0, transform: v1 ? 'translateY(0)' : 'translateY(28px)' }}
          >
            <BrowserFrame src={studentsShot} alt="Ilimi student records, grouped by class" />
          </div>
        </div>

        {/* Showcase 2 — the dashboard, breadth */}
        <div ref={ref2} className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div
            className="transition-all duration-900 ease-out motion-reduce:transition-none"
            style={{ transitionDelay: '120ms', opacity: v2 ? 1 : 0, transform: v2 ? 'translateY(0)' : 'translateY(28px)' }}
          >
            <BrowserFrame src={dashboardShot} alt="Ilimi admin dashboard" />
          </div>
          <div
            className="transition-all duration-900 ease-out motion-reduce:transition-none"
            style={{ opacity: v2 ? 1 : 0, transform: v2 ? 'translateX(0)' : 'translateX(24px)' }}
          >
            <h2 className="font-bold leading-[1.15] tracking-tight text-3xl sm:text-4xl mb-5" style={display}>
              And that's just the start.
            </h2>
            <p className="text-lg leading-relaxed text-[#1a2b4a]/70">
              Students, staff, attendance, fees, report cards, parent messaging —
              the whole school, run from one calm dashboard. Each part built for
              how Ghanaian schools actually work, ready when you are.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShowcaseSection