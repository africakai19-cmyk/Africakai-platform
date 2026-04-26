import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Plus, Search, Filter, ChevronDown, X, Check, AlertCircle, Mail, Phone, Building2, Shield, Eye, Edit, UserCheck } from 'lucide-react'

const ROLES = [
  { value: 'ceo', label: 'Chief Executive Officer', dept: 'Executive' },
  { value: 'coo', label: 'Chief Operating Officer', dept: 'Executive' },
  { value: 'cfo', label: 'Chief Financial Officer', dept: 'Executive' },
  { value: 'hod_finance', label: 'Head of Finance', dept: 'Finance' },
  { value: 'hod_admin', label: 'Head of Admin / Operations', dept: 'Admin / Operations' },
  { value: 'hod_hr', label: 'Head of Human Resources', dept: 'Human Resources' },
  { value: 'hod_marketing', label: 'Head of Marketing & Sales', dept: 'Marketing & Sales' },
  { value: 'hod_it', label: 'Head of IT', dept: 'Information Technology' },
  { value: 'hod_risk', label: 'Head of Risk & Compliance', dept: 'Risk & Compliance' },
  { value: 'finance_staff', label: 'Finance Officer', dept: 'Finance' },
  { value: 'admin_staff', label: 'Admin Officer', dept: 'Admin / Operations' },
  { value: 'hr_staff', label: 'HR Officer', dept: 'Human Resources' },
  { value: 'marketing_staff', label: 'Marketing Officer', dept: 'Marketing & Sales' },
  { value: 'it_staff', label: 'IT Officer', dept: 'Information Technology' },
  { value: 'risk_staff', label: 'Risk Officer', dept: 'Risk & Compliance' },
  { value: 'md_bizcom', label: 'Managing Director — BizCom', dept: 'BizCom Division' },
  { value: 'tech_manager_bizcom', label: 'Technical Manager — BizCom', dept: 'BizCom Division' },
  { value: 'compliance_agent', label: 'Compliance Agent', dept: 'BizCom Division' },
  { value: 'md_consulting', label: 'Managing Director — Consulting', dept: 'Management Consulting' },
  { value: 'consulting_coordinator', label: 'Consulting Coordinator', dept: 'Management Consulting' },
  { value: 'orange_army', label: 'Orange Army Member', dept: 'Orange Army' },
]

const EMPLOYMENT_TYPES = [
  { value: 'fulltime', label: 'Full Time' },
  { value: 'parttime', label: 'Part Time' },
  { value: 'intern', label: 'Intern (TVET)' },
  { value: 'contractor', label: 'Contractor' },
]

