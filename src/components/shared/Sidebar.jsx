import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../../store'
import {
  LayoutDashboard, Users, DollarSign, Shield, TrendingUp,
  Monitor, UserCheck, Building2, LogOut, Bell,
  FileText, Star, AlertTriangle, MessageSquare,
  PanelLeftClose, PanelLeft, Globe, Briefcase,
} from 'lucide-react'

const NAV = {
  ceo: [
    { section: 'EXECUTIVE', items: [
      { icon: LayoutDashboard, label: 'Overview',        path: '/dashboard' },
      { icon: Globe,           label: 'Divisions',       path: '/divisions' },
      { icon: Building2,       label: 'Branches',        path: '/branches' },
      { icon: AlertTriangle,   label: 'Risk Flags',      path: '/risk-flags', badge: 3 },
      { icon: FileText,        label: 'Reports',         path: '/reports' },
    ]},
    { section: 'DEPARTMENTS', items: [
      { icon: DollarSign,      label: 'Finance',         path: '/finance' },
      { icon: Users,           label: 'Admin / Ops',     path: '/admin' },
      { icon: UserCheck,       label: 'Human Resources', path: '/hr' },
      { icon: TrendingUp,      label: 'Marketing',       path: '/marketing' },
      { icon: Monitor,         label: 'IT',              path: '/it' },
      { icon: Shield,          label: 'Risk & Compliance', path: '/risk' },
    ]},
    { section: 'PEOPLE', items: [
      { icon: Users,           label: 'All Employees',   path: '/employees' },
      { icon: Star,            label: 'Orange Army',     path: '/orange-army' },
      { icon: Briefcase,       label: 'Clients',         path: '/clients' },
    ]},
  ],
}

function NavItem({ item, collapsed }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === item.path

  return (
    <div
      className={`ak-sidebar-link ${isActive ? 'active' : ''}`}
      onClick={() => navigate(item.path)}
      title={collapsed ? item.label : undefined}
      style={collapsed ? { justifyContent: 'center', padding: '10px' } : {}}
    >
      <item.icon size={16} style={{ flexShrink: 0 }} />
      {!collapsed && (
        <>
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge && (
            <span style={{ background: '#E8700A', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: 700 }}>{item.badge}</span>
          )}
        </>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { profile, role, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const collapsed = !sidebarOpen
  const nav = NAV[role] || NAV.ceo

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      minHeight: '100vh',
      background: '#141414',
      borderRight: '1px solid #1C1C1C',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: collapsed ? '16px 0' : '16px',
        borderBottom: '1px solid #1C1C1C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '10px',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/AfricaKai_Logo.jpg"
              alt="AfricaKai"
              style={{ width: 34, height: 34, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div style={{ display: 'none', width: 34, height: 34, borderRadius: '8px', background: 'linear-gradient(135deg, #E8700A, #fb923c)', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '15px', color: 'white', flexShrink: 0 }}>A</div>
            <div>
              <div style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '14px' }}>AfricaKai</div>
              <div style={{ color: '#444', fontSize: '10px', letterSpacing: '0.5px' }}>PLATFORM</div>
            </div>
          </div>
        )}
        {collapsed && (
          <>
            <img
              src="/AfricaKai_Logo.jpg"
              alt="AfricaKai"
              style={{ width: 34, height: 34, borderRadius: '8px', objectFit: 'cover' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div style={{ display: 'none', width: 34, height: 34, borderRadius: '8px', background: 'linear-gradient(135deg, #E8700A, #fb923c)', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '15px', color: 'white' }}>A</div>
          </>
        )}
        {!collapsed && (
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '4px', borderRadius: '4px' }}>
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {nav.map((section, si) => (
          <div key={si} style={{ marginBottom: '20px' }}>
            {!collapsed && (
              <div style={{ color: '#3A3A3A', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', padding: '4px 8px 8px' }}>
                {section.section}
              </div>
            )}
            {section.items.map((item, ii) => (
              <NavItem key={ii} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Profile ── */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 8px', borderTop: '1px solid #1C1C1C' }}>
        {!collapsed && profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', marginBottom: '4px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#E8700A22', border: '1px solid #E8700A44', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8700A', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#DDD', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.first_name} {profile.last_name}
              </div>
              <div style={{ color: '#555', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.role_label || role}
              </div>
            </div>
          </div>
        )}

        <div className="ak-sidebar-link" onClick={logout}
          style={collapsed ? { justifyContent: 'center', padding: '10px' } : {}}
          title={collapsed ? 'Sign Out' : undefined}>
          <LogOut size={15} />
          {!collapsed && <span>Sign Out</span>}
        </div>

        {collapsed && (
          <div className="ak-sidebar-link" onClick={toggleSidebar}
            style={{ justifyContent: 'center', padding: '10px', marginTop: '4px' }}
            title="Expand sidebar">
            <PanelLeft size={15} />
          </div>
        )}
      </div>
    </aside>
  )
}
