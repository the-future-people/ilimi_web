import { Link } from 'react-router-dom'

function Breadcrumb({ items }) {
  return (
    <div className="flex items-center gap-2.5 text-[15px] mb-3 flex-wrap">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5">
          {i > 0 && (
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.href ? (
            <Link to={item.href} className="flex items-center gap-1.5 text-gray-400 hover:text-navy transition">
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ) : (
            <span
              className="flex items-center gap-1.5 font-semibold px-3 py-1 rounded-full min-w-0"
              style={{ background: '#1a2b4a', color: '#c9a227' }}
            >
              {item.icon}
              <span className="truncate max-w-[140px] sm:max-w-none">{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default Breadcrumb