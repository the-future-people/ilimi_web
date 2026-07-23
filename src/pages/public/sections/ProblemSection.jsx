import { useState, useEffect, useRef } from 'react'

/**
 * Landing section 2 — "The problem, named."
 *
 * The recognition beat: before selling, make a Ghanaian school head feel
 * understood. Deliberately quieter and darker than the hero — a tonal shift
 * that gives the page rhythm. Copy is the hero here, not images.
 *
 * Prose pain points, then a gold pivot line turning toward the solution.
 * Reveals on scroll.
 */

const display = { fontFamily: "'Fraunces', Georgia, serif" }

function ProblemSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="bg-[#1a2b4a] text-[#faf8f4]">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-24 md:py-32">
        <div
          className="transition-all duration-1000 ease-out motion-reduce:transition-none"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)' }}
        >
          <div className="flex items-center gap-2.5 mb-8">
            <span className="w-8 h-px bg-[#c9a227]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a227]">The reality</span>
          </div>

          <h2 className="font-bold leading-[1.15] tracking-tight text-3xl sm:text-4xl md:text-[2.7rem] mb-8" style={display}>
            You already know where the time goes.
          </h2>

          <div className="space-y-5 text-lg sm:text-xl leading-relaxed text-[#faf8f4]/75 max-w-2xl">
            <p
              className="transition-all duration-700 ease-out motion-reduce:transition-none"
              style={{ transitionDelay: '150ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
            >
              The register book, filled in by hand every morning. The report-card
              scramble at the end of every term, chasing scores across a dozen
              exercise books.
            </p>
            <p
              className="transition-all duration-700 ease-out motion-reduce:transition-none"
              style={{ transitionDelay: '320ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
            >
              Fees followed up over Mobile Money, one parent at a time. Notices
              that never quite reach everyone. And software built for schools in
              another country that never really fit yours — so you bent your
              school to fit it instead.
            </p>
          </div>

          <p
            className="mt-10 text-2xl sm:text-3xl font-semibold tracking-tight transition-all duration-700 ease-out motion-reduce:transition-none"
            style={{ ...display, transitionDelay: '500ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', color: '#c9a227' }}
          >
            It doesn't have to be this way.
          </p>
        </div>
      </div>
    </section>
  )
}

export default ProblemSection