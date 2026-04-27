import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  FileText, Plus, Search, X, Check, AlertCircle,
  Clock, CheckCircle, AlertOctagon, ChevronRight,
  DollarSign, Calendar, User, Briefcase, Eye,
  ArrowRight, Shield, Star, TrendingUp, BookOpen,
} from 'lucide-react'

// ─── AfricaKai Services Catalogue ─────────────────────────────────────────────
const SERVICES_CATALOGUE = {
  bizcom: {
    label: 'Business Compliance',
    color: '#3B82F6',
    agreement_type: 'once_off',
    services: [
      { code: 'CIPC_REG', name: 'Company Registration (Pty) Ltd', price: 1500, deposit: true },
      { code: 'CIPC_CC', name: 'CC Registration', price: 1200, deposit: true },
      { code: 'CIPC_AMD', name: 'CIPC Amendment', price: 800, deposit: true },
      { code: 'CIPC_AR', name: 'Annual Returns', price: 600, deposit: true },
      { code: 'SARS_VAT', name: 'VAT Registration', price: 1200, deposit: true },
      { code: 'SARS_PAYE', name: 'PAYE Registration', price: 800, deposit: true },
      { code: 'SARS_TCS', name: 'Tax Clearance Certificate', price: 800, deposit: true },
      { code: 'SARS_ITR', name: 'Income Tax Return', price: 1500, deposit: true },
      { code: 'UIF_REG', name: 'UIF Registration', price: 600, deposit: true },
      { code: 'COIDA_REG', name: 'COIDA Registration', price: 800, deposit: true },
      { code: 'NAME_RES', name: 'Name Reservation', price: 500, deposit: true },
      { code: 'BUS_ADDR', name: 'Business Address', price: 300, deposit: false },
    ]
  },
  bookkeeping: {
    label: 'Bookkeeping',
    color: '#10B981',
    agreement_type: 'bookkeeping',
    services: [
      { code: 'BK_SME', name: 'SME Full Compliance Package', price: 3000, deposit: false, recurring: true, interval: 'monthly' },
      { code: 'BK_BASIC', name: 'Basic Bookkeeping', price: 1500, deposit: false, recurring: true, interval: 'monthly' },
      { code: 'BK_PAYROLL', name: 'Payroll Processing', price: 1200, deposit: false, recurring: true, interval: 'monthly' },
      { code: 'BK_FS', name: 'Financial Statements', price: 3500, deposit: true },
      { code: 'BK_RECON', name: 'Bank Reconciliation', price: 800, deposit: true },
    ]
  },
  consulting: {
    label: 'Management Consulting',
    color: '#8B5CF6',
    agreement_type: 'consulting',
    services: [
      { code: 'MC_SB', name: 'Silver Bullet Internship Placement', price: 1200, deposit: false, recurring: true, interval: 'monthly' },
      { code: 'MC_STAFF', name: 'Staffing Solution', price: 1200, deposit: false, recurring: true, interval: 'monthly' },
      { code: 'MC_BUS', name: 'Business Advisory', price: 2500, deposit: true },
      { code: 'MC_STRAT', name: 'Strategic Planning', price: 5000, deposit: true },
    ]
  }
}

const AGREEMENT_LABELS = {
  once_off: 'Once-Off Service Agreement',
  bookkeeping: 'Bookkeeping Service Contract',
  consulting: 'Management Consulting Agreement',
}

const STATUS_CONFIG = {
  draft:       { label: 'Draft',        color: '#888',    bg: '#3A3A3A',    icon: FileText },
  agreement_pending: { label: 'Awaiting Agreement', color: '#F59E0B', bg: '#F59E0B18', icon: FileText },
  agreement_signed: { label: 'Agreement Signed', color: '#3B82F6', bg: '#3B82F618', icon: Check },
  deposit_pending: { label: 'Awaiting Deposit', color: '#F59E0B', bg: '#F59E0B18', icon: DollarSign },
  deposit_paid: { label: 'Deposit Paid', color: '#10B981', bg: '#10B98118', icon: Check },
  in_progress: { label: 'In Progress',  color: '#E8700A', bg: '#E8700A18',  icon: Clock },
  review:      { label: 'Under Review', color: '#8B5CF6', bg: '#8B5CF618',  icon: Eye },
  completed:   { label: 'Completed',    color: '#10B981', bg: '#10B98118',  icon: CheckCircle },
  cancelled:   { label: 'Cancelled',    color: '#EF4444', bg: '#EF444418',  icon: X },
}

const EMPTY_FORM = {
  client_id: '', service_category: '', service_code: '',
  service_name: '', price: '', notes: '', due_date: '',
  assigned_to: '', agreement_type: '',
}

