import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import "../auth.form.scss"
import "./VerifyOtp.scss"

const VerifyOtp = () => {
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') || ''
    const navigate = useNavigate()
    const { handleVerifyOtp, handleResendOtp } = useAuth()

    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    const inputRefs = useRef([])

    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return // Only digits
        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Keep only last digit
        setOtp(newOtp)
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newOtp = [...otp]
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i]
        }
        setOtp(newOtp)
        inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const otpString = otp.join('')
        if (otpString.length < 6) {
            return setError('Please enter all 6 digits')
        }
        setError('')
        setLoading(true)
        try {
            await handleVerifyOtp(email, otpString)
            navigate('/')
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.')
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (resendCooldown > 0) return
        setError('')
        try {
            await handleResendOtp(email)
            setSuccessMsg('A new OTP has been sent to your email.')
            setResendCooldown(60)
            setTimeout(() => setSuccessMsg(''), 5000)
        } catch (err) {
            setError(err.message || 'Failed to resend OTP.')
        }
    }

    return (
        <main className="auth-page">
            <div className="form-container verify-otp-container">
                {/* Brand Header */}
                <div className="brand-header">
                    <span className="brand-icon">✉️</span>
                    <h1>Verify Your Email</h1>
                    <p className="subtitle">
                        We sent a 6-digit OTP to <strong>{email}</strong>
                    </p>
                </div>

                {error && (
                    <div className="auth-alert error">{error}</div>
                )}
                {successMsg && (
                    <div className="auth-alert success">{successMsg}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="otp-inputs" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(index, e.target.value)}
                                onKeyDown={e => handleKeyDown(index, e)}
                                className={`otp-box ${digit ? 'filled' : ''}`}
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    <button
                        className="button primary-button"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading || otp.join('').length < 6}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="otp-resend">
                    <span>Didn't receive it? </span>
                    <button
                        className="resend-btn"
                        onClick={handleResend}
                        disabled={resendCooldown > 0}
                    >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                </div>

                {/* Footer */}
                <p className="footer-link" style={{ marginTop: '0.5rem' }}>
                    <Link to="/login">← Back to Login</Link>
                </p>
            </div>
        </main>
    )
}

export default VerifyOtp
