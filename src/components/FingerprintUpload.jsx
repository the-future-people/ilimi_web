import { useState } from 'react'

export default function FingerprintUpload({ value, onChange, label = 'Fingerprint Scan' }) {
  const [error, setError] = useState('')

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
      setError('')
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-500">{label}</label>

      {value ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-navy truncate">{value.name}</div>
            <div className="text-[10px] text-gray-400">{(value.size / 1024).toFixed(0)} KB</div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition flex-shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 border border-gray-200 px-3.5 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Fingerprint Scan
          <input type="file" accept="image/*,.dat,.bmp" onChange={handleFileUpload} className="hidden" />
        </label>
      )}

      {error && <div className="text-[11px] text-red-500">{error}</div>}
    </div>
  )
}