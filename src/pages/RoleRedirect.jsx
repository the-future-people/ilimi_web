import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPath } from '../constants/permissions'

function RoleRedirect() {
  const { activeMember } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!activeMember) {
      navigate('/select-membership')
      return
    }

      navigate(dashboardPath(activeMember))
  }, [activeMember, navigate])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Redirecting...</div>
    </div>
  )
}

export default RoleRedirect