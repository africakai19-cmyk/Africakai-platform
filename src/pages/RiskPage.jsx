import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Shield, Search, X, Check, AlertCircle, Flag,
  Plus, Eye, AlertTriangle, CheckCircle, Clock,
  FileText, Users, ChevronRight, TrendingUp,
} from 'lucide-react'

const FLAG_TYPES = {
  client_file:      { label: 'Client File Issue',     color: '#E8700A' },
  deadline:         { label: 'Deadline Risk',          color: '#F59E0B' },
  invoice:          { label: 'Invoice Issue',          color: '#EF4444' },
  staff:            { label: 'Staff Conduct',          color: '#8B5CF6' },
  oa_conduct:       { label: 'Orange Army Conduct',    color: '#3B82F6' },
  deposit_bypass:   { label: 'Deposit Bypass Request', color: '#10B981' },
  disciplinary:     { label: 'Disciplinary Matter',   color: '#EF4444' },
  other:            { label: 'Other',                  color: '#888' },
}

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: '#10B981', bg: '#10B98118' },
  medium:   { label: 'Medium',   color: '#F59E0B', bg: '#F59E0B18' },
  high:     { label: 'High',     color: '#EF4444', bg: '#EF444418' },
  critical: { label: 'Critical', color: '#DC2626', bg: '#DC262618' },
}

const STATUS_CONFIG = {
  open:         { label: 'Open',         color: '#EF4444', bg: '#EF444418' },
  investigating:{ label: 'Investigating',color: '#F59E0B', bg: '#F59E0B18' },
  resolved:     { label: 'Resolved',     color: '#10B981', bg: '#10B98118' },
  dismissed:    { label: 'Dismissed',    color: '#888',    bg: '#3A3A3A' },
}

const EMPTY_FLAG = {
  flag_type: 'client_file', priority: 'medium',
  title: '', description: '', client_id: '', employee_id: '',
}

const AUDIT_CHECKLIST = [
  'Service agreement on file and signed',
  'Deposit received and proof uploaded',
  'Work order created and assigned',
  'All required client documents collected',
  'Work completed and reviewed by Technical Manager',
  'Final invoice issued',
  'Client satisfaction survey sent',
  'Compliance deadlines tracked and actioned',
]

