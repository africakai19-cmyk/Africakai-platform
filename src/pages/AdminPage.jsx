import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users, Search, X, Check, AlertCircle, MessageSquare,
  Clock, CheckCircle, Flag, Plus, Eye, Bell, Calendar,
  ChevronRight, AlertTriangle, Mail, Phone,
} from 'lucide-react'

const DEADLINE_TYPES = [
  { value: 'annual_return', label: 'Annual Return (CIPC)' },
  { value: 'vat_return', label: 'VAT Return (SARS)' },
  { value: 'paye', label: 'PAYE Submission' },
  { value: 'uif', label: 'UIF Submission' },
  { value: 'coida', label: 'COIDA Return' },
  { value: 'tax_return', label: 'Income Tax Return' },
  { value: 'financial_statements', label: 'Financial Statements' },
  { value: 'compliance_review', label: 'Quarterly Compliance Review' },
  { value: 'other', label: 'Other' },
]

const FLAG_TYPES = [
  { value: 'missing_document', label: 'Missing Document' },
  { value: 'client_not_responding', label: 'Client Not Responding' },
  { value: 'deadline_approaching', label: 'Deadline Approaching' },
  { value: 'payment_outstanding', label: 'Payment Outstanding' },
  { value: 'work_incomplete', label: 'Work Incomplete' },
  { value: 'other', label: 'Other' },
]

const COMM_TYPES = [
  { value: 'client_email', label: 'Email to Client' },
  { value: 'client_sms', label: 'SMS to Client' },
  { value: 'internal_message', label: 'Internal Message' },
  { value: 'flag', label: 'Flag / Alert' },
]

const DEPT_EMAILS = [
  { value: 'admin@africakai.co.za', label: 'admin@africakai.co.za' },
  { value: 'bizcom@africakai.co.za', label: 'bizcom@africakai.co.za' },
  { value: 'finance@africakai.co.za', label: 'finance@africakai.co.za' },
]

const EMPTY_DEADLINE = { client_id: '', deadline_type: '', due_date: '', description: '' }
const EMPTY_COMM = { client_id: '', type: 'client_email', subject: '', body: '', department_email: 'admin@africakai.co.za' }
const EMPTY_FLAG = { client_id: '', flag_type: '', description: '' }

