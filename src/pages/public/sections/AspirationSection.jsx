import { useState, useEffect, useRef } from 'react'

/**
 * Landing section 5 — the aspirational warmth section.
 *
 * This is the original inspiration image's motif — warm scattered
 * portraits — deliberately reused here, echoing the hero near the end of
 * the page. Framed honestly as aspiration ("imagine your school like
 * this"), NOT as testimonials — there are no real customers yet, and
 * fabricated quotes would be a credibility risk. When real testimonials
 * exist, this section is the natural place to evolve them in.
 *
 * Swap PORTRAITS `src` for final Ghanaian photos alongside the hero's.
 */

const display = { fontFamily: "'Fraunces', Georgia, serif" }

const PORTRAITS = [
  { src: 'https://images.pexels.com/photos/8471835/pexels-photo-8471835.jpeg?auto=compress&cs=tinysrgb&w=400', pos: 'top-0 left-[6%]', size: 'w-24 h-32', rotate: '-rotate-3' },
  { src: 'https://images.pexels.com/photos/8617839/pexels-photo-8617839.jpeg?auto=compress&cs=tinysrgb&w=400', pos: 'top-[38%] left-[0%]', size: 'w-20 h-24', rotate: 'rotate-2' },
  { src: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg?auto=compress&cs=tinysrgb&w=400', pos: 'bottom-0 left-[10%]', size: 'w-24 h-32', rotate: 'rotate-2' },
  { src: 'https://images.pexels.com/photos/8471965/pexels-photo-8471965.jpeg?auto=compress&cs=tinysrgb&w=400', pos: 'top-[4%] right-[6%]', size: 'w-24 h-32', rotate: 'rotate-3' },
  { src: 'https://images.pexels.com/photos/8617817/pexels-photo-8617817.jpeg?auto=compress&cs=tinysrgb&w=400', pos: 'top-[40%] right-[0%]', size: 'w-20 h-24', rotate: '-rotate-2' },
  { src: 'https://images.pexels.com/photos/8471900/pexels-photo-8471900.jpeg?auto=compress&cs=tinysrgb&w=400', pos: 'bottom-0 right-[10%]', size: 'w-24 h-32', rotate: '-rotate-2' },
]

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

function AspirationSection() {
  const [ref, visible] = useReveal()

  return (
    <section className="bg-[#faf8f4] overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-5 sm:px-8 py-24 md:py-36 relative">
        {/* Scattered portraits — tablet/desktop only, tilted for warmth */}
        <div className="hidden md:block">
          {PORTRAITS.map((p, i) => (
            <div
              key={i}
              className={`absolute ${p.pos} ${p.size} ${p.rotate} rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 transition-all duration-800 ease-out motion-reduce:transition-none`}
              style={{
                transitionDelay: `${100 + i * 90}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? undefined : 'translateY(20px) scale(0.92)',
              }}
            >
              <img src={p.src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Halo for legibility */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
          <div className="w-[58%] h-[70%] bg-[#faf8f4] blur-3xl opacity-90 rounded-full" />
        </div>

        <div
          className="relative z-10 text-center max-w-xl mx-auto transition-all duration-800 ease-out motion-reduce:transition-none"
          style={{ transitionDelay: '250ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <span className="w-8 h-px bg-[#c9a227]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a2b4a]/60">Imagine this</span>
            <span className="w-8 h-px bg-[#c9a227]" />
          </div>

          <h2 className="font-bold leading-[1.15] tracking-tight text-3xl sm:text-4xl md:text-[2.6rem] mb-6" style={display}>
            A calmer school year is possible.
          </h2>

          <p className="text-lg leading-relaxed text-[#1a2b4a]/70">
            Heads who aren't buried in paperwork. Teachers who mark once and
            move on. Parents who actually know what's happening, without
            chasing anyone for it. This is what a school feels like when the
            admin gets out of the way.
          </p>
        </div>
      </div>
    </section>
  )
}

export default AspirationSection