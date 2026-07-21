import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleColors = {
  school_admin: 'bg-navy',
  branch_manager: 'bg-navy-light',
  teacher: 'bg-green-700',
  accountant: 'bg-amber-700',
  receptionist: 'bg-purple-700',
  parent: 'bg-rose-700',
}

function SelectMembership() {
  const { memberships, selectMembership, logout, user } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (member) => {
    selectMembership(member)
    navigate('/redirect')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-navy text-white font-serif font-bold text-lg flex items-center justify-center mx-auto mb-4">
            I
          </div>
          {memberships.length > 0 ? (
            <>
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">Which account?</h1>
              <p className="text-sm text-gray-400">
                {user?.first_name ? `Welcome back, ${user.first_name}. ` : ''}
                You have access to multiple schools. Choose one to continue.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">No school access yet</h1>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                {user?.first_name ? `${user.first_name}, y` : 'Y'}our account isn't linked to any school on Ilimi yet.
              </p>
            </>
          )}
        </div>

        {memberships.length > 0 ? (
          <div className="flex flex-col gap-3">
            {memberships.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition text-left border border-transparent hover:border-gold"
              >
                <div className={`w-12 h-12 rounded-lg ${roleColors[member.role] || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {member.school_name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy truncate">{member.school_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {member.role_display}
                    {member.branch_name ? ` · ${member.branch_name}` : ''}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              If you're setting up a new school, register it now. If you were expecting an invite from an existing school, ask their administrator to send you one.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-navy text-white text-sm font-bold py-3 rounded-lg hover:bg-navy-light transition mb-3"
            >
              Register Your School
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-400 hover:text-navy transition"
            >
              Log out and try a different account
            </button>
          </div>
        )}

        {memberships.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-400 hover:text-navy transition"
            >
              Not you? Log out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectMembership