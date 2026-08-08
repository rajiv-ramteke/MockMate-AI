import React, { useState } from 'react'
import { Link } from 'react-router'
import { forgotPassword } from '../services/auth.api'
import "../auth.form.scss"

const ForgotPassword = () => {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setMessage("")
        setLoading(true)
        
        try {
            const res = await forgotPassword(email)
            setMessage(res.message || "If an account exists, a reset link has been sent.")
        } catch (err) {
            setError(err.message || "Failed to send reset link.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="form-container">
                {/* Brand Header */}
                <div className="brand-header">
                    <span className="brand-icon">🔑</span>
                    <h1>Forgot Password</h1>
                    <p className="subtitle">Enter your email to reset your password</p>
                </div>

                {/* Alerts */}
                {error && <div className="auth-alert error">{error}</div>}
                {message && <div className="auth-alert success">{message}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrap">
                            <span className="input-icon">✉️</span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <button className="button primary-button" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                {/* Footer */}
                <p className="footer-link" style={{ marginTop: '0.5rem' }}>
                    Remembered your password? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </main>
    )
}

export default ForgotPassword
