function AvailabilityIndicator({ status }) {
  if (status === 'idle') return null

  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2">
      {status === 'checking' && (
        <div className="w-4 h-4 border-2 border-gray-200 border-t-gold rounded-full animate-spin" />
      )}
      {status === 'available' && (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {(status === 'taken' || status === 'invalid') && (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </span>
  )
}

export default AvailabilityIndicator