import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  DollarSign, Plus, Search, X, Check, AlertCircle,
  Clock, CheckCircle, FileText, Eye, AlertTriangle,
  TrendingUp, CreditCard, ChevronRight, Shield,
} from 'lucide-react'

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: '#888',    bg: '#3A3A3A' },
  sent:     { label: 'Sent',     color: '#3B82F6', bg: '#3B82F618' },
  partial:  { label: 'Partial',  color: '#F59E0B', bg: '#F59E0B18' },
  paid:     { label: 'Paid',     color: '#10B981', bg: '#10B98118' },
  overdue:  { label: 'Overdue',  color: '#EF4444', bg: '#EF444418' },
  cancelled:{ label: 'Cancelled',color: '#555',    bg: '#2E2E2E' },
}

const INVOICE_TYPES = [
  { value: 'quote',    label: 'Quote' },
  { value: 'deposit',  label: '50% Deposit Invoice' },
  { value: 'invoice',  label: 'Final Invoice' },
  { value: 'credit_note', label: 'Credit Note' },
]

const BYPASS_REASONS = [
  { value: 'good_payer', label: 'Client has good payment history' },
  { value: 'internal', label: 'Service done internally by AfricaKai staff' },
  { value: 'dept_covers_oa', label: 'Department covering Orange Army cost' },
  { value: 'strategic', label: 'Strategic/relationship reason' },
  { value: 'other', label: 'Other (specify in notes)' },
]

const EMPTY_FORM = {
  client_id: '', work_order_id: '', type: 'deposit',
  amount: '', vat_amount: '0', due_date: '', notes: '',
}

const EMPTY_BYPASS = {
  work_order_id: '', reason: '', notes: '', client_id: '',
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBypass, setShowBypass] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [bypass, setBypass] = useState(EMPTY_BYPASS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [clientWorkOrders, setClientWorkOrders] = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [inv, cl, wo] = await Promise.all([
      supabase.from('invoices').select(`*, clients(company_name, client_number)`).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, company_name, client_number').eq('status', 'active'),
      supabase.from('work_orders').select(`id, clients(company_name), services(name), status`).not('status', 'eq', 'cancelled'),
    ])
    setInvoices(inv.data || [])
    setClients(cl.data || [])
    setWorkOrders(wo.data || [])
    setLoading(false)
  }

  async function handleClientChange(clientId) {
    setForm(f => ({ ...f, client_id: clientId, work_order_id: '' }))
    if (!clientId) { setClientWorkOrders([]); return }
    const { data } = await supabase.from('work_orders')
      .select(`id, services(name), status`)
      .eq('client_id', clientId)
      .not('status', 'eq', 'cancelled')
    setClientWorkOrders(data || [])
  }

  function calcTotal() {
    const amount = parseFloat(form.amount) || 0
    const vat = parseFloat(form.vat_amount) || 0
    return amount + vat
  }

  function calcDeposit() {
    const amount = parseFloat(form.amount) || 0
    return (amount * 0.5).toFixed(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const total = calcTotal()
      const { error } = await supabase.from('invoices').insert([{
        client_id: form.client_id,
        work_order_id: form.work_order_id || null,
        type: form.type,
        amount: parseFloat(form.amount),
        vat_amount: parseFloat(form.vat_amount) || 0,
        total,
        status: 'draft',
        due_date: form.due_date || null,
        notes: form.notes || null,
      }])
      if (error) throw error
      setSuccess(`${INVOICE_TYPES.find(t => t.value === form.type)?.label} created successfully!`)
      setForm(EMPTY_FORM)
      setClientWorkOrders([])
      setShowForm(false)
      fetchAll()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleBypassSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('risk_flags').insert([{
        flag_type: 'deposit_bypass',
        priority: 'high',
        title: 'Deposit Bypass Request',
        description: `Reason: ${BYPASS_REASONS.find(r => r.value === bypass.reason)?.label}. Notes: ${bypass.notes}`,
        client_id: bypass.client_id || null,
      }])
      if (error) throw error
      setSuccess('Bypass request submitted to HOD Finance for approval.')
      setBypass(EMPTY_BYPASS)
      setShowBypass(false)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id, status) {
    const update = { status }
    if (status === 'paid') update.paid_at = new Date().toISOString()
    await supabase.from('invoices').update(update).eq('id', id)
    fetchAll()
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = `${inv.clients?.company_name} ${inv.clients?.client_number} ${inv.invoice_number || ''}`
      .toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total_invoiced: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0),
    outstanding: invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0),
    overdue: invoices.filter(i => i.status === 'overdue').length,
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const b = (k, v) => setBypass(prev => ({ ...prev, [k]: v }))

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>Finance</h1>
          <p style={{ color: '#555', fontSize: '14px' }}>Invoices, deposits, and payment tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ak-btn-ghost" onClick={() => setShowBypass(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={15} /> Deposit Bypass
          </button>
          <button className="ak-btn" onClick={() => setShowForm(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Invoiced', value: `R ${stats.total_invoiced.toLocaleString()}`, color: '#E8700A', icon: FileText },
          { label: 'Collected', value: `R ${stats.paid.toLocaleString()}`, color: '#10B981', icon: CheckCircle },
          { label: 'Outstanding', value: `R ${stats.outstanding.toLocaleString()}`, color: '#F59E0B', icon: Clock },
          { label: 'Overdue', value: stats.overdue, color: '#EF4444', icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="ak-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${s.color}18`, border: `1px solid ${s.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#F5F5F5' }}>{s.value}</div>
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1, minWidth: '200px' }}>
          <Search size={15} color="#555" />
          <input placeholder="Search by client or invoice number..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'draft', 'sent', 'partial', 'paid', 'overdue'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              background: filterStatus === s ? '#E8700A' : '#1C1C1C',
              color: filterStatus === s ? 'white' : '#888',
              border: `1px solid ${filterStatus === s ? '#E8700A' : '#2E2E2E'}`,
              borderRadius: '6px', padding: '8px 14px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
            }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="ak-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <DollarSign size={40} color="#333" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No invoices yet</div>
            <div style={{ color: '#444', fontSize: '13px' }}>Click "New Invoice" to create your first invoice</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                {['Client', 'Invoice No.', 'Type', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const status = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{inv.clients?.company_name || '—'}</div>
                      <div style={{ color: '#555', fontSize: '12px' }}>{inv.clients?.client_number}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: '#E8700A18', color: '#E8700A', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                        {inv.invoice_number || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#CCC', fontSize: '13px', textTransform: 'capitalize' }}>{inv.type?.replace('_', ' ')}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>R {(inv.total || 0).toLocaleString()}</div>
                      {inv.vat_amount > 0 && <div style={{ color: '#555', fontSize: '11px' }}>incl. VAT R{inv.vat_amount}</div>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: inv.status === 'overdue' ? '#EF4444' : '#666', fontSize: '13px' }}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-ZA') : '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button onClick={() => setSelected(inv)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#888' }}>
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

      {/* New Invoice Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>New Invoice</h2>
                <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Invoice number will be auto-generated</p>
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client *</label>
                <select className="ak-input" value={form.client_id} onChange={e => handleClientChange(e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.client_number})</option>)}
                </select>
              </div>

              {clientWorkOrders.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Link to Work Order</label>
                  <select className="ak-input" value={form.work_order_id} onChange={e => f('work_order_id', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select work order (optional)...</option>
                    {clientWorkOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.services?.name} — {wo.status}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Invoice Type *</label>
                <select className="ak-input" value={form.type} onChange={e => f('type', e.target.value)} required style={{ cursor: 'pointer' }}>
                  {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Amount (R) *</label>
                  <input className="ak-input" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => f('amount', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>VAT Amount (R)</label>
                  <input className="ak-input" type="number" step="0.01" placeholder="0.00" value={form.vat_amount} onChange={e => f('vat_amount', e.target.value)} />
                </div>
              </div>

              {/* Auto calculations */}
              {form.amount && (
                <div style={{ background: '#1C1C1C', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>50% Deposit Amount</span>
                    <span style={{ color: '#E8700A', fontWeight: 700, fontSize: '13px' }}>R {calcDeposit()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>Total (incl. VAT)</span>
                    <span style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '13px' }}>R {calcTotal().toLocaleString()}</span>
                  </div>
                  {form.amount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666', fontSize: '12px' }}>Orange Army 40% (if applicable)</span>
                      <span style={{ color: '#8B5CF6', fontWeight: 700, fontSize: '13px' }}>R {(parseFloat(form.amount) * 0.4).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Due Date</label>
                <input className="ak-input" type="date" value={form.due_date} onChange={e => f('due_date', e.target.value)} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</label>
                <textarea className="ak-input" placeholder="Any notes for this invoice..." value={form.notes} onChange={e => f('notes', e.target.value)} style={{ minHeight: '70px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? (<><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Creating...</>) : (<><DollarSign size={15} /> Create Invoice</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Bypass Modal */}
      {showBypass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #E8700A33', borderRadius: '16px', width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Deposit Bypass Request</h2>
                <p style={{ color: '#E8700A', fontSize: '13px', marginTop: '4px' }}>Requires HOD Finance approval</p>
              </div>
              <button onClick={() => setShowBypass(false)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleBypassSubmit} style={{ padding: '28px' }}>
              <div style={{ background: '#E8700A10', border: '1px solid #E8700A22', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <Shield size={15} color="#E8700A" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ color: '#E8700A', fontSize: '12px' }}>This request will be flagged to HOD Finance for approval before work can begin without a deposit.</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Client *</label>
                <select className="ak-input" value={bypass.client_id} onChange={e => b('client_id', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Reason for Bypass *</label>
                <select className="ak-input" value={bypass.reason} onChange={e => b('reason', e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select reason...</option>
                  {BYPASS_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Additional Notes *</label>
                <textarea className="ak-input" placeholder="Provide full motivation for this bypass request..." value={bypass.notes} onChange={e => b('notes', e.target.value)} required style={{ minHeight: '90px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => setShowBypass(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? 'Submitting...' : <><Shield size={15} /> Submit for Approval</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>Invoice Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>{selected.clients?.company_name}</div>
                <div style={{ color: '#E8700A', fontSize: '13px', fontFamily: '"JetBrains Mono", monospace', marginTop: '4px' }}>{selected.invoice_number || 'Invoice number pending'}</div>
              </div>

              {[
                { label: 'Type', value: selected.type?.replace('_', ' ') },
                { label: 'Amount', value: `R ${(selected.amount || 0).toLocaleString()}` },
                { label: 'VAT', value: `R ${(selected.vat_amount || 0).toLocaleString()}` },
                { label: 'Total', value: `R ${(selected.total || 0).toLocaleString()}` },
                { label: 'Due Date', value: selected.due_date ? new Date(selected.due_date).toLocaleDateString('en-ZA') : '—' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1C1C1C' }}>
                  <span style={{ color: '#555', fontSize: '13px' }}>{item.label}</span>
                  <span style={{ color: '#CCC', fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}

              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Update Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['sent', 'partial', 'paid', 'overdue', 'cancelled'].map(s => {
                    const sc = STATUS_CONFIG[s]
                    return (
                      <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                        background: selected.status === s ? sc.bg : '#1C1C1C',
                        color: selected.status === s ? sc.color : '#666',
                        border: `1px solid ${selected.status === s ? sc.color + '44' : '#2E2E2E'}`,
                        borderRadius: '6px', padding: '8px', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600, fontFamily: '"DM Sans", sans-serif',
                      }}>
                        {sc.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
