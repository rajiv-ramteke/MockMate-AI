const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
    degree: { type: String, default: "" },
    branch: { type: String, default: "" },
    college: { type: String, default: "" },
    university: { type: String, default: "" },
    startYear: { type: Number },
    endYear: { type: Number },
    scoreType: { type: String, default: "CGPA" },
    score: { type: Number }
}, { _id: true });

const experienceSchema = new mongoose.Schema({
    type: { type: String, default: "Full-Time" },
    role: { type: String, default: "" },
    company: { type: String, default: "" },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, default: "" }
}, { _id: true });

const projectSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    role: { type: String, default: "" },
    technologies: [{ type: String }],
    description: { type: String, default: "" },
    contribution: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    liveUrl: { type: String, default: "" }
}, { _id: true });

const skillSchema = new mongoose.Schema({
    category: { type: String, default: "" },
    name: { type: String, default: "" },
    level: { type: String, default: "Intermediate" }
}, { _id: true });

const achievementSchema = new mongoose.Schema({
    type: { type: String, default: "" },
    title: { type: String, default: "" },
    date: { type: Date },
    description: { type: String, default: "" }
}, { _id: true });

const documentSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    format: { type: String, default: "" },
    size: { type: Number },
    base64Data: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const studentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    // Personal Info
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    dob: { type: Date },
    gender: { type: String, default: "" },
    address: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    summary: { type: String, default: "" },
    profilePicture: { type: String, default: "" }, // Base64

    // Data Arrays
    education: [educationSchema],
    experience: [experienceSchema],
    projects: [projectSchema],
    skills: [skillSchema],
    achievements: [achievementSchema],
    documents: [documentSchema],

    // Cached calculation
    completionPercentage: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
