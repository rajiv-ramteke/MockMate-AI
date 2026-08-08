const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
    degree: { type: String, required: true },
    branch: { type: String, required: true },
    college: { type: String, required: true },
    university: { type: String },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    scoreType: { type: String, enum: ['CGPA', 'Percentage'], required: true },
    score: { type: Number, required: true }
});

const experienceSchema = new mongoose.Schema({
    type: { type: String, enum: ['Full-Time', 'Part-Time', 'Internship', 'Freelance'], required: true },
    role: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String }
});

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    role: { type: String },
    technologies: [{ type: String }],
    description: { type: String },
    contribution: { type: String },
    githubUrl: { type: String },
    liveUrl: { type: String }
});

const skillSchema = new mongoose.Schema({
    category: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true }
});

const achievementSchema = new mongoose.Schema({
    type: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String }
});

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    format: { type: String, required: true },
    size: { type: Number },
    base64Data: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

const studentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    // Personal Info
    fullName: { type: String },
    phone: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    address: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    summary: { type: String },
    profilePicture: { type: String }, // Base64

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
