import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { memberships } = await login(email, password)

      if (memberships.length === 0) {
        setError('No school membership found for this account.')
      } else if (memberships.length === 1) {
        navigate('/redirect')
      } else {
        navigate('/select-membership')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a2946] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#1a2946] mb-1">Ilimi</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest">School Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email or Phone Number</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#e8a021] transition"
              placeholder="you@school.edu.gh or 0244558389"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#e8a021] transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-[#e8a021] text-[#1a2946] font-bold rounded-lg hover:bg-[#f5c05a] transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-2">
            New to Ilimi? <Link to="/register" className="text-[#1a2946] font-semibold hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login