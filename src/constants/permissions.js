// Permissions come from the API now, on each membership, because roles and
// their bundles live in the database per school — a school with no accounts
// office gives fees to its administrator, and no static table here could
// know that. Nothing to keep in sync by hand any more.

export const LEVEL_RANK = { view: 1, request: 2, full: 3 }

// Roles that run or oversee the whole school rather than one domain.
export const OVERSIGHT_ROLES = ['proprietor', 'assistant_head']

export function hasDomainAccess(member, domain, level = 'full') {
  const granted = member?.permissions?.[domain]
  if (!granted) return false
  return (LEVEL_RANK[granted] || 0) >= (LEVEL_RANK[level] || 99)
}

export function domainsForMember(member) {
  return Object.keys(member?.permissions || {}).sort()
}

export function isAdminTier(member) {
  return OVERSIGHT_ROLES.includes(member?.role)
}

// Where this member's dashboard lives. Repeated in eight files before this.
export function dashboardPath(member) {
  switch (member?.role) {
    case 'teacher':
      return '/teacher'
    case 'accounts':
      return '/accountant'
    case 'administrator':
      return '/registrar'
    default:
      return '/admin'
  }
}