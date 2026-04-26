import { useState } from 'react'
import { useAuthStore } from '../store'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `repeating-linear-gradient(45deg, #E8700A 0, #E8700A 1px, transparent 0, transparent 50%)`, backgroundSize: '24px 24px' }} />
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #E8700A15 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #E8700A10 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/AfricaKai_Logo.jpg" alt="AfricaKai" style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '10px' }} />
          <div>
            <div style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '20px', fontFamily: '"Playfair Display", serif' }}>AfricaKai</div>
            <div style={{ color: '#444', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Business Platform</div>
          </div>
        </div>

        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: 700, color: '#F5F5F5', lineHeight: 1.2, marginBottom: '8px' }}>Welcome back</h2>
        <p style={{ color: '#555', fontSize: '14px', marginBottom: '36px' }}>Sign in to your AfricaKai workspace</p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FF444418', border: '1px solid #FF444433', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
            <AlertCircle size={16} color="#FF4444" />
            <span style={{ color: '#FF6666', fontSize: '13px' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
            <input className="ak-input" type="email" placeholder="you@africakai.co.za" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#666', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Password</span>
              <a href="/forgot-password" style={{ color: '#E8700A', fontSize: '12px', textDecoration: 'none' }}>Forgot password?</a>
            </label>
            <div style={{ position: 'relative' }}>
              <input className="ak-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '4px' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <button className="ak-btn" type="submit" disabled={submitting || loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {submitting ? (<><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Signing in...</>) : (<>Sign In <ArrowRight size={16} /></>)}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #1C1C1C', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#333', fontSize: '11px' }}>© 2025 AfricaKai (Pty) Ltd</span>
          <span style={{ color: '#333', fontSize: '11px' }}>Reg No: 2019/380527/07</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
