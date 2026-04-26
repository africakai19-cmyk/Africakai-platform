import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Briefcase, Plus, Search, X, Check, AlertCircle, Mail, Phone, Building2, Eye, MapPin, Hash } from 'lucide-react'

const ENTITY_TYPES = [
  { value: 'pty_ltd', label: '(Pty) Ltd' },
  { value: 'cc', label: 'CC (Close Corporation)' },
  { value: 'sole_prop', label: 'Sole Proprietor' },
  { value: 'npo', label: 'NPO / NPC' },
  { value: 'trust', label: 'Trust' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
]

const PROVINCES = ['Limpopo','Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Mpumalanga','North West','Northern Cape']

const LEAD_SOURCES = [
  { value: 'referral', label: 'Referral' },
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Website' },
  { value: 'walk_in', label: 'Walk In' },
  { value: 'social', label: 'Social Media' },
  { value: 'other', label: 'Other' },
]

const EMPTY_FORM = {
  company_name: '', trading_as: '', reg_number: '', vat_number: '',
  entity_type: '', industry: '', contact_first: '', contact_last: '',
  contact_email: '', contact_phone: '', address: '', city: '',
  province: '', lead_source: '', status: 'active',
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [divisions, setDivisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedDivision, setSelectedDivision] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchClients()
    fetchDivisions()
  }, [])

  async function fetchDivisions() {
    const { data } = await supabase
      .from('divisions')
      .select('id, name, code')
      .eq('active', true)
    setDivisions(data || [])
  }

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form }
      if (selectedDivision) payload.division_id = selectedDivision
      const { error } = await supabase.from('clients').insert([payload])
      if (error) throw error
      setSuccess(`${form.company_name} added successfully! Client number auto-assigned.`)
      setForm(EMPTY_FORM)
      setSelectedDivision('')
      setShowForm(false)
      fetchClients()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const filtered = clients.filter(c =>
    `${c.company_name} ${c.contact_email} ${c.client_number} ${c.city}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Clients</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>{clients.length} total · {clients.filter(c => c.status === 'active').length} active</p>
        </div>
        <button className="ak-btn" onClick={() => setShowForm(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#10B98118', border: '1px solid #10B98133', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
          <Check size={16} color="#10B981" /><span style={{ color: '#10B981', fontSize: '14px' }}>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1 }}>
          <Search size={15} color="#555" />
          <input placeholder="Search by company, email, client number..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }} />
        </div>
      </div>

      <div className="ak-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Briefcase size={40} color="#333" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No clients yet</div>
            <div style={{ color: '#444', fontSize: '13px' }}>Click "Add Client" to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                {['Company', 'Client No.', 'Contact', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <tr key={client.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#3B82F618', border: '1px solid #3B82F633', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                        {client.company_name?.[0]}
                      </div>
                      <div>
                        <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{client.company_name}</div>
                        {client.trading_as && <div style={{ color: '#555', fontSize: '12px' }}>t/a {client.trading_as}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: '#3B82F618', color: '#3B82F6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                      {client.client_number || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#CCC', fontSize: '13px' }}>{client.contact_first} {client.contact_last}</div>
                    <div style={{ color: '#555', fontSize: '12px' }}>{client.contact_email}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ color: '#666', fontSize: '13px' }}>{client.city}{client.province ? `, ${client.province}` : ''}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ background: client.status === 'active' ? '#10B98118' : '#3A3A3A', color: client.status === 'active' ? '#10B981' : '#888', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      {client.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button onClick={() => setSelected(client)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#888' }}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Client Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Add New Client</h2>
                <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Client number will be auto-generated</p>
              </div>
              <button onClick={() => { setShowForm(false); setError(null) }} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                  <AlertCircle size={15} color="#EF4444" /><span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span>
                </div>
              )}

              <p style={{ color: '#E8700A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Company Details</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Company Name *</label>
                  <input className="ak-input" placeholder="Maano Trading (Pty) Ltd" value={form.company_name} onChange={e => f('company_name', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Trading As</label>
                  <input className="ak-input" placeholder="If different from above" value={form.trading_as} onChange={e => f('trading_as', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Entity Type</label>
                  <select className="ak-input" value={form.entity_type} onChange={e => f('entity_type', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Reg Number</label>
                  <input className="ak-input" placeholder="2024/000000/07" value={form.reg_number} onChange={e => f('reg_number', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>VAT Number</label>
                  <input className="ak-input" placeholder="4000000000" value={form.vat_number} onChange={e => f('vat_number', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Division *</label>
                  <select className="ak-input" value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)} required style={{ cursor: 'pointer' }}>
                    <option value="">Select division...</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Lead Source</label>
                  <select className="ak-input" value={form.lead_source} onChange={e => f('lead_source', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <p style={{ color: '#E8700A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Contact Person</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>First Name *</label>
                  <input className="ak-input" placeholder="John" value={form.contact_first} onChange={e => f('contact_first', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Last Name *</label>
                  <input className="ak-input" placeholder="Smith" value={form.contact_last} onChange={e => f('contact_last', e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Email *</label>
                  <input className="ak-input" type="email" placeholder="john@company.co.za" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Phone</label>
                  <input className="ak-input" placeholder="0XX XXX XXXX" value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>City</label>
                  <input className="ak-input" placeholder="Polokwane" value={form.city} onChange={e => f('city', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '7px' }}>Province</label>
                  <select className="ak-input" value={form.province} onChange={e => f('province', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? (<><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Adding...</>) : (<><Briefcase size={15} /> Add Client</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>Client Profile</h2>
              <button onClick={() => setSelected(null)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '12px', background: '#3B82F618', border: '1px solid #3B82F633', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontWeight: 700, fontSize: '20px' }}>
                  {selected.company_name?.[0]}
                </div>
                <div>
                  <div style={{ color: '#F5F5F5', fontSize: '17px', fontWeight: 700 }}>{selected.company_name}</div>
                  <div style={{ color: '#3B82F6', fontSize: '12px', fontFamily: '"JetBrains Mono", monospace' }}>{selected.client_number}</div>
                </div>
              </div>
              {[
                { icon: Hash, label: 'Reg Number', value: selected.reg_number || '—' },
                { icon: Hash, label: 'VAT Number', value: selected.vat_number || '—' },
                { icon: Mail, label: 'Contact Email', value: selected.contact_email },
                { icon: Phone, label: 'Contact Phone', value: selected.contact_phone || '—' },
                { icon: MapPin, label: 'Location', value: `${selected.city || '—'}${selected.province ? `, ${selected.province}` : ''}` },
                { icon: Building2, label: 'Entity Type', value: selected.entity_type || '—' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid #1C1C1C' }}>
                  <item.icon size={14} color="#555" />
                  <span style={{ color: '#555', fontSize: '12px', width: '110px' }}>{item.label}</span>
                  <span style={{ color: '#CCC', fontSize: '13px' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
