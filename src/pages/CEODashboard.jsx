import { useState, useEffect } from 'react'
import { useAuthStore } from '../store'
import {
  TrendingUp, Users, Shield, AlertTriangle, DollarSign,
  Building2, Star, CheckCircle, Clock, ArrowUpRight,
  FileText, Bell, ChevronRight, Activity, Zap,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Mock data (will be replaced by Supabase queries) ─────────────────────────
const MOCK_STATS = {
  activeClients: 47,
  clientsGrowth: '+12%',
  monthlyRevenue: 'R 84,200',
  revenueGrowth: '+8.3%',
  activeEmployees: 14,
  openRiskFlags: 3,
  pendingInvoices: 8,
  orangeArmyActive: 11,
  complianceRate: 94,
  completedThisMonth: 23,
}

const MOCK_REVENUE = [
  { month: 'Jul', revenue: 52000 },
  { month: 'Aug', revenue: 61000 },
  { month: 'Sep', revenue: 58000 },
  { month: 'Oct', revenue: 71000 },
  { month: 'Nov', revenue: 69000 },
  { month: 'Dec', revenue: 84200 },
]

const MOCK_DIVISIONS = [
  { name: 'Business Compliance', clients: 38, compliance: 96, status: 'active', color: '#3B82F6' },
  { name: 'Management Consulting', clients: 9, compliance: 88, status: 'active', color: '#10B981' },
  { name: 'Financial Services', clients: 0, compliance: 0, status: 'planned', color: '#8B5CF6' },
  { name: 'Properties & Investments', clients: 0, compliance: 0, status: 'planned', color: '#F59E0B' },
]

const MOCK_FLAGS = [
  { id: 1, type: 'client_file', message: 'Client file incomplete — Makopo Trading (Pty) Ltd', dept: 'BizCom', priority: 'high', time: '2h ago' },
  { id: 2, type: 'deadline', message: 'Annual return due in 7 days — Sunrise Logistics CC', dept: 'Admin', priority: 'medium', time: '5h ago' },
  { id: 3, type: 'invoice', message: 'Invoice overdue 14 days — Mabu Construction', dept: 'Finance', priority: 'high', time: '1d ago' },
]

const MOCK_ACTIVITY = [
  { action: 'New client onboarded', detail: 'Letsatsi Mining (Pty) Ltd', time: '10 min ago', icon: '🏢' },
  { action: 'Work order completed', detail: 'VAT Registration — Kgoshi Retail', time: '42 min ago', icon: '✅' },
  { action: 'Orange Army payout processed', detail: 'R 1,840 to N. Mahlangu', time: '1h ago', icon: '💳' },
  { action: 'Service agreement signed', detail: 'Bokamoso Cleaning Services', time: '2h ago', icon: '📝' },
  { action: 'New lead captured', detail: 'Thabo Tech Solutions — Google', time: '3h ago', icon: '🎯' },
]

const MOCK_REPORTS_DUE = [
  { dept: 'Finance', due: 'Jan 5', status: 'pending' },
  { dept: 'Admin / Operations', due: 'Jan 7', status: 'pending' },
  { dept: 'HR', due: 'Jan 9', status: 'submitted' },
  { dept: 'Risk & Compliance', due: 'Jan 12', status: 'pending' },
  { dept: 'Marketing & Sales', due: 'Jan 14', status: 'pending' },
  { dept: 'BizCom Division', due: 'Jan 6', status: 'submitted' },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = '#E8700A', delay = '' }) {
  return (
    <div className={`ak-card ak-card-hover animate-in ${delay}`} style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: `${color}18`, border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        {sub && (
          <span style={{
            background: '#10B98118', color: '#10B981',
            padding: '3px 8px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 600,
          }}>{sub}</span>
        )}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#F5F5F5', fontFamily: '"DM Sans", sans-serif', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ color: '#666', fontSize: '13px' }}>{label}</div>
    </div>
  )
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: 600 }}>{title}</h3>
      {action && (
        <button style={{
          background: 'none', border: 'none', color: '#E8700A',
          fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#1C1C1C', border: '1px solid #2E2E2E',
        borderRadius: '8px', padding: '10px 14px',
      }}>
        <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#E8700A', fontWeight: 700 }}>
          R {payload[0].value.toLocaleString()}
        </div>
      </div>
    )
  }
  return null
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function CEODashboard() {
  const { profile } = useAuthStore()
  const [greeting, setGreeting] = useState('')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', flex: 1 }}>

      {/* ── Header ── */}
      <div className="animate-in" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '28px', fontWeight: 700,
              color: '#F5F5F5', marginBottom: '6px',
            }}>
              {greeting}, {profile?.first_name || 'Madembe'} 👋
            </h1>
            <p style={{ color: '#555', fontSize: '14px' }}>
              {time.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}AfricaKai Business Platform
            </p>
          </div>

          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#10B98118', border: '1px solid #10B98133',
            borderRadius: '100px', padding: '8px 16px',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#10B981',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>Live Dashboard</span>
          </div>
        </div>
      </div>

      {/* ── Risk Flags Banner ── */}
      {MOCK_STATS.openRiskFlags > 0 && (
        <div className="animate-in delay-1" style={{
          background: '#E8700A10', border: '1px solid #E8700A33',
          borderRadius: '10px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '28px', cursor: 'pointer',
        }}>
          <AlertTriangle size={18} color="#E8700A" />
          <span style={{ color: '#E8700A', fontSize: '14px', fontWeight: 500, flex: 1 }}>
            {MOCK_STATS.openRiskFlags} risk flags require your attention
          </span>
          <ChevronRight size={16} color="#E8700A" />
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '28px',
      }}>
        <StatCard icon={Users}       label="Active Clients"      value={MOCK_STATS.activeClients}     sub={MOCK_STATS.clientsGrowth}    color="#3B82F6" delay="delay-1" />
        <StatCard icon={DollarSign}  label="Monthly Revenue"     value={MOCK_STATS.monthlyRevenue}    sub={MOCK_STATS.revenueGrowth}    color="#10B981" delay="delay-2" />
        <StatCard icon={Star}        label="Orange Army Active"  value={MOCK_STATS.orangeArmyActive}  color="#E8700A" delay="delay-3" />
        <StatCard icon={Users}       label="Employees"           value={MOCK_STATS.activeEmployees}   color="#8B5CF6" delay="delay-4" />
        <StatCard icon={Shield}      label="Compliance Rate"     value={`${MOCK_STATS.complianceRate}%`} color="#10B981" delay="delay-5" />
        <StatCard icon={CheckCircle} label="Completed This Month" value={MOCK_STATS.completedThisMonth} color="#F59E0B" delay="delay-6" />
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', marginBottom: '20px' }}>

        {/* Revenue Chart */}
        <div className="ak-card animate-in delay-2" style={{ padding: '24px' }}>
          <SectionHeader title="Revenue — Last 6 Months" action="View full report" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_REVENUE} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8700A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E8700A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#E8700A" strokeWidth={2}
                fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Flags */}
        <div className="ak-card animate-in delay-3" style={{ padding: '24px' }}>
          <SectionHeader title="Risk Flags" action="View all" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MOCK_FLAGS.map(flag => (
              <div key={flag.id} style={{
                background: '#1C1C1C', border: `1px solid ${flag.priority === 'high' ? '#E8700A33' : '#2E2E2E'}`,
                borderRadius: '8px', padding: '12px',
                borderLeft: `3px solid ${flag.priority === 'high' ? '#E8700A' : '#F59E0B'}`,
              }}>
                <div style={{ color: '#DDD', fontSize: '13px', marginBottom: '6px' }}>{flag.message}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{
                    background: '#2E2E2E', color: '#888',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                  }}>{flag.dept}</span>
                  <span style={{ color: '#444', fontSize: '11px' }}>{flag.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '20px' }}>

        {/* Divisions */}
        <div className="ak-card animate-in delay-4" style={{ padding: '24px' }}>
          <SectionHeader title="Divisions" action="Manage" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MOCK_DIVISIONS.map((div, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', background: '#1C1C1C', borderRadius: '8px',
                opacity: div.status === 'planned' ? 0.5 : 1,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: div.color, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#DDD', fontSize: '13px', fontWeight: 500 }}>{div.name}</div>
                  {div.status === 'active' ? (
                    <div style={{ color: '#555', fontSize: '11px' }}>{div.clients} clients · {div.compliance}% compliant</div>
                  ) : (
                    <div style={{ color: '#555', fontSize: '11px' }}>Planned — Not yet active</div>
                  )}
                </div>
                <span style={{
                  background: div.status === 'active' ? '#10B98118' : '#3A3A3A',
                  color: div.status === 'active' ? '#10B981' : '#666',
                  padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {div.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="ak-card animate-in delay-5" style={{ padding: '24px' }}>
          <SectionHeader title="Live Activity" action="View all" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_ACTIVITY.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#CCC', fontSize: '13px' }}>{item.action}</div>
                  <div style={{ color: '#555', fontSize: '12px' }}>{item.detail}</div>
                </div>
                <div style={{ color: '#444', fontSize: '11px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Reports */}
        <div className="ak-card animate-in delay-6" style={{ padding: '24px' }}>
          <SectionHeader title="Monthly Reports" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_REPORTS_DUE.map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: '#1C1C1C', borderRadius: '8px',
              }}>
                <div>
                  <div style={{ color: '#DDD', fontSize: '13px' }}>{r.dept}</div>
                  <div style={{ color: '#444', fontSize: '11px' }}>Due {r.due}</div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                  background: r.status === 'submitted' ? '#10B98118' : '#E8700A18',
                  color: r.status === 'submitted' ? '#10B981' : '#E8700A',
                  textTransform: 'uppercase',
                }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}
