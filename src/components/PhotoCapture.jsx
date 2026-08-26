import { useState, useRef, useEffect } from 'react'

const cameraIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const uploadIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

export default function PhotoCapture({
  value,
  onChange,
  allowCamera = true,
  label = 'Photo',
  variant = 'default', // 'default' | 'square'
}) {
  const [mode, setMode] = useState('idle') // 'idle' | 'camera'
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Created once per file and revoked when it changes. Building the URL
  // inline during render leaked one blob URL per keystroke elsewhere in
  // the form.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setMode('camera')
      // videoRef may not be mounted yet on this render pass
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 0)
    } catch (err) {
      setError('Could not access camera. You can upload a photo instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
      onChange(file)
      stopCamera()
      setMode('idle')
    }, 'image/jpeg', 0.9)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
      setMode('idle')
    }
    // Reset so picking the same file twice still fires onChange.
    e.target.value = ''
  }

  const handleRetake = () => {
    onChange(null)
    setMode('idle')
  }

  // ── Square variant ──────────────────────────────────────────────────────

  if (variant === 'square') {
    return (
      <div className="flex flex-col gap-2 w-[150px]">
        {mode === 'camera' ? (
          <>
            <div className="relative rounded-xl overflow-hidden bg-black w-[150px] h-[150px]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={capture}
                className="flex-1 text-xs font-bold bg-gold text-navy py-2 rounded-lg hover:bg-gold-light transition"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={() => { stopCamera(); setMode('idle') }}
                className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Staff photo preview"
              className="w-[150px] h-[150px] rounded-xl object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRetake}
              className="w-full text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition"
            >
              Retake
            </button>
          </>
        ) : (
          <>
            {allowCamera ? (
              <button
                type="button"
                onClick={startCamera}
                className="w-[150px] h-[150px] rounded-xl border border-dashed border-gold bg-cream/40 flex flex-col items-center justify-center gap-2 hover:bg-cream transition"
              >
                <span className="w-9 h-9 rounded-lg bg-navy text-white flex items-center justify-center">
                  {cameraIcon}
                </span>
                <span className="text-xs font-semibold text-navy">Take Photo</span>
                <span className="text-[10px] text-gray-400">Optional</span>
              </button>
            ) : (
              <label className="w-[150px] h-[150px] rounded-xl border border-dashed border-gold bg-cream/40 flex flex-col items-center justify-center gap-2 hover:bg-cream transition cursor-pointer">
                <span className="w-9 h-9 rounded-lg bg-navy text-white flex items-center justify-center">
                  {uploadIcon}
                </span>
                <span className="text-xs font-semibold text-navy">Upload Photo</span>
                <span className="text-[10px] text-gray-400">Optional</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}

            {allowCamera && (
              <label className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition cursor-pointer">
                {uploadIcon}
                Upload instead
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </>
        )}

        {error && <div className="text-[11px] text-red-500">{error}</div>}
      </div>
    )
  }

  // ── Default variant (unchanged) ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-gray-500">{label}</label>

      {previewUrl && mode === 'idle' && (
        <div className="flex items-center gap-3">
          <img src={previewUrl} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
          <button
            type="button"
            onClick={handleRetake}
            className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
          >
            Retake / Remove
          </button>
        </div>
      )}

      {!previewUrl && mode === 'idle' && (
        <div className="flex items-center gap-2">
          {allowCamera && (
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 text-xs font-semibold bg-navy text-white px-3.5 py-2.5 rounded-lg hover:bg-navy-light transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
          )}
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 border border-gray-200 px-3.5 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            {uploadIcon}
            Upload Instead
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div className="flex flex-col gap-2">
          <div className="relative rounded-xl overflow-hidden bg-black w-full max-w-xs aspect-square">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={capture}
              className="text-xs font-bold bg-gold text-navy px-4 py-2.5 rounded-lg hover:bg-gold-light transition"
            >
              Capture
            </button>
            <button
              type="button"
              onClick={() => { stopCamera(); setMode('idle') }}
              className="text-xs font-semibold text-gray-500 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-[11px] text-red-500">{error}</div>}
    </div>
  )
}