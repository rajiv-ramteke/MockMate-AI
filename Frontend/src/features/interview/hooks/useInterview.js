import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, evaluateAnswerAPI } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const evaluateAnswer = async ({ question, answer, expectedAnswer }) => {
        try {
            const response = await evaluateAnswerAPI({ question, answer, expectedAnswer })
            return response.evaluation
        } catch (error) {
            console.error("Error evaluating answer:", error)
            return null
        }
    }

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {

        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Error generating report:", error)
            setLoading(false)
            return { error: error.response?.data?.error || error.response?.data?.message || error.message }
        } finally {
            setLoading(false)
        }

        return response && response.interviewReport ? response.interviewReport : null
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Error fetching report by ID:", error)
        } finally {
            setLoading(false)
        }
        return response && response.interviewReport ? response.interviewReport : null
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            if (response && response.interviewReports) {
                setReports(response.interviewReports)
            }
        } catch (error) {
            console.error("Error fetching reports:", error)
        } finally {
            setLoading(false)
        }

        return response && response.interviewReports ? response.interviewReports : []
    }

    const getResumePdf = async (interviewReportId, candidateAnswers = []) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId, candidateAnswers })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        }
        catch (error) {
            console.error("PDF Download Error:", error)
            let errorMessage = "Failed to download resume.\nError message: " + error.message;
            if (error.response && error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    errorMessage += "\n\nServer Reason: " + (json.error || json.message);
                } catch(e){}
            }
            alert(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, evaluateAnswer }

}