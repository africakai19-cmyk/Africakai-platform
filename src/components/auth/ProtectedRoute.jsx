import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuthStore()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0D0D0D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '10px',
          background: 'linear-gradient(135deg, #E8700A, #fb923c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Playfair Display", serif', fontWeight: 700,
          fontSize: '18px', color: 'white',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>A</div>
        <div style={{ color: '#444', fontSize: '13px' }}>Loading AfricaKai Platform...</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />

  return children
}
