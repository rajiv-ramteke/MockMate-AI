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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setUnverifiedEmail("")
        try {
            await handleLogin({ identifier, password })
            navigate('/')
        } catch (err) {
            if (err.unverified) setUnverifiedEmail(identifier)
            setError(err.message || "Invalid credentials. Please try again.")
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const token = await result.user.getIdToken()
            await handleGoogleLogin(token)
            navigate('/')
        } catch (err) {
            console.error(err)
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(`Error: ${err.message || 'Google sign-in failed.'}`)
            }
        }
    }

    if (loading) return <main className="auth-page" />

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

                    <button className="button primary-button" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
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