export default function RiskPage() {
  const [tab, setTab] = useState('flags')
  const [flags, setFlags] = useState([])
  const [clients, setClients] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [form, setForm] = useState(EMPTY_FLAG)
  const [auditClient, setAuditClient] = useState('')
  const [auditChecks, setAuditChecks] = useState({})
  const [auditNotes, setAuditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [fl, cl, em] = await Promise.all([
      supabase.from('risk_flags').select(`*, clients!risk_flags_client_id_fkey(company_name, client_number), employees!risk_flags_employee_id_fkey(first_name, last_name)`).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name, client_number').eq('status', 'active'),
      supabase.from('employees').select('id, first_name, last_name, role_label').eq('status', 'active'),
    ])
    setFlags(fl.data || [])
    setClients(cl.data || [])
    setEmployees(em.data || [])
    setLoading(false)
  }

  async function saveFlag(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('risk_flags').insert([{
        flag_type: form.flag_type,
        priority: form.priority,
        title: form.title,
        description: form.description,
        client_id: form.client_id || null,
        employee_id: form.employee_id || null,
        status: 'open',
      }])
      if (error) throw error
      setSuccess('Risk flag raised successfully.')
      setForm(EMPTY_FLAG)
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function saveAudit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const passed = Object.values(auditChecks).filter(Boolean).length
      const total = AUDIT_CHECKLIST.length
      const score = Math.round((passed / total) * 100)
      const client = clients.find(c => c.id === auditClient)
      const { error } = await supabase.from('audit_log').insert([{
        action: 'quarterly_audit',
        table_name: 'clients',
        record_id: auditClient || null,
        new_values: {
          client_name: client?.company_name,
          score,
          passed,
          total,
          checks: auditChecks,
          notes: auditNotes,
          audited_at: new Date().toISOString(),
        },
      }])
      if (error) throw error

      // If score below 80% raise a flag automatically
      if (score < 80) {
        await supabase.from('risk_flags').insert([{
          flag_type: 'client_file',
          priority: score < 50 ? 'high' : 'medium',
          title: `Audit Failed — ${client?.company_name} (${score}%)`,
          description: `Quarterly audit score: ${score}%. ${total - passed} item(s) failed. Notes: ${auditNotes}`,
          client_id: auditClient || null,
          status: 'open',
        }])
      }

      setSuccess(`Audit completed! Score: ${score}%. ${score < 80 ? 'Risk flag raised automatically.' : 'All clear.'}`)
      setAuditClient('')
      setAuditChecks({})
      setAuditNotes('')
      setShowAudit(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 6000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function updateStatus(id, status) {
    const update = { status }
    if (status === 'resolved') update.resolved_at = new Date().toISOString()
    await supabase.from('risk_flags').update(update).eq('id', id)
    fetchAll()
  }

  const filtered = flags.filter(f => {
    const matchSearch = `${f.title} ${f.clients?.company_name} ${f.employees?.first_name}`
      .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || f.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    open: flags.filter(f => f.status === 'open').length,
    investigating: flags.filter(f => f.status === 'investigating').length,
    high: flags.filter(f => f.priority === 'high' && f.status === 'open').length,
    resolved_this_month: flags.filter(f => f.status === 'resolved' && new Date(f.resolved_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
  }

  const ff = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const TABS = [
    { key: 'flags', label: 'Risk Flags', icon: Flag, count: stats.open },
    { key: 'audit', label: 'Client Audits', icon: Shield },
  ]

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Risk & Compliance</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>Flags, audits, and compliance oversight</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ak-btn-ghost" onClick={() => setShowAudit(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={15} /> Run Client Audit
          </button>
          <button className="ak-btn" onClick={() => setShowForm(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={16} /> Raise Flag
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Open Flags', value: stats.open, color: '#EF4444', icon: Flag },
          { label: 'Investigating', value: stats.investigating, color: '#F59E0B', icon: Clock },
          { label: 'High Priority', value: stats.high, color: '#DC2626', icon: AlertTriangle },
          { label: 'Resolved This Month', value: stats.resolved_this_month, color: '#10B981', icon: CheckCircle },
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

      {/* Flags Tab */}
      {tab === 'flags' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1, minWidth: '200px' }}>
              <Search size={15} color="#555" />
              <input placeholder="Search flags..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'open', 'investigating', 'resolved', 'dismissed'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  background: filterStatus === s ? '#E8700A' : '#1C1C1C',
                  color: filterStatus === s ? 'white' : '#888',
                  border: `1px solid ${filterStatus === s ? '#E8700A' : '#2E2E2E'}`,
                  borderRadius: '6px', padding: '8px 14px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                  textTransform: 'capitalize',
                }}>{s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}</button>
              ))}
            </div>
          </div>

          <div className="ak-card" style={{ overflow: 'hidden' }}>
            {loading ? <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading flags...</div> :
            filtered.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center' }}>
                <Shield size={40} color="#333" style={{ margin: '0 auto 16px' }} />
                <div style={{ color: '#10B981', fontSize: '16px', marginBottom: '8px' }}>All clear</div>
                <div style={{ color: '#444', fontSize: '13px' }}>No risk flags matching your filter</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                    {['Issue', 'Type', 'Client / Employee', 'Priority', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => {
                    const priority = PRIORITY_CONFIG[f.priority] || PRIORITY_CONFIG.medium
                    const status = STATUS_CONFIG[f.status] || STATUS_CONFIG.open
                    const flagType = FLAG_TYPES[f.flag_type] || FLAG_TYPES.other
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{f.title}</div>
                          <div style={{ color: '#555', fontSize: '12px', marginTop: '2px' }}>{f.description?.substring(0, 50)}...</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: `${flagType.color}18`, color: flagType.color, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {flagType.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#CCC', fontSize: '13px' }}>{f.clients?.company_name || f.employees?.first_name + ' ' + f.employees?.last_name || '—'}</div>
                          {f.clients?.client_number && <div style={{ color: '#555', fontSize: '12px' }}>{f.clients.client_number}</div>}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: priority.bg, color: priority.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                            {priority.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {f.status === 'open' && (
                              <button onClick={() => updateStatus(f.id, 'investigating')} style={{ background: '#F59E0B18', border: '1px solid #F59E0B33', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#F59E0B', fontSize: '11px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                                Investigate
                              </button>
                            )}
                            {['open', 'investigating'].includes(f.status) && (
                              <button onClick={() => updateStatus(f.id, 'resolved')} style={{ background: '#10B98118', border: '1px solid #10B98133', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#10B981', fontSize: '11px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                                Resolve
                              </button>
                            )}
                            {f.status === 'open' && (
                              <button onClick={() => updateStatus(f.id, 'dismissed')} style={{ background: '#3A3A3A', border: '1px solid #555', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#888', fontSize: '11px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
                                Dismiss
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ak-card" style={{ padding: '24px' }}>
            <div style={{ color: '#F5F5F5', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Quarterly Client File Audit</div>
            <p style={{ color: '#666', fontSize: '13px', lineHeight: 1.6 }}>
              Every client file must be audited once every 3 months per AfricaKai policy. 
              The audit checks that all required steps have been completed. 
              Files scoring below 80% will automatically generate a risk flag for CEO attention.
            </p>
            <button className="ak-btn" onClick={() => setShowAudit(true)} style={{ width: 'auto', marginTop: '16px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={15} /> Start New Audit
            </button>
          </div>

          <div className="ak-card" style={{ padding: '24px' }}>
            <div style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Audit Checklist Items</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AUDIT_CHECKLIST.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#1C1C1C', borderRadius: '8px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E8700A18', border: '1px solid #E8700A33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8700A', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ color: '#CCC', fontSize: '13px' }}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Raise Flag Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Raise Risk Flag</h2>
              <button onClick={() => { setShowForm(false); setError(null) }} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveFlag} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Flag Type *</label>
                  <select className="ak-input" value={form.flag_type} onChange={e => ff('flag_type', e.target.value)} style={{ cursor: 'pointer' }}>
                    {Object.entries(FLAG_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Priority *</label>
                  <select className="ak-input" value={form.priority} onChange={e => ff('priority', e.target.value)} style={{ cursor: 'pointer' }}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Title *</label>
                <input className="ak-input" placeholder="Brief description of the risk..." value={form.title} onChange={e => ff('title', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client (if applicable)</label>
                  <select className="ak-input" value={form.client_id} onChange={e => ff('client_id', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Employee (if applicable)</label>
                  <select className="ak-input" value={form.employee_id} onChange={e => ff('employee_id', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Full Description *</label>
                <textarea className="ak-input" placeholder="Describe the risk in full detail..." value={form.description} onChange={e => ff('description', e.target.value)} required style={{ minHeight: '100px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Raising...' : <><Flag size={15} /> Raise Flag</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAudit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Client File Audit</h2>
                <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Files below 80% will auto-generate a risk flag</p>
              </div>
              <button onClick={() => setShowAudit(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={saveAudit} style={{ padding: '28px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client Being Audited *</label>
                <select className="ak-input" value={auditClient} onChange={e => setAuditClient(e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.client_number})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Audit Checklist</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {AUDIT_CHECKLIST.map((item, i) => (
                    <div key={i} onClick={() => setAuditChecks(p => ({ ...p, [i]: !p[i] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: auditChecks[i] ? '#10B98110' : '#1C1C1C', border: `1px solid ${auditChecks[i] ? '#10B98133' : '#2E2E2E'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '4px', background: auditChecks[i] ? '#10B981' : '#2E2E2E', border: `1px solid ${auditChecks[i] ? '#10B981' : '#555'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {auditChecks[i] && <Check size={12} color="white" />}
                      </div>
                      <span style={{ color: auditChecks[i] ? '#10B981' : '#888', fontSize: '13px' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live score */}
              <div style={{ background: '#1C1C1C', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>Current Score</span>
                  <span style={{ color: Object.values(auditChecks).filter(Boolean).length / AUDIT_CHECKLIST.length >= 0.8 ? '#10B981' : '#EF4444', fontWeight: 700, fontSize: '18px' }}>
                    {Math.round((Object.values(auditChecks).filter(Boolean).length / AUDIT_CHECKLIST.length) * 100)}%
                  </span>
                </div>
                <div style={{ marginTop: '8px', background: '#2E2E2E', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: Object.values(auditChecks).filter(Boolean).length / AUDIT_CHECKLIST.length >= 0.8 ? '#10B981' : '#EF4444', width: `${Math.round((Object.values(auditChecks).filter(Boolean).length / AUDIT_CHECKLIST.length) * 100)}%`, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Audit Notes</label>
                <textarea className="ak-input" placeholder="Any observations or notes from this audit..." value={auditNotes} onChange={e => setAuditNotes(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowAudit(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving || !auditClient} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Saving...' : <><Shield size={15} /> Complete Audit</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
