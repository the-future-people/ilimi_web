import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, getMyMemberships } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [activeMember, setActiveMember] = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, restore session from localStorage if tokens exist
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      const storedMember = localStorage.getItem('active_member')

      if (token && storedUser) {
        setUser(JSON.parse(storedUser))
        if (storedMember) {
          setActiveMember(JSON.parse(storedMember))
        }
        try {
          const data = await getMyMemberships()
          setMemberships(data.data?.memberships || data.memberships || [])
        } catch (err) {
          console.error('Failed to restore memberships', err)
        }
      }
      setLoading(false)
    }
    restoreSession()
  }, [])

  const doLogin = async (email, password) => {
    const result = await apiLogin(email, password)
    const payload = result.data || result

    localStorage.setItem('access_token', payload.access)
    localStorage.setItem('refresh_token', payload.refresh)
    localStorage.setItem('user', JSON.stringify(payload.user))
    setUser(payload.user)

    const membershipData = await getMyMemberships()
    const membershipList = membershipData.data?.memberships || membershipData.memberships || []
    setMemberships(membershipList)

    // Auto-select if only one membership
    if (membershipList.length === 1) {
      selectMembership(membershipList[0])
    }

    return { user: payload.user, memberships: membershipList }
  }

  const selectMembership = (member) => {
    localStorage.setItem('active_member_id', member.id)
    localStorage.setItem('active_member', JSON.stringify(member))
    setActiveMember(member)
  }

  const doLogout = () => {
    localStorage.clear()
    setUser(null)
    setMemberships([])
    setActiveMember(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        activeMember,
        loading,
        login: doLogin,
        logout: doLogout,
        selectMembership,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}