export default function AdminPage() {
  const [tab, setTab] = useState('deadlines')
  const [clients, setClients] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [communications, setCommunications] = useState([])
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeadlineForm, setShowDeadlineForm] = useState(false)
  const [showCommForm, setShowCommForm] = useState(false)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [deadlineForm, setDeadlineForm] = useState(EMPTY_DEADLINE)
  const [commForm, setCommForm] = useState(EMPTY_COMM)
  const [flagForm, setFlagForm] = useState(EMPTY_FLAG)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [cl, dl, cm, fl] = await Promise.all([
      supabase.from('clients').select('id, company_name, client_number, contact_email, contact_phone').eq('status', 'active'),
      supabase.from('compliance_deadlines').select(`*, clients(company_name, client_number)`).order('due_date', { ascending: true }),
      supabase.from('communications').select(`*, clients(company_name)`).order('sent_at', { ascending: false }).limit(50),
      supabase.from('risk_flags').select(`*, clients(company_name)`).eq('status', 'open').order('created_at', { ascending: false }),
    ])
    setClients(cl.data || [])
    setDeadlines(dl.data || [])
    setCommunications(cm.data || [])
    setFlags(fl.data || [])
    setLoading(false)
  }

  async function saveDeadline(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('compliance_deadlines').insert([{
        client_id: deadlineForm.client_id,
        deadline_type: deadlineForm.deadline_type,
        due_date: deadlineForm.due_date,
        description: deadlineForm.description || null,
        status: 'upcoming',
      }])
      if (error) throw error
      setSuccess('Deadline added successfully!')
      setDeadlineForm(EMPTY_DEADLINE)
      setShowDeadlineForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function saveComm(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('communications').insert([{
        type: commForm.type,
        subject: commForm.subject,
        body: commForm.body,
        client_id: commForm.client_id || null,
        to_client: commForm.client_id || null,
        department_email: commForm.department_email,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }])
      if (error) throw error
      setSuccess('Communication logged successfully!')
      setCommForm(EMPTY_COMM)
      setShowCommForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function saveFlag(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const reason = FLAG_TYPES.find(f => f.value === flagForm.flag_type)?.label
      const { error } = await supabase.from('risk_flags').insert([{
        flag_type: 'client_file',
        priority: 'medium',
        title: reason || flagForm.flag_type,
        description: flagForm.description,
        client_id: flagForm.client_id || null,
        status: 'open',
      }])
      if (error) throw error
      setSuccess('Flag raised successfully! Risk & Compliance has been notified.')
      setFlagForm(EMPTY_FLAG)
      setShowFlagForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function markDeadlineActioned(id) {
    await supabase.from('compliance_deadlines').update({ status: 'actioned', actioned_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
  }

  async function resolveFlag(id) {
    await supabase.from('risk_flags').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    fetchAll()
  }

  const daysUntil = (date) => {
    const diff = new Date(date) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const urgencyColor = (days) => {
    if (days < 0) return '#EF4444'
    if (days <= 7) return '#EF4444'
    if (days <= 14) return '#F59E0B'
    if (days <= 30) return '#E8700A'
    return '#10B981'
  }

  const upcomingDeadlines = deadlines.filter(d => d.status === 'upcoming')
  const overdueDeadlines = deadlines.filter(d => daysUntil(d.due_date) < 0 && d.status === 'upcoming')

  const df = (k, v) => setDeadlineForm(p => ({ ...p, [k]: v }))
  const cf = (k, v) => setCommForm(p => ({ ...p, [k]: v }))
  const ff = (k, v) => setFlagForm(p => ({ ...p, [k]: v }))

  const TABS = [
    { key: 'deadlines', label: 'Compliance Deadlines', icon: Calendar, count: overdueDeadlines.length },
    { key: 'communications', label: 'Communications', icon: MessageSquare, count: null },
    { key: 'flags', label: 'Flags', icon: Flag, count: flags.length },
  ]

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Admin / Operations</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>Client communication, deadlines, and flags</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ak-btn-ghost" onClick={() => setShowFlagForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={15} /> Raise Flag
          </button>
          <button className="ak-btn-ghost" onClick={() => setShowCommForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={15} /> Log Communication
          </button>
          <button className="ak-btn" onClick={() => setShowDeadlineForm(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={16} /> Add Deadline
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Active Clients', value: clients.length, color: '#3B82F6', icon: Users },
          { label: 'Upcoming Deadlines', value: upcomingDeadlines.length, color: '#E8700A', icon: Calendar },
          { label: 'Overdue', value: overdueDeadlines.length, color: '#EF4444', icon: AlertTriangle },
          { label: 'Open Flags', value: flags.length, color: '#F59E0B', icon: Flag },
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
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #1C1C1C', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: tab === t.key ? '2px solid #E8700A' : '2px solid transparent',
            color: tab === t.key ? '#E8700A' : '#666',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif', marginBottom: '-1px',
          }}>
            <t.icon size={14} />
            {t.label}
            {t.count > 0 && (
              <span style={{ background: '#EF4444', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Deadlines Tab */}
      {tab === 'deadlines' && (
        <div className="ak-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading deadlines...</div>
          ) : upcomingDeadlines.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Calendar size={40} color="#333" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No upcoming deadlines</div>
              <div style={{ color: '#444', fontSize: '13px' }}>Click "Add Deadline" to track compliance dates</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                  {['Client', 'Deadline Type', 'Due Date', 'Days Left', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(d => {
                  const days = daysUntil(d.due_date)
                  const color = urgencyColor(days)
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{d.clients?.company_name || '—'}</div>
                        <div style={{ color: '#555', fontSize: '12px' }}>{d.clients?.client_number}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ color: '#CCC', fontSize: '13px' }}>{DEADLINE_TYPES.find(t => t.value === d.deadline_type)?.label || d.deadline_type}</div>
                        {d.description && <div style={{ color: '#555', fontSize: '12px' }}>{d.description}</div>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ color: color, fontSize: '13px', fontWeight: 600 }}>{new Date(d.due_date).toLocaleDateString('en-ZA')}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: `${color}18`, color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                          {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today!' : `${days} days`}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <button onClick={() => markDeadlineActioned(d.id)} style={{ background: '#10B98118', border: '1px solid #10B98133', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#10B981', fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                          Mark Actioned
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Communications Tab */}
      {tab === 'communications' && (
        <div className="ak-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading communications...</div>
          ) : communications.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <MessageSquare size={40} color="#333" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No communications logged yet</div>
              <div style={{ color: '#444', fontSize: '13px' }}>Click "Log Communication" to record client interactions</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                  {['Client', 'Type', 'Subject', 'Sent From', 'Date'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {communications.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{c.clients?.company_name || 'Internal'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: '#3B82F618', color: '#3B82F6', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {COMM_TYPES.find(t => t.value === c.type)?.label || c.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#CCC', fontSize: '13px' }}>{c.subject || '—'}</div>
                      <div style={{ color: '#444', fontSize: '11px', marginTop: '2px' }}>{c.body?.substring(0, 60)}...</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#666', fontSize: '12px' }}>{c.department_email}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#555', fontSize: '12px' }}>{new Date(c.sent_at).toLocaleDateString('en-ZA')}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Flags Tab */}
      {tab === 'flags' && (
        <div className="ak-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading flags...</div>
          ) : flags.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Flag size={40} color="#333" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No open flags</div>
              <div style={{ color: '#444', fontSize: '13px' }}>All clear — no issues flagged</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                  {['Client', 'Issue', 'Description', 'Priority', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flags.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{f.clients?.company_name || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#E8700A', fontSize: '13px' }}>{f.title}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#888', fontSize: '12px' }}>{f.description?.substring(0, 60)}...</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: f.priority === 'high' ? '#EF444418' : '#F59E0B18', color: f.priority === 'high' ? '#EF4444' : '#F59E0B', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {f.priority}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button onClick={() => resolveFlag(f.id)} style={{ background: '#10B98118', border: '1px solid #10B98133', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#10B981', fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Deadline Modal */}
      {showDeadlineForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Add Compliance Deadline</h2>
              <button onClick={() => setShowDeadlineForm(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveDeadline} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client *</label>
                <select className="ak-input" value={deadlineForm.client_id} onChange={e => df('client_id', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Deadline Type *</label>
                <select className="ak-input" value={deadlineForm.deadline_type} onChange={e => df('deadline_type', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select type...</option>
                  {DEADLINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Due Date *</label>
                <input className="ak-input" type="date" value={deadlineForm.due_date} onChange={e => df('due_date', e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</label>
                <input className="ak-input" placeholder="Any additional details..." value={deadlineForm.description} onChange={e => df('description', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowDeadlineForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Saving...' : <><Calendar size={15} /> Add Deadline</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Communication Modal */}
      {showCommForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Log Communication</h2>
              <button onClick={() => setShowCommForm(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveComm} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Type *</label>
                  <select className="ak-input" value={commForm.type} onChange={e => cf('type', e.target.value)} style={{ cursor: 'pointer' }}>
                    {COMM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Sent From</label>
                  <select className="ak-input" value={commForm.department_email} onChange={e => cf('department_email', e.target.value)} style={{ cursor: 'pointer' }}>
                    {DEPT_EMAILS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client</label>
                <select className="ak-input" value={commForm.client_id} onChange={e => cf('client_id', e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Select client (optional)...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Subject</label>
                <input className="ak-input" placeholder="e.g. Annual return reminder" value={commForm.subject} onChange={e => cf('subject', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Message *</label>
                <textarea className="ak-input" placeholder="Message content..." value={commForm.body} onChange={e => cf('body', e.target.value)} required style={{ minHeight: '100px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowCommForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Logging...' : <><MessageSquare size={15} /> Log Communication</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Flag Modal */}
      {showFlagForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #E8700A33', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Raise a Flag</h2>
              <button onClick={() => setShowFlagForm(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveFlag} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client</label>
                <select className="ak-input" value={flagForm.client_id} onChange={e => ff('client_id', e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Select client (optional)...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Issue Type *</label>
                <select className="ak-input" value={flagForm.flag_type} onChange={e => ff('flag_type', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select issue...</option>
                  {FLAG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Description *</label>
                <textarea className="ak-input" placeholder="Describe the issue in detail..." value={flagForm.description} onChange={e => ff('description', e.target.value)} required style={{ minHeight: '90px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowFlagForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Raising...' : <><Flag size={15} /> Raise Flag</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
