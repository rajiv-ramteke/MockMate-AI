const { PDFParse } = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 * @access Private
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        if (!jobDescription) {
            return res.status(400).json({ message: "Job description is required." })
        }

        if (!req.file && !selfDescription) {
            return res.status(400).json({ message: "Please upload a resume PDF file or write a self description." })
        }

        let resumeContent = ""
        if (req.file) {
            const pdfDoc = new PDFParse(Uint8Array.from(req.file.buffer))
            const resumeData = await pdfDoc.getText()
            resumeContent = resumeData.text || ""
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("generateInterViewReportController error:", err)
        res.status(500).json({ message: "Failed to generate interview report. Please try again.", error: err.message })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 * @access Private
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("getInterviewReportByIdController error:", err)
        res.status(500).json({ message: "Failed to fetch interview report." })
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 * @access Private
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -technicalQuiz -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("getAllInterviewReportsController error:", err)
        res.status(500).json({ message: "Failed to fetch interview reports." })
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 * @access Private
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params
        const { candidateAnswers = [] } = req.body

        if (!candidateAnswers || candidateAnswers.length < 4) {
            return res.status(400).json({
                message: "Please answer at least 4 interview questions before regenerating your customized resume."
            })
        }

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription, candidateAnswers })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        console.error("generateResumePdfController error:", err)
        res.status(500).json({ message: "Failed to generate resume PDF.", error: err.message })
    }
}

/**
 * @description Controller to evaluate candidate's answer for a specific question.
 * @access Private
 */
async function evaluateAnswerController(req, res) {
    try {
        const { question, answer } = req.body

        if (!question || !answer) {
            return res.status(400).json({ message: "Question and answer are required." })
        }

        const { evaluateCandidateAnswer } = require("../services/ai.service")
        const evaluation = await evaluateCandidateAnswer({ question, answer })

        res.status(200).json({
            message: "Answer evaluated successfully.",
            evaluation
        })
    } catch (err) {
        console.error("evaluateAnswerController error:", err)
        res.status(500).json({ message: "Failed to evaluate answer. Please try again." })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    evaluateAnswerController
}