const { PDFParse } = require("pdf-parse")
const { generateInterviewReport, generateResumePdf, generateInstantTailoredReport } = require("../services/ai.service")
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

        const technicalQuestions = (interViewReportByAi.technicalQuestions || []).map((q, idx) => ({
            question: q?.question || `Technical Question ${idx + 1}`,
            intention: q?.intention || "Assess candidate's technical and architectural depth for the target role.",
            answer: q?.answer || "Provide a structured, accurate technical answer citing real-world examples."
        }))

        const behavioralQuestions = (interViewReportByAi.behavioralQuestions || []).map((q, idx) => ({
            question: q?.question || `Behavioral Question ${idx + 1}`,
            intention: q?.intention || "Assess candidate's behavioral adaptability, communication, and situational problem-solving.",
            answer: q?.answer || "Structure response using Situation, Task, Action, and Result (STAR)."
        }))

        const skillGaps = (interViewReportByAi.skillGaps || []).map(g => {
            let sev = (g?.severity || 'medium').toLowerCase()
            if (!['low', 'medium', 'high'].includes(sev)) sev = 'medium'
            return { skill: g?.skill || 'Technical Skill', severity: sev }
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi,
            title: interViewReportByAi.title || "Job Preparation Strategy",
            technicalQuestions,
            behavioralQuestions,
            skillGaps
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

        // Auto-heal any report with missing behavioral questions, quiz, or tech questions
        if (!interviewReport.behavioralQuestions?.length || !interviewReport.technicalQuiz?.length || interviewReport.technicalQuestions?.length < 5) {
            try {
                const repaired = generateInstantTailoredReport({
                    resume: interviewReport.resume || "",
                    selfDescription: interviewReport.selfDescription || "",
                    jobDescription: interviewReport.jobDescription || ""
                })

                let hasUpdates = false
                if ((!interviewReport.behavioralQuestions || interviewReport.behavioralQuestions.length === 0) && repaired.behavioralQuestions?.length) {
                    interviewReport.behavioralQuestions = repaired.behavioralQuestions
                    hasUpdates = true
                }
                if ((!interviewReport.technicalQuiz || interviewReport.technicalQuiz.length === 0) && repaired.technicalQuiz?.length) {
                    interviewReport.technicalQuiz = repaired.technicalQuiz
                    hasUpdates = true
                }
                if ((!interviewReport.technicalQuestions || interviewReport.technicalQuestions.length < 5) && repaired.technicalQuestions?.length) {
                    interviewReport.technicalQuestions = repaired.technicalQuestions
                    hasUpdates = true
                }
                if ((!interviewReport.skillGaps || interviewReport.skillGaps.length < 4) && repaired.skillGaps?.length) {
                    interviewReport.skillGaps = repaired.skillGaps
                    hasUpdates = true
                }
                if ((!interviewReport.preparationPlan || interviewReport.preparationPlan.length < 7) && repaired.preparationPlan?.length) {
                    interviewReport.preparationPlan = repaired.preparationPlan
                    hasUpdates = true
                }

                if (hasUpdates) {
                    await interviewReport.save()
                    console.log(`[Interview Controller] Auto-repaired report ${interviewId} with behavioral questions & quiz`)
                }
            } catch (healErr) {
                console.error("[Interview Controller] Failed to auto-repair report:", healErr.message)
            }
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
        const { question, answer, expectedAnswer } = req.body

        if (!question || !answer) {
            return res.status(400).json({ message: "Question and answer are required." })
        }

        const { evaluateCandidateAnswer } = require("../services/ai.service")
        const evaluation = await evaluateCandidateAnswer({ question, answer, expectedAnswer })

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