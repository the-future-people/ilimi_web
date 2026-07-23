import { useState, useEffect } from 'react'
import ProblemSection from './sections/ProblemSection'
import ShowcaseSection from './sections/ShowcaseSection'
import GhanaSection from './sections/GhanaSection'
import AspirationSection from './sections/AspirationSection'
import MigrationSection from './sections/MigrationSection'
import DemoFormSection from './sections/DemoFormSection'

/**
 * Ilimi landing page — hero section (v2).
 *
 * Display face: Fraunces (warm, characterful old-style serif — chosen over
 * Playfair, which reads generic from overuse). Body: DM Sans.
 *
 * Three headline variants rotate by day of week via `day % 3`.
 *
 * Signature: scattered portraits of Ghanaian school life around the
 * headline, settling in on load. On phones (below md) the scatter is
 * dropped for a clean, fast, centered hero — clarity beats decoration on a
 * small screen and a slow network.
 *
 * Swap the PORTRAITS `src` values for final Ghanaian school photos before
 * launch; layout and placement stay.
 */

const HERO_VARIANTS = [
  {
    headline: ["Most school software wasn't", 'built for Ghana.', 'This one was.'],
    sub: 'GES calendar, Mobile Money fees, Ghana Card records, SMS to every parent — Ilimi fits your school like it was made for it. Because it was.',
  },
  {
    headline: ['Your school year has a rhythm.', 'Finally, software', 'that knows it.'],
    sub: "Three terms, not four. BECE season. Fees over MoMo. Report cards the way GES wants them. Ilimi already speaks your school's language.",
  },
  {
    headline: ['Everything your school', 'runs on. One place.', 'Built for Ghana.'],
    sub: 'From enrolment to report cards, fees to parent SMS — the daily work of running a school, handled. No workarounds, no software fighting you.',
  },
]

const PORTRAITS = [
  { src: 'https://images.pexels.com/photos/8471835/pexels-photo-8471835.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'top-[10%] left-[3%]', size: 'w-24 h-32' },
  { src: 'https://images.pexels.com/photos/8617839/pexels-photo-8617839.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'top-[3%] left-[20%]', size: 'w-20 h-28' },
  { src: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'bottom-[8%] left-[6%]', size: 'w-28 h-36' },
  { src: 'https://images.pexels.com/photos/8471799/pexels-photo-8471799.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'bottom-[4%] left-[24%]', size: 'w-20 h-24' },
  { src: 'https://images.pexels.com/photos/8471965/pexels-photo-8471965.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'top-[8%] right-[4%]', size: 'w-24 h-32' },
  { src: 'https://images.pexels.com/photos/8617817/pexels-photo-8617817.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'top-[2%] right-[22%]', size: 'w-20 h-28' },
  { src: 'https://images.pexels.com/photos/8471900/pexels-photo-8471900.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'bottom-[10%] right-[5%]', size: 'w-28 h-36' },
  { src: 'https://images.pexels.com/photos/8471898/pexels-photo-8471898.jpeg?auto=compress&cs=tinysrgb&w=400', alt: '', pos: 'bottom-[3%] right-[23%]', size: 'w-20 h-24' },
]

function dayVariant() {
  return HERO_VARIANTS[new Date().getDay() % 3]
}

// Inject Fraunces once. (For production, prefer adding this <link> to
// index.html; injecting here keeps the component self-contained for review.)
function useFraunces() {
  useEffect(() => {
    const id = 'fraunces-font'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap'
    document.head.appendChild(link)
  }, [])
}

function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const variant = dayVariant()
  useFraunces()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const scrollToDemo = () => {
    const el = document.getElementById('demo')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const display = { fontFamily: "'Fraunces', Georgia, serif" }

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a2b4a] font-sans overflow-x-hidden">
      {/* Nav */}
      <nav className="relative z-30 max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#1a2b4a] text-white font-bold flex items-center justify-center text-lg" style={display}>I</div>
          <div>
            <div className="font-bold text-lg leading-none tracking-tight" style={display}>Ilimi</div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-[#1a2b4a]/50 mt-0.5">Engineered for Ghana's Schools</div>
          </div>
        </div>
        <button
          onClick={scrollToDemo}
          className="bg-[#1a2b4a] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#243a5e] transition"
        >
          Book a demo
        </button>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 pb-20 md:min-h-[78vh] flex items-center justify-center">
        {/* Scattered portraits — desktop/tablet only */}
        <div className="hidden md:block">
          {PORTRAITS.map((p, i) => (
            <div
              key={i}
              className={`absolute ${p.pos} ${p.size} rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 transition-all duration-700 ease-out motion-reduce:transition-none`}
              style={{
                transitionDelay: `${120 + i * 90}ms`,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
              }}
            >
              <img src={p.src} alt={p.alt} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2b4a]/25 to-transparent" />
            </div>
          ))}
        </div>

        {/* Soft halo keeps the headline legible amid the portraits */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
          <div className="w-[62%] h-[64%] bg-[#faf8f4] blur-3xl opacity-90 rounded-full" />
        </div>

        {/* Headline */}
        <div className="relative z-20 text-center max-w-xl mx-auto">
          <div
            className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-all duration-500"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-8px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a227]" />
            <span className="text-xs font-semibold tracking-wide text-[#1a2b4a]/70">For Ghanaian schools</span>
          </div>

          <h1
            className="font-bold leading-[1.1] tracking-tight text-[1.9rem] sm:text-4xl md:text-[2.9rem]"
            style={display}
          >
            {variant.headline.map((line, i) => (
              <span
                key={i}
                className="block transition-all duration-700 ease-out motion-reduce:transition-none"
                style={{
                  transitionDelay: `${200 + i * 110}ms`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="mt-5 text-[0.95rem] sm:text-base leading-relaxed text-[#1a2b4a]/70 max-w-md mx-auto transition-all duration-700 ease-out motion-reduce:transition-none"
            style={{ transitionDelay: '560ms', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)' }}
          >
            {variant.sub}
          </p>

          <div
            className="mt-8 flex items-center justify-center gap-3 flex-wrap transition-all duration-700 ease-out motion-reduce:transition-none"
            style={{ transitionDelay: '680ms', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)' }}
          >
            <button
              onClick={scrollToDemo}
              className="bg-[#1a2b4a] text-white font-semibold px-7 py-3.5 rounded-full hover:bg-[#243a5e] transition shadow-lg shadow-[#1a2b4a]/20"
            >
              Book a demo
            </button>
            <button
              onClick={scrollToDemo}
              className="group flex items-center gap-2 text-[#1a2b4a] font-semibold px-5 py-3.5 rounded-full hover:bg-[#1a2b4a]/5 transition"
            >
              See how it works
              <svg className="w-4 h-4 group-hover:translate-y-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          {/* Mobile-only: a small, tidy portrait row instead of the scatter */}
          <div className="md:hidden mt-10 flex items-center justify-center gap-2">
            {PORTRAITS.slice(0, 3).map((p, i) => (
              <div key={i} className="w-20 h-24 rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                <img src={p.src} alt={p.alt} loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProblemSection />
      <ShowcaseSection />
      <GhanaSection />
      <AspirationSection />
      <MigrationSection />
      <DemoFormSection />

      {/* Placeholder anchor for the demo form section (built later) */}
      <div id="demo" />
    </div>
  )
}

export default LandingPage