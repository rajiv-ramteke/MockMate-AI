import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../../config/firebase'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin, handleGoogleLogin } = useAuth()
    const navigate = useNavigate()

    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [unverifiedEmail, setUnverifiedEmail] = useState("")

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setUnverifiedEmail("")
        setIsSubmitting(true)
        try {
            await handleLogin({ identifier, password })
            navigate('/')
        } catch (err) {
            if (err.unverified) setUnverifiedEmail(identifier)
            setError(err.message || "Invalid credentials. Please try again.")
            setIsSubmitting(false)
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsSubmitting(true)
            const result = await signInWithPopup(auth, googleProvider)
            const token = await result.user.getIdToken()
            await handleGoogleLogin(token)
            navigate('/')
        } catch (err) {
            console.error(err)
            if (err.code !== 'auth/popup-closed-by-user') {
                const msg = typeof err === 'string' ? err : (err.message || err.error || (typeof err === 'object' ? JSON.stringify(err) : 'Google sign-in failed.'))
                setError(`Error: ${msg}`)
            }
            setIsSubmitting(false)
        }
    }

    if (loading || isSubmitting) return (
        <main className="auth-page">
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
            }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: '3px solid rgba(167,139,250,0.2)',
                    borderTopColor: '#a78bfa',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Please wait...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </main>
    )

    return (
        <main className="auth-page">
            <div className="form-container">

                {/* Brand Header */}
                <div className="brand-header">
                    <span className="brand-icon">🧠</span>
                    <h1>MockMate AI</h1>
                    <p className="subtitle">Sign in to continue your journey</p>
                </div>

                {/* Alerts */}
                {error && <div className="auth-alert error">{error}</div>}
                {unverifiedEmail && (
                    <div className="auth-alert info">
                        Email not verified.{' '}
                        <Link to={`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`}>
                            Verify now →
                        </Link>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="identifier">Username or Email</label>
                        <div className="input-wrap">
                            <span className="input-icon">👤</span>
                            <input
                                id="identifier"
                                type="text"
                                name="identifier"
                                placeholder="Enter username or email"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrap">
                            <span className="input-icon">🔒</span>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="forgot-row">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>

                    <button className="button primary-button" disabled={loading || isSubmitting}>
                        {(loading || isSubmitting) ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">OR</div>

                {/* Google Login */}
                <div className="google-btn-wrap">
                    <button 
                        type="button" 
                        onClick={handleGoogleSignIn}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.85rem',
                            backgroundColor: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '2rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        <img 
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                            alt="Google" 
                            style={{ width: '20px', height: '20px' }}
                        />
                        Sign in with Google
                    </button>
                </div>

                {/* Footer */}
                <p className="footer-link">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </main>
    )
}

export default Login