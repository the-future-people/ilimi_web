import { useState, useEffect, useRef } from 'react'

const display = { fontFamily: "'Fraunces', Georgia, serif" }

function useReveal(threshold = 0.3) {
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

function MigrationSection() {
  const [ref, visible] = useReveal()

  return (
    <section className="bg-[#1a2b4a]">
      <div
        ref={ref}
        className="max-w-3xl mx-auto px-5 sm:px-8 py-16 md:py-20 text-center transition-all duration-800 ease-out motion-reduce:transition-none"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
      >
        <h3 className="font-bold text-2xl sm:text-3xl text-[#faf8f4] mb-3" style={display}>
          Switching schools? Your history doesn't have to move.
        </h3>
        <p className="text-[#faf8f4]/65 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Already running another system? We'll get last term's results onto this
          term's report cards — no messy migration, nothing left behind.
        </p>
      </div>
    </section>
  )
}

export default MigrationSection