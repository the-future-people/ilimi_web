import { useState, useEffect, useRef } from 'react'
import { checkAvailability } from '../api/auth'

/**
 * Debounced live-uniqueness check for a field (email, phone_number, school_email).
 * Returns { status, message } where status is 'idle' | 'checking' | 'available' | 'taken' | 'invalid'.
 */
export function useAvailabilityCheck(field, value, { minLength = 3, delay = 600 } = {}) {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const timerRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!value || value.trim().length < minLength) {
      setStatus('idle')
      setMessage('')
      return
    }

    setStatus('checking')
    const thisRequestId = ++requestIdRef.current

    timerRef.current = setTimeout(async () => {
      try {
        const res = await checkAvailability(field, value.trim())
        if (thisRequestId !== requestIdRef.current) return // stale response, ignore

        const data = res.data || res
        if (data.available) {
          setStatus('available')
          setMessage('')
        } else {
          setStatus(data.message?.includes('valid') ? 'invalid' : 'taken')
          setMessage(data.message || 'This is already in use.')
        }
      } catch (err) {
        if (thisRequestId !== requestIdRef.current) return
        setStatus('idle')
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [field, value])

  return { status, message }
}