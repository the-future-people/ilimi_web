import { Link } from 'react-router-dom'

function StaffRegisterTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Link
        to="/admin/staff/register"
        className="bg-white rounded-xl p-5 shadow-sm border border-transparent hover:border-gray-200 hover:shadow-md transition group"
      >
        <div className="w-11 h-11 rounded-xl bg-navy flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div className="text-sm font-bold text-navy mb-1.5 flex items-center gap-1.5">
          Register Staff
          <svg
            className="w-3.5 h-3.5 text-gray-300 group-hover:text-navy group-hover:translate-x-0.5 transition"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Register a new teacher or staff member — personal details, employment, qualifications and next of kin, captured in one guided flow.
        </p>
      </Link>
    </div>
  )
}

export default StaffRegisterTab