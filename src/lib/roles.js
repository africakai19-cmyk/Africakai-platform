// ─── AfricaKai Role & Permission System ───────────────────────────────────────

export const ROLES = {
  // Corporate
  CEO:                    'ceo',
  COO:                    'coo',
  CFO:                    'cfo',

  // Shared Department HODs
  HOD_FINANCE:            'hod_finance',
  HOD_ADMIN:              'hod_admin',
  HOD_HR:                 'hod_hr',
  HOD_MARKETING:          'hod_marketing',
  HOD_IT:                 'hod_it',
  HOD_RISK:               'hod_risk',

  // Shared Department Staff
  FINANCE_STAFF:          'finance_staff',
  ADMIN_STAFF:            'admin_staff',
  HR_STAFF:               'hr_staff',
  MARKETING_STAFF:        'marketing_staff',
  IT_STAFF:               'it_staff',
  RISK_STAFF:             'risk_staff',

  // Division Leadership
  MD_BIZCOM:              'md_bizcom',
  MD_CONSULTING:          'md_consulting',
  MD_FINANCIAL:           'md_financial',
  MD_PROPERTIES:          'md_properties',

  // Division Technical Staff
  TECH_MANAGER_BIZCOM:    'tech_manager_bizcom',
  COMPLIANCE_AGENT:       'compliance_agent',
  CONSULTING_COORDINATOR: 'consulting_coordinator',

  // Orange Army
  ORANGE_ARMY:            'orange_army',

  // Client Portal
  CLIENT:                 'client',
}

export const DIVISIONS = {
  MAIN:        { id: 'main',        name: 'AfricaKai (Pty) Ltd',                    color: '#E8700A', active: true },
  BIZCOM:      { id: 'bizcom',      name: 'AfricaKai Business Compliance',          color: '#3B82F6', active: true },
  CONSULTING:  { id: 'consulting',  name: 'AfricaKai Management Consulting',        color: '#10B981', active: true },
  FINANCIAL:   { id: 'financial',   name: 'AfricaKai Financial Services',           color: '#8B5CF6', active: false },
  PROPERTIES:  { id: 'properties',  name: 'AfricaKai Properties & Investments',     color: '#F59E0B', active: false },
  BANKING:     { id: 'banking',     name: 'AfricaKai Banking',                      color: '#EF4444', active: false },
}

export const DEPARTMENTS = {
  FINANCE:    { id: 'finance',    name: 'Finance',             icon: 'DollarSign',   division: 'main' },
  ADMIN:      { id: 'admin',      name: 'Admin / Operations',  icon: 'Users',        division: 'main' },
  HR:         { id: 'hr',         name: 'Human Resources',     icon: 'UserCheck',    division: 'main' },
  MARKETING:  { id: 'marketing',  name: 'Marketing & Sales',   icon: 'TrendingUp',   division: 'main' },
  IT:         { id: 'it',         name: 'Information Technology', icon: 'Monitor',   division: 'main' },
  RISK:       { id: 'risk',       name: 'Risk & Compliance',   icon: 'Shield',       division: 'main' },
}

