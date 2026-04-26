import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAppStore, useAuthStore } from '../../store'
import { PERMISSIONS } from '../../lib/roles'
import { Bell, Search } from 'lucide-react'

export default function AppLayout({ children }) {
  const { profile, role } = useAuthStore()
  const roleLabel = PERMISSIONS[role]?.label || ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* ── Top Bar ── */}
        <header style={{
          height: '60px', background: '#141414',
          borderBottom: '1px solid #1C1C1C',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: '16px',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px 14px', flex: 1, maxWidth: '400px' }}>
            <Search size={14} color="#555" />
            <input
              placeholder="Search clients, employees, documents..."
              style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }}
            />
          </div>

          <div style={{ flex: 1 }} />

          <button style={{ position: 'relative', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}>
            <Bell size={16} />
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#E8700A', color: 'white', width: 16, height: 16, borderRadius: '50%', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#E8700A22', border: '1px solid #E8700A44', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8700A', fontWeight: 700, fontSize: '11px' }}>
              {profile?.first_name?.[0]}{profile?.last_name?.[0] || 'MM'}
            </div>
            <div>
              <div style={{ color: '#DDD', fontSize: '12px', fontWeight: 600 }}>{profile?.first_name || 'Madembe'} {profile?.last_name || 'Maano'}</div>
              <div style={{ color: '#555', fontSize: '10px' }}>{roleLabel}</div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
