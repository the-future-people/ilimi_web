// Mirrors apps/tenants/permissions.py — keep both in sync by hand.
// A domain not listed for a role means NO access, not read-only.

export const DOMAINS = [
  'students', 'staff', 'attendance', 'fees',
  'communications', 'documents', 'reports', 'parents',
]

export const ROLE_PERMISSIONS = {
  school_admin:   Object.fromEntries(DOMAINS.map((d) => [d, 'full'])),
  branch_manager: Object.fromEntries(DOMAINS.map((d) => [d, 'full'])),
  accountant:     { fees: 'full' },
  registrar:      { students: 'full', staff: 'full', documents: 'full', reports: 'full', parents: 'full' },
  teacher:        {}, // teachers use the separate /teacher/* route tree
  receptionist:   {}, // reserved, unused
}

export function hasDomainAccess(role, domain, level = 'full') {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.[domain] === level
}

export function domainsForRole(role) {
  const perms = ROLE_PERMISSIONS[role] || {}
  return Object.entries(perms)
    .filter(([, level]) => level === 'full')
    .map(([domain]) => domain)
}