const StudentProfile = require("../models/studentProfile.model");

function calculateCompletion(profile) {
    let score = 0;
    
    // Personal Info (Max 30%)
    if (profile.fullName) score += 5;
    if (profile.phone) score += 5;
    if (profile.dob) score += 5;
    if (profile.address) score += 5;
    if (profile.summary) score += 5;
    if (profile.linkedin || profile.github || profile.portfolio) score += 5;

    // Profile Picture (Max 10%)
    if (profile.profilePicture) score += 10;

    // Education (Max 20%)
    if (profile.education && profile.education.length > 0) score += 20;

    // Experience (Max 10%)
    if (profile.experience && profile.experience.length > 0) score += 10;

    // Projects (Max 15%)
    if (profile.projects && profile.projects.length > 0) score += 15;

    // Skills (Max 10%)
    if (profile.skills && profile.skills.length > 0) score += 10;

    // Achievements (Max 5%)
    if (profile.achievements && profile.achievements.length > 0) score += 5;

    return Math.min(score, 100);
}

/**
 * @route GET /api/profile
 * @description Get user's profile or create empty one
 */
async function getProfile(req, res) {
    try {
        let profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) {
            profile = await StudentProfile.create({ user: req.user.id });
        }
        res.status(200).json({ profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
}

/**
 * @route PUT /api/profile/picture
 * @description Upload base64 cropped profile picture
 */
async function uploadProfilePicture(req, res) {
    try {
        const { base64Image } = req.body;
        if (!base64Image) return res.status(400).json({ message: "Image is required" });

        let profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) profile = new StudentProfile({ user: req.user.id });

        profile.profilePicture = base64Image;
        profile.completionPercentage = calculateCompletion(profile);
        await profile.save();

        res.status(200).json({ message: "Profile picture updated", profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to upload picture" });
    }
}

/**
 * @route POST /api/profile/documents
 * @description Add a new document (base64)
 */
async function uploadDocument(req, res) {
    try {
        const { title, format, size, base64Data } = req.body;
        if (!title || !format || !base64Data) {
            return res.status(400).json({ message: "Missing document data" });
        }
        
        // Approx 5MB base64 check
        if (base64Data.length > 7000000) {
            return res.status(400).json({ message: "File exceeds 5MB limit" });
        }

        let profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) profile = new StudentProfile({ user: req.user.id });

        profile.documents.push({ title, format, size, base64Data });
        await profile.save();

        res.status(200).json({ message: "Document uploaded successfully", profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to upload document" });
    }
}

/**
 * @route DELETE /api/profile/documents/:docId
 * @description Delete a document
 */
async function deleteDocument(req, res) {
    try {
        const { docId } = req.params;
        let profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        profile.documents = profile.documents.filter(doc => doc._id.toString() !== docId);
        await profile.save();

        res.status(200).json({ message: "Document deleted", profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete document" });
    }
}

/**
 * @route PUT /api/profile/:section
 * @description Update specific section of the profile (education, experience, projects, skills, achievements)
 */
async function updateProfileSection(req, res) {
    try {
        const { section } = req.params;
        const data = req.body;
        
        let profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) profile = new StudentProfile({ user: req.user.id });

        const validArrays = ['education', 'experience', 'projects', 'skills', 'achievements'];
        
        if (section === 'personal') {
            // Only allow specific fields to prevent overwriting arrays
            const allowed = ['fullName', 'phone', 'dob', 'gender', 'address', 'linkedin', 'github', 'portfolio', 'summary'];
            allowed.forEach(field => {
                if (data[field] !== undefined) profile[field] = data[field];
            });
        } else if (validArrays.includes(section)) {
            if (!Array.isArray(data)) {
                return res.status(400).json({ message: `Data for ${section} must be an array` });
            }
            
            // Clean empty strings to prevent Mongoose CastError on Numbers and Dates
            const cleanData = data.map(item => {
                const cleanItem = { ...item };
                for (let key in cleanItem) {
                    if (cleanItem[key] === "") {
                        delete cleanItem[key];
                    }
                }
                return cleanItem;
            });

            profile[section] = cleanData;
        } else {
            return res.status(400).json({ message: "Invalid profile section" });
        }

        profile.completionPercentage = calculateCompletion(profile);
        await profile.save();
        
        res.status(200).json({ message: `${section} updated successfully`, profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: `Failed to update ${req.params.section}` });
    }
}

module.exports = {
    getProfile,
    updateProfileSection,
    uploadProfilePicture,
    uploadDocument,
    deleteDocument
};