const STATUS_COLORS = {
  active: { bg: '#10B98118', color: '#10B981', label: 'Active' },
  inactive: { bg: '#3A3A3A', color: '#888', label: 'Inactive' },
  suspended: { bg: '#F59E0B18', color: '#F59E0B', label: 'Suspended' },
  terminated: { bg: '#EF444418', color: '#EF4444', label: 'Terminated' },
}

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  id_number: '', role: '', role_label: '', employment_type: 'fulltime',
  start_date: '', status: 'active',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setEmployees(data || [])
    setLoading(false)
  }

  function handleRoleChange(value) {
    const found = ROLES.find(r => r.value === value)
    setForm(f => ({ ...f, role: value, role_label: found?.label || '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          id_number: form.id_number,
          role: form.role,
          role_label: form.role_label,
          employment_type: form.employment_type,
          start_date: form.start_date || null,
          status: form.status,
        }])
        .select()

      if (error) throw error

      setSuccess(`${form.first_name} ${form.last_name} added successfully! Employee number auto-assigned.`)
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchEmployees()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email} ${e.role_label} ${e.employee_number}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px', flex: 1, maxWidth: '1400px' }}>

      {/* ── Header ── */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F5F5', marginBottom: '6px' }}>
            Employees
          </h1>
          <p style={{ color: '#555', fontSize: '14px' }}>
            {employees.length} total · {employees.filter(e => e.status === 'active').length} active
          </p>
        </div>
        <button
          className="ak-btn"
          onClick={() => setShowForm(true)}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* ── Success / Error ── */}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#10B98118', border: '1px solid #10B98133', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
          <Check size={16} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: '14px' }}>{success}</span>
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
          <AlertCircle size={16} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {/* ── Search ── */}
      <div className="animate-in delay-1" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '10px 14px', flex: 1 }}>
          <Search size={15} color="#555" />
          <input
            placeholder="Search by name, email, role, employee number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#999', fontSize: '13px', width: '100%', fontFamily: '"DM Sans", sans-serif' }}
          />
        </div>
      </div>

      {/* ── Employee Table ── */}
      <div className="ak-card animate-in delay-2" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#555' }}>Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Users size={40} color="#333" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#555', fontSize: '16px', marginBottom: '8px' }}>No employees yet</div>
            <div style={{ color: '#444', fontSize: '13px' }}>Click "Add Employee" to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C1C1C' }}>
                {['Employee', 'Employee No.', 'Role', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const status = STATUS_COLORS[emp.status] || STATUS_COLORS.active
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #1C1C1C', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
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
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#CCC', fontSize: '13px' }}>{emp.role_label || emp.role}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#666', fontSize: '13px', textTransform: 'capitalize' }}>{emp.employment_type}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setSelectedEmployee(emp)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#888' }} title="View">
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Employee Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <div>
                <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>Add New Employee</h2>
                <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Employee number will be auto-generated</p>
              </div>
              <button onClick={() => { setShowForm(false); setError(null) }} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EF444418', border: '1px solid #EF444433', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                  <AlertCircle size={15} color="#EF4444" />
                  <span style={{ color: '#EF4444', fontSize: '13px' }}>{error}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>First Name *</label>
                  <input className="ak-input" placeholder="Madembe" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Last Name *</label>
                  <input className="ak-input" placeholder="Maano" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address *</label>
                <input className="ak-input" type="email" placeholder="name@africakai.co.za" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Phone Number</label>
                  <input className="ak-input" placeholder="0XX XXX XXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>SA ID Number</label>
                  <input className="ak-input" placeholder="0000000000000" value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Role / Position *</label>
                <select className="ak-input" value={form.role} onChange={e => handleRoleChange(e.target.value)} required style={{ cursor: 'pointer' }}>
                  <option value="">Select a role...</option>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.dept} — {r.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Employment Type *</label>
                  <select className="ak-input" value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} style={{ cursor: 'pointer' }}>
                    {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date</label>
                  <input className="ak-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" className="ak-btn-ghost" onClick={() => { setShowForm(false); setError(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="ak-btn" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? (<><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Adding...</>) : (<><UserCheck size={15} /> Add Employee</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Employee Modal ── */}
      {selectedEmployee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#141414', border: '1px solid #2E2E2E', borderRadius: '16px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #1C1C1C' }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>Employee Profile</h2>
              <button onClick={() => setSelectedEmployee(null)} style={{ background: '#1C1C1C', border: '1px solid #2E2E2E', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#888' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '12px', background: '#E8700A22', border: '1px solid #E8700A33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8700A', fontWeight: 700, fontSize: '20px' }}>
                  {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                </div>
                <div>
                  <div style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: 700 }}>{selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                  <div style={{ color: '#E8700A', fontSize: '13px' }}>{selectedEmployee.role_label}</div>
                  <div style={{ color: '#555', fontSize: '12px', marginTop: '4px', fontFamily: '"JetBrains Mono", monospace' }}>{selectedEmployee.employee_number}</div>
                </div>
              </div>
              {[
                { icon: Mail, label: 'Email', value: selectedEmployee.email },
                { icon: Phone, label: 'Phone', value: selectedEmployee.phone || 'Not provided' },
                { icon: Shield, label: 'ID Number', value: selectedEmployee.id_number || 'Not provided' },
                { icon: Building2, label: 'Employment Type', value: selectedEmployee.employment_type },
                { icon: UserCheck, label: 'Status', value: STATUS_COLORS[selectedEmployee.status]?.label },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #1C1C1C' }}>
                  <item.icon size={15} color="#555" />
                  <span style={{ color: '#555', fontSize: '13px', width: '120px' }}>{item.label}</span>
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
