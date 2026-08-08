import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, googleLogin, verifyOtp, resendOtp } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ identifier, password }) => {
        setLoading(true)
        try {
            const data = await login({ identifier, password })
            setUser(data.user)
            return true;
        } catch (err) {
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            await register({ username, email, password })
            return true;
        } catch (err) {
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    const handleGoogleLogin = async (credential) => {
        setLoading(true)
        try {
            const data = await googleLogin(credential)
            setUser(data.user)
            return true;
        } catch (err) {
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (email, otp) => {
        setLoading(true)
        try {
            const data = await verifyOtp(email, otp)
            setUser(data.user)
            return true;
        } catch (err) {
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async (email) => {
        try {
            const data = await resendOtp(email)
            return data;
        } catch (err) {
            throw err
        }
    }

    return { user, loading, handleRegister, handleLogin, handleLogout, handleGoogleLogin, handleVerifyOtp, handleResendOtp }
}