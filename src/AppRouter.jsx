import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store'
import { ROLES } from './lib/roles'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/shared/AppLayout'
import LoginPage from './pages/LoginPage'
import CEODashboard from './pages/CEODashboard'
import EmployeesPage from './pages/EmployeesPage'
import ClientsPage from './pages/ClientsPage'
import ServicesPage from './pages/ServicesPage'
import FinancePage from './pages/FinancePage'
import AdminPage from './pages/AdminPage'
import HRPage from './pages/HRPage'


function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '32px', flex: 1 }}>
      <div style={{ background: '#141414', border: '1px solid #1C1C1C', borderRadius: '12px', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ width: 60, height: 60, borderRadius: '16px', background: '#E8700A18', border: '1px solid #E8700A33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔨</div>
        <h2 style={{ fontFamily: '"Playfair Display", serif', color: '#F5F5F5', fontSize: '22px', fontWeight: 700 }}>{title}</h2>
        <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>This module is being built and will be available soon.</p>
        <div style={{ background: '#E8700A18', border: '1px solid #E8700A33', borderRadius: '8px', padding: '10px 20px', color: '#E8700A', fontSize: '13px', fontWeight: 600 }}>Coming Soon</div>
      </div>
    </div>
  )
}

function DashboardRouter() {
  const { role } = useAuthStore()
  switch (role) {
    case ROLES.CEO: return <CEODashboard />
    case ROLES.COO: return <CEODashboard />
    default: return <CEODashboard />
  }
}

export default function AppRouter() {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={
          <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#E8700A', textAlign: 'center' }}>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '28px' }}>Access Denied</h2>
              <p style={{ color: '#666', marginTop: '8px' }}>You do not have permission to view this page.</p>
            </div>
          </div>
        } />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><AppLayout><Navigate to="/dashboard" replace /></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardRouter /></AppLayout></ProtectedRoute>} />

        {/* Employees & Clients — LIVE */}
        <Route path="/employees" element={<ProtectedRoute><AppLayout><EmployeesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><AppLayout><ClientsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/bizcom/clients" element={<ProtectedRoute><AppLayout><ClientsPage /></AppLayout></ProtectedRoute>} />

        {/* Departments */}
        <Route path="/finance" element={<ProtectedRoute><AppLayout><FinancePage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/invoices" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Invoices" /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/quotes" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Quotes" /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/payouts" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Orange Army Payouts" /></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute><AppLayout><HRPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/employees" element={<ProtectedRoute><AppLayout><HRPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/onboarding" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Onboarding" /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/contracts" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Contracts" /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/disciplinary" element={<ProtectedRoute><AppLayout><HRPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/leave" element={<ProtectedRoute><AppLayout><HRPage /></AppLayout></ProtectedRoute>} />
        <Route path="/marketing" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Marketing & Sales" /></AppLayout></ProtectedRoute>} />
        <Route path="/it" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Information Technology" /></AppLayout></ProtectedRoute>} />
        <Route path="/risk" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Risk & Compliance" /></AppLayout></ProtectedRoute>} />

        {/* Divisions */}
        <Route path="/bizcom/work-orders" element={<ProtectedRoute><AppLayout><ServicesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/bizcom/orange-army" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Orange Army Management" /></AppLayout></ProtectedRoute>} />
        <Route path="/bizcom/quality" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Quality Control" /></AppLayout></ProtectedRoute>} />

        {/* Executive */}
        <Route path="/work-orders" element={<ProtectedRoute><AppLayout><ServicesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><AppLayout><ServicesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/orange-army" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Orange Army" /></AppLayout></ProtectedRoute>} />
        <Route path="/divisions" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Divisions" /></AppLayout></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Branches" /></AppLayout></ProtectedRoute>} />
        <Route path="/risk-flags" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Risk Flags" /></AppLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Reports" /></AppLayout></ProtectedRoute>} />
        <Route path="/my-team" element={<ProtectedRoute><AppLayout><PlaceholderPage title="My Team" /></AppLayout></ProtectedRoute>} />
        <Route path="/communication" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Communication" /></AppLayout></ProtectedRoute>} />
        <Route path="/flags" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Flags" /></AppLayout></ProtectedRoute>} />
        <Route path="/deadlines" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Deadlines" /></AppLayout></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><AppLayout><PlaceholderPage title="My Assignments" /></AppLayout></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute><AppLayout><PlaceholderPage title="My Earnings" /></AppLayout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
