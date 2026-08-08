const { Router } = require("express");
const { getProfile, updateProfileSection, uploadProfilePicture, uploadDocument, deleteDocument } = require("../controllers/profile.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const profileRouter = Router();

// Protect all profile routes
profileRouter.use(authMiddleware.authUser);

// Get full profile
profileRouter.get("/", getProfile);

// Upload profile picture (base64)
profileRouter.put("/picture", uploadProfilePicture);

// Documents specific endpoints
profileRouter.post("/documents", uploadDocument);
profileRouter.delete("/documents/:docId", deleteDocument);

// Generic section update (personal, education, experience, etc.)
// Important: This route must come AFTER /picture and /documents to avoid parameter collision
profileRouter.put("/:section", updateProfileSection);

module.exports = profileRouter;
