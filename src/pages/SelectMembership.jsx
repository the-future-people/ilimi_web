import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleColors = {
  school_admin: 'bg-[#1a2946]',
  branch_manager: 'bg-[#2e4a72]',
  teacher: 'bg-[#15803d]',
  accountant: 'bg-[#b45309]',
  receptionist: 'bg-[#7c3aed]',
  parent: 'bg-[#be123c]',
}

function SelectMembership() {
  const { memberships, selectMembership } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (member) => {
    selectMembership(member)
    navigate('/redirect')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold text-[#1a2946] mb-1">Which account?</h1>
          <p className="text-sm text-gray-400">You have access to multiple schools. Choose one to continue.</p>
        </div>

        <div className="flex flex-col gap-3">
          {memberships.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className="flex items-center gap-4 bg-white rounded-xl p-5 shadow hover:shadow-md transition text-left border border-transparent hover:border-[#e8a021]"
            >
              <div className={`w-12 h-12 rounded-lg ${roleColors[member.role] || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {member.school_name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#1a2946]">{member.school_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {member.role_display}
                  {member.branch_name ? ` · ${member.branch_name}` : ''}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SelectMembership