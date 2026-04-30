import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  TrendingUp, Plus, Search, X, Check, AlertCircle,
  Star, Phone, Mail, Building2, Eye, ChevronRight,
  Users, Target, MessageSquare, CheckCircle, Clock,
} from 'lucide-react'

const LEAD_SOURCES = [
  { value: 'google', label: 'Google Search' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'walk_in', label: 'Walk In' },
  { value: 'social', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'other', label: 'Other' },
]

const LEAD_STATUSES = {
  new:        { label: 'New',        color: '#3B82F6', bg: '#3B82F618' },
  contacted:  { label: 'Contacted',  color: '#F59E0B', bg: '#F59E0B18' },
  qualified:  { label: 'Qualified',  color: '#8B5CF6', bg: '#8B5CF618' },
  converted:  { label: 'Converted',  color: '#10B981', bg: '#10B98118' },
  lost:       { label: 'Lost',       color: '#EF4444', bg: '#EF444418' },
}

const SERVICES_INTEREST = [
  'Company Registration',
  'CIPC Amendment',
  'Annual Returns',
  'VAT Registration',
  'PAYE Registration',
  'Tax Clearance Certificate',
  'Income Tax Return',
  'UIF / COIDA Registration',
  'Bookkeeping Package',
  'Silver Bullet Internship',
  'Business Advisory',
  'Other',
]

const PIPELINE_STAGES = [
  { key: 'new',       label: 'New Leads',    color: '#3B82F6' },
  { key: 'contacted', label: 'Contacted',    color: '#F59E0B' },
  { key: 'qualified', label: 'Qualified',    color: '#8B5CF6' },
  { key: 'converted', label: 'Converted',    color: '#10B981' },
]

const EMPTY_FORM = {
  company_name: '', contact_name: '', email: '', phone: '',
  source: '', service_interest: '', notes: '', status: 'new',
}

