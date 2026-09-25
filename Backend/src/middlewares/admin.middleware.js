/**
 * @description Middleware to restrict access to admin users only.
 * Must be used AFTER authUser middleware.
 */
async function isAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized. Please log in." })
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden. Admin access required." })
    }

    next()
}

module.exports = { isAdmin }
