import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { resetPassword } from '../services/auth.api'
import "../auth.form.scss"

const ResetPassword = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setMessage("")
        
        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match")
        }
        
        setLoading(true)
        
        try {
            const res = await resetPassword(token, newPassword)
            setMessage(res.message || "Password reset successfully")
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.message || "Failed to reset password. The link might be expired.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="auth-page">
            <div className="form-container">
                {/* Brand Header */}
                <div className="brand-header">
                    <span className="brand-icon">🔐</span>
                    <h1>Reset Password</h1>
                    <p className="subtitle">Enter your new password below</p>
                </div>

                {/* Alerts */}
                {error && <div className="auth-alert error">{error}</div>}
                {message && <div className="auth-alert success">{message} Redirecting...</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="input-wrap">
                            <span className="input-icon">🔒</span>
                            <input
                                id="newPassword"
                                type="password"
                                name="newPassword"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-wrap">
                            <span className="input-icon">🔐</span>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <button className="button primary-button" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                {/* Footer */}
                <p className="footer-link" style={{ marginTop: '0.5rem' }}>
                    <Link to="/login">← Back to Login</Link>
                </p>
            </div>
        </main>
    )
}

export default ResetPassword