// ─── Permission Matrix ─────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // What each role can access
  [ROLES.CEO]: {
    label: 'Chief Executive Officer',
    division: 'main',
    department: null,
    canView: ['*'],           // everything
    canEdit: ['*'],
    canApprove: ['*'],
    canHire: ['hod', 'md'],
    dashboardModules: ['overview', 'finance', 'hr', 'clients', 'risk', 'reports', 'divisions', 'branches', 'ai'],
    emailDomain: 'ceo@africakai.co.za',
    sidebarSections: ['executive', 'departments', 'divisions', 'reports', 'settings'],
  },
  [ROLES.HOD_FINANCE]: {
    label: 'Head of Finance',
    division: 'main',
    department: 'finance',
    canView: ['finance', 'invoices', 'payouts', 'reports_finance'],
    canEdit: ['finance', 'invoices', 'payouts'],
    canApprove: ['invoices', 'payouts', 'expenses'],
    canHire: ['finance_staff'],
    dashboardModules: ['finance', 'invoices', 'payouts', 'reports'],
    emailDomain: 'finance@africakai.co.za',
    sidebarSections: ['finance', 'reports'],
  },
  [ROLES.HOD_ADMIN]: {
    label: 'Head of Admin / Operations',
    division: 'main',
    department: 'admin',
    canView: ['clients', 'communication', 'deadlines', 'flags'],
    canEdit: ['clients', 'communication', 'deadlines'],
    canApprove: ['client_comms'],
    canHire: ['admin_staff'],
    dashboardModules: ['clients', 'deadlines', 'flags', 'communication'],
    emailDomain: 'admin@africakai.co.za',
    sidebarSections: ['clients', 'communication', 'deadlines', 'reports'],
  },
  [ROLES.HOD_HR]: {
    label: 'Head of Human Resources',
    division: 'main',
    department: 'hr',
    canView: ['employees', 'contracts', 'leave', 'disciplinary', 'onboarding'],
    canEdit: ['employees', 'contracts', 'leave', 'disciplinary', 'onboarding'],
    canApprove: ['leave', 'onboarding'],
    canHire: ['hr_staff'],
    dashboardModules: ['employees', 'onboarding', 'leave', 'disciplinary'],
    emailDomain: 'hr@africakai.co.za',
    sidebarSections: ['employees', 'onboarding', 'leave', 'disciplinary', 'reports'],
  },
  [ROLES.HOD_MARKETING]: {
    label: 'Head of Marketing & Sales',
    division: 'main',
    department: 'marketing',
    canView: ['leads', 'campaigns', 'agreements', 'surveys', 'clients'],
    canEdit: ['leads', 'campaigns', 'agreements', 'surveys'],
    canApprove: ['agreements'],
    canHire: ['marketing_staff'],
    dashboardModules: ['leads', 'pipeline', 'agreements', 'surveys'],
    emailDomain: 'marketing@africakai.co.za',
    sidebarSections: ['leads', 'campaigns', 'agreements', 'reports'],
  },
  [ROLES.HOD_IT]: {
    label: 'Head of Information Technology',
    division: 'main',
    department: 'it',
    canView: ['*'],
    canEdit: ['system_settings', 'users', 'access'],
    canApprove: ['access_requests'],
    canHire: ['it_staff'],
    dashboardModules: ['system', 'users', 'access', 'logs'],
    emailDomain: 'it@africakai.co.za',
    sidebarSections: ['system', 'users', 'logs', 'settings'],
  },
  [ROLES.HOD_RISK]: {
    label: 'Head of Risk & Compliance',
    division: 'main',
    department: 'risk',
    canView: ['*'],
    canEdit: ['audits', 'risk_flags', 'compliance_reports'],
    canApprove: ['audit_reports'],
    canHire: ['risk_staff'],
    dashboardModules: ['audits', 'risk_flags', 'compliance', 'reports'],
    emailDomain: 'risk@africakai.co.za',
    sidebarSections: ['audits', 'risk', 'reports'],
  },
  [ROLES.MD_BIZCOM]: {
    label: 'Managing Director — BizCom',
    division: 'bizcom',
    department: null,
    canView: ['bizcom_clients', 'bizcom_team', 'bizcom_work', 'orange_army', 'finance_bizcom'],
    canEdit: ['bizcom_clients', 'bizcom_work', 'orange_army_assignments'],
    canApprove: ['bizcom_work', 'orange_army_payouts'],
    canHire: ['tech_manager_bizcom', 'compliance_agent'],
    dashboardModules: ['clients', 'team', 'work_orders', 'orange_army', 'quality'],
    emailDomain: 'bizcom@africakai.co.za',
    sidebarSections: ['clients', 'team', 'work', 'orange_army', 'reports'],
  },
  [ROLES.ORANGE_ARMY]: {
    label: 'Orange Army Member',
    division: 'bizcom',
    department: null,
    canView: ['my_assignments', 'my_earnings'],
    canEdit: ['my_work_submissions'],
    canApprove: [],
    canHire: [],
    dashboardModules: ['assignments', 'earnings', 'submissions'],
    emailDomain: null,
    sidebarSections: ['assignments', 'earnings'],
  },
  [ROLES.CLIENT]: {
    label: 'Client',
    division: null,
    department: null,
    canView: ['my_services', 'my_documents', 'my_invoices'],
    canEdit: ['my_documents_upload'],
    canApprove: [],
    canHire: [],
    dashboardModules: ['services', 'documents', 'invoices', 'communication'],
    emailDomain: null,
    sidebarSections: ['services', 'documents', 'invoices'],
  },
}

export function getRoleLabel(role) {
  return PERMISSIONS[role]?.label || role
}

export function hasPermission(role, permission) {
  const perms = PERMISSIONS[role]
  if (!perms) return false
  if (perms.canView.includes('*')) return true
  return perms.canView.includes(permission) || perms.canEdit.includes(permission)
}

export function getDashboardModules(role) {
  return PERMISSIONS[role]?.dashboardModules || []
}
