import { Link } from 'react-router-dom'

function Breadcrumb({ items }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-gray-300">›</span>}
          {item.href ? (
            <Link to={item.href} className="hover:text-navy transition flex items-center gap-1">
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <span className="text-navy font-semibold">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default Breadcrumb