const userModel = require("../models/user.model");
const interviewReportModel = require("../models/interviewReport.model");
const studentProfileModel = require("../models/studentProfile.model");
const { generateResumePdf } = require("../services/ai.service");
const { sendProfileToProfessor } = require("../services/email.service");

/**
 * @route POST /api/share/professor
 * @description Send student profile and resume to a professor via email
 * @access Private
 */
async function shareWithProfessor(req, res) {
    try {
        const { professorEmail, message, interviewReportId, candidateAnswers = [] } = req.body;

        if (!professorEmail) {
            return res.status(400).json({ message: "Professor's email is required." });
        }

        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const profile = await studentProfileModel.findOne({ user: req.user.id });

        // 1. Fetch the Interview Report to generate the Resume PDF
        let pdfBuffer = null;
        let matchScore = null;
        let interviewReport = null;

        if (interviewReportId) {
            // Use the specific report the user is viewing
            interviewReport = await interviewReportModel.findById(interviewReportId);
        } else {
            // Fall back to the most recent report for this user
            interviewReport = await interviewReportModel
                .findOne({ user: req.user.id })
                .sort({ createdAt: -1 });
        }

        if (interviewReport) {
            matchScore = interviewReport.matchScore;
            
            // Always generate the tailored resume PDF (with answers if provided)
            try {
                pdfBuffer = await generateResumePdf({
                    resume: interviewReport.resume,
                    jobDescription: interviewReport.jobDescription,
                    selfDescription: interviewReport.selfDescription,
                    candidateAnswers
                });
            } catch (pdfErr) {
                console.error("PDF generation failed (non-fatal):", pdfErr.message);
                // Continue sending the email without a PDF attachment
            }
        }

        // 2. Prepare Data for Email (convert Mongoose docs to plain objects)
        const studentData = {
            name: user.username || "A Student",
            email: user.email,
            score: matchScore,
            message: message,
            fullProfile: profile ? profile.toObject() : {},
            answers: candidateAnswers,
            interviewReport: interviewReport ? interviewReport.toObject() : null
        };

        // 3. Send Email
        await sendProfileToProfessor(professorEmail, studentData, pdfBuffer);

        res.status(200).json({ message: "Profile successfully shared with professor!" });
    } catch (err) {
        console.error("shareWithProfessor error:", err);
        res.status(500).json({ message: "Failed to share profile.", error: err.message });
    }
}

module.exports = {
    shareWithProfessor
};
