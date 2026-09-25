const userModel = require("../models/user.model")
const interviewReportModel = require("../models/interviewReport.model")
const studentProfileModel = require("../models/studentProfile.model")


// ─── Dashboard Stats ────────────────────────────────────────────────────────
async function getDashboardStats(req, res) {
    try {
        const totalUsers = await userModel.countDocuments({ role: "user" })
        const verifiedUsers = await userModel.countDocuments({ role: "user", isVerified: true })
        const bannedUsers = await userModel.countDocuments({ isBanned: true })
        const totalReports = await interviewReportModel.countDocuments()
        const totalProfiles = await studentProfileModel.countDocuments()

        // New users in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const newUsers = await userModel.countDocuments({
            role: "user",
            createdAt: { $gte: sevenDaysAgo }
        })

        // Reports generated in last 7 days
        const recentReports = await interviewReportModel.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        })

        // Monthly user registrations (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyUsers = await userModel.aggregate([
            { $match: { role: "user", createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])

        // Monthly interview reports (last 6 months)
        const monthlyReports = await interviewReportModel.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])

        res.json({
            totalUsers,
            verifiedUsers,
            bannedUsers,
            totalReports,
            totalProfiles,
            newUsers,
            recentReports,
            monthlyUsers,
            monthlyReports
        })
    } catch (err) {
        console.error("Admin getDashboardStats error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Get All Users ───────────────────────────────────────────────────────────
async function getAllUsers(req, res) {
    try {
        const { page = 1, limit = 20, search = "", status = "" } = req.query

        const query = { role: "user" }

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        }

        if (status === "banned") query.isBanned = true
        if (status === "active") query.isBanned = false
        if (status === "verified") query.isVerified = true
        if (status === "unverified") query.isVerified = false

        const totalCount = await userModel.countDocuments(query)
        const users = await userModel.find(query)
            .select("-password -resetPasswordToken -verificationOtp -googleId")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))

        // Attach interview report counts
        const userIds = users.map(u => u._id)
        const reportCounts = await interviewReportModel.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: "$user", count: { $sum: 1 } } }
        ])
        const reportCountMap = {}
        reportCounts.forEach(r => { reportCountMap[r._id.toString()] = r.count })

        const usersWithStats = users.map(u => ({
            ...u.toObject(),
            reportCount: reportCountMap[u._id.toString()] || 0
        }))

        res.json({
            users: usersWithStats,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Number(page)
        })
    } catch (err) {
        console.error("Admin getAllUsers error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Get Single User Detail ───────────────────────────────────────────────────
async function getUserDetail(req, res) {
    try {
        const { userId } = req.params
        const user = await userModel.findById(userId).select("-password -resetPasswordToken -verificationOtp")
        if (!user) return res.status(404).json({ message: "User not found" })

        const profile = await studentProfileModel.findOne({ user: userId }).select("-documents")
        const reports = await interviewReportModel.find({ user: userId })
            .select("title matchScore createdAt")
            .sort({ createdAt: -1 })

        res.json({ user, profile, reports })
    } catch (err) {
        console.error("Admin getUserDetail error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Ban / Unban User ─────────────────────────────────────────────────────────
async function banUser(req, res) {
    try {
        const { userId } = req.params
        const { reason } = req.body

        const user = await userModel.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" })
        if (user.role === "admin") return res.status(403).json({ message: "Cannot ban admin users" })

        user.isBanned = true
        user.bannedReason = reason || "Violated terms of service"
        await user.save()

        res.json({ message: `User ${user.username} has been banned.`, user })
    } catch (err) {
        console.error("Admin banUser error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}

async function unbanUser(req, res) {
    try {
        const { userId } = req.params
        const user = await userModel.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" })

        user.isBanned = false
        user.bannedReason = undefined
        await user.save()

        res.json({ message: `User ${user.username} has been unbanned.`, user })
    } catch (err) {
        console.error("Admin unbanUser error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Delete User (and all their data) ────────────────────────────────────────
async function deleteUser(req, res) {
    try {
        const { userId } = req.params
        const user = await userModel.findById(userId)
        if (!user) return res.status(404).json({ message: "User not found" })
        if (user.role === "admin") return res.status(403).json({ message: "Cannot delete admin users" })

        // Delete all associated data
        await interviewReportModel.deleteMany({ user: userId })
        await studentProfileModel.deleteOne({ user: userId })
        await userModel.findByIdAndDelete(userId)

        res.json({ message: `User ${user.username} and all their data have been permanently deleted.` })
    } catch (err) {
        console.error("Admin deleteUser error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Get All Interview Reports ────────────────────────────────────────────────
async function getAllReports(req, res) {
    try {
        const { page = 1, limit = 20, search = "" } = req.query

        const query = {}
        if (search) {
            query.title = { $regex: search, $options: "i" }
        }

        const totalCount = await interviewReportModel.countDocuments(query)
        const reports = await interviewReportModel.find(query)
            .populate("user", "username email")
            .select("title matchScore createdAt user")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))

        res.json({
            reports,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Number(page)
        })
    } catch (err) {
        console.error("Admin getAllReports error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Delete an Interview Report ───────────────────────────────────────────────
async function deleteReport(req, res) {
    try {
        const { reportId } = req.params
        const report = await interviewReportModel.findByIdAndDelete(reportId)
        if (!report) return res.status(404).json({ message: "Report not found" })

        res.json({ message: "Interview report deleted successfully." })
    } catch (err) {
        console.error("Admin deleteReport error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


// ─── Promote / Demote User Role ───────────────────────────────────────────────
async function updateUserRole(req, res) {
    try {
        const { userId } = req.params
        const { role } = req.body

        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" })
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select("-password")

        if (!user) return res.status(404).json({ message: "User not found" })

        res.json({ message: `User role updated to '${role}'`, user })
    } catch (err) {
        console.error("Admin updateUserRole error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}


module.exports = {
    getDashboardStats,
    getAllUsers,
    getUserDetail,
    banUser,
    unbanUser,
    deleteUser,
    getAllReports,
    deleteReport,
    updateUserRole
}
