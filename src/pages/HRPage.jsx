import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users, Plus, Search, X, Check, AlertCircle,
  UserCheck, FileText, Calendar, Shield, Eye,
  Clock, CheckCircle, AlertTriangle, ChevronDown,
} from 'lucide-react'

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'family', label: 'Family Responsibility' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'study', label: 'Study Leave' },
]

const DISCIPLINARY_TYPES = [
  { value: 'verbal_warning', label: 'Verbal Warning' },
  { value: 'written_warning', label: 'Written Warning' },
  { value: 'final_warning', label: 'Final Written Warning' },
  { value: 'suspension', label: 'Suspension Pending Investigation' },
  { value: 'dismissal', label: 'Dismissal' },
]

const DISCIPLINARY_STEPS = [
  { key: 'flagged', label: '1. Issue Flagged', desc: 'Risk/Admin raises the concern' },
  { key: 'investigating', label: '2. HR Investigating', desc: 'HR gathers evidence and facts' },
  { key: 'preliminary_report', label: '3. Preliminary Report', desc: 'HR prepares report for MD/HOD' },
  { key: 'hearing_scheduled', label: '4. Hearing Scheduled', desc: 'MD holds formal hearing' },
  { key: 'ceo_review', label: '5. CEO Review', desc: 'Decision submitted to CEO' },
  { key: 'resolved', label: '6. Resolved', desc: 'CEO approved outcome' },
]

const EMPTY_LEAVE = { employee_id: '', leave_type: '', start_date: '', end_date: '', reason: '' }
const EMPTY_DISCIPLINARY = { employee_id: '', type: '', description: '', status: 'flagged' }

