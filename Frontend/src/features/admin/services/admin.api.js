import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : ""),
    withCredentials: true,
})

// Dashboard
export const getAdminStatsAPI = () => api.get("/api/admin/stats").then(r => r.data)

// Users
export const getAllUsersAPI = (params) => api.get("/api/admin/users", { params }).then(r => r.data)
export const getUserDetailAPI = (userId) => api.get(`/api/admin/users/${userId}`).then(r => r.data)
export const banUserAPI = (userId, reason) => api.patch(`/api/admin/users/${userId}/ban`, { reason }).then(r => r.data)
export const unbanUserAPI = (userId) => api.patch(`/api/admin/users/${userId}/unban`).then(r => r.data)
export const deleteUserAPI = (userId) => api.delete(`/api/admin/users/${userId}`).then(r => r.data)
export const updateUserRoleAPI = (userId, role) => api.patch(`/api/admin/users/${userId}/role`, { role }).then(r => r.data)

// Reports
export const getAllReportsAPI = (params) => api.get("/api/admin/reports", { params }).then(r => r.data)
export const deleteReportAPI = (reportId) => api.delete(`/api/admin/reports/${reportId}`).then(r => r.data)
