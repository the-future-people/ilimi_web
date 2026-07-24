import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleRoutes = {
  school_admin: '/admin',
  branch_manager: '/admin',
  teacher: '/teacher',
  accountant: '/accountant',
  registrar: '/registrar',
  receptionist: '/receptionist',
  parent: '/parent',
}

function RoleRedirect() {
  const { activeMember } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!activeMember) {
      navigate('/select-membership')
      return
    }

    const path = roleRoutes[activeMember.role] || '/login'
    navigate(path)
  }, [activeMember, navigate])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Redirecting...</div>
    </div>
  )
}

export default RoleRedirect