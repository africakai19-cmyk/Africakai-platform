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
      // error handled in store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background geometric pattern ── */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(45deg, #E8700A 0, #E8700A 1px, transparent 0, transparent 50%)`,
        backgroundSize: '24px 24px',
      }} />

      {/* ── Glow ── */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, #E8700A18 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, #E8700A10 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Left Panel — Branding ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px', borderRight: '1px solid #2E2E2E',
        display: 'none',
      }}
        className="lg:flex lg:flex-col"
      >
        <div style={{ maxWidth: '480px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: '#E8700A18', border: '1px solid #E8700A44',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '48px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8700A', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#E8700A', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
              AFRICAKAI PLATFORM
            </span>
          </div>

          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '56px', fontWeight: 700, lineHeight: 1.1,
            color: '#F5F5F5', marginBottom: '24px',
          }}>
            Africa's Gift<br />
            <span style={{ color: '#E8700A' }}>to the World</span><br />
            Starts Here.
          </h1>

          <p style={{ color: '#666', fontSize: '16px', lineHeight: 1.7, marginBottom: '48px' }}>
            One platform. Every employee. Every division.<br />
            Every client. All in one place.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Business Compliance', desc: 'CIPC · SARS · UIF · COIDA · Bookkeeping' },
              { label: 'Management Consulting', desc: 'Silver Bullet · Funded Workforce Solutions' },
              { label: 'Orange Army Network', desc: 'Vetted Professionals · Structured Work' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px', background: '#141414',
                border: '1px solid #242424', borderRadius: '10px',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E8700A, #fb923c)',
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: '#555', fontSize: '12px', marginTop: '2px' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div style={{
        width: '100%', maxWidth: '480px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 40px',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '10px',
              background: 'linear-gradient(135deg, #E8700A, #fb923c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Playfair Display", serif', fontWeight: 700,
              fontSize: '18px', color: 'white',
            }}>A</div>
            <div>
              <div style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>
                AfricaKai
              </div>
              <div style={{ color: '#555', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Business Platform
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in" style={{ marginBottom: '8px' }}>
          <h2 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '32px', fontWeight: 700,
            color: '#F5F5F5', lineHeight: 1.2,
          }}>
            Welcome back
          </h2>
        </div>
        <p className="animate-in delay-1" style={{ color: '#666', fontSize: '14px', marginBottom: '36px' }}>
          Sign in to your AfricaKai workspace
        </p>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#FF444418', border: '1px solid #FF444444',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '24px',
          }}>
            <AlertCircle size={16} color="#FF4444" />
            <span style={{ color: '#FF4444', fontSize: '13px' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="animate-in delay-2">
            <label style={{ display: 'block', color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              className="ak-input"
              type="email"
              placeholder="you@africakai.co.za"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="animate-in delay-3">
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Password
              </span>
              <a href="/forgot-password" style={{ color: '#E8700A', fontSize: '12px', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="ak-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#555',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="animate-in delay-4" style={{ paddingTop: '8px' }}>
            <button
              className="ak-btn"
              type="submit"
              disabled={submitting || loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="animate-in delay-5" style={{
          marginTop: '48px', paddingTop: '24px',
          borderTop: '1px solid #1C1C1C',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#444', fontSize: '12px' }}>
            © 2025 AfricaKai (Pty) Ltd
          </span>
          <span style={{ color: '#444', fontSize: '12px' }}>
            Reg No: 2019/380527/07
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (min-width: 1024px) {
          .lg\\:flex { display: flex !important; }
          .lg\\:flex-col { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
