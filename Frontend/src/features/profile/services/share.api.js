import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.DEV ? "http://localhost:3000" : "",
    withCredentials: true,
});

/**
 * Sends the student profile and interview report to a professor's email.
 * @param {Object} data 
 * @param {string} data.professorEmail - The professor's email address
 * @param {string} data.message - Optional message from the student
 * @param {string} data.interviewReportId - Optional ID of the interview report to include the PDF resume
 */
export const shareWithProfessorAPI = async (data) => {
    const response = await api.post("/api/share/professor", data);
    return response.data;
};
