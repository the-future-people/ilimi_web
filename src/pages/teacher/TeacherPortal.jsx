import { useAuth } from '../../context/AuthContext'

function TeacherPortal() {
  const { user, activeMember, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1a2946]">
              Welcome, {user?.first_name}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {activeMember?.school_name} · {activeMember?.role_display}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
          Teacher portal — build starts here.
        </div>
      </div>
    </div>
  )
}

export default TeacherPortal