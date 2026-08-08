import axios from "axios"


const api = axios.create({
    baseURL: import.meta.env.DEV ? "http://localhost:3000" : "",
    withCredentials: true
})

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function login({ identifier, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            identifier, password
        })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function googleLogin(credential) {
    try {
        const response = await api.post("/api/auth/google", { credential })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function forgotPassword(email) {
    try {
        const response = await api.post("/api/auth/forgot-password", { email })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function resetPassword(token, newPassword) {
    try {
        const response = await api.post(`/api/auth/reset-password/${token}`, { newPassword })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function verifyOtp(email, otp) {
    try {
        const response = await api.post("/api/auth/verify-otp", { email, otp })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}

export async function resendOtp(email) {
    try {
        const response = await api.post("/api/auth/resend-otp", { email })
        return response.data
    } catch (err) {
        throw err.response?.data || err
    }
}