export default function HRPage() {
  const [tab, setTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [disciplinary, setDisciplinary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showDisciplinaryForm, setShowDisciplinaryForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE)
  const [discForm, setDiscForm] = useState(EMPTY_DISCIPLINARY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [em, lv, dc] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('leave_requests').select(`*, employees!leave_requests_employee_id_fkey(first_name, last_name, role_label)`).order('created_at', { ascending: false }),
      supabase.from('risk_flags').select(`*, employees!risk_flags_employee_id_fkey(first_name, last_name)`).eq('flag_type', 'disciplinary').order('created_at', { ascending: false }),
    ])
    setEmployees(em.data || [])
    setLeaveRequests(lv.data || [])
    setDisciplinary(dc.data || [])
    setLoading(false)
  }

  async function saveLeave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const start = new Date(leaveForm.start_date)
      const end = new Date(leaveForm.end_date)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
      const { error } = await supabase.from('leave_requests').insert([{
        employee_id: leaveForm.employee_id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        days_requested: days,
        reason: leaveForm.reason,
        status: 'pending',
      }])
      if (error) throw error
      setSuccess('Leave request submitted for approval.')
      setLeaveForm(EMPTY_LEAVE)
      setShowLeaveForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function saveDisc(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const emp = employees.find(e => e.id === discForm.employee_id)
      const { error } = await supabase.from('risk_flags').insert([{
        flag_type: 'disciplinary',
        priority: 'high',
        title: `Disciplinary — ${DISCIPLINARY_TYPES.find(t => t.value === discForm.type)?.label}`,
        description: discForm.description,
        employee_id: discForm.employee_id,
        status: 'open',
      }])
      if (error) throw error
      setSuccess('Disciplinary process initiated. HR must now investigate.')
      setDiscForm(EMPTY_DISCIPLINARY)
      setShowDisciplinaryForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function updateLeaveStatus(id, status) {
    await supabase.from('leave_requests').update({ status, decided_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
  }

  async function updateDiscStatus(id, status) {
    await supabase.from('risk_flags').update({ status: status === 'resolved' ? 'resolved' : 'investigating' }).eq('id', id)
    fetchAll()
  }

  const LEAVE_STATUS = {
    pending:  { label: 'Pending',  color: '#F59E0B', bg: '#F59E0B18' },
    approved: { label: 'Approved', color: '#10B981', bg: '#10B98118' },
    declined: { label: 'Declined', color: '#EF4444', bg: '#EF444418' },
  }

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    interns: employees.filter(e => e.employment_type === 'intern').length,
    pending_leave: leaveRequests.filter(l => l.status === 'pending').length,
  }

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email} ${e.role_label} ${e.employee_number}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const lf = (k, v) => setLeaveForm(p => ({ ...p, [k]: v }))
  const df = (k, v) => setDiscForm(p => ({ ...p, [k]: v }))

  const TABS = [
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'leave', label: 'Leave Requests', icon: Calendar, count: stats.pending_leave },
    { key: 'disciplinary', label: 'Disciplinary', icon: Shield, count: disciplinary.length },
  ]

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Human Resources</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>Employees, leave, and disciplinary management</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ak-btn-ghost" onClick={() => setShowDisciplinaryForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={15} /> Initiate Disciplinary
          </button>
          <button className="ak-btn-ghost" onClick={() => setShowLeaveForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} /> Log Leave Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Employees', value: stats.total, color: '#E8700A', icon: Users },
          { label: 'Active', value: stats.active, color: '#10B981', icon: UserCheck },
          { label: 'Interns', value: stats.interns, color: '#8B5CF6', icon: Users },
          { label: 'Pending Leave', value: stats.pending_leave, color: '#F59E0B', icon: Calendar },
        ].map((s, i) => (
          <div key={i} className="ak-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${s.color}18`, border: `1px solid ${s.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#F5F5F5' }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '12px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#10B98118', border: '1px solid #10B98133', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
          <Check size={16} color="#10B981" /><span style={{ color: '#10B981', fontSize: '14px' }}>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #1C1C1C' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: tab === t.key ? '2px solid #E8700A' : '2px solid transparent',
            color: tab === t.key ? '#E8700A' : '#666',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif', marginBottom: '-1px',
          }}>
            <t.icon size={14} />{t.label}
            {t.count > 0 && <span style={{ background: '#EF4444', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {tab === 'employees' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1 }}>
              <Search size={15} color="#555" />
              <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }} />
            </div>
          </div>
          <div className="ak-card" style={{ overflow: 'hidden' }}>
            {loading ? <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading...</div> :
            filtered.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center' }}>
                <Users size={40} color="#333" style={{ margin: '0 auto 16px' }} />
                <div style={{ color: '#555', fontSize: '16px' }}>No employees found</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                    {['Employee', 'Employee No.', 'Role', 'Type', 'Status'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#E8700A22', border: '1px solid #E8700A33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8700A', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                          <div>
                            <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{emp.first_name} {emp.last_name}</div>
                            <div style={{ color: '#555', fontSize: '12px' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: '#E8700A18', color: '#E8700A', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                          {emp.employee_number || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}><div style={{ color: '#CCC', fontSize: '13px' }}>{emp.role_label || emp.role}</div></td>
                      <td style={{ padding: '16px 20px' }}><div style={{ color: '#666', fontSize: '13px', textTransform: 'capitalize' }}>{emp.employment_type}</div></td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: emp.status === 'active' ? '#10B98118' : '#3A3A3A', color: emp.status === 'active' ? '#10B981' : '#888', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Leave Tab */}
      {tab === 'leave' && (
        <div className="ak-card" style={{ overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading...</div> :
          leaveRequests.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Calendar size={40} color="#333" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#555', fontSize: '16px' }}>No leave requests</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                  {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(l => {
                  const s = LEAVE_STATUS[l.status] || LEAVE_STATUS.pending
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{l.employees?.first_name} {l.employees?.last_name}</div>
                        <div style={{ color: '#555', fontSize: '12px' }}>{l.employees?.role_label}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}><div style={{ color: '#CCC', fontSize: '13px' }}>{LEAVE_TYPES.find(t => t.value === l.leave_type)?.label}</div></td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ color: '#CCC', fontSize: '13px' }}>{new Date(l.start_date).toLocaleDateString('en-ZA')}</div>
                        <div style={{ color: '#555', fontSize: '12px' }}>to {new Date(l.end_date).toLocaleDateString('en-ZA')}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}><div style={{ color: '#E8700A', fontWeight: 700 }}>{l.days_requested}</div></td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {l.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateLeaveStatus(l.id, 'approved')} style={{ background: '#10B98118', border: '1px solid #10B98133', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#10B981', fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>Approve</button>
                            <button onClick={() => updateLeaveStatus(l.id, 'declined')} style={{ background: '#EF444418', border: '1px solid #EF444433', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#EF4444', fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>Decline</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Disciplinary Tab */}
      {tab === 'disciplinary' && (
        <div className="ak-card" style={{ overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading...</div> :
          disciplinary.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Shield size={40} color="#333" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#555', fontSize: '16px' }}>No disciplinary cases</div>
              <div style={{ color: '#444', fontSize: '13px' }}>All clear</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                  {['Employee', 'Matter', 'Description', 'Stage', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disciplinary.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{d.employees?.first_name} {d.employees?.last_name}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}><div style={{ color: '#E8700A', fontSize: '13px' }}>{d.title}</div></td>
                    <td style={{ padding: '16px 20px' }}><div style={{ color: '#888', fontSize: '12px' }}>{d.description?.substring(0, 50)}...</div></td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: d.status === 'open' ? '#EF444418' : '#10B98118', color: d.status === 'open' ? '#EF4444' : '#10B981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {d.status === 'open' ? 'Active' : 'Resolved'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {d.status === 'open' && (
                        <button onClick={() => updateDiscStatus(d.id, 'resolved')} style={{ background: '#10B98118', border: '1px solid #10B98133', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#10B981', fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Log Leave Request</h2>
              <button onClick={() => setShowLeaveForm(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveLeave} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Employee *</label>
                <select className="ak-input" value={leaveForm.employee_id} onChange={e => lf('employee_id', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select employee...</option>
                  {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Leave Type *</label>
                <select className="ak-input" value={leaveForm.leave_type} onChange={e => lf('leave_type', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select type...</option>
                  {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date *</label>
                  <input className="ak-input" type="date" value={leaveForm.start_date} onChange={e => lf('start_date', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>End Date *</label>
                  <input className="ak-input" type="date" value={leaveForm.end_date} onChange={e => lf('end_date', e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Reason</label>
                <textarea className="ak-input" placeholder="Reason for leave..." value={leaveForm.reason} onChange={e => lf('reason', e.target.value)} style={{ minHeight: '70px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowLeaveForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Submitting...' : <><Calendar size={15} /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disciplinary Modal */}
      {showDisciplinaryForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #EF444433', borderRadius: '16px', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Initiate Disciplinary</h2>
                <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '4px' }}>This will be escalated to HR and CEO</p>
              </div>
              <button onClick={() => setShowDisciplinaryForm(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveDisc} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}

              {/* Process reminder */}
              <div style={{ background: '#EF444410', border: '1px solid #EF444422', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Disciplinary Process:</div>
                {DISCIPLINARY_STEPS.map((s, i) => (
                  <div key={s.key} style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>{s.label} — {s.desc}</div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Employee *</label>
                <select className="ak-input" value={discForm.employee_id} onChange={e => df('employee_id', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select employee...</option>
                  {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.role_label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Matter Type *</label>
                <select className="ak-input" value={discForm.type} onChange={e => df('type', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select type...</option>
                  {DISCIPLINARY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Description *</label>
                <textarea className="ak-input" placeholder="Describe the incident or misconduct in detail..." value={discForm.description} onChange={e => df('description', e.target.value)} required style={{ minHeight: '100px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowDisciplinaryForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                  {saving ? 'Initiating...' : <><Shield size={15} /> Initiate Process</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