export default function MarketingPage() {
  const [tab, setTab] = useState('leads')
  const [leads, setLeads] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [ld, em] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name').eq('status', 'active'),
    ])
    setLeads(ld.data || [])
    setEmployees(em.data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('leads').insert([form])
      if (error) throw error
      setSuccess('Lead added to pipeline!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function updateStatus(id, status) {
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (selected?.id === id) setSelected(p => ({ ...p, status }))
    fetchAll()
  }

  async function convertToClient(lead) {
    try {
      const { error } = await supabase.from('clients').insert([{
        company_name: lead.company_name || lead.contact_name,
        contact_first: lead.contact_name?.split(' ')[0] || '',
        contact_last: lead.contact_name?.split(' ').slice(1).join(' ') || '',
        contact_email: lead.email,
        contact_phone: lead.phone,
        lead_source: lead.source,
        status: 'active',
      }])
      if (error) throw error
      await updateStatus(lead.id, 'converted')
      setSuccess('Lead converted to client successfully!')
      setSelected(null)
    } catch (err) { setError(err.message) }
  }

  const filtered = leads.filter(l => {
    const matchSearch = `${l.company_name} ${l.contact_name} ${l.email} ${l.service_interest}`
      .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    conversion_rate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0,
  }

  const ff = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const TABS = [
    { key: 'leads', label: 'Lead Pipeline', icon: Target },
    { key: 'pipeline', label: 'Pipeline View', icon: TrendingUp },
  ]

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Marketing & Sales</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>Lead pipeline, client acquisition and retention</p>
        </div>
        <button className="ak-btn" onClick={() => setShowForm(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Leads', value: stats.total, color: '#3B82F6', icon: Users },
          { label: 'New', value: stats.new, color: '#F59E0B', icon: Star },
          { label: 'Qualified', value: stats.qualified, color: '#8B5CF6', icon: Target },
          { label: 'Conversion Rate', value: `${stats.conversion_rate}%`, color: '#10B981', icon: TrendingUp },
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
          </button>
        ))}
      </div>

      {/* Leads Table */}
      {tab === 'leads' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1, minWidth: '200px' }}>
              <Search size={15} color="#555" />
              <input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  background: filterStatus === s ? '#E8700A' : '#1C1C1C',
                  color: filterStatus === s ? 'white' : '#888',
                  border: `1px solid ${filterStatus === s ? '#E8700A' : '#2E2E2E'}`,
                  borderRadius: '6px', padding: '8px 14px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                  textTransform: 'capitalize',
                }}>{s === 'all' ? 'All' : LEAD_STATUSES[s]?.label || s}</button>
              ))}
            </div>
          </div>

          <div className="ak-card" style={{ overflow: 'hidden' }}>
            {loading ? <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading leads...</div> :
            filtered.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center' }}>
                <Target size={40} color="#333" style={{ margin: '0 auto 16px' }} />
                <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No leads yet</div>
                <div style={{ color: '#444', fontSize: '13px' }}>Click "Add Lead" to start your pipeline</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                    {['Contact', 'Company', 'Service Interest', 'Source', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => {
                    const s = LEAD_STATUSES[lead.status] || LEAD_STATUSES.new
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{lead.contact_name || '—'}</div>
                          <div style={{ color: '#555', fontSize: '12px' }}>{lead.email}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#CCC', fontSize: '13px' }}>{lead.company_name || '—'}</div>
                          <div style={{ color: '#555', fontSize: '12px' }}>{lead.phone}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#888', fontSize: '13px' }}>{lead.service_interest || '—'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: '#1C1C1C', color: '#666', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {LEAD_SOURCES.find(src => src.value === lead.source)?.label || lead.source || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <button onClick={() => setSelected(lead)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#888' }}>
                            <Eye size={14} />
                          </button>
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

      {/* Pipeline View */}
      {tab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage.key)
            return (
              <div key={stage.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: stage.color, fontSize: '13px', fontWeight: 700 }}>{stage.label}</span>
                  <span style={{ background: `${stage.color}18`, color: stage.color, borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{stageLeads.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stageLeads.length === 0 ? (
                    <div style={{ background: '#141414', border: '1px dashed #2E2E2E', borderRadius: '8px', padding: '24px', textAlign: 'center', color: '#444', fontSize: '12px' }}>Empty</div>
                  ) : stageLeads.map(lead => (
                    <div key={lead.id} onClick={() => setSelected(lead)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color + '44'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2E2E2E'; e.currentTarget.style.transform = 'none' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{lead.contact_name || lead.company_name}</div>
                      {lead.company_name && lead.contact_name && <div style={{ color: '#666', fontSize: '11px', marginBottom: '6px' }}>{lead.company_name}</div>}
                      <div style={{ color: '#555', fontSize: '11px' }}>{lead.service_interest}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Add New Lead</h2>
              <button onClick={() => { setShowForm(false); setError(null) }} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px' }}><AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span></div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Contact Name *</label>
                  <input className="ak-input" placeholder="John Smith" value={form.contact_name} onChange={e => ff('contact_name', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Company Name</label>
                  <input className="ak-input" placeholder="Maano Trading (Pty) Ltd" value={form.company_name} onChange={e => ff('company_name', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Email</label>
                  <input className="ak-input" type="email" placeholder="john@company.co.za" value={form.email} onChange={e => ff('email', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Phone</label>
                  <input className="ak-input" placeholder="0XX XXX XXXX" value={form.phone} onChange={e => ff('phone', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Lead Source</label>
                  <select className="ak-input" value={form.source} onChange={e => ff('source', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select source...</option>
                    {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Service Interest</label>
                  <select className="ak-input" value={form.service_interest} onChange={e => ff('service_interest', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select service...</option>
                    {SERVICES_INTEREST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</label>
                <textarea className="ak-input" placeholder="Any additional notes about this lead..." value={form.notes} onChange={e => ff('notes', e.target.value)} style={{ minHeight: '70px', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Adding...' : <><Target size={15} /> Add to Pipeline</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>Lead Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>{selected.contact_name}</div>
                {selected.company_name && <div style={{ color: '#E8700A', fontSize: '13px', marginTop: '4px' }}>{selected.company_name}</div>}
              </div>
              {[
                { icon: Mail, label: 'Email', value: selected.email || '—' },
                { icon: Phone, label: 'Phone', value: selected.phone || '—' },
                { icon: Target, label: 'Service Interest', value: selected.service_interest || '—' },
                { icon: Star, label: 'Source', value: LEAD_SOURCES.find(s => s.value === selected.source)?.label || '—' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid #1C1C1C' }}>
                  <item.icon size={14} color="#555" />
                  <span style={{ color: '#555', fontSize: '12px', width: '110px' }}>{item.label}</span>
                  <span style={{ color: '#CCC', fontSize: '13px' }}>{item.value}</span>
                </div>
              ))}
              {selected.notes && (
                <div style={{ marginTop: '16px', background: '#1C1C1C', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ color: '#666', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>NOTES</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{selected.notes}</div>
                </div>
              )}

              {/* Update Status */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Update Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {['contacted', 'qualified', 'lost'].map(s => {
                    const sc = LEAD_STATUSES[s]
                    return (
                      <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                        background: selected.status === s ? sc.bg : '#1C1C1C',
                        color: selected.status === s ? sc.color : '#666',
                        border: `1px solid ${selected.status === s ? sc.color + '44' : '#2E2E2E'}`,
                        borderRadius: '6px', padding: '8px', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                      }}>{sc.label}</button>
                    )
                  })}
                </div>
                {selected.status !== 'converted' && (
                  <button onClick={() => convertToClient(selected)} style={{
                    width: '100%', background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white', border: 'none', borderRadius: '8px',
                    padding: '12px', cursor: 'pointer', fontSize: '13px',
                    fontWeight: 700, fontFamily: '"DM Sans", sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                    <CheckCircle size={15} /> Convert to Client
                  </button>
                )}
                {selected.status === 'converted' && (
                  <div style={{ background: '#10B98118', border: '1px solid #10B98133', borderRadius: '8px', padding: '12px', textAlign: 'center', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                    ✅ Converted to Client
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