export default function ServicesPage() {
  const [workOrders, setWorkOrders] = useState([])
  const [clients, setClients] = useState([])
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
    const [wo, cl, em] = await Promise.all([
      supabase.from('work_orders').select(`*, clients(company_name, client_number, contact_first, contact_last), services(name, code)`).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name, client_number').eq('status', 'active'),
      supabase.from('employees').select('id, first_name, last_name, role').eq('status', 'active'),
    ])
    setWorkOrders(wo.data || [])
    setClients(cl.data || [])
    setEmployees(em.data || [])
    setLoading(false)
  }

  function handleCategoryChange(cat) {
    setForm(f => ({ ...f, service_category: cat, service_code: '', service_name: '', price: '', agreement_type: SERVICES_CATALOGUE[cat]?.agreement_type || '' }))
  }

  function handleServiceChange(code) {
    const cat = SERVICES_CATALOGUE[form.service_category]
    const svc = cat?.services.find(s => s.code === code)
    if (svc) setForm(f => ({ ...f, service_code: code, service_name: svc.name, price: svc.price }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Look up service without .single() to avoid crash
      const { data: existingSvcs } = await supabase
        .from('services')
        .select('id')
        .eq('code', form.service_code)

      let serviceId = null

      if (existingSvcs && existingSvcs.length > 0) {
        serviceId = existingSvcs[0].id
      } else {
        // Create the service
        const { data: newSvc, error: svcErr } = await supabase
          .from('services')
          .insert([{
            code: form.service_code,
            name: form.service_name,
            base_price: parseFloat(form.price) || 0,
            active: true,
          }])
          .select()
        if (svcErr) throw svcErr
        serviceId = newSvc?.[0]?.id
      }

      // Create work order
      const { error: woErr } = await supabase.from('work_orders').insert([{
        client_id: form.client_id,
        service_id: serviceId,
        status: 'draft',
        priority: 'normal',
        due_date: form.due_date || null,
        notes: form.notes || null,
        assigned_to: form.assigned_to || null,
      }])
      if (woErr) throw woErr

      setSuccess('Work order created! Next step: send the service agreement to the client.')
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 6000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id, status) {
    await supabase.from('work_orders').update({ status }).eq('id', id)
    fetchAll()
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = workOrders.filter(wo => {
    const matchSearch = `${wo.clients?.company_name} ${wo.services?.name} ${wo.clients?.client_number}`
      .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || wo.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: workOrders.length,
    in_progress: workOrders.filter(w => w.status === 'in_progress').length,
    awaiting_deposit: workOrders.filter(w => w.status === 'deposit_pending').length,
    completed: workOrders.filter(w => w.status === 'completed').length,
  }

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Services & Work Orders</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>Manage client services from agreement to completion</p>
        </div>
        <button className="ak-btn" onClick={() => setShowForm(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <Plus size={16} /> New Work Order
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Orders', value: stats.total, color: '#E8700A', icon: FileText },
          { label: 'In Progress', value: stats.in_progress, color: '#3B82F6', icon: Clock },
          { label: 'Awaiting Deposit', value: stats.awaiting_deposit, color: '#F59E0B', icon: DollarSign },
          { label: 'Completed', value: stats.completed, color: '#10B981', icon: CheckCircle },
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

      {/* Success/Error */}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#10B98118', border: '1px solid #10B98133', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
          <Check size={16} color="#10B981" /><span style={{ color: '#10B981', fontSize: '14px' }}>{success}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1, minWidth: '200px' }}>
          <Search size={15} color="#555" />
          <input placeholder="Search by client or service..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'agreement_pending', 'deposit_pending', 'in_progress', 'review', 'completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              background: filterStatus === s ? '#E8700A' : '#1C1C1C',
              color: filterStatus === s ? 'white' : '#888',
              border: `1px solid ${filterStatus === s ? '#E8700A' : '#2E2E2E'}`,
              borderRadius: '6px', padding: '8px 14px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
              textTransform: 'capitalize',
            }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="ak-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading work orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Briefcase size={40} color="#333" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No work orders yet</div>
            <div style={{ color: '#444', fontSize: '13px' }}>Click "New Work Order" to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                {['Client', 'Service', 'Agreement', 'Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(wo => {
                const status = STATUS_CONFIG[wo.status] || STATUS_CONFIG.draft
                return (
                  <tr key={wo.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{wo.clients?.company_name || '—'}</div>
                      <div style={{ color: '#555', fontSize: '12px' }}>{wo.clients?.client_number}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#CCC', fontSize: '13px' }}>{wo.services?.name || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: '#1C1C1C', color: '#666', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {wo.status === 'draft' ? 'Not sent' : wo.status === 'agreement_pending' ? 'Awaiting signature' : 'Signed ✓'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#666', fontSize: '13px' }}>{wo.due_date ? new Date(wo.due_date).toLocaleDateString('en-ZA') : '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button onClick={() => setSelected(wo)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#888' }}>
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

      {/* New Work Order Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>New Work Order</h2>
                <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Service agreement will be required before work begins</p>
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

              {/* Policy reminder */}
              <div style={{ background: '#E8700A10', border: '1px solid #E8700A22', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <Shield size={15} color="#E8700A" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ color: '#E8700A', fontSize: '12px' }}>
                  <strong>Policy Reminder:</strong> A service agreement must be signed and a 50% deposit received before work begins.
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client *</label>
                <select className="ak-input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} required style={{ cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.client_number})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Service Category *</label>
                  <select className="ak-input" value={form.service_category} onChange={e => handleCategoryChange(e.target.value)} required style={{ cursor: 'pointer' }}>
                    <option value="">Select category...</option>
                    {Object.entries(SERVICES_CATALOGUE).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Service *</label>
                  <select className="ak-input" value={form.service_code} onChange={e => handleServiceChange(e.target.value)} required style={{ cursor: 'pointer' }} disabled={!form.service_category}>
                    <option value="">Select service...</option>
                    {form.service_category && SERVICES_CATALOGUE[form.service_category]?.services.map(s => (
                      <option key={s.code} value={s.code}>{s.name} — R{s.price.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.agreement_type && (
                <div style={{ background: '#3B82F618', border: '1px solid #3B82F633', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="#3B82F6" />
                  <span style={{ color: '#3B82F6', fontSize: '12px' }}>Required agreement: <strong>{AGREEMENT_LABELS[form.agreement_type]}</strong></span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Price (R)</label>
                  <input className="ak-input" type="number" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Due Date</label>
                  <input className="ak-input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Assign To</label>
                <select className="ak-input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ cursor: 'pointer' }}>
                  <option value="">Unassigned</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</label>
                <textarea className="ak-input" placeholder="Any specific instructions or notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? (<><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Creating...</>) : (<><FileText size={15} /> Create Work Order</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Order Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>Work Order Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{selected.clients?.company_name}</div>
                <div style={{ color: '#555', fontSize: '13px' }}>{selected.services?.name}</div>
              </div>

              {/* Status Pipeline */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Progress Pipeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'agreement_pending', label: '1. Send Service Agreement', desc: 'Client must sign before work begins' },
                    { key: 'agreement_signed', label: '2. Agreement Signed', desc: 'Agreement received and filed' },
                    { key: 'deposit_pending', label: '3. Request 50% Deposit', desc: 'Invoice sent to Finance' },
                    { key: 'deposit_paid', label: '4. Deposit Received', desc: 'Proof of payment uploaded' },
                    { key: 'in_progress', label: '5. Work In Progress', desc: 'Assigned staff working on file' },
                    { key: 'review', label: '6. Under Review', desc: 'Technical Manager reviewing work' },
                    { key: 'completed', label: '7. Completed', desc: 'Work delivered, balance invoice sent' },
                  ].map((step, i) => {
                    const statuses = ['draft', 'agreement_pending', 'agreement_signed', 'deposit_pending', 'deposit_paid', 'in_progress', 'review', 'completed']
                    const currentIdx = statuses.indexOf(selected.status)
                    const stepIdx = statuses.indexOf(step.key)
                    const isDone = stepIdx < currentIdx
                    const isCurrent = step.key === selected.status
                    return (
                      <div key={step.key} onClick={() => updateStatus(selected.id, step.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${isCurrent ? '#E8700A33' : '#1C1C1C'}`, background: isCurrent ? '#E8700A10' : isDone ? '#10B98108' : 'transparent', transition: 'all 0.15s' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isDone ? '#10B981' : isCurrent ? '#E8700A' : '#2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isDone ? <Check size={12} color="white" /> : <span style={{ color: isDone || isCurrent ? 'white' : '#555', fontSize: '11px', fontWeight: 700 }}>{i + 1}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: isCurrent ? '#E8700A' : isDone ? '#10B981' : '#888', fontSize: '13px', fontWeight: 600 }}>{step.label}</div>
                          <div style={{ color: '#444', fontSize: '11px' }}>{step.desc}</div>
                        </div>
                        {isCurrent && <ChevronRight size={14} color="#E8700A" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ color: '#555', fontSize: '12px', textAlign: 'center' }}>Click any step to update the status</div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
