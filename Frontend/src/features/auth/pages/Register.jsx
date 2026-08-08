import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../../config/firebase'
import { useAuth } from '../hooks/useAuth'
import "../auth.form.scss"

const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const { loading, handleRegister, handleGoogleLogin } = useAuth()

    const handleGoogleSignUp = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const token = await result.user.getIdToken()
            await handleGoogleLogin(token)
            navigate('/')
        } catch (err) {
            console.error(err)
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(`Error: ${err.message || 'Google sign-up failed.'}`)
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        try {
            await handleRegister({ username, email, password })
            navigate(`/verify-otp?email=${encodeURIComponent(email)}`)
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.")
        }
    }

    if (loading) return <main className="auth-page" />

    return (
        <main className="auth-page">
            <div className="form-container">

                {/* Brand Header */}
                <div className="brand-header">
                    <span className="brand-icon">🚀</span>
                    <h1>Create Your Account</h1>
                    <p className="subtitle">Join MockMate AI today</p>
                </div>

                {/* Alert */}
                {error && <div className="auth-alert error">{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-wrap">
                            <span className="input-icon">👤</span>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrap">
                            <span className="input-icon">✉️</span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
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
                                placeholder="Create a strong password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button className="button primary-button" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">OR</div>

                {/* Google Sign Up */}
                <div className="google-btn-wrap">
                    <button 
                        type="button" 
                        onClick={handleGoogleSignUp}
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
                        Sign up with Google
                    </button>
                </div>

                {/* Footer */}
                <p className="footer-link">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </main>
    )
}

export default Register