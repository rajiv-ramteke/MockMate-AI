const express = require("express")
const router = express.Router()
const { authUser } = require("../middlewares/auth.middleware")
const { isAdmin } = require("../middlewares/admin.middleware")
const {
    getDashboardStats,
    getAllUsers,
    getUserDetail,
    banUser,
    unbanUser,
    deleteUser,
    getAllReports,
    deleteReport,
    updateUserRole
} = require("../controllers/admin.controller")

// All admin routes require auth + admin role
router.use(authUser, isAdmin)

// Dashboard
router.get("/stats", getDashboardStats)

// User Management
router.get("/users", getAllUsers)
router.get("/users/:userId", getUserDetail)
router.patch("/users/:userId/ban", banUser)
router.patch("/users/:userId/unban", unbanUser)
router.delete("/users/:userId", deleteUser)
router.patch("/users/:userId/role", updateUserRole)

// Interview Report Management
router.get("/reports", getAllReports)
router.delete("/reports/:reportId", deleteReport)

module.exports = router
